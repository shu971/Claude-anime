"""曲の拍を測って JSON にする。

使い方: python tools/beats.py song.mp3 [beats.json]
出力: bpm、beats（拍の時刻）、downbeats（4拍ごと＝大きな転換用）、hits（音の立ち上がりのピーク＝効果音用）、
      drop（音量が一番大きく跳ね上がる時刻の推定）
"""
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import librosa
import numpy as np


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else None

    y, sr = librosa.load(src, sr=None, mono=True)
    tempo, frames = librosa.beat.beat_track(y=y, sr=sr, units="frames")
    beats = librosa.frames_to_time(frames, sr=sr)

    onset = librosa.onset.onset_strength(y=y, sr=sr)
    peaks = librosa.util.peak_pick(onset, pre_max=3, post_max=3, pre_avg=3, post_avg=5, delta=0.5, wait=10)

    # ドロップの推定：1拍ごとの音量を出し、直前4拍の平均からの伸びが最大の拍
    rms = librosa.feature.rms(y=y)[0]
    rms_t = librosa.frames_to_time(np.arange(len(rms)), sr=sr)
    per_beat = np.array([rms[(rms_t >= a) & (rms_t < b)].mean() if np.any((rms_t >= a) & (rms_t < b)) else 0
                         for a, b in zip(beats[:-1], beats[1:])])
    drop = None
    if len(per_beat) > 8:
        gain = [per_beat[i] / (per_beat[i - 4:i].mean() + 1e-9) for i in range(4, len(per_beat))]
        drop = round(float(beats[4 + int(np.argmax(gain))]), 3)

    out = {
        "source": src,
        "duration": round(len(y) / sr, 3),
        "bpm": round(float(np.atleast_1d(tempo)[0]), 2),
        "beats": beats.round(3).tolist(),
        "downbeats": beats[::4].round(3).tolist(),
        "hits": librosa.frames_to_time(peaks, sr=sr).round(3).tolist(),
        "drop": drop,
    }
    text = json.dumps(out, ensure_ascii=False, indent=1)
    if dst:
        with open(dst, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"bpm {out['bpm']}  beats {len(out['beats'])}  drop {drop}  -> {dst}")
    else:
        print(text)


if __name__ == "__main__":
    main()
