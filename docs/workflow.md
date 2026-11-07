# 制作手順と技術メモ

CLAUDE.md のルールを前提にした、作り方の詳細です。前のセッションの引き継ぎ書（2026-10）と、参考記事から取り込んだ手法をまとめています。

---

## 1. 制作の流れ（毎回この順番）

1. **入力の確認：** 台本、ナレーション、形式、参考の有無、BGM の有無、効果音の方針（CLAUDE.md「2. 入力」）。足りないものは質問する。台本は要約して、把握したことを伝える。指示がなければ作業を始めない。
2. **（参考がある場合）参考の分析：** `python tools/sheet.py contact ref.mp4` → 拍ごとの構成を `style_guide.md` に書く。中身ではなく文法を借りる。
3. **音声の準備：** ナレーションを 48k（ミックス用）と 16k（文字起こし用）に変換し、文字起こしする（固有名詞は `initial_prompt` に入れる）。VOICEVOX なら audio_query から時刻を取る。
4. **読まれた言葉の台本：** `script.json` を作る。読まれなかった文、言い換えられた語は報告する。`align.py` で照合（一致率 0.95 以上）。
5. **（BGM がある場合）拍の測定：** `python tools/beats.py song.mp3 beats.json`。大きな転換は小節の頭（downbeats）に置く。
6. **拍・場面の一覧を見せる：** 場面ごとにセット、キャラ、カメラ、2D の演出、効果音を表にして見せる。ここで直すのが一番手戻りが少ない。
7. **実装：** part_*.js を書いて scene.js に組み立て、`node --check` で文法確認。
8. **静止画の点検：** 要所（または 1 拍 1 コマ）を書き出し、タイル状に並べて見る。採点して悪い所を 3 つ直す。2〜3 回。
9. **効果音：** 素材を `assets/sfx/` に用意し、`python tools/sfx_peak.py assets/sfx/*.wav` でピーク位置を測る。各イベントにピークが合うよう置く。合う音が無いものは合成で補う。
10. **本番の書き出し：** 書き出して音を合わせる。長さと最大音量を確認。`python tools/popscan.py out/xxx.mp4` で 1 コマの飛びを探す。
11. **報告：** SendUserFile で送り、場面の流れ、判断した点、注意点を日本語で報告する。

---

## 2. 方式A：3D 解説動画（正方形 1080、three.js）※メイン

雛形は `templates/3d/`（「デプロイって何？」）。新しい動画は、この雛形を `works/<作品名>/` に丸ごとコピーして、場面の部分だけ差し替える。
コピーしたら `render.mjs` の `goto` のパス（`/templates/3d/index.html`）を作品フォルダに合わせて直す。

### ファイル構成
```
narration.mp3      ユーザーのナレーション（コミットしない）
voice48k.wav       48k・モノラル（ミックス用）
audio16k.wav       16k（文字起こし用）
transcribe.py      faster-whisper で単語単位の時刻 → transcript.json
script.json        [{id, text}] 読まれた言葉に合わせた台本（1文＝1行）
align.py           台本と文字起こしを difflib で照合 → timing.json
timeline.js        DURATION、S(id)/E(id)、at(id,'語') で語の時刻、B = 演出の拍
scene.js           シーン本体。part_*.js から組み立てる
part_world.js / part_props.js / part_stage.js / part_overlay.js   動画ごとに差し替える部分
render.mjs         puppeteer で frameAt(t) を呼び、JPEG(0.94) を ffmpeg に流す（libx264 crf18、30fps）
                   `node render.mjs stills hq 1.5 3.0 ...` / `node render.mjs video hq`
mix.mjs            効果音の配置 ＋ ナレーション → audio/mix.wav（sfx.wav も出す）
index.html         importmap で three をリポジトリ直下の node_modules から読む
```
- 60 秒の動画の書き出しは約 3 分（このPC）。
- 音を合わせる：`ffmpeg -i out/*_silent.mp4 -i audio/mix.wav -c:v copy -c:a aac -b:a 192k -shortest`

