# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

After Effects Audio Text Animator is an Adobe After Effects ExtendScript-based automation tool that processes audio files and JSON configuration to automatically create compositions with text animations. The script is designed to work with After Effects CS3 or later (tested on After Effects 2025).

## Installation & Deployment

The project uses a shell script for deployment to After Effects:

```bash
cd utils
chmod +x transport.sh
./transport.sh
```

The script `utils/transport.sh` copies all necessary `.jsx` files to the After Effects ScriptUI Panels directory (`/Applications/Adobe After Effects 2025/Scripts/ScriptUI Panels/`), archiving any existing versions with timestamps.

After installation, launch After Effects and access the script via `Window > MakeCompForJson.jsx`.

## Architecture Overview

### Module Structure

The codebase follows a modular architecture where functionality is split across specialized `.jsx` files that are dynamically loaded by the main script:

**MakeCompForJson.jsx** (Entry Point)
- Loads all modules using `$.evalFile()` from the script folder
- Creates and displays the UI panel
- Module load order:
  1. logger.jsx
  2. jsonHandler.jsx
  3. audioHandler.jsx
  4. compUtils.jsx
  5. slideCompCreator.jsx
  6. mainCompCreator.jsx
  7. compCreator.jsx
  8. shapeAnimator.jsx
  9. vttExporter.jsx
  10. subCompTimestampExporter.jsx
  11. ui.jsx

### Core Modules

**logger.jsx** - Simple logging utility that writes to `MakeCompForJson.txt` on the desktop with timestamps

**ui.jsx** - ScriptUI panel with 6 main buttons:
1. "JSONを読み込む" - Load JSON configuration
2. "オーディオファイルを追加" - Import audio files
3. "コンポジションを作成" - Create compositions (enabled after JSON load)
4. "アニメーション適用＆レイヤー長さ調整" - Apply animations and adjust layer durations
5. "VTT字幕を出力" - Export WebVTT subtitle file
6. "タイムスタンプリストを出力" - Export timestamp list for sub-compositions

**jsonHandler.jsx** - Handles JSON file selection, parsing, and validation. Stores parsed data in global `jsonData` variable

**audioHandler.jsx** - Manages audio file import and placement:
- Stores audio files in global `audioFiles` array
- Extracts ID from filename (first 4 digits before underscore, e.g., "0001_text.mp3")
- Creates "audio" folder in After Effects project
- `addAudioToSubComps()` places audio files sequentially in slide compositions based on `audio_list` IDs

**compUtils.jsx** - Utility functions:
- `findCompByName()` - Search for compositions by name
- `findOrCreateFolder()` - Find or create project folders
- `createSlideFolder()` - Creates "slide" folder for organization
- `clearCompLayers()` - Remove all layers from a composition
- `updateSectionInfo()` - Update UI with slide/audio counts

**slideCompCreator.jsx** - Creates individual slide compositions:
- `createSlideCompositions()` - Iterates through JSON slide data
- `createOrUpdateSlideComp()` - Creates/updates individual slide comp (1920x1080, 30fps)
- Duration calculated as `(slideData.duration + slideData.margin) / 1000` seconds

**mainCompCreator.jsx** - Assembles the final composition:
- Creates main composition with all slides arranged sequentially
- Adds optional "base" composition at the beginning (if exists)
- Adds optional "end" composition at the end (if exists)
- Applies fade-in/fade-out transitions to slide layers via `applyInOutOpacityTransition()` (20 frames)
- Total duration = sum of all slide durations + 20 seconds buffer

**compCreator.jsx** - Orchestrates the full composition creation workflow:
1. Validates JSON data
2. Creates slide folder
3. Creates slide compositions
4. Places audio files in slide compositions
5. Creates main composition with all slides

**shapeAnimator.jsx** - Applies animations to layers:
- `animateShapeLayers()` - Main function triggered by UI button
- Works on active composition and all nested sub-compositions
- Shape layers: Scale animation from [0,0] to current scale over 20 frames
- Text layers: Opacity animation from 0% to current opacity over 20 frames
- `extendLayersToCompDuration()` - Extends all non-audio layers to match composition duration
- `applyInOutOpacityTransition()` - 20-frame fade in/out for slide transitions in main comp
- All animations use bezier easing (KeyframeEase: speed=0.5, influence=50)

**vttExporter.jsx** - Exports WebVTT subtitle files:
- `exportVTT()` - Main export function that creates VTT subtitles from audio layers
- `collectAudioEntries()` - Recursively collects all audio layers from main comp and nested comps (excludes "base" comps)
- `getAudioTextById()` - Maps audio IDs to transcript text from JSON data
- `generateVTTContent()` - Generates WEBVTT format with timestamps and text
- Output file: `cc.vtt` saved next to project file (or Desktop if project unsaved)
- Format: `HH:MM:SS.mmm` timestamps with sequential cue numbers

**subCompTimestampExporter.jsx** - Exports timestamp list for video chapters:
- `exportSubCompTimestamps()` - Main export function for sub-composition timestamps
- `collectSubCompEntries()` - Collects all sub-comps from main comp (excludes "base" and "end" comps)
- `getFirstAudioName()` - Extracts first audio filename from each sub-comp (removes ID prefix and extension)
- `cleanupText()` - Removes common Japanese phrases like "はじめに", "次に", "について解説します"
- `replaceSpecialPhrases()` - Replaces specific phrases (e.g., "まとめ", "ご視聴ありがとうございました")
- Output file: `timecodes.txt` saved next to project file (or Desktop if project unsaved)
- Format: `MM:SS Title` for YouTube chapter timestamps

## JSON Data Format

The script expects JSON with this structure:

```json
{
  "project": {
    "name": "MainCompositionName"
  },
  "audios": [
    {
      "id": 1,
      "text": "Audio transcript text",
      "duration": 1608,
      "slideNumber": 1,
      "slideOrder": 1
    }
  ],
  "slide": [
    {
      "id": 1,
      "name": "1",
      "num_audio": 3,
      "audio_list": [1, 2, 3],
      "duration": 10968,
      "margin": 1000
    }
  ]
}
```

**Key Points:**
- `duration` and `margin` are in milliseconds
- Audio files must be named with 4-digit ID prefix (e.g., "0001_filename.mp3")
- `audio_list` in slides references audio IDs
- Supported audio formats: .wav, .mp3, .aif, .aiff, .m4a

## Workflow

1. Load JSON configuration file
2. Import audio files (naming must match ID convention)
3. Click "Create Compositions" to:
   - Create individual slide compositions in "slide" folder
   - Place audio files sequentially in each slide
   - Create main composition with all slides arranged sequentially
4. Design visual elements in each slide composition
5. Click "Apply Animation & Adjust Layer Length" to:
   - Apply scale/opacity animations to all shapes and text
   - Extend all non-audio layers to match composition duration
   - Process all nested sub-compositions recursively
6. (Optional) Click "Export VTT Subtitles" to generate WebVTT subtitle file with audio transcripts
7. (Optional) Click "Export Timestamp List" to generate YouTube chapter timestamps

## Development Notes

- All files use UTF-8 encoding
- ExtendScript does not support modern JavaScript (ES3-like syntax)
- Global variables `jsonData` and `audioFiles` maintain state across modules
- After Effects layer indexing is 1-based (not 0-based)
- Layers are added in reverse order (newest layer = index 1)
- Audio placement is sequential with no gaps (currentTime += audioDuration)
- Standard composition size: 1920x1080 @ 30fps
- Animation timing: 20 frames for most transitions
