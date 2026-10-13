#!/usr/bin/env bash
# 配布用の zip を release/ に作る。展開すると yt-cap/ フォルダになり、
# そのまま Chrome の「パッケージ化されていない拡張機能を読み込む」で選べる。
set -euo pipefail

cd "$(dirname "$0")/.."

version="$(node -p "require('./manifest.json').version")"
staging="release/yt-cap"
archive="release/yt-cap-v${version}.zip"

rm -rf dist release
npm run build

mkdir -p "$staging/src" "$staging/icons"
cp manifest.json LICENSE "$staging/"
cp -R _locales "$staging/_locales"
cp -R dist "$staging/dist"
cp src/options.html src/options.css src/overlay.css "$staging/src/"
cp icons/icon-16.png icons/icon-48.png icons/icon-128.png "$staging/icons/"

(cd release && zip -rqX "yt-cap-v${version}.zip" yt-cap)
rm -rf "$staging"

echo "Created ${archive}"
