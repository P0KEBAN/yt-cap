import type { LanguageSetting } from "./types";

export type Locale = "en" | "ja";

export type Messages = {
  // options page
  pageTitle: string;
  language: string;
  languageAuto: string;
  filenameFormat: string;
  filenameTitle: string;
  filenameTitleId: string;
  filenameId: string;
  filenameHint: string;
  showSaveDialog: string;
  showSaveDialogHint: string;
  save: string;
  saved: string;
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
    language: "Language",
    languageAuto: "Auto (follow browser)",
    filenameFormat: "File name format",
    filenameTitle: "Title (Video title.jpg)",
    filenameTitleId: "Title + video ID (Video title_ID.jpg)",
    filenameId: "Video ID only (ID.jpg)",
    filenameHint:
      "Characters that cannot be used in file names are replaced automatically.",
    showSaveDialog: "Show the save dialog on download",
    showSaveDialogHint:
      "When on, the browser asks where to save each time. When off, files go straight to your downloads folder.",
    save: "Save",
    saved: "Saved",
    loading: "Loading...",
    thumbnailLoading: "Thumbnail is still loading",
    downloading: "Downloading...",
    downloaded: "Downloaded",
    downloadHint: "Press Enter to download",
    thumbnailFailed: "Could not fetch the thumbnail",
    unsupportedPage: "This page is not supported",
    cannotRunHere: "Cannot run on this page",
    downloadedThumbnail: "Downloaded the thumbnail",
    downloadFailed: "Failed to download the thumbnail",
  },
  ja: {
    pageTitle: "yt-cap 設定",
    language: "言語",
    languageAuto: "自動（ブラウザに合わせる）",
    filenameFormat: "ファイル名の形式",
    filenameTitle: "タイトル（動画タイトル.jpg）",
    filenameTitleId: "タイトル＋動画ID（動画タイトル_ID.jpg）",
    filenameId: "動画IDのみ（ID.jpg）",
    filenameHint: "ファイル名に使えない文字は自動で置き換えます。",
    showSaveDialog: "ダウンロード時に保存ダイアログを表示する",
    showSaveDialogHint:
      "オンにすると毎回保存先を選べます。オフのときはダウンロードフォルダへ直接保存します。",
    save: "保存",
    saved: "保存しました",
    loading: "読み込み中...",
    thumbnailLoading: "サムネイルを読み込み中です",
    downloading: "ダウンロード中...",
    downloaded: "ダウンロードしました",
    downloadHint: "Enterでダウンロード",
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
