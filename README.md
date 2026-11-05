# Claude-anime

Claude Code で、AI・IT 解説のショート動画（Instagram 向け）を作るための制作キットです。
動画はすべてコードで描き、ヘッドレスの Chrome で 1 コマずつ撮影して ffmpeg で MP4 にします。

- **[CLAUDE.md](CLAUDE.md)**：作業ルール（Claude Code が毎回読む）
- **[docs/workflow.md](docs/workflow.md)**：制作手順と技術メモ
- **[docs/references.md](docs/references.md)**：参考にした記事の要点

## 中身
| フォルダ | 内容 |
|---|---|
| `templates/3d/` | three.js の 3D 解説動画（正方形 1080×1080、チビキャラ）の雛形 |
| `templates/voicevox/` | VOICEVOX でナレーションを作り、時刻を取る部分 |
| `templates/remotion/` | Remotion の縦型 UI ショート（1080×1920） |
| `tools/` | 拍の分析、コンタクトシート、1 コマの飛び検出、効果音のピーク測定 |

## 準備
```bash
npm install
pip install numpy librosa soundfile faster-whisper
```
Chrome と ffmpeg も必要です。Chrome が標準の場所に無い場合は、環境変数 `CHROME_PATH` で指定します。

## 試す
```bash
npm run stills:3d
```
`templates/3d/stills/` に雛形の静止画が出ます。

## 素材について
曲・効果音・写真などのダウンロード素材は、ライセンス上このリポジトリに含めていません。
各作品フォルダの `assets/` に置いて使います（`.gitignore` 済み）。
