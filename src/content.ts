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

    return navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";
  }

  function showThumbnailOverlay(m: Record<string, string>): void {
    const existing = document.getElementById(OVERLAY_ID);

    if (existing) {
      existing.remove();
      restoreScroll();
    }

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

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

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

    const cleanup = (): void => {
      document.removeEventListener("keydown", onKeyDown, true);
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

        if (!response.ok) {
          setStatus(response.error, "error");
          return;
        }

        setStatus(m.downloaded, "success");
        window.setTimeout(cleanup, 700);
      } catch {
        setStatus(m.downloadFailed, "error");
      } finally {
        state.downloading = false;
      }
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

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        cleanup();
        return;
      }

      if (event.key !== "Enter") {
        return;
      }

      const useSaveDialog = isSaveDialogEnter(event);

      if (!useSaveDialog && !isPlainEnter(event)) {
        return;
      }

      event.preventDefault();
      void download(useSaveDialog);
    };

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
    document.addEventListener("keydown", onKeyDown, true);

    image.src = buildThumbnailUrl(
      metadata.videoId,
      THUMBNAIL_QUALITIES[state.qualityIndex],
    );
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
      url.pathname.startsWith("/shorts/")
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
    const heading =
      document.querySelector<HTMLHeadingElement>("h1.ytd-watch-metadata") ??
      document.querySelector<HTMLHeadingElement>("h1.title");
    const headingText = heading?.textContent?.trim();

    if (headingText) {
      return headingText;
    }

    return (
      document.title.replace(/\s*-\s*YouTube\s*$/i, "").trim() ||
      "YouTube thumbnail"
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
