"""ナレーション＋BGM＋効果音 → audio/mix.wav（効果音とBGMだけの audio/bed.wav も出す）

使い方: python mix.py [BGMのID=175] [BGMの音量=0.12]
- cues.json（render.mjs が scene.js から書き出す）の時刻に、効果音を「ピーク位置ぶん早く」置く。
- 最後に全体を -14 LUFS に。声の一瞬の山はリミッター（ffmpeg alimiter）で抑えて、真のピーク約 -1.5dB。
"""
import json
import os
import subprocess
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import librosa
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
bgm_id = sys.argv[1] if len(sys.argv) > 1 else "175"
bgm_vol = float(sys.argv[2]) if len(sys.argv) > 2 else 0.12
SR = 48000

SFX = {"pop": "3005", "click": "2577", "tick": "2568", "chime": "1107", "whoosh": "1490",
       "swoosh": "1489", "swish": "1489", "error": "2569", "key": "2568"}
VOL = {"pop": 0.55, "click": 0.5, "tick": 0.45, "chime": 0.5, "whoosh": 0.45, "swoosh": 0.3, "swish": 0.25,
       "error": 0.45, "key": 0.25}
P = lambda *a: os.path.join(HERE, *a)
peaks = {os.path.splitext(os.path.basename(p["file"]))[0]: p["peak"] for p in json.load(open(P("assets/sfx/peaks.json"), encoding="utf-8"))}
cues = json.load(open(P("cues.json"), encoding="utf-8"))

voice, _ = librosa.load(P(os.environ.get("VOICE", "voice48k.wav")), sr=SR, mono=True)
MAX_LIMIT = float(os.environ.get("MAX_LIMIT", "3"))  # リミッターで抑えるのは最大この dB まで（声を潰さない）
N = len(voice)
bed = np.zeros(N, dtype=np.float32)

# BGM：小さく敷いて、頭と最後をフェード
bgm, _ = librosa.load(P(f"assets/bgm/{bgm_id}.mp3"), sr=SR, mono=True)
bgm = np.pad(bgm, (0, max(0, N - len(bgm))))[:N] * bgm_vol
fi, fo = int(0.8 * SR), int(2.5 * SR)
bgm[:fi] *= np.linspace(0, 1, fi); bgm[-fo:] *= np.linspace(1, 0, fo)
bed += bgm

# 効果音
cache = {}
for c in cues:
    sid = SFX[c["id"]]
    if sid not in cache:
        cache[sid], _ = librosa.load(P(f"assets/sfx/{sid}.mp3"), sr=SR, mono=True)
    x = cache[sid] * VOL[c["id"]] * c["vol"]
    s = int(round(max(0.0, c["t"] - peaks[sid]) * SR))
    e = min(N, s + len(x))
    bed[s:e] += x[: e - s]

os.makedirs(P("audio"), exist_ok=True)
sf.write(P("audio/bed_raw.wav"), bed, SR)
sf.write(P("audio/mix_raw.wav"), voice + bed, SR)


def measure(p):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", p, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    lines = [l.strip() for l in r.stderr.splitlines()]
    I = float([l for l in lines if l.startswith("I:")][-1].split()[1])
    pk = float([l for l in lines if l.startswith("Peak:")][-1].split()[1])
    return I, pk


def master(src, dst, gain):
    # 音量を上げてから、-1.5dB を超える山だけ抑える
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af",
                    f"volume={gain:.2f}dB,alimiter=limit=0.84:attack=3:release=60:level=false", "-ac", "2", dst], check=True)


I0, pk0 = measure(P("audio/mix_raw.wav"))
cap = (-1.5 - pk0) + MAX_LIMIT  # これ以上上げると、山を MAX_LIMIT dB 以上つぶすことになる
gain = min(-14 - I0, cap)
master(P("audio/mix_raw.wav"), P("audio/mix.wav"), gain)
I1, _ = measure(P("audio/mix.wav"))
gain = min(gain + (-14 - I1), cap)  # リミッターで少し下がった分を足して、もう一度
master(P("audio/mix_raw.wav"), P("audio/mix.wav"), gain)
I2, pk2 = measure(P("audio/mix.wav"))
master(P("audio/bed_raw.wav"), P("audio/bed.wav"), gain)
print(f"cues {len(cues)}  bgm {bgm_id} vol {bgm_vol}  gain {gain:+.1f}dB  -> mix {I2} LUFS, peak {pk2} dBFS, {N / SR:.2f}s")
