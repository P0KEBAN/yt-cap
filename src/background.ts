import {
  getMessages,
  resolveLocale,
  type Locale,
  type Messages,
} from "./i18n.js";
import { DEFAULT_SETTINGS, loadSettings } from "./settings.js";
import type {
  DownloadRequest,
  DownloadThumbnailMessage,
  DownloadThumbnailResponse,
  FilenameFormat,
} from "./types";

// ファイル名に使えない・避けたい文字。Windows禁止文字＋制御文字を含む。
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
// 多くのファイルシステムはファイル名を255バイトまでに制限している。
// 拡張子や重複時の連番 " (1)" の余裕を残して、拡張子を除いた部分をこの長さに収める。
const MAX_FILENAME_BASE_BYTES = 200;
const DOWNLOAD_TIMEOUT_MS = 120_000;

// 保存ダイアログを閉じたなど、ユーザー自身が保存をやめた場合。失敗とは区別して扱う。
class DownloadCanceledError extends Error {}

chrome.action.onClicked.addListener((tab) => {
  void injectContentScript(tab);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "download-thumbnail") {
    return;
  }

  void runOnActiveTab();
});

chrome.runtime.onMessage.addListener(
  (
    message: DownloadThumbnailMessage,
    _sender,
    sendResponse: (response: DownloadThumbnailResponse) => void,
  ) => {
    if (message?.type !== "YT_CAP_DOWNLOAD_THUMBNAIL") {
      return false;
    }

    void (async () => {
      let locale = fallbackLocale();

      try {
        locale = await currentLocale();
        const thumbnailUrl = await downloadThumbnail(message.payload, locale);

        sendResponse({ ok: true, thumbnailUrl });
      } catch (error) {
        sendResponse({
          ok: false,
          error: toUserFacingError(error, locale),
          canceled: error instanceof DownloadCanceledError,
        });
      }
    })();

    return true;
  },
);

async function currentLocale(): Promise<Locale> {
  const settings = await loadSettings();
  return resolveLocale(settings.language, chrome.i18n.getUILanguage());
}

function fallbackLocale(): Locale {
  return resolveLocale(DEFAULT_SETTINGS.language, chrome.i18n.getUILanguage());
}

async function runOnActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await injectContentScript(tab);
}

async function injectContentScript(
  tab: chrome.tabs.Tab | undefined,
): Promise<void> {
  const m = getMessages(await currentLocale());

  if (!tab?.id || !isInjectablePage(tab.url)) {
    await notify(m.unsupportedPage);
    return;
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["src/overlay.css"],
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["dist/content.js"],
    });
  } catch {
    await notify(m.cannotRunHere);
  }
}

function isInjectablePage(rawUrl: string | undefined): boolean {
  return (
    !rawUrl || rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
  );
}

async function downloadThumbnail(
  request: DownloadRequest,
  locale: Locale,
): Promise<string> {
  const settings = await loadSettings();
  const m = getMessages(locale);
  const thumbnailUrl = request.thumbnailUrl;

  if (!thumbnailUrl) {
    throw new Error(m.thumbnailFailed);
  }

  const filename = buildDownloadPath(
    buildFilename(request, settings.filenameFormat),
    settings.defaultDownloadFolder,
  );

  let downloadId: number;

  try {
    downloadId = await chrome.downloads.download({
      url: thumbnailUrl,
      filename,
      saveAs: request.useSaveDialog === true,
    });
  } catch (error) {
    if (isUserCancelMessage(error)) {
      throw new DownloadCanceledError();
    }

    console.warn("yt-cap: ダウンロードを開始できませんでした", error);
    throw new Error(m.downloadFailed);
  }

  await waitForDownload(downloadId, m);
  await notify(m.downloadedThumbnail);
  return thumbnailUrl;
}

