import type { LanguageSetting } from "./types";

export type Locale = "en" | "ja";

export type Messages = {
  // options page
  pageTitle: string;
  shortcut: string;
  shortcutNotSet: string;
  shortcutChange: string;
  shortcutHint: string;
  language: string;
  languageAuto: string;
  filenameFormat: string;
  filenameTitle: string;
  filenameTitleId: string;
  filenameId: string;
  filenameHint: string;
  defaultDownloadFolder: string;
  defaultDownloadFolderHint: string;
  save: string;
  saved: string;
  saveFailed: string;
  // overlay (content script)
  loading: string;
  thumbnailLoading: string;
  downloading: string;
  downloaded: string;
  downloadHint: string;
  thumbnailFailed: string;
  // background
  unsupportedPage: string;
  cannotRunHere: string;
  downloadedThumbnail: string;
  downloadFailed: string;
};

export const MESSAGES: Record<Locale, Messages> = {
  en: {
    pageTitle: "yt-cap Settings",
    shortcut: "Keyboard shortcut",
    shortcutNotSet: "Not set",
    shortcutChange: "Set shortcut",
    shortcutHint:
      "Shortcut keys are changed in the browser's settings. Even without a shortcut, you can use yt-cap by clicking its icon in the toolbar.",
    language: "Language",
    languageAuto: "Auto (follow browser)",
    filenameFormat: "File name format",
    filenameTitle: "Title (Video title.jpg)",
    filenameTitleId: "Title + video ID (Video title_ID.jpg)",
    filenameId: "Video ID only (ID.jpg)",
    filenameHint:
      "Characters that cannot be used in file names are replaced automatically.",
    defaultDownloadFolder: "Default download folder",
    defaultDownloadFolderHint:
      "Use Downloads or leave blank to save at the root of the browser downloads folder. Subfolders are created under it.",
    save: "Save",
    saved: "Saved",
    saveFailed: "Could not save the settings",
    loading: "Loading...",
    thumbnailLoading: "Thumbnail is still loading",
    downloading: "Downloading...",
    downloaded: "Downloaded",
    downloadHint:
      "Press Enter to download. Press {shortcut} to choose where to save",
    thumbnailFailed: "Could not fetch the thumbnail",
    unsupportedPage: "This page is not supported",
    cannotRunHere: "Cannot run on this page",
    downloadedThumbnail: "Downloaded the thumbnail",
    downloadFailed: "Failed to download the thumbnail",
  },
  ja: {
    pageTitle: "yt-cap 設定",
    shortcut: "ショートカットキー",
    shortcutNotSet: "未設定",
    shortcutChange: "ショートカットを設定",
    shortcutHint:
      "ショートカットキーはブラウザの設定画面で変更します。未設定でも、ツールバーの yt-cap アイコンをクリックすれば同じように使えます。",
    language: "言語",
    languageAuto: "自動（ブラウザに合わせる）",
    filenameFormat: "ファイル名の形式",
    filenameTitle: "タイトル（動画タイトル.jpg）",
    filenameTitleId: "タイトル＋動画ID（動画タイトル_ID.jpg）",
    filenameId: "動画IDのみ（ID.jpg）",
    filenameHint: "ファイル名に使えない文字は自動で置き換えます。",
    defaultDownloadFolder: "デフォルトのダウンロード場所",
    defaultDownloadFolderHint:
      "Downloads または空欄ならブラウザのダウンロードフォルダ直下に保存します。サブフォルダはその配下に作成されます。",
    save: "保存",
    saved: "保存しました",
    saveFailed: "設定を保存できませんでした",
    loading: "読み込み中...",
    thumbnailLoading: "サムネイルを読み込み中です",
    downloading: "ダウンロード中...",
    downloaded: "ダウンロードしました",
    downloadHint: "Enterでダウンロード、{shortcut}で保存先を選択",
    thumbnailFailed: "サムネイルを取得できませんでした",
    unsupportedPage: "このページは対応していません",
    cannotRunHere: "このページでは実行できません",
    downloadedThumbnail: "サムネイルをダウンロードしました",
    downloadFailed: "サムネイルのダウンロードに失敗しました",
  },
};

/**
 * 言語設定とブラウザUI言語から実際に使うロケールを決定する。
 * "auto" のときだけブラウザ言語を見て、ja始まりなら日本語、それ以外は英語。
 */
export function resolveLocale(
  setting: LanguageSetting,
  uiLanguage: string,
): Locale {
  if (setting === "en" || setting === "ja") {
    return setting;
  }

  return uiLanguage.toLowerCase().startsWith("ja") ? "ja" : "en";
}

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}
