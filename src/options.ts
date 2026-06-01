import {
  getMessages,
  resolveLocale,
  type Locale,
  type Messages,
} from "./i18n.js";
import type { FilenameFormat, LanguageSetting, Settings } from "./types";

const DEFAULT_SETTINGS: Settings = {
  language: "auto",
  filenameFormat: "titleId",
  defaultDownloadFolder: "",
};

const form = requireElement<HTMLFormElement>("#settings-form");
const languageSelect = requireElement<HTMLSelectElement>("#language");
const filenameFormatSelect =
  requireElement<HTMLSelectElement>("#filename-format");
const defaultDownloadFolderInput = requireElement<HTMLInputElement>(
  "#default-download-folder",
);
const statusElement = requireElement<HTMLElement>("#status");

let messages: Messages = getMessages("en");

void initialize();

async function initialize(): Promise<void> {
  const settings = await loadSettings();
  languageSelect.value = settings.language;
  filenameFormatSelect.value = settings.filenameFormat;
  defaultDownloadFolderInput.value = formatDownloadFolderForForm(
    settings.defaultDownloadFolder,
  );

  applyLanguage(settings.language);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveSettings();
  });

  // 言語の選択を変えたら即座に画面表示へ反映する（保存前のプレビュー）。
  languageSelect.addEventListener("change", () => {
    applyLanguage(languageSelect.value as LanguageSetting);
  });
}

function applyLanguage(setting: LanguageSetting): void {
  const locale = resolveLocale(setting, navigator.language);
  messages = getMessages(locale);
  translateDocument(locale);
}

function translateDocument(locale: Locale): void {
  const m = getMessages(locale);

  document.documentElement.lang = locale;

  const elements = Array.from(
    document.querySelectorAll<HTMLElement>("[data-i18n]"),
  );

  for (const element of elements) {
    const key = element.dataset.i18n as keyof Messages | undefined;

    if (key && key in m) {
      element.textContent = m[key];
    }
  }

  document.title = m.pageTitle;
}

async function loadSettings(): Promise<Settings> {
  const saved = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  return {
    language: normalizeLanguage(saved.language),
    filenameFormat: normalizeFilenameFormat(saved.filenameFormat),
    defaultDownloadFolder: normalizeDownloadFolder(
      saved.defaultDownloadFolder,
    ),
  };
}

async function saveSettings(): Promise<void> {
  const settings = readFormSettings();
  await chrome.storage.sync.set(settings);
  await chrome.storage.sync.remove("showSaveDialog");
  defaultDownloadFolderInput.value = formatDownloadFolderForForm(
    settings.defaultDownloadFolder,
  );
  applyLanguage(settings.language);
  setStatus(messages.saved, "success");
}

function readFormSettings(): Settings {
  return {
    language: normalizeLanguage(languageSelect.value),
    filenameFormat: normalizeFilenameFormat(filenameFormatSelect.value),
    defaultDownloadFolder: normalizeDownloadFolder(
      defaultDownloadFolderInput.value,
    ),
  };
}

function normalizeLanguage(value: unknown): LanguageSetting {
  return value === "en" || value === "ja" || value === "auto"
    ? value
    : DEFAULT_SETTINGS.language;
}

function normalizeFilenameFormat(value: unknown): FilenameFormat {
  return value === "title" || value === "titleId" || value === "id"
    ? value
    : DEFAULT_SETTINGS.filenameFormat;
}

function normalizeDownloadFolder(value: unknown): string {
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
  const sanitized = value
    .replace(/[<>:"\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+$/, "");

  return sanitized === "." || sanitized === ".." ? "" : sanitized;
}

function formatDownloadFolderForForm(folder: string): string {
  return folder || "Downloads";
}

function setStatus(
  message: string,
  variant: "normal" | "error" | "success" = "normal",
): void {
  statusElement.textContent = message;
  statusElement.dataset.variant = variant;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Options page is missing ${selector}`);
  }

  return element;
}
