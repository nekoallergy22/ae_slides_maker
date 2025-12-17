// compCreator.jsx - コンポジション作成機能のメインモジュール

function createCompositions() {
  var logger = new Logger("CompCreator");

  if (!jsonData || !jsonData.slide) {
    alert("有効なJSONデータが読み込まれていません。");
    logger.log("有効なJSONデータが読み込まれていません");
    return;
  }

  app.beginUndoGroup("コンポジションの作成");

  try {
    // slideフォルダを作成
    var slideFolder = createSlideFolder();

    // スライドコンポジションを作成
    var result = createSlideCompositions(jsonData.slide, slideFolder);
    var slideItems = result.slideItems;
    var totalDuration = result.totalDuration;

    // 各サブコンポジションに対応する音声データを配置
    logger.log("オーディオファイルの配置を開始します");
    var audioResult = addAudioToSubComps(slideItems, jsonData.slide);

    if (audioResult) {
      logger.log("すべてのオーディオファイルが正常に配置されました");
    } else {
      logger.log("一部のオーディオファイルの配置に問題がありました");
    }

    // オーディオ配置の詳細ログ出力と実際の配置数をカウント
    var totalAudioCount = 0;
    var detailedMessage = "";

    for (var i = 0; i < jsonData.slide.length; i++) {
      var slideData = jsonData.slide[i];
      var slideComp = slideItems[i];

      // 実際に配置されたオーディオレイヤー数をカウント
      var actualAudioCount = 0;
      for (var j = slideComp.numLayers; j >= 1; j--) {
        var layer = slideComp.layer(j);
        // オーディオファイルのみカウント（画像ファイルは除外）
        if (layer.source && layer.source instanceof FootageItem &&
            layer.source.hasAudio && !layer.source.hasVideo) {
          actualAudioCount++;
        }
      }

      totalAudioCount += actualAudioCount;

      if (slideData.audio_list && slideData.audio_list.length > 0) {
        var expectedCount = slideData.audio_list.length;
        var status = (actualAudioCount === expectedCount) ? "OK" : "エラー";

        detailedMessage += "スライド " + slideData.name + ": " +
          actualAudioCount + "/" + expectedCount + "個 (" + status + ")\n";

        logger.log(
          "スライド " + slideData.name +
          " - 期待: " + expectedCount + "個, 実際: " + actualAudioCount + "個" +
          " - オーディオID一覧: " + slideData.audio_list.join(", ")
        );
      }
    }

    // メインコンポジションを作成（スライド間のみ配置）
    if (jsonData.project && jsonData.project.name) {
      createMainComposition(jsonData.project.name, slideItems, totalDuration);
    }

    var summaryMessage =
      jsonData.slide.length + "個のコンポに" + totalAudioCount + "個のオーディオを配置しました。\n\n" +
      detailedMessage;

    alert(summaryMessage);

    logger.log(
      jsonData.slide.length + "個のコンポに" + totalAudioCount + "個のオーディオを配置しました。"
    );
  } catch (e) {
    alert("コンポジション作成中にエラーが発生しました: " + e.toString());
    logger.log("コンポジション作成中にエラーが発生しました: " + e.toString());
  }

  app.endUndoGroup();
}