### scene.js の構造（上から順）
1. 共通：import、ユーティリティ（`V`、`clamp`、`lerp`、`seg`、`ss`、`eOut`、`eIO`、`eBack`、`inR`）
2. 場面の区切り：`SEC = {…}`（`S('lXX') - 0.1` など）
3. renderer：ACESFilmic（露出 0.95）、PCFSoftShadows、sRGB、`preserveDrawingBuffer`
4. テクスチャ：`makeTex(size, fill, repeat)`（floor、plaster、walnut、oak、knit、denim、wool、plaid、hair、linen）
5. world（差し替え）：部屋、窓、日差し（DirectionalLight 4096 の影）、RectAreaLight、Hemisphere、RoomEnvironment（0.34）、光の筋、浮遊粒子
6. props（差し替え）：小道具、マスコット、書類、モニター画面（CanvasTexture、キーが変わったときだけ描き直す）
7. people（共通）：チビキャラ `makePerson(o)`
   - 骨組み：root（1.15倍）→ hips → spine → chest → neck → head、腕 sh → el → hd、脚 hp → kn → an
   - オプション：`{girl, hair, style:'short'|'long'|'bob'|'pony'|'spiky', iris, glasses, casual, top, pants}`
   - 表情 `paintFace(kind, iris)`：normal、look、closed、happy、strain、dizzy、shock、blush、shockBlush、smirk、wink、embar
   - 動き：`resetPose`、`walk(P,t,pts,t0,t1,endRy)`、`sit`、`solveArm`、`holdFront`、`place`、`faceTo`
8. cast / animate(t) / shot(t)（差し替え）：時刻 t だけで配置と姿勢が決まる（毎フレーム最初に resetPose）。カメラは場面ごとにゆっくり動かすか切り替え。
9. post（共通）：RenderPass → Toggle → GTAO → Bokeh → Toggle → UnrealBloom → Output → SMAA → 色調整
10. 2D overlay：`spans`、`txt`、`chip`、`head3`、`speech`、`proj`/`headTop`、`flash`、`dim`、`drawSubs`、`band`
11. renderAt(t)：照明の切り替え → animate → applyCamera → 描画 → overlay
12. boot：フォントの事前読み込み（scene.js の全文字と台本を `document.fonts.load` に渡す）

組み立て：前の scene.js をコピーし、Python の `cut(s, '開始の目印', '終了の目印', 新しい部分)` で world / props / stage / overlay の区間を入れ替える。

### 字幕と演出の定番
- 見出し：`head3(t, a, b, 小さい行, [[大きい行, 色]], {y:150, t1, size})`（大きく縮みながら着地、暗い下地）
- ラベル：`chip(x, y, 文字, 透明度, 拡大率, {bg, fg, size})`
- 吹き出し：`speech(x, y, 指す先x, 指す先y, 行の配列, 透明度, 拡大率, {size, bg, spiky})`
- 場面転換：白フラッシュ（0.16 秒）＋ whoosh。大きな転換には集中線。
- カメラ：場面ごとにゆっくり寄るか引く。全体にわずかな手持ち風の揺れ。

### 効果音の置き方
- 場面転換に whoosh、ラベルや吹き出しの出現に pop、見出しは riser → hit → kira、✕ には hit＋buzz、正解・完成には okCheck か kira。
- 合成用の関数（`mix.mjs` 前半）：pop／popHi／popLo、whoosh、swing、hit、taiko、ding、kira、shimmer、riser、drop、paper、tick、key、okCheck、buzz、smoke、stamp、steps、pitter、boing、click、zap、swish。
- Mixkit の音を使うときは、`mix.mjs` に WAV を読み込んで配置する関数を足す（ピーク位置ぶん早く置く）。

