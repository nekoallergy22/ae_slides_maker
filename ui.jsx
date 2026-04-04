// ui.jsx - ユーザーインターフェースを提供するモジュール

function createUI(thisObj) {
  var logger = new Logger("UI");
  try {
    // パネルの初期化
    var panel =
      thisObj instanceof Panel
        ? thisObj
        : new Window("palette", "JSON読み込み", [0, 0, 260, 550]);
    // JSON操作ボタン行（横並び）
    var jsonButtonRow = panel.add("group", [10, 10, 250, 40]);
    jsonButtonRow.orientation = "row";
    jsonButtonRow.spacing = 5;
    jsonButtonRow.margins = 0;
    panel.loadButton = jsonButtonRow.add("button", undefined, "JSONを読み込む");
    panel.loadButton.preferredSize = [145, 30];
    panel.resetJsonButton = jsonButtonRow.add("button", undefined, "リセット");
    panel.resetJsonButton.preferredSize = [75, 30];
    // オーディオファイルを追加するボタン
    panel.addAudioButton = panel.add(
      "button",
      [10, 50, 250, 80],
      "オーディオファイルを追加"
    );
    // 結果表示エリア
    panel.resultText = panel.add("edittext", [10, 90, 250, 240], "", {
      multiline: true,
      readonly: true,
      scrollable: true,
    });
    // セクション数表示エリア
    panel.sectionCountText = panel.add("statictext", [10, 250, 250, 290], "", {
      multiline: true,
    });
    // コンポジション作成ボタン
    panel.createCompButton = panel.add(
      "button",
      [10, 300, 250, 330],
      "コンポジションを作成"
    );
    panel.createCompButton.enabled = false;

    // 図形アニメーション適用ボタン
    panel.animateShapesButton = panel.add(
      "button",
      [10, 340, 250, 370],
      "アニメーション適用＆レイヤー長さ調整"
    );

    // VTT字幕出力ボタン（間隔を開けて配置）
    panel.exportVTTButton = panel.add(
      "button",
      [10, 410, 250, 440],
      "VTT字幕を出力"
    );

    // サブコンポタイムスタンプリスト出力ボタン
    panel.exportTimestampButton = panel.add(
      "button",
      [10, 450, 250, 480],
      "タイムスタンプリストを出力"
    );

    // ステータス表示エリア
    panel.statusText = panel.add("statictext", [10, 500, 250, 520], "準備完了");

    // パネルのリサイズ対応
    panel.onResizing = panel.onResize = function () {
      this.layout.resize();
    };

    // JSONを読み込むボタンのクリックイベント
    panel.loadButton.onClick = function () {
      try {
        logger.log("JSONを読み込むボタンがクリックされました");
        panel.statusText.text = "JSONファイルを読み込んでいます...";
        loadJSON(panel);
        panel.statusText.text = "JSONファイルを読み込みました";
      } catch (e) {
        logger.log("JSONの読み込み中にエラーが発生しました: " + e.toString());
        panel.statusText.text = "エラーが発生しました";
        alert("エラーが発生しました: " + e.toString());
      }
    };

    // JSONリセットボタンのクリックイベント
    panel.resetJsonButton.onClick = function () {
      try {
        logger.log("JSONリセットボタンがクリックされました");
        jsonData = null;
        panel.resultText.text = "";
        panel.sectionCountText.text = "";
        panel.createCompButton.enabled = false;
        panel.statusText.text = "JSONをリセットしました";
        logger.log("JSONをリセットしました");
      } catch (e) {
        logger.log("JSONリセット中にエラーが発生しました: " + e.toString());
        panel.statusText.text = "エラーが発生しました";
        alert("エラーが発生しました: " + e.toString());
      }
    };

    // オーディオファイル追加ボタンのクリックイベント
    panel.addAudioButton.onClick = function () {
      try {
        logger.log("オーディオファイル追加ボタンがクリックされました");
        panel.statusText.text = "オーディオファイルを選択しています...";
        loadAudioFiles(panel);
        panel.statusText.text = "オーディオファイルを追加しました";
      } catch (e) {
        logger.log(
          "オーディオファイルの追加中にエラーが発生しました: " + e.toString()
        );
        panel.statusText.text = "エラーが発生しました";
        alert("エラーが発生しました: " + e.toString());
      }
    };

    // コンポジション作成ボタンのクリックイベント
    panel.createCompButton.onClick = function () {
      try {
        logger.log("コンポジション作成ボタンがクリックされました");

        // オーディオファイルが追加されているか確認
        if (!audioFiles || audioFiles.length === 0) {
          alert("警告: オーディオファイルが追加されていません。\n先に「オーディオファイルを追加」ボタンでオーディオファイルを追加してください。");
          panel.statusText.text = "オーディオファイルが追加されていません";
          logger.log("オーディオファイルが追加されていないため、コンポジション作成を中止しました");
          return;
        }

        panel.statusText.text = "コンポジションを作成しています...";
        createCompositions();
        panel.statusText.text = "コンポジションを作成しました";
      } catch (e) {
        logger.log(
          "コンポジション作成中にエラーが発生しました: " + e.toString()
        );
        panel.statusText.text = "エラーが発生しました";
        alert("エラーが発生しました: " + e.toString());
      }
    };

    // アニメーション適用ボタンのクリックイベント
    panel.animateShapesButton.onClick = function () {
      try {
        logger.log(
          "アニメーション適用＆レイヤー長さ調整ボタンがクリックされました"
        );
        panel.statusText.text =
          "アニメーション適用とレイヤー長さ調整を実行中...";
        var result = animateShapeLayers();
        if (result) {
          panel.statusText.text =
            "アニメーション適用とレイヤー長さ調整が完了しました";
        } else {
          panel.statusText.text = "処理に失敗しました";
        }
      } catch (e) {
        logger.log("処理中にエラーが発生しました: " + e.toString());
        panel.statusText.text = "エラーが発生しました";
        alert("エラーが発生しました: " + e.toString());
      }
    };

    // VTT字幕出力ボタンのクリックイベント
    panel.exportVTTButton.onClick = function () {
      try {
        logger.log("VTT字幕出力ボタンがクリックされました");
        panel.statusText.text = "VTT字幕を出力中...";
        var result = exportVTT();
        if (result) {
          panel.statusText.text = "VTT字幕を出力しました";
        } else {
          panel.statusText.text = "VTT出力に失敗しました";
        }
      } catch (e) {
        logger.log("VTT出力中にエラーが発生しました: " + e.toString());
        panel.statusText.text = "エラーが発生しました";
        alert("エラーが発生しました: " + e.toString());
      }
    };

    // タイムスタンプリスト出力ボタンのクリックイベント
    panel.exportTimestampButton.onClick = function () {
      try {
        logger.log("タイムスタンプリスト出力ボタンがクリックされました");
        panel.statusText.text = "タイムスタンプリストを出力中...";
        var result = exportSubCompTimestamps();
        if (result) {
          panel.statusText.text = "タイムスタンプリストを出力しました";
        } else {
          panel.statusText.text = "タイムスタンプリスト出力に失敗しました";
        }
      } catch (e) {
        logger.log("タイムスタンプリスト出力中にエラーが発生しました: " + e.toString());
        panel.statusText.text = "エラーが発生しました";
        alert("エラーが発生しました: " + e.toString());
      }
    };

    // パネルのレイアウトを適用
    panel.layout.layout(true);
    logger.log("UIを作成しました");
    return panel;
  } catch (e) {
    alert("UIの作成中にエラーが発生しました: " + e.toString());
    logger.log("UIの作成中にエラーが発生しました: " + e.toString());
    return null;
  }
}
