# 喋り動画の音声 → 単語単位の時刻 → transcript.json
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from faster_whisper import WhisperModel

model = WhisperModel("medium", device="cpu", compute_type="int8")
prompt = "2a−3b=5。aの値わかりますか？b=−1、a=1。10元1次方程式。プロの数学者。BからJまでの9つの値。SNSを伸ばす方法。コンテキストエンジニアリング。"
segs, info = model.transcribe("audio16k.wav", language="ja", word_timestamps=True, initial_prompt=prompt,
                              vad_filter=False, beam_size=5)
out = []
for s in segs:
    out.append({"start": round(s.start, 3), "end": round(s.end, 3), "text": s.text,
                "words": [{"w": w.word, "s": round(w.start, 3), "e": round(w.end, 3)} for w in s.words]})
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text}", flush=True)
json.dump(out, open("transcript.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
