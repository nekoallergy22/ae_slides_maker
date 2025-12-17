// vttExporter.jsx - VTT字幕ファイルの出力を担当するモジュール

// VTT形式で字幕を出力する関数
function exportVTT() {
  var logger = new Logger("VTTExporter");

  try {
    // JSONデータの存在確認
    if (!jsonData || !jsonData.project || !jsonData.project.name) {
      alert("JSONデータが読み込まれていません。\n先に「JSONを読み込む」ボタンでJSONファイルを読み込んでください。");
      logger.log("JSONデータが読み込まれていないため、VTT出力を中止しました");
      return false;
    }

    // メインコンポジションを取得
    var mainCompName = jsonData.project.name;
    var mainComp = findCompByName(mainCompName);

    if (!mainComp) {
      alert("メインコンポジション「" + mainCompName + "」が見つかりません。\n先に「コンポジションを作成」ボタンでコンポジションを作成してください。");
      logger.log("メインコンポジション「" + mainCompName + "」が見つかりませんでした");
      return false;
    }

    logger.log("メインコンポジション「" + mainCompName + "」を解析します");

    // 音声データを収集
    var audioEntries = collectAudioEntries(mainComp, 0, null);

    if (audioEntries.length === 0) {
      alert("メインコンポジション内に音声レイヤーが見つかりませんでした。");
      logger.log("音声レイヤーが見つかりませんでした");
      return false;
    }

    logger.log(audioEntries.length + "個の音声レイヤーを検出しました");

    // 開始時間でソート
    audioEntries.sort(function(a, b) {
      return a.startTime - b.startTime;
    });

    // VTT形式で出力
    var vttContent = generateVTTContent(audioEntries);

    // プロジェクトファイルと同階層に保存
    // プロジェクトが未保存の場合はデスクトップにフォールバック
    var saveFolder;
    if (app.project.file) {
      saveFolder = app.project.file.parent.fsName;
    } else {
      saveFolder = Folder.desktop.fsName;
    }
    var saveFile = new File(saveFolder + "/cc.vtt");

    // ファイルに書き込み
    saveFile.encoding = "UTF-8";
    if (saveFile.open("w")) {
      saveFile.write(vttContent);
      saveFile.close();

      alert("VTTファイルを保存しました:\n" + saveFile.fsName);
      logger.log("VTTファイルを保存しました: " + saveFile.fsName);
      return true;
    } else {
      alert("ファイルの書き込みに失敗しました。");
      logger.log("ファイルの書き込みに失敗しました");
      return false;
    }

  } catch (e) {
    logger.log("VTT出力中にエラーが発生しました: " + e.toString());
    alert("VTT出力中にエラーが発生しました: " + e.toString());
    return false;
  }
}

// コンポジションから音声レイヤーを再帰的に収集する関数
function collectAudioEntries(comp, timeOffset, parentCompName) {
  var logger = new Logger("VTTExporter");
  var entries = [];

  try {
    for (var i = 1; i <= comp.numLayers; i++) {
      var layer = comp.layer(i);

      // レイヤーのソースがコンポジションの場合（ネストされたコンポジション）
      if (layer.source && layer.source instanceof CompItem) {
        var nestedComp = layer.source;
        var nestedCompName = nestedComp.name;

        // "base"という名前のコンポジションは除外
        if (nestedCompName.toLowerCase().indexOf("base") !== -1) {
          logger.log("「" + nestedCompName + "」コンポジション内の音声を除外します");
          continue;
        }

        // ネストされたコンポジションの開始時間を計算
        var nestedTimeOffset = timeOffset + layer.startTime;

        // 再帰的にネストされたコンポジション内の音声を収集
        var nestedEntries = collectAudioEntries(nestedComp, nestedTimeOffset, nestedCompName);
        entries = entries.concat(nestedEntries);
      }
      // レイヤーのソースが音声ファイルの場合
      else if (layer.source && layer.source instanceof FootageItem) {
        var audioItem = layer.source;
        var audioName = audioItem.name;

        // ファイル名から4桁IDを抽出
        var audioId = extractIdFromFileName(audioName);

        if (audioId === null) {
          logger.log("音声ファイル「" + audioName + "」からIDを抽出できませんでした");
          continue;
        }

        // JSONデータから対応するテキストを取得
        var audioText = getAudioTextById(audioId);

        if (!audioText) {
          logger.log("ID " + audioId + " に対応するテキストが見つかりませんでした");
          audioText = "[テキストなし - ID: " + audioId + "]";
        }

        // メインコンポジションでの絶対時間を計算
        var absoluteStartTime = timeOffset + layer.startTime;
        var absoluteEndTime = timeOffset + layer.outPoint;

        entries.push({
          id: audioId,
          text: audioText,
          startTime: absoluteStartTime,
          endTime: absoluteEndTime,
          fileName: audioName,
          parentComp: parentCompName || comp.name
        });

        logger.log(
          "音声を追加: ID=" + audioId +
          ", 開始=" + formatTime(absoluteStartTime) +
          ", 終了=" + formatTime(absoluteEndTime) +
          ", 親=" + (parentCompName || comp.name)
        );
      }
    }
  } catch (e) {
    logger.log("音声収集中にエラーが発生しました: " + e.toString());
  }

  return entries;
}

// JSONデータから音声IDに対応するテキストを取得する関数
function getAudioTextById(id) {
  if (!jsonData || !jsonData.audios) {
    return null;
  }

  for (var i = 0; i < jsonData.audios.length; i++) {
    if (jsonData.audios[i].id === id) {
      return jsonData.audios[i].text;
    }
  }

  return null;
}

// VTT形式のコンテンツを生成する関数
function generateVTTContent(audioEntries) {
  var vtt = "WEBVTT\n\n";

  for (var i = 0; i < audioEntries.length; i++) {
    var entry = audioEntries[i];
    var cueNumber = i + 1;

    vtt += cueNumber + "\n";
    vtt += formatTime(entry.startTime) + " --> " + formatTime(entry.endTime) + "\n";
    vtt += entry.text + "\n\n";
  }

  return vtt;
}

// 時間を VTT 形式にフォーマットする関数 (HH:MM:SS.mmm)
function formatTime(seconds) {
  var hours = Math.floor(seconds / 3600);
  var minutes = Math.floor((seconds % 3600) / 60);
  var secs = Math.floor(seconds % 60);
  var milliseconds = Math.floor((seconds % 1) * 1000);

  // 2桁または3桁にゼロパディング
  var hoursStr = padZero(hours, 2);
  var minutesStr = padZero(minutes, 2);
  var secsStr = padZero(secs, 2);
  var millisecondsStr = padZero(milliseconds, 3);

  return hoursStr + ":" + minutesStr + ":" + secsStr + "." + millisecondsStr;
}

// ゼロパディングする関数
function padZero(num, length) {
  var str = num.toString();
  while (str.length < length) {
    str = "0" + str;
  }
  return str;
}
