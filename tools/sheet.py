"""動画からコマを抜いてタイル状に並べる（点検・参考動画の分析用）。

使い方:
  python tools/sheet.py contact video.mp4 [fps=2] [cols=6]      1秒あたり fps コマ（既定2）を並べる。長い動画は複数枚に分かれる
  python tools/sheet.py strip   video.mp4 秒 [枚数=12]           指定秒の前後のコマを連続で並べる（速い動きの確認）
  python tools/sheet.py phone   video.mp4                        幅360pxに縮めて1秒1コマ（スマホでの読みやすさ確認）
  python tools/sheet.py beats   video.mp4 beats.json [cols=8]    1拍1コマ（beats.json は tools/beats.py の出力）
出力: 動画と同じフォルダの sheets/ に PNG。各コマの左上に時刻を書き込む。
"""
import json
import math
import os
import subprocess
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def probe_duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def outdir(video):
    d = os.path.join(os.path.dirname(os.path.abspath(video)), "sheets")
    os.makedirs(d, exist_ok=True)
    return d


def _font():
    # Windows の ffmpeg は fontconfig の設定が無く drawtext が落ちるので、フォントファイルを直接渡す
    for f in ["C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/segoeui.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/System/Library/Fonts/Helvetica.ttc"]:
        if os.path.exists(f):
            return f.replace(":", "\\:")
    return None


FONT = _font()


def label(text, size=20):
    if not FONT:
        return "null"
    return f"drawtext=fontfile='{FONT}':text='{text}':x=6:y=6:fontsize={size}:fontcolor=white:box=1:boxcolor=black@0.6"


LABEL = label("%{pts\\:hms}")


def run(args):
    subprocess.run(["ffmpeg", "-v", "error", "-y"] + args, check=True)


def contact(video, fps=2.0, cols=6, width=270, rows=5, name="contact"):
    dur = probe_duration(video)
    per = cols * rows
    total = max(1, math.ceil(dur * fps))
    pages = math.ceil(total / per)
    base = os.path.splitext(os.path.basename(video))[0]
    outs = []
    for p in range(pages):
        start = p * per / fps
        o = os.path.join(outdir(video), f"{base}_{name}_{p + 1:02d}.png")
        run(["-ss", f"{start}", "-i", video, "-vf",
             f"fps={fps},setpts=PTS+{start}/TB,scale={width}:-1,{LABEL},tile={cols}x{rows}", "-frames:v", "1", o])
        outs.append(o)
    return outs


def strip(video, at, n=12, width=320):
    fr = 30.0
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate",
                        "-of", "csv=p=0", video], capture_output=True, text=True, check=True)
    a, b = r.stdout.strip().split("\n")[0].strip(",").split("/")
    fr = float(a) / float(b)
    start = max(0.0, at - (n / 2) / fr)
    base = os.path.splitext(os.path.basename(video))[0]
    o = os.path.join(outdir(video), f"{base}_strip_{at:.2f}.png")
    cols = min(n, 6)
    rows = math.ceil(n / cols)
    run(["-ss", f"{start}", "-i", video, "-vf", f"setpts=PTS+{start}/TB,scale={width}:-1,{LABEL},tile={cols}x{rows}",
         "-frames:v", "1", o])
    return [o]


def beats_sheet(video, beats_json, cols=8, width=240):
    with open(beats_json, encoding="utf-8") as f:
        beats = json.load(f)["beats"]
    dur = probe_duration(video)
    beats = [t for t in beats if t < dur]
    base = os.path.splitext(os.path.basename(video))[0]
    tmp = os.path.join(outdir(video), "_beat_frames")
    os.makedirs(tmp, exist_ok=True)
    for i, t in enumerate(beats):
        run(["-ss", f"{t}", "-i", video, "-frames:v", "1", "-vf",
             f"scale={width}:-1,{label(f'{i}  {t:.2f}s', 18)}",
             os.path.join(tmp, f"b{i:04d}.png")])
    rows = math.ceil(len(beats) / cols)
    o = os.path.join(outdir(video), f"{base}_beats.png")
    run(["-framerate", "1", "-i", os.path.join(tmp, "b%04d.png"), "-vf", f"tile={cols}x{rows}", "-frames:v", "1", o])
    for fn in os.listdir(tmp):
        os.remove(os.path.join(tmp, fn))
    os.rmdir(tmp)
    return [o]


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    mode, video = sys.argv[1], sys.argv[2]
    rest = sys.argv[3:]
    if mode == "contact":
        outs = contact(video, float(rest[0]) if rest else 2.0, int(rest[1]) if len(rest) > 1 else 6)
    elif mode == "strip":
        outs = strip(video, float(rest[0]), int(rest[1]) if len(rest) > 1 else 12)
    elif mode == "phone":
        outs = contact(video, 1.0, 5, width=360, rows=3, name="phone")
    elif mode == "beats":
        outs = beats_sheet(video, rest[0], int(rest[1]) if len(rest) > 1 else 8)
    else:
        print(__doc__)
        sys.exit(1)
    for o in outs:
        print(o)


if __name__ == "__main__":
    main()
