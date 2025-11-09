// audioHandler.jsx - オーディオファイルの読み込みと管理を担当するモジュール
var audioFiles = []; // オーディオファイルを格納する配列

function loadAudioFiles(panel) {
  var logger = new Logger("AudioHandler");

  try {
    // 複数ファイル選択ダイアログを表示
    var audioFilesSelection = File.openDialog(
      "オーディオファイルを選択",
      "オーディオファイル:*.wav,*.mp3,*.aif,*.aiff,*.m4a;すべてのファイル:*.*",
      true
    ); // trueで複数選択可能

    if (!audioFilesSelection) {
      logger.log("オーディオファイル選択がキャンセルされました");
      return;
    }

    // audioフォルダを作成または取得
    var audioFolder = findOrCreateFolder("audio");

    // 選択されたファイルをプロジェクトに追加
    for (var i = 0; i < audioFilesSelection.length; i++) {
      var file = audioFilesSelection[i];

      // ファイル名をURLデコードして正しい形式に変換
      var decodedName = decodeURIComponent(file.name);

      // ファイルをプロジェクトにインポート
      var importOptions = new ImportOptions(file);
      var audioItem = app.project.importFile(importOptions);

      // audioフォルダに移動
      audioItem.parentFolder = audioFolder;

      audioFiles.push({
        item: audioItem,
        name: decodedName, // URLデコード済みの名前を保存
        id: parseInt(decodedName.substring(0, 4)), // ファイル名の先頭4桁をIDとして扱う
        size: file.length,
      });

      logger.log("オーディオファイルをプロジェクトに追加: " + decodedName);
    }

    // UI表示を更新
    updateAudioFilesInfo(panel);

    alert(
      audioFilesSelection.length +
        "個のオーディオファイルをプロジェクトに追加しました"
    );
  } catch (e) {
    logger.log(
      "オーディオファイル読み込み中にエラーが発生しました: " + e.toString()
    );
    alert(
      "オーディオファイル読み込み中にエラーが発生しました: " + e.toString()
    );
  }
}

function updateAudioFilesInfo(panel) {
  updateSectionInfo(panel);

  // 選択したオーディオファイルの情報をresultTextに追加
  if (audioFiles.length > 0) {
    var audioInfo = "選択したオーディオファイル:\n";
    for (var i = 0; i < audioFiles.length; i++) {
      audioInfo += i + 1 + ". " + audioFiles[i].name + "\n";
    }

    // 既存のJSON情報があれば保持
    if (jsonData) {
      // 既存のオーディオ情報を削除して新しい情報を追加
      var jsonText =
        panel.resultText.text.split("選択したオーディオファイル:")[0];
      panel.resultText.text = jsonText + "\n\n" + audioInfo;
    } else {
      panel.resultText.text = audioInfo;
    }
  }
}

// IDに基づいてオーディオファイルを検索する関数
function findAudioById(id) {
  var logger = new Logger("AudioHandler");

  if (!audioFiles || audioFiles.length === 0) {
    logger.log("オーディオファイルが読み込まれていません");
    return null;
  }

  // 文字列IDを数値に変換（必要な場合）
  var numericId = parseInt(id, 10);

  for (var i = 0; i < audioFiles.length; i++) {
    var file = audioFiles[i];
    var fileId = extractIdFromFileName(file.name);

    if (fileId === numericId || fileId === id) {
      return file;
    }
  }

  logger.log(
    "ID " + id + " に対応するオーディオファイルが見つかりませんでした"
  );
  return null;
}

