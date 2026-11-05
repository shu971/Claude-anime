"""1コマだけ急に変わる「飛び」を探す。

使い方: python tools/popscan.py video.mp4 [倍率=3] [最小差=8]
仕組み: 各コマを 96px の白黒に縮め、前のコマとの差の平均を出す。
        差が前後の平均の「倍率」倍以上、かつ「最小差」以上のコマを候補として出す。
        場面転換（意図した切り替え）も出るので、候補は目で確認する（tools/sheet.py strip 動画 秒）。
"""
import subprocess
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import numpy as np


def frames(video, w=96):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                        "stream=width,height,r_frame_rate", "-of", "csv=p=0", video],
                       capture_output=True, text=True, check=True)
    vw, vh, rate = r.stdout.strip().split("\n")[0].strip(",").split(",")[:3]
    h = max(2, round(int(vh) * w / int(vw) / 2) * 2)
    a, b = rate.split("/")
    fps = float(a) / float(b)
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"scale={w}:{h}", "-f", "rawvideo",
                        "-pix_fmt", "gray", "-"], capture_output=True, check=True)
    arr = np.frombuffer(p.stdout, dtype=np.uint8).reshape(-1, h, w).astype(np.float32)
    return arr, fps


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    video = sys.argv[1]
    ratio = float(sys.argv[2]) if len(sys.argv) > 2 else 3.0
    floor = float(sys.argv[3]) if len(sys.argv) > 3 else 8.0
    arr, fps = frames(video)
    d = np.abs(np.diff(arr, axis=0)).mean(axis=(1, 2))  # d[i] = コマ i と i+1 の差
    hits = []
    for i in range(2, len(d) - 2):
        around = np.r_[d[i - 2:i], d[i + 1:i + 3]].mean()
        if d[i] >= floor and d[i] >= ratio * (around + 1e-6):
            hits.append((i + 1, (i + 1) / fps, d[i], around))
    print(f"{len(arr)} frames @ {fps:.2f}fps, median diff {np.median(d):.2f}")
    if not hits:
        print("飛びの候補なし")
    for n, t, v, a in hits:
        print(f"frame {n:5d}  {t:7.3f}s  diff {v:6.2f}  (周り {a:5.2f})")


if __name__ == "__main__":
    main()