function waitForDownload(downloadId: number, m: Messages): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timeoutId = globalThis.setTimeout(() => {
      finish("error");
    }, DOWNLOAD_TIMEOUT_MS);

    const cleanup = (): void => {
      globalThis.clearTimeout(timeoutId);
      chrome.downloads.onChanged.removeListener(onChanged);
    };

    const finish = (result: "complete" | "canceled" | "error"): void => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      if (result === "complete") {
        resolve();
        return;
      }

      reject(
        result === "canceled"
          ? new DownloadCanceledError()
          : new Error(m.downloadFailed),
      );
    };

    const handleState = (
      state: string | undefined,
      error: string | undefined,
    ): void => {
      if (state === "complete") {
        finish("complete");
        return;
      }

      if (state === "interrupted") {
        finish(error === "USER_CANCELED" ? "canceled" : "error");
      }
    };

    const onChanged = (delta: chrome.downloads.DownloadDelta): void => {
      if (delta.id !== downloadId) {
        return;
      }

      handleState(delta.state?.current, delta.error?.current);
    };

    chrome.downloads.onChanged.addListener(onChanged);

    void chrome.downloads
      .search({ id: downloadId })
      .then(([item]) => {
        handleState(item?.state, item?.error);
      })
      .catch(() => {
        finish("error");
      });
  });
}

/**
 * 設定された形式に従いダウンロード用のファイル名を組み立てる。
 * 拡張子はサムネイルURLから推定し、見つからなければ .jpg を使う。
 */
function buildFilename(
  request: DownloadRequest,
  format: FilenameFormat,
): string {
  const extension = extractExtension(request.thumbnailUrl);
  const safeTitle = sanitizeFilenamePart(request.title) || "youtube-thumbnail";
  const videoId = sanitizeFilenamePart(request.videoId) || "thumbnail";

  let base: string;

  switch (format) {
    case "title":
      base = safeTitle;
      break;
    case "id":
      base = videoId;
      break;
    case "titleId":
    default:
      // 長いタイトルでも動画IDが切り落とされないよう、タイトル側だけを詰める。
      base = `${truncate(
        safeTitle,
        MAX_FILENAME_BASE_BYTES - byteLength(videoId) - 1,
      )}_${videoId}`;
      break;
  }

  return `${truncate(base, MAX_FILENAME_BASE_BYTES)}.${extension}`;
}

function buildDownloadPath(filename: string, folder: string): string {
  return folder ? `${folder}/${filename}` : filename;
}

function sanitizeFilenamePart(value: string): string {
  return value
    .replace(INVALID_FILENAME_CHARS, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .replace(/\.+$/, "")
    .trim();
}

function truncate(value: string, maxBytes: number): string {
  if (byteLength(value) <= maxBytes) {
    return value;
  }

  // 絵文字などを途中で切って壊れた文字にしないよう、1文字ずつ収まる範囲まで足していく。
  let result = "";
  let bytes = 0;

  for (const char of value) {
    bytes += byteLength(char);

    if (bytes > maxBytes) {
      break;
    }

    result += char;
  }

  return result.trim();
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function extractExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = /\.([a-zA-Z0-9]{1,5})$/.exec(pathname);

    if (match) {
      return match[1].toLowerCase();
    }
  } catch {
    // URL として解釈できない場合は既定値にフォールバックする。
  }

  return "jpg";
}

function isUserCancelMessage(error: unknown): boolean {
  return error instanceof Error && /cancell?ed/i.test(error.message);
}

async function notify(message: string): Promise<void> {
  // 通知の失敗（アイコン読み込み不可・OS側で通知無効など）はダウンロード成否に影響させない。
  // MV3のService Workerでは相対パスのiconUrlが解決できず例外になることがあるため、
  // chrome.runtime.getURL で絶対URLに解決したうえで、例外は握りつぶす。
  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon-128.png"),
      title: "yt-cap",
      message,
    });
  } catch (error) {
    console.warn("yt-cap: 通知の表示に失敗しました", error);
  }
}

function toUserFacingError(error: unknown, locale: Locale): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return getMessages(locale).downloadFailed;
}
