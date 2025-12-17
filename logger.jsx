// logger.jsx - ログ機能を提供するモジュール
function Logger(scriptName) {
  this.scriptName = scriptName;

  // プロジェクトファイルと同階層にログを保存
  // プロジェクトが未保存の場合はデスクトップにフォールバック
  var logFolder;
  if (app.project.file) {
    logFolder = app.project.file.parent.fsName;
  } else {
    logFolder = Folder.desktop.fsName;
  }
  this.logFile = new File(logFolder + "/log.txt");

  this.log = function (message) {
    try {
      var timestamp = new Date().toLocaleString();
      var logMessage = timestamp + " [" + this.scriptName + "] " + message;

      // ファイルを開く前にエンコーディングを設定
      this.logFile.encoding = "UTF-8";
      if (this.logFile.open("a")) {
        this.logFile.writeln(logMessage); // UTF-8で直接書き込む
        this.logFile.close();
      } else {
        alert("ログファイルを開けませんでした。");
      }
    } catch (e) {
      alert("ログの書き込み中にエラーが発生しました: " + e.toString());
    }
  };
}
