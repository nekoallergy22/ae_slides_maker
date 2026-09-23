// jsonHandler.jsx - JSONファイルの読み込みと解析を担当するモジュール
var jsonData = null;

// tts_export形式（lines/slides構造）かどうかを判定する
function isTtsExportFormat(data) {
  return data && data.lines && data.slides && !data.slide;
}

// tts_export形式のJSONを内部形式（project/audios/slide）に変換する
// - duration: 秒 → ミリ秒
// - lines → audios (line_index → id, slide_id → slideNumber)
// - slides → slide (line_indices → audio_list, margin はデフォルト1000ms)
function convertTtsExport(data, projectName) {
  var converted = {
    project: { name: projectName },
    audios: [],
    slide: []
  };

  var orderBySlide = {};
  for (var i = 0; i < data.lines.length; i++) {
    var line = data.lines[i];
    var sid = line.slide_id;
    orderBySlide[sid] = (orderBySlide[sid] || 0) + 1;
    converted.audios.push({
      id: line.line_index,
      text: line.text,
      duration: Math.round(line.duration * 1000),
      slideNumber: sid,
      slideOrder: orderBySlide[sid]
    });
  }

  for (var j = 0; j < data.slides.length; j++) {
    var s = data.slides[j];
    converted.slide.push({
      id: s.slide_id,
      name: String(s.slide_id),
      num_audio: s.line_count,
      audio_list: s.line_indices,
      duration: Math.round(s.duration * 1000),
      margin: 1000
    });
  }

  return converted;
}

// jsonDataの中身を診断用にダンプする（原因切り分けログ用）
function describeJsonData() {
  if (typeof jsonData === "undefined") return "undefined";
  if (jsonData === null) return "null";
  var keys = [];
  for (var k in jsonData) {
    keys.push(k);
  }
  var desc = "型=" + typeof jsonData + ", キー=[" + keys.join(", ") + "]";
  desc +=
    ", slide=" +
    (jsonData.slide ? "あり(" + jsonData.slide.length + "件)" : "なし");
  desc +=
    ", audios=" +
    (jsonData.audios ? "あり(" + jsonData.audios.length + "件)" : "なし");
  desc +=
    ", project.name=" +
    (jsonData.project && jsonData.project.name
      ? jsonData.project.name
      : "なし");
  return desc;
}

function loadJSON(panel) {
  var logger = new Logger("JSONHandler");

  try {
    var jsonFile = File.openDialog("JSONファイルを選択", "*.json");
    if (!jsonFile) {
      logger.log("ファイル選択がキャンセルされました");
      return;
    }

    jsonFile.encoding = "UTF-8";
    if (jsonFile.open("r")) {
      var content = jsonFile.read();
      jsonFile.close();

      try {
        jsonData = JSON.parse(content);

        // tts_export形式なら内部形式に自動変換
        if (isTtsExportFormat(jsonData)) {
          var projectName = jsonFile.parent
            ? decodeURI(jsonFile.parent.name)
            : "MainComp";
          logger.log(
            "tts_export形式のJSONを検出しました。内部形式に変換します (project.name=" +
              projectName +
              ")"
          );
          jsonData = convertTtsExport(jsonData, projectName);
        }

        logger.log(
          "JSON解析成功: ファイル=" +
            jsonFile.name +
            ", 文字数=" +
            content.length
        );
        logger.log("jsonData詳細: " + describeJsonData());
        if (!jsonData.slide) {
          logger.log(
            "警告: 読み込んだJSONに 'slide' キーがありません。コンポジション作成は失敗します"
          );
          alert(
            "警告: 読み込んだJSONに 'slide' キーがありません。\nこのままではコンポジションを作成できません。JSONの構造を確認してください。"
          );
        }
        panel.resultText.text = content;

        updateSectionInfo(panel);

        panel.createCompButton.enabled = true;
        logger.log("JSONファイルを正常に読み込みました: " + jsonFile.name);
      } catch (e) {
        alert("JSONの解析に失敗しました: " + e.toString());
        logger.log("JSONの解析に失敗しました: " + e.toString());
        panel.resultText.text = "JSONの解析に失敗しました";
        panel.createCompButton.enabled = false;
      }
    } else {
      logger.log("ファイルを開けませんでした: " + jsonFile.name);
      alert("ファイルを開けませんでした");
    }
  } catch (e) {
    logger.log("JSONファイル読み込み中にエラーが発生しました: " + e.toString());
    alert("JSONファイル読み込み中にエラーが発生しました: " + e.toString());
  }
}
