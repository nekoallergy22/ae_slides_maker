// shapeAnimator.jsx - 図形アニメーション機能を提供するモジュール

function animateShapeLayers() {
  var logger = new Logger("ShapeAnimator");

  try {
    logger.log("slideフォルダ内のコンポジションにアニメーションを適用します");

    // アンドゥグループを開始
    app.beginUndoGroup("レイヤーのアニメーション適用");

    // slideフォルダを検索
    var slideFolder = null;
    for (var i = 1; i <= app.project.numItems; i++) {
      var item = app.project.item(i);
      if (item instanceof FolderItem && item.name === "slide") {
        slideFolder = item;
        break;
      }
    }

    if (!slideFolder) {
      alert("slideフォルダが見つかりません。先にコンポジションを作成してください。");
      logger.log("slideフォルダが見つかりませんでした");
      app.endUndoGroup();
      return false;
    }

    // slideフォルダ内のすべてのコンポジションを取得
    var uniqueComps = [];
    for (var j = 1; j <= slideFolder.numItems; j++) {
      var item = slideFolder.item(j);
      if (item instanceof CompItem) {
        uniqueComps.push(item);
        logger.log("処理対象のコンポジションを検出: " + item.name);
      }
    }

    if (uniqueComps.length === 0) {
      alert("slideフォルダ内にコンポジションが見つかりません。");
      logger.log("slideフォルダ内にコンポジションがありませんでした");
      app.endUndoGroup();
      return false;
    }

    // 各コンポジションに対して再帰的にアニメーションと長さ調整を適用
    var totalShapesAnimated = 0;
    var totalTextLayersAnimated = 0;
    var totalLayersExtended = 0;
    var totalCompsProcessed = 0;
    var visited = {}; // 同じサブコンポを二重処理しないためのマップ（キー: comp.id）

    for (var k = 0; k < uniqueComps.length; k++) {
      var comp = uniqueComps[k];

      // レイヤー長さ調整＋サブコンポ自体の長さ延長（再帰）
      totalLayersExtended += extendCompTreeDuration(comp, 0);

      // アニメーション適用（再帰・同一コンポは1回のみ）
      var result = animateCompTree(comp, visited, 0);
      totalShapesAnimated += result.shapesAnimated;
      totalTextLayersAnimated += result.textLayersAnimated;
      totalCompsProcessed += result.compsProcessed;
    }

    // 最終的な結果のログ
    logger.log(
      "合計: " +
        totalCompsProcessed +
        "個のコンポジション（サブコンポ含む）に" +
        (totalShapesAnimated + totalTextLayersAnimated) +
        "個のアニメーションを適用し、" +
        totalLayersExtended +
        "個のレイヤーの長さを調整しました。"
    );

    app.endUndoGroup();

    var totalAnimated = totalShapesAnimated + totalTextLayersAnimated;

    if (totalAnimated > 0 || totalLayersExtended > 0) {
      var message =
        totalCompsProcessed + "個のコンポジション（サブコンポ含む）に対して、";
      if (totalShapesAnimated > 0) {
        message += totalShapesAnimated + "個の図形レイヤー";
      }
      if (totalTextLayersAnimated > 0) {
        if (totalShapesAnimated > 0) message += "と";
        message += totalTextLayersAnimated + "個のテキストレイヤー";
      }
      message += "にアニメーションを適用し、";
      message +=
        totalLayersExtended +
        "個のレイヤーの長さをコンポジションに合わせました。";

      alert(message);
      return true;
    } else {
      alert("アニメーション可能なレイヤーが見つかりませんでした。");
      logger.log("アニメーション可能なレイヤーが見つかりませんでした");
      return false;
    }
  } catch (e) {
    logger.log("アニメーション処理中にエラーが発生しました: " + e.toString());
    alert("エラーが発生しました: " + e.toString());
    return false;
  }
}

