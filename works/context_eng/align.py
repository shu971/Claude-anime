# Map each script character to a time in the edited narration (whisper words + difflib alignment) -> timing.json
import json, difflib, re, unicodedata
script = json.load(open('script_read.json', encoding='utf-8'))
tr = json.load(open('transcript.json', encoding='utf-8'))
SUBS={'＝':'いこーる','=':'いこーる','−':'まいなす','-':'まいなす'}
def norm(c):
    c = unicodedata.normalize('NFKC', c).lower()
    return '' if re.match(r'[\s、。「」？！?!,.：:・]', c) else c
# transcript chars with times (interpolated inside each word)
tchars, ttimes = [], []
for s in tr:
    for w in s['words']:
        cs = [norm(c) for c in w['w']]; cs = [c for c in cs if c]
        for i, c in enumerate(cs):
            tchars.append(c); ttimes.append(w['s'] + (w['e'] - w['s']) * i / max(1, len(cs)))
tstr = ''.join(tchars)
# script chars
rows = []
for l in script:
    for i, c in enumerate(l['text']):
        n = norm(c)
        if n: rows.append((l['id'], i, n))
sstr = ''.join(r[2] for r in rows)
sm = difflib.SequenceMatcher(None, sstr, tstr, autojunk=False)
m = [None] * len(sstr)
for a, b, size in sm.get_matching_blocks():
    for k in range(size): m[a + k] = ttimes[b + k]
# fill gaps by interpolation
known = [i for i, v in enumerate(m) if v is not None]
for i in range(len(m)):
    if m[i] is None:
        lo = max([k for k in known if k < i], default=None); hi = min([k for k in known if k > i], default=None)
        if lo is None: m[i] = m[hi]
        elif hi is None: m[i] = m[lo]
        else: m[i] = m[lo] + (m[hi] - m[lo]) * (i - lo) / (hi - lo)
out = {}
for (lid, ci, _), t in zip(rows, m): out.setdefault(lid, {})[ci] = round(t, 3)
# per line: char times for every char index (punctuation inherits next/prev), plus end time from whisper words
res = {}
for l in script:
    d = out[l['id']]; arr = []; last = None
    for i in range(len(l['text'])):
        if i in d: last = d[i]
        arr.append(last)
    nxt = None
    for i in range(len(arr) - 1, -1, -1):
        if arr[i] is None: arr[i] = nxt
        else: nxt = arr[i]
    res[l['id']] = arr
# line end = start of next line's first char minus small gap, last line = audio end
ids = [l['id'] for l in script]
ends = {}
for k, lid in enumerate(ids):
    lastc = res[lid][-1]
    # find whisper word end nearest after lastc
    wend = min([w['e'] for s in tr for w in s['words'] if w['e'] >= lastc - 0.05] or [lastc + 0.3])
    ends[lid] = round(wend, 3)
json.dump({'chars': res, 'start': {i: res[i][0] for i in ids}, 'end': ends}, open('timing.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
for i in ids: print(i, res[i][0], ends[i])
print('match ratio', round(sm.ratio(), 3))
