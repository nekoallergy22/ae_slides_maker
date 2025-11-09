// compUtils.jsx - コンポジション作成のユーティリティ関数

// 名前でコンポジションを検索する関数
function findCompByName(name) {
  try {
    for (var i = 1; i <= app.project.numItems; i++) {
      var item = app.project.item(i);
      if (item instanceof CompItem && item.name === name) {
        return item;
      }
    }
  } catch (e) {
    var logger = new Logger("CompUtils");
    logger.log("コンポジション検索中にエラーが発生しました: " + e.toString());
  }
  return null;
}

// 名前でフォルダを検索または作成する関数
function findOrCreateFolder(folderName) {
  for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);
    if (item instanceof FolderItem && item.name === folderName) {
      return item;
    }
  }
  return app.project.items.addFolder(folderName);
}

// slideフォルダを作成する関数
function createSlideFolder() {
  var logger = new Logger("CompUtils");
  var slideFolder = findOrCreateFolder("slide");
  logger.log("slideフォルダを作成しました");
  return slideFolder;
}

// コンポジションのレイヤーをすべて削除する関数
function clearCompLayers(comp) {
  try {
    while (comp.numLayers > 0) {
      comp.layer(1).remove();
    }
    return true;
  } catch (e) {
    var logger = new Logger("CompUtils");
    logger.log("レイヤー削除中にエラーが発生しました: " + e.toString());
    return false;
  }
}

// セクション情報を更新する関数
function updateSectionInfo(panel) {
  var slideCount = jsonData && jsonData.slide ? jsonData.slide.length : 0;
  var audioCount = jsonData && jsonData.audios ? jsonData.audios.length : 0;
  var loadedAudioCount = 0;

  // 関数が存在する場合のみ呼び出し
  if (typeof getAudioFilesCount === "function") {
    loadedAudioCount = getAudioFilesCount();
  }

  panel.sectionCountText.text =
    "slide: " +
    slideCount +
    "\naudios (JSON): " +
    audioCount +
    "\naudios (loaded): " +
    loadedAudioCount;
}
