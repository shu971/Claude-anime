# Beatless ambient BGM: slow pads with irregular chord changes, airy noise, sparse bells at random times.
# No percussion and nothing on a grid, so it never fights the narration's rhythm.
import numpy as np, wave, subprocess

SR = 48000
DUR = 30.0  # a bit longer than the 22s video so it can be trimmed in CapCut
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, fc):  # one-pole lowpass, run twice for a softer slope
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    for _ in range(2):
        y = np.empty_like(x); acc = 0.0
        for i in range(0, len(x), 4096):  # chunked loop for speed
            seg = x[i:i + 4096]; out = np.empty_like(seg)
            for j, v in enumerate(seg): acc += a * (v - acc); out[j] = acc
            y[i:i + 4096] = out
        x = y
    return x

# chords (MIDI) — warm, open voicings; change times deliberately uneven
chords = [
    (0.0,  [48, 55, 62, 64, 71]),   # Cmaj9
    (6.7,  [45, 52, 59, 60, 67]),   # Am9
    (13.3, [41, 48, 55, 57, 64, 66]),  # Fmaj7#11
    (19.9, [43, 50, 57, 59, 62]),   # G6/9
    (25.6, [48, 55, 62, 64, 71]),   # back to Cmaj9
]
XF = 3.2  # slow crossfade between chords

pad = np.zeros(N)
for ci, (start, notes) in enumerate(chords):
    end = chords[ci + 1][0] if ci + 1 < len(chords) else DUR
    env = np.clip((t - (start - XF / 2)) / XF, 0, 1) * np.clip(((end + XF / 2) - t) / XF, 0, 1)
    env = env * env * (3 - 2 * env)
    for k, m in enumerate(notes):
        f = mtof(m)
        voice = np.zeros(N)
        dets = (-0.08, 0.0, 0.07) if m >= 55 else (-0.015, 0.0, 0.012)  # low notes barely detuned: no audible wobble
        for det in dets:  # detuned triangles
            ph = 2 * np.pi * f * 2 ** (det / 12) * t + rng.uniform(0, 6.28)
            voice += (2 / np.pi) * np.arcsin(np.sin(ph))
        lfo = 0.75 + 0.25 * np.sin(2 * np.pi * rng.uniform(0.05, 0.11) * t + rng.uniform(0, 6.28))  # slow, unsynced swells
        pad += voice * env * lfo * (0.9 if m < 50 else 0.55) / 3
pad = lp(pad, 1400)

# soft sub drone that glides with the chord roots
# one sine whose pitch glides between chord roots (no two bass notes overlapping -> no beating)
midi = np.full(N, float(chords[0][1][0] - 12))
for ci in range(1, len(chords)):
    st, prev, cur = chords[ci][0], chords[ci - 1][1][0] - 12, chords[ci][1][0] - 12
    k = np.clip((t - (st - XF / 2)) / XF, 0, 1); k = k * k * (3 - 2 * k)
    midi = np.where(t >= st - XF / 2, prev + (cur - prev) * k, midi)
root = np.sin(2 * np.pi * np.cumsum(440.0 * 2 ** ((midi - 69) / 12)) / SR)
root *= 0.35

# airy noise bed, high-passed, slowly breathing
noise = rng.standard_normal(N)
air = noise - lp(noise, 2500)
air = lp(air, 7000) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.043 * t + 1.0)) * 0.018

# sparse bells at random (Poisson) times from a pentatonic set, never on a grid
bells = np.zeros(N)
scale = [72, 74, 76, 79, 81, 84, 86, 88]
tt = 1.3
while tt < DUR - 3:
    m = scale[rng.integers(len(scale))]; f = mtof(m); n0 = int(tt * SR); L = int(SR * 3.5)
    x = np.arange(min(L, N - n0)) / SR
    tone = (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * f * 2.01 * x) * np.exp(-x * 3)) * np.exp(-x * 1.4) * np.minimum(1, x * 300)
    bells[n0:n0 + len(x)] += tone * rng.uniform(0.05, 0.11)
    tt += rng.exponential(1.9) + 0.6

# reverb: convolve with a decaying-noise impulse (2.8s), separate L/R for width
def reverb(x, seed):
    r = np.random.default_rng(seed); L = int(SR * 2.8)
    ir = r.standard_normal(L) * np.exp(-np.arange(L) / SR * 2.2); ir = lp(ir, 5000); ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + L; F = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(ir, F), F)[:len(x)]

dry = pad * 0.5 + root + air
wetsrc = pad * 0.5 + bells
L = dry + bells * 0.6 + reverb(wetsrc, 1) * 0.55
R = dry + bells * 0.6 + reverb(wetsrc, 2) * 0.55
fade = np.minimum(1, t / 2.0) * np.minimum(1, (DUR - t) / 3.5)
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max())
g = 10 ** (-4 / 20) / peak  # peak -4 dBFS; turn it down under the narration in CapCut
st = np.stack([L * g, R * g], axis=1)
pcm = (np.clip(st, -1, 1) * 32767).astype(np.int16)
with wave.open('bgm_ambient.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', 'bgm_ambient.wav', '-c:a', 'libmp3lame', '-b:a', '192k', '../out/bgm_ambient.mp3'], check=True)
print('wrote out/bgm_ambient.mp3', DUR, 's')
