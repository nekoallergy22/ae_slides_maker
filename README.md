# After Effects Audio Text Animator

JSONファイルとオーディオファイルから自動的にAfter Effectsコンポジションを作成し、アニメーションを適用するスクリプトです。

## 主な機能

- JSONファイルの読み込みと解析
- オーディオファイルの自動インポートとスライドコンポジションへの配置
- スライドコンポジションとメインコンポジションの自動作成
- シェイプレイヤー・テキストレイヤーへのアニメーション適用

## インストール方法

```bash
cd utils
chmod +x transport.sh
./transport.sh
```

スクリプトは `/Applications/Adobe After Effects 2025/Scripts/ScriptUI Panels/` にコピーされます。

After Effectsを起動し、`ウィンドウ > MakeCompForJson.jsx` からパネルを開きます。

## 使用方法

1. **JSONを読み込む**: プロジェクト設定とスライド情報を含むJSONファイルを選択
2. **オーディオファイルを追加**: `####_filename.mp3` 形式のオーディオファイルを複数選択（例: `0001_intro.mp3`）
3. **コンポジションを作成**: スライドコンポジションとメインコンポジションを自動生成
4. **アニメーション適用＆レイヤー長さ調整**: slideフォルダ内の全コンポジションに対してアニメーションを適用

## JSON形式

```json
{
  "project": {
    "name": "プロジェクト名",
    "num_slide": 9,
    "num_audio": 68
  },
  "audios": [
    {
      "id": 1,
      "text": "音声のテキスト",
      "duration": 10128,
      "slideNumber": 1,
      "slideOrder": 1
    }
  ],
  "slide": [
    {
      "id": 1,
      "name": "1",
      "num_audio": 4,
      "audio_list": [1, 2, 3, 4],
      "duration": 28680,
      "margin": 1000
    }
  ]
}
```

## 動作環境

- Adobe After Effects CS3以降（After Effects 2025で動作確認済み）