### よくある不具合と直し方
- 顔が見えない：本や紙を顔の前で持たせている → 下げる／前髪が目を隠す → 髪のキャップを後ろに傾ける／カメラが後ろ側 → 動かす。
- キャラが床や台に埋まる：台の上では y を台の高さに。
- 吹き出しや字幕が重なってキャラが隠れる：吹き出しを上に逃がすか、カメラの狙いを変える。
- ラベルが画面端で切れる：`clamp(x, 190, 890)`。
- 場面の最初に人物がカメラの後ろから入って映らない：歩き始めを画面の横に。
- 一瞬画面が真っ白になる：`flash` の透明度が負になっていた（雛形は修正済み。古いコピーを使うときは注意）。
- 遠くの場所が映らない：カメラの far を 200〜400 に。
- 別の場所の草や空、照明が混ざって見える：場所ごとに照明と背景物の `visible` を切り替える（下記）。

### 2026-11 の作品で固まったやり方（api／llm／server／chrome）
作品のコードは `works/<作品名>/` にあり、コミットしていない（ローカルにだけある）。似た動画を作るときはまずそこを読む。
- **組み立て**：`works/<作品名>/assemble.py` が雛形 `templates/3d/scene.js` を**行番号**で切り出し（`L(開始, 終了)`）、作品の `part_*.js` と並べて `scene.js` を作る。
  - 使っている区間：L(1,30) 先頭、L(38,125) renderer とテクスチャ、L(126,197) オフィス、L(238,254) 光の筋、L(369,560) 人物、L(733,760) カメラと post、L(762,861) overlay、L(889,943) 吹き出しとエディタ、L(1088,1098) boot。
  - **雛形の scene.js を編集すると行番号がずれる。** 雛形を直したら各作品の assemble.py も見直す。
  - 名前の重複（`mascot` など）でエラーになったら、雛形側の区間から外す。
- **場所の切り替え**：1つのシーンに場所を横に並べ、カメラの x で判定する（例：オフィス x<30、街や別空間は x=60／100／140）。`renderAt` で場所ごとに太陽、空、環境光、背景物を出し分ける。
- **効果音**：`mix.py`（numpy 版。ffmpeg の amix は止まることがあったので使わない）。Mixkit の番号ごとに音量、頭のスキップ、ピーク補正を決める。目標 -14 LUFS だが、リミッターの上限（MAX_LIMIT 3dB）を超える分は上げない（結果 -17〜-18 LUFS になることが多い）。
- **効果音の出す時刻**：シーンのコードから `window.CUES` に積み、`render.mjs` が `cues.json` に書き出す。mix.py はそれを読む。映像と音のタイミングが1か所で決まる。
- **本物そっくりの手順画面（chrome）**：オフスクリーンの 1600×1000 キャンバスにブラウザやアプリを描き、仮想カメラ（`deskCam` のキーフレーム）で操作している所へ寄る。1画面 0.5〜1 秒しか映らないので、寄りは強めに。
- **数直線や図の上の言葉（llm）**：図形を動かすときも、何の数か分かる言葉のカードを図のそばに付けたまま動かす（「言葉が見えない」と指摘された）。

---

## 3. 方式A'：VOICEVOX ナレーション版（`templates/voicevox/`）
- `tts.mjs`：四国めたん（speaker 2）、speedScale 1.2、intonationScale 1.25、前後の無音 0.04／0.06、48k。
- 読点はそのまま残す。「」は削除、「…」は「、」に置き換える。
- 読みの指定は `script.json` の `yomi`（例：AI → エーアイ、1人 → ひとり）。
- タイミングは audio_query の accent_phrases から計算し、読点の区切りの時刻を `audio/timing.json` の chunks に保存。区切りの中は文字位置から推定（`timeline.js` の `at()`）。
- 公開時は「VOICEVOX:四国めたん」のクレジットが必要。

## 4. 加工済みナレーションへの差し替え
- 加工前の音声でタイミングを作り、あとで加工済み音声に差し替えることがある（タイムスタンプは同じ）。
- 映像だけの動画と効果音だけの音声を残し、`bash combine.sh 加工済み音声.mp3` で合成し直す。
- 「加工前の完成版」と「映像＋効果音だけ」の 2 つを先に渡すと喜ばれた。

