// VOICEVOX 四国めたん(ノーマル). 読点はそのまま合成する（ユーザー指定）.
// Timing comes from VOICEVOX's own phoneme lengths (no transcription): we record when each
// comma-separated chunk starts and ends.
import fs from 'node:fs';
const HOST = 'http://127.0.0.1:50021', SPEAKER = 2, SPEED = 1.2;
const lines = JSON.parse(fs.readFileSync('script.json', 'utf8'));
const out = {};
for (const l of lines) {
  const say = (l.yomi || l.text).replace(/[「」]/g, '').replace(/…/g, '、');
  const q = await (await fetch(`${HOST}/audio_query?speaker=${SPEAKER}&text=${encodeURIComponent(say)}`, { method: 'POST' })).json();
  q.speedScale = SPEED; q.intonationScale = 1.25; q.pitchScale = 0;
  q.prePhonemeLength = 0.04; q.postPhonemeLength = 0.06; q.outputSamplingRate = 48000;
  // chunk boundaries: accent phrases followed by a pause (comma) end a chunk
  const chunks = []; let t = q.prePhonemeLength, c0 = t;
  for (const ap of q.accent_phrases) {
    for (const m of ap.moras) t += ((m.consonant_length || 0) + m.vowel_length) / SPEED;
    if (ap.pause_mora) { chunks.push([+c0.toFixed(3), +t.toFixed(3)]); t += ap.pause_mora.vowel_length / SPEED; c0 = t; }
  }
  chunks.push([+c0.toFixed(3), +t.toFixed(3)]);
  const wav = Buffer.from(await (await fetch(`${HOST}/synthesis?speaker=${SPEAKER}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) })).arrayBuffer());
  fs.writeFileSync(`audio/${l.id}.wav`, wav);
  const dur = +(wav.readUInt32LE(40) / wav.readUInt32LE(28)).toFixed(3);
  out[l.id] = { dur, chunks };
  console.log(l.id, dur, chunks.length, say);
}
fs.writeFileSync('audio/timing.json', JSON.stringify(out, null, 1));