// コンポジションツリー全体の長さ調整を再帰的に行う関数
// 1) コンポ内の非オーディオレイヤーのout点をコンポの長さに合わせる
// 2) サブコンポ自体の長さ（duration）が不足していれば延長する
// 3) サブコンポの中身も同様に再帰処理する
function extendCompTreeDuration(comp, depth) {
  var logger = new Logger("ShapeAnimator");

  // 【重要】先にサブコンポ自体の長さ（duration）を延長する。
  // AEは時間リマップなしのコンポレイヤーのout点をソースの長さより先に
  // 延ばせない（サイレントにクランプされる）ため、レイヤー長調整より
  // 前にソース側を延長しておく必要がある。
  for (var i = 1; i <= comp.numLayers; i++) {
    var layer = comp.layer(i);
    if (layer.source && layer.source instanceof CompItem) {
      var subComp = layer.source;

      // 親コンポの末尾まで表示するために必要なソースの長さ
      var requiredDuration = comp.duration - layer.startTime;
      if (subComp.duration < requiredDuration) {
        logger.log(
          "サブコンポ「" +
            subComp.name +
            "」の長さを " +
            subComp.duration.toFixed(2) +
            "秒 → " +
            requiredDuration.toFixed(2) +
            "秒 に延長します (親: " +
            comp.name +
            ")"
        );
        subComp.duration = requiredDuration;
      }
    }
  }

  // このコンポ内のレイヤーの長さを調整（サブコンポ延長済みなのでout点を末尾まで延ばせる）
  var extended = extendLayersToCompDuration(comp);

  // サブコンポの中身も再帰処理
  for (var j = 1; j <= comp.numLayers; j++) {
    var subLayer = comp.layer(j);
    if (subLayer.source && subLayer.source instanceof CompItem) {
      extended += extendCompTreeDuration(subLayer.source, depth + 1);
    }
  }

  return extended;
}

// アニメーション適用を再帰的に行う関数
// 同一コンポジションが複数の場所で使われていても1回だけ処理する（visitedで管理）
function animateCompTree(comp, visited, depth) {
  var logger = new Logger("ShapeAnimator");
  var totals = { shapesAnimated: 0, textLayersAnimated: 0, compsProcessed: 0 };

  if (visited[comp.id]) {
    logger.log("アニメーション適用スキップ（処理済み）: " + comp.name);
    return totals;
  }
  visited[comp.id] = true;
  totals.compsProcessed = 1;

  logger.log("アニメーション適用 (深さ" + depth + "): " + comp.name);

  // このコンポ内の図形・テキストレイヤーにアニメーションを適用
  var result = animateLayersInComp(comp);
  totals.shapesAnimated += result.shapesAnimated;
  totals.textLayersAnimated += result.textLayersAnimated;

  // サブコンポジションへ再帰
  for (var i = 1; i <= comp.numLayers; i++) {
    var layer = comp.layer(i);
    if (layer.source && layer.source instanceof CompItem) {
      var sub = animateCompTree(layer.source, visited, depth + 1);
      totals.shapesAnimated += sub.shapesAnimated;
      totals.textLayersAnimated += sub.textLayersAnimated;
      totals.compsProcessed += sub.compsProcessed;
    }
  }

  return totals;
}

// レイヤーの長さをコンポジションの長さに合わせる関数
function extendLayersToCompDuration(comp) {
  var logger = new Logger("ShapeAnimator");
  var layersExtended = 0;

  logger.log("コンポジション「" + comp.name + "」のレイヤー長さを調整します");

  for (var i = 1; i <= comp.numLayers; i++) {
    var layer = comp.layer(i);

    // オーディオレイヤー以外のレイヤーを処理
    if (!layer.hasAudio || (layer.hasVideo && layer.hasAudio)) {
      // レイヤーのout点をコンポジションの長さに合わせる
      var currentOutPoint = layer.outPoint;

      if (currentOutPoint < comp.duration) {
        layer.outPoint = comp.duration;
        layersExtended++;
      }
    }
  }

  logger.log(
    "スライド「" +
      comp.name +
      "」の" +
      layersExtended +
      "個のレイヤー長さを調整しました。"
  );
  return layersExtended;
}

// 特定のコンポジション内のレイヤーにアニメーションを適用する関数
function animateLayersInComp(comp) {
  var logger = new Logger("ShapeAnimator");
  var shapesAnimated = 0;
  var textLayersAnimated = 0;

  for (var i = 1; i <= comp.numLayers; i++) {
    var layer = comp.layer(i);
    var layerInPoint = layer.inPoint;

    if (isShapeLayer(layer)) {
      // 「title-line」という名前のレイヤーの場合は180フレーム、それ以外は20フレーム
      var animationFrames = (layer.name === "title-line") ? 180 : 20;
      if (
        applyScaleAnimation(layer, layerInPoint, comp.frameRate, animationFrames)
      ) {
        shapesAnimated++;
      }
    } else if (layer instanceof TextLayer) {
      if (applyOpacityAnimation(layer, layerInPoint, comp.frameRate)) {
        textLayersAnimated++;
      }
    }
  }

  var totalAnimated = shapesAnimated + textLayersAnimated;
  if (totalAnimated > 0) {
    logger.log(
      "スライド「" +
        comp.name +
        "」に" +
        totalAnimated +
        "個のアニメーションを適用しました。"
    );
  }

  return {
    shapesAnimated: shapesAnimated,
    textLayersAnimated: textLayersAnimated,
  };
}

