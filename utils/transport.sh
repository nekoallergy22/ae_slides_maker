#!/bin/bash

# ae_slides_maker インストールスクリプト

# 必要なファイルを After Effects のスクリプトフォルダにコピーします

# 定数
AE_SCRIPTS_DIR="/Applications/Adobe After Effects 2026/Scripts/ScriptUI Panels"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIR="$SCRIPT_DIR/.."
CURRENT_DIR=$(pwd)

echo
echo $DIR
echo $CURRENT_DIR
echo

# スクリプトの開始メッセージ
echo "ae_slides_maker インストールを開始します..."

# After Effects がインストールされているか確認
if [ ! -d "$AE_SCRIPTS_DIR" ]; then
  echo "エラー: After Effects 2026 が見つかりません。"
  echo "パス '$AE_SCRIPTS_DIR' が存在しません。"
  echo "After Effects 2026 がインストールされていることを確認してください。"
  exit 1
fi


# インストールするファイルのリスト
FILES_TO_INSTALL=(
  "ae_slides_maker.jsx"
  "json2.jsx"
  "jsonHandler.jsx"
  "logger.jsx"
  "ui.jsx"
  "compCreator.jsx"
  "slideCompCreator.jsx"
  "mainCompCreator.jsx"
  "compUtils.jsx"
  "audioHandler.jsx"
  "shapeAnimator.jsx"
  "vttExporter.jsx"
  "subCompTimestampExporter.jsx"
)

# ファイルが存在するか確認
for file in "${FILES_TO_INSTALL[@]}"; do
  if [ ! -f "$DIR/$file" ]; then
    echo "エラー: $file ファイルが見つかりません。"
    echo "このスクリプトは ae_slides_maker リポジトリのルートディレクトリで実行してください。"
    exit 1
  fi
done

# アーカイブディレクトリの作成
ARCHIVE_DIR="$AE_SCRIPTS_DIR/_archives"
if [ ! -d "$ARCHIVE_DIR" ]; then
  echo "アーカイブディレクトリを作成しています..."
  mkdir -p "$ARCHIVE_DIR"
  if [ $? -ne 0 ]; then
    echo "エラー: アーカイブディレクトリの作成に失敗しました。"
    echo "権限の問題がある場合は、sudo を使用して実行してください: sudo ./transport.sh"
    exit 1
  fi
fi


# 現在の日時を取得（ファイル名用）
TIMESTAMP=$(date +"%Y%m%d_%H%M")

# 各ファイルをコピー
for file in "${FILES_TO_INSTALL[@]}"; do
  echo "$file を After Effects スクリプトフォルダにコピーしています..."
  
  # 既存のファイルをアーカイブ
  if [ -f "$AE_SCRIPTS_DIR/$file" ]; then
    echo "既存の $file ファイルをアーカイブしています..."
    filename=$(basename -- "$file")
    extension="${filename##*.}"
    filename="${filename%.*}"
    mv "$AE_SCRIPTS_DIR/$file" "$ARCHIVE_DIR/${filename}_${TIMESTAMP}.${extension}"
    # echo "$AE_SCRIPTS_DIR/$file     $ARCHIVE_DIR/${filename}_${TIMESTAMP}.${extension}"
    if [ $? -ne 0 ]; then
      echo "エラー: 既存の $file ファイルのアーカイブに失敗しました。"
      echo "権限の問題がある場合は、sudo を使用して実行してください: sudo ./transport.sh"
      exit 1
    fi
  fi

  
  # 新しいファイルをコピー
  cp "$DIR/$file" "$AE_SCRIPTS_DIR/"
  if [ $? -ne 0 ]; then
    echo "エラー: $file のコピーに失敗しました。"
    echo "権限の問題がある場合は、sudo を使用して実行してください: sudo ./transport.sh"
    exit 1
  fi
done


# 完了メッセージ
echo "インストールが完了しました！"
echo "After Effects 2026 を起動し、「ウィンドウ > ae_slides_maker.jsx」からスクリプトパネルを開いてください。"