---

## 5. 方式B：Remotion 縦型 UI ショート（`templates/remotion/`）
- 作品：`src/Root.tsx` に `AiSiteFeatures`（AIっぽいサイトの特徴）、`AuroraFinal`（オーロラグラデーション）、`CaptionTest1`／`CaptionTest2`、`AuroraDraft`。
- 書き出し：`npm run render`、`npm run render:aurora`、または `npx remotion render src/Root.tsx <作品名> out/x.mp4 --codec=h264 --crf=18 --browser-executable=... --chrome-mode=chrome-for-testing`。
- 音声ファイル（`public/*.wav`）はコミットしていない。使うときは作り直す。
- 設定は 1 か所に（`src/config.ts`、`src/aurora2/cfg.ts`）。字幕の時刻は文字起こしと照合して JSON に（`src/aurora2/chunks.json`）。
- 効果音は `work/` の node スクリプトで合成し `public/*.wav` に出力。
- 字幕パターン（ユーザーが選んだもの）：
  - **B（上部ヘッダー型）：** 安全圏の上部（y≈236）に暗いカード。番号バッジがポン、アクセント語がピンクで拡大しながら着地、回答は黄色＋マーカーが左から伸びる。枠はアクセントのたびに光る。
  - **1（短く区切って高速表示）：** 細かい区切りどおり、カードの上（y≈440）に白い太字を次々に。下から弾んで出る、キーワードはピンク、文末はやや大きく揺らす。長い区切りは 2 段。
  - 候補だった案：白いボックス＋読み上げ位置のハイライト。
- カメラ：ワールド全体の div に `transformOrigin: '0 0'` を必ず指定。
- グラデーションのカード：不定形を 3 枚重ね、ぼかし 60（viewBox 300×400）。図形をカードの外まで広げる。外側に同色のグローを二重に。4 色フラッシュはカードを動かさず、もやの色と配置だけを瞬時に切り替え。
- 背景：説明パートの前までは飾る（青い壁紙風、サイバー空間のグリッド、粒子）。説明パートでは控えめ。
- 安全圏：上 約 0〜200px、下 約 1560px 以降、右 約 950px 以降はアイコン列で隠れる。文字を置かない。

---

## 6. 参考記事から取り込んだ技術（新しく使うもの）
詳細は [references.md](references.md)。

- **閉形式のばね：** 減衰ばねのステップ応答を式で計算し、時刻だけの関数に保つ。目標が何度も変わる値は「変化ごとのばねの和」（`track(t, keys)`）。硬さの使い分け：UI＝きびきび、カード・カメラ＝標準、大きい文字・ロゴ＝重め、マスコット＝はっきり弾む。
- **カメラ：** キー `[時刻, ズーム, x, y]`、ズームは対数空間で補間する（等速で寄って見える）。
- **共有要素の受け渡し：** 色が画面に広がって次の場面になるとき、前の要素の文字を一緒に運ぶ。広がりはいちばん遠い角まで覆い、約 0.3〜0.35 秒かける。
- **モーションブラー：** 1 コマを 4〜8 サブフレームで描き、ffmpeg の `tmix` で重ねる。速い動きは 4 だと残像が分かれるので 8 に。60fps にする場合は書き出し時間が倍以上になる点に注意。
- **点検：** 1 拍 1 コマのシート、速い瞬間の前後 12 コマの帯、幅 360px のスマホ想定シート（`tools/sheet.py`）、フレーム差の飛び検出（`tools/popscan.py`）、同じコマを 2 回書き出して一致するか（決定性）。
- **形が変わる箱の中の文字：** 変形が始まってから入り、次の変形の前に出る。重ならないよう独自のタイミングとマスクを付ける。
- **カメラで拡大する要素に `will-change` を付けない**（文字がぼける）。
