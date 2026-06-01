export type VideoMetadata = {
  videoId: string;
  title: string;
  url: string;
  channelName: string;
  uploadDate: string;
  capturedAt: string;
};

export type DownloadThumbnailMessage = {
  type: "YT_CAP_DOWNLOAD_THUMBNAIL";
  payload: DownloadRequest;
};

export type DownloadThumbnailResponse =
  | {
      ok: true;
      thumbnailUrl: string;
    }
  | {
      ok: false;
      error: string;
    };

export type LanguageSetting = "auto" | "en" | "ja";

/**
 * ダウンロードするファイル名の組み立て方。
 * - title: 動画タイトルのみ（例: 動画タイトル.jpg）
 * - titleId: タイトル_videoId（例: 動画タイトル_dQw4w9WgXcQ.jpg）
 * - id: videoId のみ（例: dQw4w9WgXcQ.jpg）
 */
export type FilenameFormat = "title" | "titleId" | "id";

export type Settings = {
  language: LanguageSetting;
  filenameFormat: FilenameFormat;
  showSaveDialog: boolean;
};

export type DownloadRequest = VideoMetadata & {
  thumbnailUrl: string;
};
