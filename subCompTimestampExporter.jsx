// subCompTimestampExporter.jsx - サブコンポジションのタイムスタンプリストを出力するモジュール

// サブコンポジションのタイムスタンプリストを出力する関数
function exportSubCompTimestamps() {
  var logger = new Logger("SubCompTimestampExporter");

  try {
    // JSONデータの存在確認
    if (!jsonData || !jsonData.project || !jsonData.project.name) {
      alert("JSONデータが読み込まれていません。\n先に「JSONを読み込む」ボタンでJSONファイルを読み込んでください。");
      logger.log("JSONデータが読み込まれていないため、タイムスタンプリスト出力を中止しました");
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

    // サブコンポジションのタイムスタンプ情報を収集
    var subCompEntries = collectSubCompEntries(mainComp);

    if (subCompEntries.length === 0) {
      alert("メインコンポジション内にサブコンポジション（base、endを除く）が見つかりませんでした。");
      logger.log("サブコンポジションが見つかりませんでした");
      return false;
    }

    logger.log(subCompEntries.length + "個のサブコンポジションを検出しました");

    // 開始時間でソート
    subCompEntries.sort(function(a, b) {
      return a.startTime - b.startTime;
    });

    // タイムスタンプリストを生成
    var timestampContent = generateTimestampContent(subCompEntries);

    // プロジェクトファイルと同階層に保存
    // プロジェクトが未保存の場合はデスクトップにフォールバック
    var saveFolder;
    if (app.project.file) {
      saveFolder = app.project.file.parent.fsName;
    } else {
      saveFolder = Folder.desktop.fsName;
    }
    var saveFile = new File(saveFolder + "/timecodes.txt");

    // ファイルに書き込み
    saveFile.encoding = "UTF-8";
    if (saveFile.open("w")) {
      saveFile.write(timestampContent);
      saveFile.close();

      alert("タイムスタンプリストを保存しました:\n" + saveFile.fsName);
      logger.log("タイムスタンプリストを保存しました: " + saveFile.fsName);
      return true;
    } else {
      alert("ファイルの書き込みに失敗しました。");
      logger.log("ファイルの書き込みに失敗しました");
      return false;
    }

  } catch (e) {
    logger.log("タイムスタンプリスト出力中にエラーが発生しました: " + e.toString());
    alert("タイムスタンプリスト出力中にエラーが発生しました: " + e.toString());
    return false;
  }
}

// メインコンポジションからサブコンポジションの情報を収集する関数
function collectSubCompEntries(mainComp) {
  var logger = new Logger("SubCompTimestampExporter");
  var entries = [];

  try {
    for (var i = 1; i <= mainComp.numLayers; i++) {
      var layer = mainComp.layer(i);

      // レイヤーのソースがコンポジションの場合（ネストされたコンポジション）
      if (layer.source && layer.source instanceof CompItem) {
        var nestedComp = layer.source;
        var nestedCompName = nestedComp.name;

        // "base"と"end"という名前のコンポジションは除外
        var lowerName = nestedCompName.toLowerCase();
        if (lowerName.indexOf("base") !== -1 || lowerName.indexOf("end") !== -1) {
          logger.log("「" + nestedCompName + "」コンポジションを除外します");
          continue;
        }

        // サブコンポジション内の最初のオーディオファイル名を取得
        var firstAudioName = getFirstAudioName(nestedComp);

        if (!firstAudioName) {
          logger.log("「" + nestedCompName + "」コンポジション内にオーディオが見つかりませんでした");
          firstAudioName = nestedCompName; // オーディオがない場合はコンポジション名を使用
        }

        // サブコンポジションの開始時間
        var startTime = layer.startTime;

        entries.push({
          name: firstAudioName,
          startTime: startTime,
          compName: nestedCompName
        });

        logger.log(
          "サブコンポを追加: 名前=" + firstAudioName +
          ", 開始=" + formatTimestampTime(startTime) +
          ", コンポ=" + nestedCompName
        );
      }
    }
  } catch (e) {
    logger.log("サブコンポジション収集中にエラーが発生しました: " + e.toString());
  }

  return entries;
}

// コンポジション内で時間的に最も早く開始するオーディオレイヤーの名前を取得する関数（拡張子なし）
function getFirstAudioName(comp) {
  try {
    var audioLayers = [];

    // すべてのオーディオレイヤーを収集
    for (var i = 1; i <= comp.numLayers; i++) {
      var layer = comp.layer(i);

      // レイヤーのソースが音声ファイルの場合
      if (layer.source && layer.source instanceof FootageItem) {
        audioLayers.push({
          name: layer.source.name,
          startTime: layer.startTime
        });
      }
    }

    // オーディオレイヤーが見つからない場合
    if (audioLayers.length === 0) {
      return null;
    }

    // startTimeでソート（昇順）
    audioLayers.sort(function(a, b) {
      return a.startTime - b.startTime;
    });

    // 最も早く開始するオーディオの名前を取得
    var audioName = audioLayers[0].name;

    // 拡張子を除去
    audioName = removeFileExtension(audioName);

    // 4桁の連番とアンダースコアを削除（例：0004_filename → filename）
    audioName = removeIdPrefix(audioName);

    return audioName;
  } catch (e) {
    // エラーが発生した場合はnullを返す
  }

  return null;
}

// ファイル名から4桁の連番とアンダースコアを削除する関数
function removeIdPrefix(fileName) {
  // 先頭が4桁の数字 + アンダースコアの場合は削除
  var match = fileName.match(/^\d{4}_(.+)$/);
  if (match) {
    return match[1];
  }
  return fileName;
}

// ファイル名から拡張子を除去する関数
function removeFileExtension(fileName) {
  var lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex > 0) {
    return fileName.substring(0, lastDotIndex);
  }
  return fileName;
}

