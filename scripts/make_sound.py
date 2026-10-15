"""Synthesises the 6 s sound design for the Château-Figeac title.

Everything is generated from physical models, no samples:
  0.00 s  air swell + low pad
  0.35 s  cork pop
  0.90 s  wine pours into a glass (bubbles + stream, glass fills and rises in pitch)
  1.00 s  whoosh + pulse as the bottle rises; pulse every second after that
  2.00 s  swish for "AVU WINE Stories"
  2.30 s  riser building into ...
  3.00 s  glass clink ("cheers") on the "CHATEAU-FIGEAC" wipe
  4.00 s  sub boom + glass ring for the classification, ringing through the hold

Writes public/figeac/sound.wav (48 kHz, stereo, 16-bit).
"""
import wave
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
DUR = 6.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(11)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def at(sig, start):
    """Place a short mono buffer into a full-length track at `start` seconds."""
    out = np.zeros(N)
    i = int(start * SR)
    n = min(len(sig), N - i)
    out[i:i + n] = sig[:n]
    return out


def band(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], "bandpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def high(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "highpass", fs=SR, output="sos"), x)


def low(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "lowpass", fs=SR, output="sos"), x)


def sweep_filter(x, centre, width_oct=0.8):
    """Time-varying band emphasis: `centre(time_array)` gives Hz per frame."""
    f, tt, Z = signal.stft(x, SR, nperseg=1024, noverlap=768)
    fc = centre(tt)[None, :]
    g = np.exp(-0.5 * (np.log2(np.maximum(f[:, None], 1) / fc) / width_oct) ** 2)
    _, y = signal.istft(Z * g, SR, nperseg=1024, noverlap=768)
    return np.pad(y, (0, max(0, len(x) - len(y))))[:len(x)]


def stereo(x, pan=0.5):
    return np.stack([x * np.sqrt(1 - pan), x * np.sqrt(pan)], 1)


# ---------------------------------------------------------------- elements
def cork_pop():
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    f = 280 + 700 * np.exp(-tt / 0.008)
    pop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.022)
    thump = np.sin(2 * np.pi * 110 * tt) * np.exp(-tt / 0.035) * 0.6
    click = high(rng.standard_normal(n), 2500) * np.exp(-tt / 0.0015) * 0.5
    fizz = band(rng.standard_normal(n), 3000, 9000) * np.exp(-tt / 0.06) * 0.08
    return pop + thump + click + fizz


def bubble(f0, tau, rise):
    n = int(tau * 6 * SR)
    tt = np.arange(n) / SR
    f = f0 * (1 + rise * tt)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / tau) * np.minimum(tt / 0.0004, 1)


def wine_pour(start, length):
    out = np.zeros(N)
    end = start + length
    # flow envelope: quick onset, steady stream, taper as the bottle lifts
    flow = np.clip((t - start) / 0.12, 0, 1) * np.clip((end - t) / 0.45, 0, 1)
    # glugs: big low bubbles, strongest at the start of the pour
    g = start + 0.02
    while g < end - 0.3:
        strength = 1.0 if g < start + 0.5 else 0.45
        f0 = rng.uniform(150, 260)
        out += at(bubble(f0, 0.03, 4.0), g) * strength * 0.9
        out += at(bubble(f0 * 1.6, 0.018, 6.0), g + 0.012) * strength * 0.4
        g += rng.uniform(0.11, 0.16)
    # fine bubbles in the stream; pitch climbs as the glass fills
    k = start
    while k < end:
        prog = (k - start) / length
        f0 = np.exp(rng.uniform(np.log(500), np.log(2600))) * (1 + 0.5 * prog)
        tau = 1 / (np.pi * f0 * rng.uniform(0.03, 0.07))
        amp = rng.uniform(0.1, 0.45) * np.interp(k, t, flow)
        out += at(bubble(f0, tau, 0.25 / tau), k) * amp
        k += rng.exponential(1 / 260)
    # turbulent stream noise
    turb = low(np.abs(rng.standard_normal(N)), 18)
    turb /= turb.max()
    stream = band(rng.standard_normal(N), 400, 3500) * (0.3 + turb) * flow * 0.035
    mix = out + stream
    # the glass cavity resonance rises from ~550 Hz to ~1300 Hz while it fills
    cavity = sweep_filter(
        mix, lambda tt: 550 * (1300 / 550) ** np.clip((tt - start) / length, 0, 1), 0.7
    )
    return mix * 0.35 + cavity * 1.2


def glass(f1, decay=2.4, beat=1.7):
    n = int(decay * 3 * SR)
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for ratio, amp, d in [(1, 1.0, 1.0), (2.32, 0.55, 0.45), (4.25, 0.3, 0.22), (6.63, 0.14, 0.12)]:
        f = f1 * ratio
        # each mode is split in two -> the slow shimmer of real crystal
        mode = np.sin(2 * np.pi * f * tt) + 0.6 * np.sin(2 * np.pi * (f + beat * ratio) * tt + 1.0)
        out += amp * mode * np.exp(-tt / (decay * d))
    strike = high(rng.standard_normal(n), 4000) * np.exp(-tt / 0.002) * 0.8
    return (out / 1.6 + strike) * np.minimum(tt / 0.0006, 1)


