"""Synthesises the 6 s sound design for the Château-Figeac title.

Everything is synthesised, no samples. Elegant and sparse:
  0.00 s  string ensemble swells in with the chateau (Dmaj9 -> Gmaj7/B -> D)
  0.35 s  soft cork pop
  0.90 s  wine poured gently into a glass, in a soft hall
  1.0-2.5 s  felt-piano motif, one note per reveal
  3.00 s  crystal clink tuned to the chord on the "CHATEAU-FIGEAC" wipe
  4.00 s  low piano chord + high note for the classification, ringing through the hold

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


def whoosh(start, length, f_from, f_to):
    noise = rng.standard_normal(N)
    x = np.clip((t - start) / length, 0, 1)
    shape = np.sin(np.pi * x) ** 2 * (t >= start)
    swept = sweep_filter(
        noise, lambda tt: f_from * (f_to / f_from) ** np.clip((tt - start) / length, 0, 1), 0.9
    )
    return swept * shape


def piano(freq, vel=1.0, length=4.0):
    """Soft felt-piano tone: slightly inharmonic partials, two-stage decay."""
    n = int(length * SR)
    tt = np.arange(n) / SR
    tau = 2.8 * (262 / freq) ** 0.35
    out = np.zeros(n)
    for k in range(1, 11):
        fk = k * freq * np.sqrt(1 + 0.0004 * k * k)
        if fk > 12000:
            break
        amp = vel / k ** 1.4 * (0.6 + 0.4 * vel) ** (k - 1)
        d = tau / (1 + 0.45 * (k - 1))
        e = 0.65 * np.exp(-tt / (0.25 * d)) + 0.35 * np.exp(-tt / d)
        out += amp * e * (np.sin(2 * np.pi * fk * tt) + np.sin(2 * np.pi * (fk + 0.35) * tt + 0.7)) / 2
    out *= np.minimum(tt / 0.004, 1) * np.clip((length - tt) / 0.3, 0, 1)
    thump = low(rng.standard_normal(n), 900) * np.exp(-tt / 0.01) * 0.03 * vel
    return out + thump


def strings(chord, start, end, fade=0.9):
    """Warm string ensemble: detuned band-limited saws with gentle vibrato."""
    out = np.zeros((N, 2))
    for f in chord:
        for v, (det, pan) in enumerate(((-0.12, 0.25), (0.0, 0.5), (0.12, 0.75))):
            fv = f * 2 ** (det / 12) * (1 + 0.0015 * np.sin(2 * np.pi * 4.8 * t + v))
            ph = 2 * np.pi * np.cumsum(fv) / SR + rng.uniform(0, 6.3)
            saw = sum(np.sin(k * ph) / k for k in range(1, 7))
            out += stereo(saw, pan)
    env = np.clip((t - start) / fade, 0, 1) ** 2 * np.clip((end - t) / fade, 0, 1) ** 0.7
    return low(out.T, 1800).T * env[:, None] / len(chord)


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


# strings: Dmaj9 -> Gmaj7/B -> Dmaj add9, crossfading under the reveals
D, G_B, D2 = [midi(m) for m in (50, 57, 64, 66)], [midi(m) for m in (47, 55, 62, 66)], [midi(m) for m in (38, 50, 57, 64, 66)]
add(strings(D, 0.0, 2.6, 1.4), 0.05, 0.7)
add(strings(G_B, 1.9, 4.4, 0.7), 0.045, 0.7)
add(strings(D2, 3.8, 6.6, 0.6), 0.055, 0.7)

add(stereo(whoosh(0.0, 1.2, 300, 1500), 0.5), 0.02, 0.8)  # air as the chateau appears
add(stereo(at(cork_pop(), 0.35), 0.45), 0.22, 0.5)
add(stereo(wine_pour(0.9, 1.75), 0.5), 0.33, 0.55)

# felt-piano motif: one note per reveal
for start, m, vel, pan in ((1.0, 78, 0.55, 0.45), (1.5, 81, 0.5, 0.55), (2.0, 76, 0.6, 0.6), (2.5, 74, 0.45, 0.5)):
    add(stereo(at(piano(midi(m), vel), start), pan), 0.13, 0.6)

# crystal clink tuned to the chord (F#6 + A6) on the title wipe
glass_a = stereo(glass(midi(90), 2.6, 1.3), 0.35)
glass_b = stereo(np.concatenate([np.zeros(int(0.007 * SR)), glass(midi(93), 2.3, 1.8)]), 0.65)
add(np.stack([at(glass_a[:, 0], 3.0) + at(glass_b[:, 0], 3.0), at(glass_a[:, 1], 3.0) + at(glass_b[:, 1], 3.0)], 1), 0.12, 0.7)

# classification: soft low piano chord + a high resolving note
for m, vel in ((38, 0.6), (45, 0.5), (50, 0.5), (57, 0.45), (64, 0.4), (66, 0.35)):
    add(stereo(at(piano(midi(m), vel, 3.0), 4.0 + (m - 38) * 0.0025), 0.5), 0.09, 0.6)
add(stereo(at(piano(midi(86), 0.4, 2.0), 4.35), 0.6), 0.1, 0.75)

ir_n = int(SR * 3.0)
ir_t = np.arange(ir_n) / SR
wet = np.zeros((N, 2))
for ch in range(2):
    ir = low(rng.standard_normal(ir_n), 4500) * np.exp(-ir_t / 0.5)
    ir[: int(0.025 * SR)] = 0  # pre-delay
    ir /= np.sqrt((ir ** 2).sum())
    wet[:, ch] = signal.fftconvolve(send[:, ch], ir)[:N]

mix = dry + wet * 0.9
mix = high(mix.T, 28).T  # remove inaudible rumble
mix *= np.clip((DUR - t) / 0.7, 0, 1)[:, None] ** 1.5  # clean tail for the next cut
mix *= np.clip(t / 0.02, 0, 1)[:, None]

# normalise to -3 dBFS peak, keeping the dynamics intact
mix = mix / np.abs(mix).max() * 10 ** (-3 / 20)

out = Path(__file__).resolve().parent.parent / "public" / "figeac" / "sound.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", out)
