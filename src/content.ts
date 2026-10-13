(() => {
  type VideoMetadata = {
    videoId: string;
    title: string;
    url: string;
    channelName: string;
    uploadDate: string;
    capturedAt: string;
  };

  type DownloadRequest = VideoMetadata & {
    thumbnailUrl: string;
    useSaveDialog?: boolean;
  };

  type DownloadThumbnailMessage = {
    type: "YT_CAP_DOWNLOAD_THUMBNAIL";
    payload: DownloadRequest;
  };

  type DownloadThumbnailResponse =
    | {
        ok: true;
        thumbnailUrl: string;
      }
    | {
        ok: false;
        error: string;
        canceled?: boolean;
      };

  // このスクリプトは executeScript で通常スクリプトとして注入されるため import が使えない。
  // src/i18n.ts と文言を同期させること（ここはオーバーレイで使う最小限のみ）。
  type Locale = "en" | "ja";
  type LanguageSetting = "auto" | "en" | "ja";

  const MESSAGES: Record<Locale, Record<string, string>> = {
    en: {
      unsupportedPage: "This page is not supported",
      loading: "Loading...",
      thumbnailLoading: "Thumbnail is still loading",
      downloading: "Downloading...",
      downloaded: "Downloaded",
      downloadFailed: "Failed to download the thumbnail",
      downloadHint:
        "Press Enter to download. Press {shortcut} to choose where to save",
      thumbnailFailed: "Could not fetch the thumbnail",
    },
    ja: {
      unsupportedPage: "このページは対応していません",
      loading: "読み込み中...",
      thumbnailLoading: "サムネイルを読み込み中です",
      downloading: "ダウンロード中...",
      downloaded: "ダウンロードしました",
      downloadFailed: "サムネイルのダウンロードに失敗しました",
      downloadHint: "Enterでダウンロード、{shortcut}で保存先を選択",
      thumbnailFailed: "サムネイルを取得できませんでした",
    },
  };

  const YOUTUBE_WATCH_HOSTS = new Set([
    "www.youtube.com",
    "youtube.com",
    "m.youtube.com",
  ]);
  const OVERLAY_ID = "yt-cap-overlay";
  const CLOSE_EVENT = "yt-cap-close";
  const ESCAPE_UNLOCK_DELAY_MS = 100;
  const ESCAPE_UNLOCK_FALLBACK_MS = 3000;
  const KEY_EVENT_TYPES = ["keydown", "keypress", "keyup"] as const;
  const VIDEO_PATH_PREFIXES = ["/shorts/", "/live/", "/embed/"];
  const THUMBNAIL_QUALITIES = [
    "maxresdefault",
    "sddefault",
    "hqdefault",
  ] as const;
  const PLACEHOLDER_THUMBNAIL_MAX_WIDTH = 160;
  const PLACEHOLDER_THUMBNAIL_MAX_HEIGHT = 120;

  void (async () => {
    const locale = await resolveContentLocale();
    showThumbnailOverlay(MESSAGES[locale]);
  })();

  async function resolveContentLocale(): Promise<Locale> {
    let setting: LanguageSetting = "auto";

    try {
      const saved = await chrome.storage.sync.get({ language: "auto" });

      if (
        saved.language === "en" ||
        saved.language === "ja" ||
        saved.language === "auto"
      ) {
        setting = saved.language;
      }
    } catch {
      // 設定が読めない場合は auto 扱いのままにする。
    }

    if (setting === "en" || setting === "ja") {
      return setting;
    }

    return chrome.i18n.getUILanguage().toLowerCase().startsWith("ja")
      ? "ja"
      : "en";
  }

  function showThumbnailOverlay(m: Record<string, string>): void {
    // 表示中にもう一度呼ばれた場合、前回分のキー操作の受け付けも含めて片付けさせる。
    // 要素を消すだけだと前回のキーリスナーが残り、Enter 1回で二重に保存されてしまう。
    document.getElementById(OVERLAY_ID)?.dispatchEvent(new Event(CLOSE_EVENT));

    let metadata: VideoMetadata;

    try {
      metadata = collectVideoMetadata(window.location.href);
    } catch {
      window.alert(m.unsupportedPage);
      return;
    }

    const state = {
      qualityIndex: 0,
      loadedThumbnailUrl: "",
      downloading: false,
    };

    // <dialog> をモーダルで開くと、ブラウザが最前面の層（top layer）に表示してくれる。
    // 全画面再生中の動画より前に出せるうえ、裏のページへフォーカスや入力が抜けなくなる。
    const overlay = document.createElement("dialog");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("aria-label", "yt-cap");

    const panel = document.createElement("div");
    panel.className = "yt-cap-panel";

    const image = document.createElement("img");
    image.className = "yt-cap-image";
    image.alt = "YouTube thumbnail preview";

    const status = document.createElement("div");
    status.className = "yt-cap-status";
    status.textContent = m.loading;

    panel.append(image, status);
    overlay.append(panel);
    document.documentElement.append(overlay);
    document.documentElement.classList.add("yt-cap-scroll-lock");
    overlay.showModal();
    lockEscapeKey();

    let closingByEscape = false;

    const cleanup = (): void => {
      // 片付け済みなら何もしない（後から開いた別のプレビューを巻き込まないため）。
      if (!overlay.isConnected) {
        return;
      }

      for (const type of KEY_EVENT_TYPES) {
        document.removeEventListener(type, onKey, true);
      }

      unlockEscapeKey(closingByEscape);

      // close() を呼ぶと、開く前にフォーカスがあった場所へブラウザが戻してくれる。
      overlay.close();
      overlay.remove();
      restoreScroll();
    };

    const setStatus = (
      message: string,
      variant: "normal" | "error" | "success" = "normal",
    ): void => {
      status.textContent = message;
      status.dataset.variant = variant;
    };

    const download = async (useSaveDialog: boolean): Promise<void> => {
      if (state.downloading) {
        return;
      }

      if (!state.loadedThumbnailUrl) {
        setStatus(m.thumbnailLoading, "error");
        return;
      }

      state.downloading = true;
      setStatus(m.downloading);

      try {
        const response = await sendDownloadMessage({
          ...metadata,
          thumbnailUrl: state.loadedThumbnailUrl,
          useSaveDialog,
        });

        if (response.ok) {
          // 保存できたら閉じるまで操作を受け付けない（downloading は戻さない）。
          // ここで戻すと、閉じるまでの間の Enter で同じ画像がもう一度保存されてしまう。
          setStatus(m.downloaded, "success");
          window.setTimeout(cleanup, 700);
          return;
        }

        if (response.canceled) {
          setStatus(formatDownloadHint(m.downloadHint));
        } else {
          setStatus(response.error, "error");
        }
      } catch {
        setStatus(m.downloadFailed, "error");
      }

      state.downloading = false;
    };

    const tryNextThumbnail = (): void => {
      state.loadedThumbnailUrl = "";
      state.qualityIndex += 1;

      if (state.qualityIndex >= THUMBNAIL_QUALITIES.length) {
        setStatus(m.thumbnailFailed, "error");
        return;
      }

      image.src = buildThumbnailUrl(
        metadata.videoId,
        THUMBNAIL_QUALITIES[state.qualityIndex],
      );
    };

    const onKey = (event: KeyboardEvent): void => {
      // 表示中のキー操作は、再生/停止など YouTube 側のショートカットに渡さない。
      event.stopPropagation();

      if (event.type !== "keydown") {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closingByEscape = true;
        cleanup();
        return;
      }

      // 押しっぱなしによる連続入力では保存しない。
      if (event.key !== "Enter" || event.repeat) {
        return;
      }

      const useSaveDialog = isSaveDialogEnter(event);

      if (!useSaveDialog && !isPlainEnter(event)) {
        return;
      }

      event.preventDefault();
      void download(useSaveDialog);
    };

    overlay.addEventListener(CLOSE_EVENT, cleanup);
    // Escape などブラウザ側の操作で閉じられる場合も、同じ片付けを通す。
    overlay.addEventListener("cancel", (event) => {
      event.preventDefault();
      closingByEscape = true;
      cleanup();
    });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        cleanup();
      }
    });

    image.addEventListener("load", () => {
      if (isPlaceholderThumbnail(image)) {
        if (hasNextThumbnail(state.qualityIndex)) {
          tryNextThumbnail();
          return;
        }

        state.loadedThumbnailUrl = "";
        setStatus(m.thumbnailFailed, "error");
        return;
      }

      state.loadedThumbnailUrl = image.currentSrc || image.src;
      setStatus(formatDownloadHint(m.downloadHint));
    });
    image.addEventListener("error", tryNextThumbnail);

    for (const type of KEY_EVENT_TYPES) {
      document.addEventListener(type, onKey, true);
    }

    image.src = buildThumbnailUrl(
      metadata.videoId,
      THUMBNAIL_QUALITIES[state.qualityIndex],
    );
  }

  // 全画面中の Escape は通常ブラウザが先に受け取り、ページに届く前に全画面を解除してしまう。
  // Keyboard Lock API で Escape をページ側に届けてもらい、先にプレビューだけを閉じられるようにする。
  // 未対応のブラウザや拒否された場合は従来どおり（全画面の解除が先）になる。
  type KeyboardLock = {
    lock?: (keyCodes: string[]) => Promise<void>;
    unlock?: () => void;
  };

  function getKeyboardLock(): KeyboardLock | undefined {
    return (navigator as Navigator & { keyboard?: KeyboardLock }).keyboard;
  }

  function lockEscapeKey(): void {
    if (!document.fullscreenElement) {
      return;
    }

    void getKeyboardLock()
      ?.lock?.(["Escape"])
      .catch(() => {
        // ロックできなくてもプレビュー自体は使える。
      });
  }

  function unlockEscapeKey(escapeIsDown: boolean): void {
    const keyboard = getKeyboardLock();

    if (!keyboard?.unlock) {
      return;
    }

    if (!escapeIsDown || !document.fullscreenElement) {
      keyboard.unlock();
      return;
    }

    // Escape を押している最中にロックを外すと、キーを離したときの入力をブラウザが拾い、
    // 全画面まで一緒に解除されてしまう。キーが離されるのを待ってから外す。
    let released = false;

    const release = (): void => {
      if (released) {
        return;
      }

      released = true;
      document.removeEventListener("keyup", onKeyUp, true);
      keyboard.unlock?.();
    };

    const onKeyUp = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      event.stopPropagation();
      window.setTimeout(release, ESCAPE_UNLOCK_DELAY_MS);
    };

    document.addEventListener("keyup", onKeyUp, true);
    window.setTimeout(release, ESCAPE_UNLOCK_FALLBACK_MS);
  }

  function restoreScroll(): void {
    document.documentElement.classList.remove("yt-cap-scroll-lock");
  }

  function collectVideoMetadata(rawUrl: string): VideoMetadata {
    const videoId = extractVideoId(rawUrl);

    if (!videoId) {
      throw new Error("このページは対応していません");
    }

    return {
      videoId,
      title: extractTitle(),
      url: normalizeVideoUrl(videoId),
      channelName: extractChannelName(),
      uploadDate: extractUploadDate(),
      capturedAt: new Date().toISOString(),
    };
  }

  function extractVideoId(rawUrl: string): string | null {
    const url = new URL(rawUrl);

    if (YOUTUBE_WATCH_HOSTS.has(url.hostname) && url.pathname === "/watch") {
      return normalizeVideoId(url.searchParams.get("v"));
    }

    if (
      YOUTUBE_WATCH_HOSTS.has(url.hostname) &&
      VIDEO_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
    ) {
      return normalizeVideoId(url.pathname.split("/")[2]);
    }

    if (url.hostname === "youtu.be") {
      return normalizeVideoId(url.pathname.slice(1).split("/")[0]);
    }

    return null;
  }

  function normalizeVideoId(
    candidate: string | null | undefined,
  ): string | null {
    if (!candidate) {
      return null;
    }

    const trimmed = candidate.trim();
    return /^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null;
  }

  function normalizeVideoUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  function buildThumbnailUrl(
    videoId: string,
    quality: (typeof THUMBNAIL_QUALITIES)[number],
  ): string {
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
  }

  function hasNextThumbnail(qualityIndex: number): boolean {
    return qualityIndex < THUMBNAIL_QUALITIES.length - 1;
  }

  function isPlainEnter(event: KeyboardEvent): boolean {
    return (
      event.key === "Enter" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !event.shiftKey
    );
  }

  function isSaveDialogEnter(event: KeyboardEvent): boolean {
    if (event.key !== "Enter" || event.altKey || event.shiftKey) {
      return false;
    }

    if (isApplePlatform()) {
      return event.metaKey && !event.ctrlKey;
    }

    return event.ctrlKey && !event.metaKey;
  }

  function isApplePlatform(): boolean {
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  }

  function formatDownloadHint(message: string): string {
    return message.replace("{shortcut}", getSaveDialogShortcutLabel());
  }

  function getSaveDialogShortcutLabel(): string {
    return isApplePlatform() ? "Command+Enter" : "Ctrl+Enter";
  }

  function isPlaceholderThumbnail(image: HTMLImageElement): boolean {
    return (
      image.naturalWidth <= PLACEHOLDER_THUMBNAIL_MAX_WIDTH &&
      image.naturalHeight <= PLACEHOLDER_THUMBNAIL_MAX_HEIGHT
    );
  }

  function extractTitle(): string {
    // YouTube はページを移動しても見出し要素を非表示のまま残すため、
    // 表示中の見出しだけを使う（Shorts などでは前の動画のタイトルが残っている）。
    const headingText = Array.from(
      document.querySelectorAll<HTMLHeadingElement>(
        "h1.ytd-watch-metadata, h1.title",
      ),
    )
      .find((heading) => heading.getClientRects().length > 0)
      ?.textContent?.trim();

    if (headingText) {
      return headingText;
    }

    return (
      document.title
        .replace(/^\(\d+\+?\)\s*/, "")
        .replace(/\s*-\s*YouTube\s*$/i, "")
        .trim() || "YouTube thumbnail"
    );
  }

  function extractChannelName(): string {
    const selectors = [
      "ytd-watch-metadata ytd-channel-name a",
      "#owner #channel-name a",
      "ytd-video-owner-renderer #channel-name a",
    ];

    return findFirstText(selectors);
  }

  function extractUploadDate(): string {
    const selectors = [
      "ytd-watch-info-text #info-container yt-formatted-string",
      "#info-strings yt-formatted-string",
      "ytd-watch-metadata #info-strings yt-formatted-string",
    ];

    return findFirstText(selectors);
  }

  function findFirstText(selectors: string[]): string {
    for (const selector of selectors) {
      const text = document.querySelector(selector)?.textContent?.trim();

      if (text) {
        return text;
      }
    }

    return "";
  }

  function sendDownloadMessage(
    payload: DownloadRequest,
  ): Promise<DownloadThumbnailResponse> {
    const message: DownloadThumbnailMessage = {
      type: "YT_CAP_DOWNLOAD_THUMBNAIL",
      payload,
    };

    return chrome.runtime.sendMessage(message);
  }
})();