// タイムスタンプリストのコンテンツを生成する関数
function generateTimestampContent(subCompEntries) {
  var content = "";

  for (var i = 0; i < subCompEntries.length; i++) {
    var entry = subCompEntries[i];
    var timeStr = formatTimestampTime(entry.startTime);
    var nameStr = entry.name;

    // 不要な文字列を削除
    nameStr = cleanupText(nameStr);

    // 特定の文章を置換
    nameStr = replaceSpecialPhrases(nameStr, timeStr);

    content += timeStr + " " + nameStr + "\n";
  }

  return content;
}

// 文章から不要なパターンを削除する関数
function cleanupText(text) {
  // 文章の最初にある「はじめに」「始めに」「初めに」を削除
  text = text.replace(/^(はじめに|始めに|初めに)\s*/, "");

  // 文章の最初にある「さて、次に、」「さて、次に」「次に、」「次に」を削除
  text = text.replace(/^(さて、次に、|さて、次に|次に、|次に)\s*/, "");

  // 文章の最初にある「さて、最後に、」「最後に、」を削除
  text = text.replace(/^(さて、最後に、|最後に、)\s*/, "");

  // 文章の末尾にある「について解説します。」を削除（句点付き）
  text = text.replace(/について解説します。\s*$/, "");

  // 前後の空白を削除
  text = text.replace(/^\s+|\s+$/g, "");

  return text;
}

// 特定の文章を置換する関数
function replaceSpecialPhrases(text, timeStr) {
  // 「さて、今回の内容をまとめて振り返りましょう。」を「まとめ」に置換
  if (text.indexOf("さて、今回の内容をまとめて振り返りましょう。") !== -1) {
    return "まとめ";
  }

  // 「今回の内容は以上です。」を「ご視聴ありがとうございました」に置換
  if (text.indexOf("今回の内容は以上です。") !== -1) {
    return "ご視聴ありがとうございました";
  }

  // タイムが「00:00」の場合は「はじめに」に置換
  if (timeStr === "00:00") {
    return "はじめに";
  }

  return text;
}

// 時間を MM:SS 形式にフォーマットする関数
function formatTimestampTime(seconds) {
  var minutes = Math.floor(seconds / 60);
  var secs = Math.floor(seconds % 60);

  // 2桁にゼロパディング
  var minutesStr = padZeroForTimestamp(minutes, 2);
  var secsStr = padZeroForTimestamp(secs, 2);

  return minutesStr + ":" + secsStr;
}

// ゼロパディングする関数
function padZeroForTimestamp(num, length) {
  var str = num.toString();
  while (str.length < length) {
    str = "0" + str;
  }
  return str;
}
