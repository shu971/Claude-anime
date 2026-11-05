p = '../src/captest/CapTest.tsx'
s = open(p, encoding='utf-8').read()
i = s.index("  const c = chunks[ci], tt = t - c.start;"); j = s.rindex("};")
new = r'''  // one box: k = entrance spring (0..1), out = exit progress (0..1)
  const Box = (c: typeof chunks[number], ti: number, k: number, out: number, key: string) => (
    <div key={key} style={{ position: 'absolute', left: 0, right: 0, top: CAP_Y, display: 'flex', justifyContent: 'center', transform: 'translateY(-50%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: BOX.bg, borderRadius: 22, padding: '18px 22px', boxShadow: '0 14px 40px rgba(0,0,0,0.45), 0 2px 0 rgba(0,0,0,0.08)', whiteSpace: 'nowrap',
        transform: `translateY(${(1 - k) * 46 - out * 70}px) scale(${(0.78 + 0.22 * k) * (1 - 0.18 * out)}) rotate(${(1 - k) * -4 + out * 3}deg)`, opacity: clamp(k * 3) * (1 - out) }}>
        {c.toks.map((tk, i) => {
          const on = i === ti && out === 0, ka = on ? eout(seg(t, c.ts[i], c.ts[i] + 0.07)) : 0;
          const popK = on ? Math.sin(Math.PI * seg(t, c.ts[i], c.ts[i] + 0.16)) : 0;
          return (
            <span key={i} style={{ position: 'relative', display: 'inline-block', padding: '2px 12px', font: `800 ${BOX.size}px/1.25 ${FONT}`, color: on ? BOX.active : i < ti ? '#3d424d' : BOX.text, transform: `scale(${1 + 0.06 * popK})` }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: 12, background: BOX.pill, opacity: ka, transform: `scale(${0.85 + 0.15 * ka})`, zIndex: 0 }} />
              <span style={{ position: 'relative' }}>{tk}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
  const c = chunks[ci], tt = t - c.start;
  const kBox = spring({ frame: tt * fps, fps, config: { damping: 9, stiffness: 340, mass: 0.5 } }); // bouncy landing
  let ti = 0; c.ts.forEach((s, i) => { if (t >= s) ti = i; });
  const prev = ci > 0 ? chunks[ci - 1] : null, outK = eout(seg(tt, 0, 0.14));
  return (
    <Stage label={label}>
      {prev && outK < 1 && Box(prev, prev.toks.length - 1, 1, outK, 'prev')}
      {Box(c, ti, kBox, 0, 'cur')}
    </Stage>
  );
'''
s = s[:i] + new + s[j:]
open(p, 'w', encoding='utf-8').write(s)
print('patched')
