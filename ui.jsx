// ui.jsx - ユーザーインターフェースを提供するモジュール

function createUI(thisObj) {
  var logger = new Logger("UI");
  try {
    // パネルの初期化
    var panel =
      thisObj instanceof Panel
        ? thisObj
        : new Window("palette", "JSON読み込み", [0, 0, 260, 430]);
    // JSONを読み込むボタン
    panel.loadButton = panel.add("button", [10, 10, 250, 40], "JSONを読み込む");
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

    // ステータス表示エリア
    panel.statusText = panel.add("statictext", [10, 380, 250, 400], "準備完了");

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
