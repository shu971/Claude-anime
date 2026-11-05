# word-level timestamps for the user's edited narration -> transcript.json
import json
from faster_whisper import WhisperModel
model = WhisperModel("medium", device="cpu", compute_type="int8")
prompt = "デプロイって何？Webサイト、HTML・CSS・JavaScript。ブラウザさん、Webサーバーさん。localhost:3000。本番環境にデプロイします。"
segs, info = model.transcribe("audio16k.wav", language="ja", word_timestamps=True, initial_prompt=prompt, vad_filter=False, beam_size=5)
out = []
for s in segs:
    out.append({"start": round(s.start, 3), "end": round(s.end, 3), "text": s.text, "words": [{"w": w.word, "s": round(w.start, 3), "e": round(w.end, 3)} for w in s.words]})
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text}", flush=True)
json.dump(out, open("transcript.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
