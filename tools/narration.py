"""ElevenLabs のナレーション用に台本を整える（下処理・区切り・無音詰め）

使い方:
  python tools/narration.py prep 台本.txt            # 下処理して区切った結果を表示（生成はしない）
  python tools/narration.py join out.mp3 a.mp3 b.mp3  # つないで無音を詰める

ルール（docs/workflow.md「ElevenLabs のナレーション」）:
- 「」『』は外して中身だけ残す（閉じかっこで一拍空くため）
- 箇条書き・Markdown の記号（* - # など）は外し、各項目を「。」で終わる文にする
- 1回に生成するのは 180 文字以内。段落（行）の切れ目で区切り、それでも長い段落は「。」で区切る
"""
import os
import re
import subprocess
import sys
import tempfile

MAX_CHARS = 180


def prep(text: str) -> list[str]:
    """台本 → 段落（1行＝1段落）のリスト。記号を外し、箇条書きは「。」で終わる文にする"""
    text = text.replace("\r\n", "\n").replace("　", " ")
    text = re.sub(r"[「」『』]", "", text)
    text = text.replace("……", "").replace("…", "")
    paras = []
    for raw in text.split("\n"):
        line = raw.strip()
        if not line:
            continue
        m = re.match(r"^(?:[*\-・•]|\d+[.)．])\s*(.*)$", line)
        if m:  # bullet -> its own sentence(s)
            line = m.group(1).strip()
            line = re.sub(r"\s{2,}", "。", line)  # a second sentence glued on after two spaces
            if line and not re.search(r"[。！？!?、]$", line):
                line += "。"
        line = re.sub(r"^#+\s*", "", line)
        line = re.sub(r"[*_`]", "", line)
        line = re.sub(r"\s{2,}", "", line).strip()
        if line:
            paras.append(line)
    # a line ending with "、" (e.g. "主なメリットは、") belongs to the next line
    out = []
    for p in paras:
        if out and out[-1].endswith("、"):
            out[-1] += p
        else:
            out.append(p)
    return out


def split(paras: list[str], limit: int = MAX_CHARS) -> list[str]:
    """段落を limit 文字以内のかたまりにまとめる。かたまりの数を最小にし、その中で長さをそろえる。
    区切るのは段落の切れ目。1つの段落が limit を超えるときだけ「。」で区切る。"""
    units = []
    for p in paras:
        if len(p) <= limit:
            units.append(p)
            continue
        cur = ""
        for s in [x for x in re.split(r"(?<=[。！？!?])", p) if x]:
            if cur and len(cur) + len(s) > limit:
                units.append(cur)
                cur = ""
            cur += s
        if cur:
            units.append(cur)
    n = len(units)
    pre = [0]
    for u in units:
        pre.append(pre[-1] + len(u))
    INF = float("inf")
    for k in range(1, n + 1):  # fewest chunks first, then the most even split
        dp = [[INF] * (n + 1) for _ in range(k + 1)]
        cut = [[0] * (n + 1) for _ in range(k + 1)]
        dp[0][0] = 0
        for c in range(1, k + 1):
            for j in range(1, n + 1):
                for i in range(c - 1, j):
                    sl = pre[j] - pre[i]
                    if sl > limit or dp[c - 1][i] == INF:
                        continue
                    v = max(dp[c - 1][i], sl)
                    if v < dp[c][j]:
                        dp[c][j] = v
                        cut[c][j] = i
        if dp[k][n] < INF:
            chunks, j = [], n
            for c in range(k, 0, -1):
                i = cut[c][j]
                chunks.append("".join(units[i:j]))
                j = i
            return chunks[::-1]
    return units


def join(out: str, files: list[str], keep: float = 0.12, min_gap: float = 0.3, thr: str = "-45dB"):
    """音声をつなぎ、min_gap 秒以上の無音を keep 秒だけ残して詰める（先頭と末尾の無音も落とす）"""
    with tempfile.TemporaryDirectory() as d:
        lst = os.path.join(d, "list.txt")
        with open(lst, "w", encoding="utf-8") as f:
            for p in files:
                f.write(f"file '{os.path.abspath(p)}'\n")
        joined = os.path.join(d, "joined.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, joined], check=True)
        af = (f"silenceremove=start_periods=1:start_threshold={thr}:stop_periods=-1:stop_duration={min_gap}:stop_threshold={thr}:stop_silence={keep},"
              f"areverse,silenceremove=start_periods=1:start_threshold={thr}:start_silence=0.05,areverse")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", joined, "-af", af, "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "192k", out], check=True)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "prep":
        chunks = split(prep(open(sys.argv[2], encoding="utf-8").read()))
        for i, c in enumerate(chunks, 1):
            print(f"--- chunk {i}: {len(c)} chars\n{c}")
    elif cmd == "join":
        join(sys.argv[2], sys.argv[3:])
    else:
        print(__doc__)
