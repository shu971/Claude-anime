"""効果音ファイルの「一番大きくなる位置」を測る。

使い方: python tools/sfx_peak.py file1.wav file2.mp3 ... [--json out.json]
出力: ファイルごとに onset（鳴り始め）、peak（最大音量の位置）、lead（peak - onset）、長さ。
置き方: 画面の出来事の時刻 T に合わせるなら、そのファイルを T - peak から鳴らす。
"""
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import librosa
import numpy as np


def measure(path):
    y, sr = librosa.load(path, sr=None, mono=True)
    hop = 128
    env = librosa.feature.rms(y=y, frame_length=512, hop_length=hop)[0]
    t = librosa.frames_to_time(np.arange(len(env)), sr=sr, hop_length=hop)
    mx = env.max() + 1e-12
    onset_i = int(np.argmax(env > mx * 0.1))  # 最大の1割を超えた最初の位置
    peak_i = int(np.argmax(env))
    return {
        "file": path,
        "duration": round(len(y) / sr, 3),
        "onset": round(float(t[onset_i]), 3),
        "peak": round(float(t[peak_i]), 3),
        "lead": round(float(t[peak_i] - t[onset_i]), 3),
        "peak_dbfs": round(float(20 * np.log10(np.abs(y).max() + 1e-12)), 1),
    }


def main():
    args = sys.argv[1:]
    out = None
    if "--json" in args:
        i = args.index("--json")
        out = args[i + 1]
        args = args[:i] + args[i + 2:]
    if not args:
        print(__doc__)
        sys.exit(1)
    res = [measure(p) for p in args]
    for r in res:
        print(f"{r['file']}: onset {r['onset']}s  peak {r['peak']}s  lead {r['lead']}s  len {r['duration']}s  {r['peak_dbfs']}dBFS")
    if out:
        with open(out, "w", encoding="utf-8") as f:
            json.dump(res, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
