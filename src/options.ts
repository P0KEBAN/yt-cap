import {
  getMessages,
  resolveLocale,
  type Locale,
  type Messages,
} from "./i18n.js";
import {
  loadSettings,
  normalizeDownloadFolder,
  normalizeFilenameFormat,
  normalizeLanguage,
} from "./settings.js";
import type { LanguageSetting, Settings } from "./types";

const form = requireElement<HTMLFormElement>("#settings-form");
const languageSelect = requireElement<HTMLSelectElement>("#language");
const filenameFormatSelect =
  requireElement<HTMLSelectElement>("#filename-format");
const defaultDownloadFolderInput = requireElement<HTMLInputElement>(
  "#default-download-folder",
);
const statusElement = requireElement<HTMLElement>("#status");
const shortcutValueElement = requireElement<HTMLElement>("#shortcut-value");
const openShortcutsButton =
  requireElement<HTMLButtonElement>("#open-shortcuts");

// manifest.json の commands のキーと合わせること。
const SHORTCUT_COMMAND = "download-thumbnail";
const SHORTCUTS_URL = "chrome://extensions/shortcuts";

let messages: Messages = getMessages("en");
let currentShortcut = "";

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

  openShortcutsButton.addEventListener("click", () => {
    void chrome.tabs.create({ url: SHORTCUTS_URL });
  });

  // ブラウザの設定画面でキーを変えて戻ってきたときに、表示を最新にする。
  window.addEventListener("focus", () => {
    void refreshShortcut();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void refreshShortcut();
    }
  });

  await refreshShortcut();
}

async function refreshShortcut(): Promise<void> {
  try {
    const commands = await chrome.commands.getAll();
    currentShortcut =
      commands.find((command) => command.name === SHORTCUT_COMMAND)
        ?.shortcut ?? "";
  } catch {
    currentShortcut = "";
  }

  renderShortcut();
}

function renderShortcut(): void {
  shortcutValueElement.textContent = currentShortcut || messages.shortcutNotSet;
  shortcutValueElement.dataset.state = currentShortcut ? "set" : "unset";
}

function applyLanguage(setting: LanguageSetting): void {
  const locale = resolveLocale(setting, chrome.i18n.getUILanguage());
  messages = getMessages(locale);
  translateDocument(locale);
  renderShortcut();
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

async function saveSettings(): Promise<void> {
  const settings = readFormSettings();

  try {
    await chrome.storage.sync.set(settings);
    await chrome.storage.sync.remove("showSaveDialog");
  } catch (error) {
    console.warn("yt-cap: 設定を保存できませんでした", error);
    setStatus(messages.saveFailed, "error");
    return;
  }

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