// シェイプレイヤーかどうかを判定する関数
function isShapeLayer(layer) {
  return (
    layer.matchName === "ADBE Vector Layer" ||
    layer instanceof ShapeLayer ||
    layer.property("ADBE Root Vectors Group") !== null
  );
}

// スケールアニメーションを適用する関数
function applyScaleAnimation(layer, startTime, frameRate, frames) {
  var transform = layer.transform;
  var scale = transform.scale;

  // 既にキーフレームがある場合はスキップ（再実行時の二重適用・値破壊を防ぐ）
  if (scale.numKeys > 0) {
    return false;
  }

  // フレーム数が指定されていない場合はデフォルト20フレーム
  if (typeof frames === "undefined") {
    frames = 20;
  }

  // 現在のスケール値を保存
  var currentScale = scale.value;

  // レイヤーの開始時間にキーフレームを追加（0%）
  scale.setValueAtTime(startTime, [0, 0]);

  // 指定フレーム後の時間を計算
  var endTime = startTime + frames / frameRate;

  // 指定フレーム後にキーフレームを追加（現在のスケール値）
  scale.setValueAtTime(endTime, currentScale);

  // イージングを適用
  applyEasing(scale);
  return true;
}

// 不透明度アニメーションを適用する関数
function applyOpacityAnimation(layer, startTime, frameRate) {
  var opacity = layer.transform.opacity;

  // 既にキーフレームがある場合はスキップ（再実行時の二重適用・値破壊を防ぐ）
  if (opacity.numKeys > 0) {
    return false;
  }

  // 現在の不透明度値を保存
  var currentOpacity = opacity.value;

  // レイヤーの開始時間にキーフレームを追加（0%）
  opacity.setValueAtTime(startTime, 0);

  // 10フレーム後の時間を計算
  var endTime = startTime + 20 / frameRate;

  // 10フレーム後にキーフレームを追加（現在の不透明度値）
  opacity.setValueAtTime(endTime, currentOpacity);

  // イージングを適用
  applyEasing(opacity);
  return true;
}

// イージングを適用する関数
function applyEasing(property) {
  for (var j = 1; j <= property.numKeys; j++) {
    property.setInterpolationTypeAtKey(j, KeyframeInterpolationType.BEZIER);

    // プロパティの種類に応じたイージング適用
    if (property.value instanceof Array) {
      // 配列型プロパティ（スケールなど）
      var dimensionCount = property.value.length;
      var easeInArray = [];
      var easeOutArray = [];

      // 次元数に応じたイージング配列を作成
      for (var d = 0; d < dimensionCount; d++) {
        easeInArray.push(new KeyframeEase(0.5, 50));
        easeOutArray.push(new KeyframeEase(0.5, 50));
      }

      // 適切な次元数のイージングを適用
      property.setTemporalEaseAtKey(j, easeInArray, easeOutArray);
    } else {
      // 単一値プロパティ（不透明度など）
      property.setTemporalEaseAtKey(
        j,
        [new KeyframeEase(0.5, 50)],
        [new KeyframeEase(0.5, 50)]
      );
    }
  }
}

// サブコンポジションレイヤーにin/out不透明度トランジションを適用する関数
function applyInOutOpacityTransition(layer, frameRate) {
  var inStart = layer.startTime;
  var inEnd = inStart + 20 / frameRate;
  var outEnd = layer.outPoint;
  var outStart = outEnd - 20 / frameRate;
  var opacity = layer.property("Transform").property("Opacity");
  opacity.setValueAtTime(inStart, 0);
  opacity.setValueAtTime(inEnd, 100);
  opacity.setValueAtTime(outStart, 100);
  opacity.setValueAtTime(outEnd, 0);
}