// ファイル名からIDを抽出する関数
function extractIdFromFileName(fileName) {
  // ファイル名の先頭4桁をIDとして抽出
  var match = fileName.match(/^(\d{4})_/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

// オーディオレイヤーの開始時間を計算する関数
function calculateStartTime(comp, layer, index, margin) {
  var logger = new Logger("AudioHandler");

  // 最初のオーディオはマージンから開始
  if (index === 0) {
    logger.log("最初のオーディオ - マージンから開始: " + margin / 1000 + "秒");
    return margin / 1000; // ミリ秒から秒に変換
  }

  // 2つ目以降のオーディオは前のレイヤーの終了時点から開始
  // comp.numLayers は現在のレイヤー数（最新追加レイヤーを含む）
  // 前のレイヤーは現在のレイヤー+1の位置にある（AEのレイヤーは逆順）
  var previousLayer = comp.layer(1); // 最後に追加されたレイヤー（現在のレイヤーの前）

  logger.log(
    "前のレイヤー: " +
      previousLayer.name +
      ", 終了時間: " +
      previousLayer.outPoint +
      "秒"
  );
  return previousLayer.outPoint;
}

// サブコンポジションに対応するオーディオを配置する関数
function addAudioToSubComps(slideComps, jsonSlides) {
  var logger = new Logger("AudioHandler");
  var missingAudios = []; // 見つからなかったオーディオIDを記録

  try {
    for (var i = 0; i < jsonSlides.length; i++) {
      var slideData = jsonSlides[i];
      var slideComp = slideComps[i];

      if (!slideData.audio_list || slideData.audio_list.length === 0) {
        logger.log(
          "スライド " + slideData.name + " に対応するオーディオがありません"
        );
        continue;
      }

      logger.log(
        "スライド " + slideData.name + " のオーディオ配置を開始します"
      );

      // 既存のオーディオレイヤーをクリア（重複配置を防ぐ）
      for (var k = slideComp.numLayers; k >= 1; k--) {
        var layer = slideComp.layer(k);
        // AVLayerかつソースがFootageItemの場合はオーディオレイヤー
        if (layer.source && layer.source instanceof FootageItem) {
          layer.remove();
          logger.log(
            "スライド " + slideData.name + " から既存のオーディオレイヤー \"" + layer.name + "\" を削除しました"
          );
        }
      }

      // 現在の時間位置を追跡（マージンを削除し、0から開始）
      var currentTime = 0; // マージンを使用しない

      for (var j = 0; j < slideData.audio_list.length; j++) {
        var audioId = slideData.audio_list[j];
        var audioFile = findAudioById(audioId);

        if (!audioFile) {
          var errorMsg = "スライド " + slideData.name + " - ID " + audioId;
          missingAudios.push(errorMsg);
          logger.log(
            "スライド " +
              slideData.name +
              " に対応するID " +
              audioId +
              " のオーディオが見つかりませんでした"
          );
          continue;
        }

        // オーディオファイルの長さを取得
        var audioDuration = getAudioDuration(audioFile.item);

        // サブコンポジションにレイヤーとして追加
        var layer = slideComp.layers.add(audioFile.item);

        // 開始時間を設定（マージンなし）
        layer.startTime = currentTime;

        // 次のオーディオの開始時間を更新
        currentTime += audioDuration;

        logger.log(
          "スライド " +
            slideData.name +
            " にオーディオ " +
            audioFile.name +
            " (ID: " +
            audioId +
            ")" +
            " を追加しました。配置順序: " +
            (j + 1) +
            ", 開始時間: " +
            layer.startTime +
            "秒" +
            ", 終了時間: " +
            layer.outPoint +
            "秒" +
            ", 長さ: " +
            (layer.outPoint - layer.startTime) +
            "秒"
        );
      }

      logger.log(
        "スライド " + slideData.name + " のオーディオ配置が完了しました"
      );
    }

    // 見つからなかったオーディオがある場合は警告を表示
    if (missingAudios.length > 0) {
      var warningMsg =
        "以下のオーディオファイルが見つかりませんでした:\n\n" +
        missingAudios.join("\n") +
        "\n\nファイル名が「####_*.mp3」形式（例: 0001_audio.mp3）になっているか確認してください。";
      logger.log("警告: " + missingAudios.length + "個のオーディオが見つかりませんでした");
      alert(warningMsg);
      return false;
    }

    return true;
  } catch (e) {
    logger.log(
      "サブコンポジションへのオーディオ配置中にエラーが発生しました: " +
        e.toString()
    );
    return false;
  }
}

// オーディオファイルの長さを取得する関数
function getAudioDuration(item) {
  if (item && item.duration) {
    return item.duration;
  } else {
    // デフォルト値（秒）を返す
    return 3;
  }
}

// 読み込まれたオーディオファイルの数を返す関数
function getAudioFilesCount() {
  return audioFiles ? audioFiles.length : 0;
}
