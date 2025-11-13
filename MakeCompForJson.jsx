// MakeCompForJson.jsx - メインスクリプトファイル

var scriptFolder = new File($.fileName).parent.absoluteURI;

// 各ファイルを読み込む
$.evalFile(scriptFolder + "/logger.jsx");
$.evalFile(scriptFolder + "/jsonHandler.jsx");
$.evalFile(scriptFolder + "/audioHandler.jsx");
$.evalFile(scriptFolder + "/compUtils.jsx");
$.evalFile(scriptFolder + "/slideCompCreator.jsx");
$.evalFile(scriptFolder + "/mainCompCreator.jsx");
$.evalFile(scriptFolder + "/compCreator.jsx");
$.evalFile(scriptFolder + "/shapeAnimator.jsx");
$.evalFile(scriptFolder + "/vttExporter.jsx");
$.evalFile(scriptFolder + "/subCompTimestampExporter.jsx");
$.evalFile(scriptFolder + "/ui.jsx");

// グローバルロガーインスタンスを作成
var logger = new Logger("MakeCompForJson");
logger.log("スクリプトを開始しました");

// UIパネルを作成
var myPanel = createUI(this);

// パネルとして実行されていない場合はウィンドウを表示
if (!(myPanel instanceof Panel)) {
  myPanel.center();
  myPanel.show();
}

logger.log("UIを作成しました");