def clink():
    a = stereo(glass(1460, 2.6, 1.6), 0.3)
    b = stereo(np.concatenate([np.zeros(int(0.006 * SR)), glass(1585, 2.3, 2.1)]), 0.7)
    n = max(len(a), len(b))
    out = np.zeros((n, 2))
    out[: len(a)] += a
    out[: len(b)] += b
    return out


def kick(amp=1.0):
    n = int(0.5 * SR)
    tt = np.arange(n) / SR
    f = 46 + 90 * np.exp(-tt / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.22)
    click = high(rng.standard_normal(n), 3000) * np.exp(-tt / 0.002) * 0.15
    return amp * (body + click)


def boom():
    n = int(2.5 * SR)
    tt = np.arange(n) / SR
    f = 36 + 70 * np.exp(-tt / 0.07)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 1.1)
    hit = low(rng.standard_normal(n), 400) * np.exp(-tt / 0.08) * 0.8
    return sub + hit


def hat(amp):
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    return high(rng.standard_normal(n), 7500) * np.exp(-tt / 0.018) * amp


def whoosh(start, length, f_from, f_to):
    noise = rng.standard_normal(N)
    x = np.clip((t - start) / length, 0, 1)
    shape = np.sin(np.pi * x) ** 2 * (t >= start)
    swept = sweep_filter(
        noise, lambda tt: f_from * (f_to / f_from) ** np.clip((tt - start) / length, 0, 1), 0.9
    )
    return swept * shape


def riser(start, end):
    noise = rng.standard_normal(N)
    x = np.clip((t - start) / (end - start), 0, 1)
    shape = x ** 2.5 * (t < end)
    swept = sweep_filter(noise, lambda tt: 400 * 15 ** np.clip((tt - start) / (end - start), 0, 1), 1.0)
    tone = np.sin(2 * np.pi * np.cumsum(midi(62) * (1 + x)) / SR) * 0.15
    return (swept + tone) * shape


def pad():
    chord = [midi(50), midi(57), midi(62), midi(64), midi(69)]
    out = np.zeros((N, 2))
    for k, f in enumerate(chord):
        for side, det in ((0, -0.7), (1, 0.7)):
            ph = rng.uniform(0, 2 * np.pi)
            out[:, side] += (np.sin(2 * np.pi * (f + det) * t + ph)
                             + 0.2 * np.sin(4 * np.pi * (f + det) * t + ph)) / (1 + 0.35 * k)
    swell = np.clip(t / 1.2, 0, 1) ** 1.5 * (1 + 0.35 * np.clip((t - 4.0) / 0.4, 0, 1))
    return out * swell[:, None]


# ---------------------------------------------------------------- mix
dry = np.zeros((N, 2))
send = np.zeros((N, 2))  # reverb send


def add(x, gain, rev=0.3):
    global dry, send
    if x.ndim == 1:
        x = stereo(x)
    full = np.zeros((N, 2))
    full[: min(len(x), N)] = x[:N]
    dry += full * gain
    send += full * gain * rev


add(pad(), 0.025, 0.6)
add(stereo(whoosh(0.0, 1.0, 300, 1800), 0.5), 0.05, 0.5)
add(stereo(at(cork_pop(), 0.35), 0.45), 0.55, 0.25)
add(stereo(wine_pour(0.9, 1.75), 0.5), 0.8, 0.3)
add(stereo(whoosh(0.85, 0.7, 250, 2500), 0.4), 0.09, 0.4)
for s, a in ((1.0, 0.55), (2.0, 0.5), (3.0, 0.6)):
    add(at(kick(), s), a, 0.1)
for s in np.arange(1.25, 4.0, 0.25):
    accent = 1.0 if abs((s % 0.5) - 0.0) > 1e-6 else 0.55  # off-beats louder
    add(stereo(at(hat(1.0), s), 0.6 if int(s * 4) % 2 else 0.4), 0.035 * accent, 0.2)
add(stereo(whoosh(1.85, 0.4, 1500, 7000), 0.65), 0.07, 0.4)
add(stereo(riser(2.2, 2.99), 0.5), 0.2, 0.5)
c = clink()
add(np.stack([at(c[:, 0], 3.0), at(c[:, 1], 3.0)], 1), 0.32, 0.45)
add(at(boom(), 4.0), 0.75, 0.25)
ring = at(glass(1170, 2.8, 1.2), 0) * 0.6 + at(glass(1755, 2.2, 1.9), 0) * 0.35
add(stereo(np.roll(ring, int(4.02 * SR)) * (t >= 4.02), 0.5), 0.22, 0.6)

ir_n = int(SR * 2.2)
ir_t = np.arange(ir_n) / SR
wet = np.zeros((N, 2))
for ch in range(2):
    ir = low(rng.standard_normal(ir_n), 6000) * np.exp(-ir_t / 0.38)
    ir[: int(0.012 * SR)] = 0  # pre-delay
    ir /= np.sqrt((ir ** 2).sum())
    wet[:, ch] = signal.fftconvolve(send[:, ch], ir)[:N]

mix = dry + wet * 0.9
mix = high(mix.T, 28).T  # remove inaudible rumble
mix *= np.clip((DUR - t) / 0.5, 0, 1)[:, None]  # clean tail for the next cut
mix *= np.clip(t / 0.02, 0, 1)[:, None]

# gentle bus saturation + normalise to -1 dBFS
mix = mix / np.abs(mix).max()
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
mix = mix / np.abs(mix).max() * 10 ** (-1 / 20)

out = Path(__file__).resolve().parent.parent / "public" / "figeac" / "sound.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", out)
