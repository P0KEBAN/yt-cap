import type { FilenameFormat, LanguageSetting, Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  language: "auto",
  filenameFormat: "titleId",
  defaultDownloadFolder: "",
};

// フォルダ名に使えない・避けたい文字。区切りの "/" は残す。
const INVALID_FOLDER_CHARS = /[<>:"\\|?*\x00-\x1F]/g;

export async function loadSettings(): Promise<Settings> {
  const saved = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  return {
    language: normalizeLanguage(saved.language),
    filenameFormat: normalizeFilenameFormat(saved.filenameFormat),
    defaultDownloadFolder: normalizeDownloadFolder(
      saved.defaultDownloadFolder,
    ),
  };
}

export function normalizeLanguage(value: unknown): LanguageSetting {
  return value === "en" || value === "ja" || value === "auto"
    ? value
    : DEFAULT_SETTINGS.language;
}

export function normalizeFilenameFormat(value: unknown): FilenameFormat {
  return value === "title" || value === "titleId" || value === "id"
    ? value
    : DEFAULT_SETTINGS.filenameFormat;
}

export function normalizeDownloadFolder(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_SETTINGS.defaultDownloadFolder;
  }

  const normalized = value.trim().replace(/\\/g, "/");
  const segments = normalized
    .split("/")
    .map((segment) => sanitizeFolderSegment(segment))
    .filter(Boolean);

  if (
    segments[0]?.toLowerCase() === "downloads" ||
    segments[0] === "ダウンロード"
  ) {
    segments.shift();
  }

  return segments.join("/");
}

function sanitizeFolderSegment(value: string): string {
  return value
    .replace(INVALID_FOLDER_CHARS, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+$/, "");
}
