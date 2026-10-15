"""Synthesises the 6 s sound design for the Château-Figeac title.

Cues follow the animation timeline:
  0.0 s  warm ambient pad swells in with the château photo
  1.0 s  soft air whoosh as the bottle rises
  2.0 s  gentle chime for "AVU WINE Stories"
  3.0 s  shimmer sweep under the "CHATEAU-FIGEAC" wipe
  4.0 s  low bloom + bell for the classification, ringing through the hold

Writes public/figeac/sound.wav (48 kHz, stereo, 16-bit).
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 6.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)


def note(freq):
    return 440.0 * 2 ** ((freq - 69) / 12)


def env(start, attack, decay, length=None):
    """Attack then exponential decay, starting at `start` seconds."""
    x = t - start
    e = np.where(x < 0, 0.0, np.minimum(x / attack, 1.0) ** 2)
    tail = np.exp(-np.maximum(x - attack, 0) / decay)
    e = e * tail
    if length is not None:
        e *= np.clip((start + length - t) / 0.3, 0, 1)
    return e


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def bell(freq, start, decay, amp):
    """Soft FM-free bell: inharmonic partials with fast-decaying highs."""
    out = np.zeros(N)
    for ratio, gain, dmul in [(1, 1.0, 1.0), (2.0, 0.35, 0.6), (2.76, 0.18, 0.4), (5.4, 0.06, 0.2)]:
        out += gain * np.sin(2 * np.pi * freq * ratio * t) * env(start, 0.004, decay * dmul)
    return amp * out


def pad():
    # D major add9 voicing, slightly detuned pairs for warmth
    chord = [note(50), note(57), note(62), note(64), note(66), note(69)]
    out = np.zeros((N, 2))
    for k, f in enumerate(chord):
        for side, det in ((0, -0.8), (1, 0.8)):
            ph = rng.uniform(0, 2 * np.pi)
            tone = np.sin(2 * np.pi * (f + det) * t + ph)
            tone += 0.25 * np.sin(2 * np.pi * 2 * (f + det) * t + ph)
            out[:, side] += tone / (1 + 0.3 * k)
    # slow breathing swell
    shape = np.clip(t / 1.6, 0, 1) ** 1.5 * (1 + 0.06 * np.sin(2 * np.pi * 0.35 * t))
    return out * shape[:, None] * 0.05


def whoosh(start, length, amp):
    noise = rng.standard_normal(N)
    x = np.clip((t - start) / length, 0, 1)
    shape = np.sin(np.pi * x) ** 2
    shape[t < start] = 0
    # two band-ish layers: darker body + airy top
    body = lowpass(noise, 900) - lowpass(noise, 120)
    air = noise - lowpass(noise, 3500)
    sig = (body * 1.0 + air * 0.25) * shape
    # pan from left to centre with the bottle's rise
    pan = 0.35 + 0.15 * x
    return amp * np.stack([sig * (1 - pan), sig * pan], 1)


def shimmer(start, length, amp):
    """Rising sparkle of quiet high partials following the left-to-right wipe."""
    out = np.zeros((N, 2))
    freqs = [note(m) for m in (81, 83, 85, 86, 88, 90, 93)]
    for i, f in enumerate(freqs):
        s = start + i * length / len(freqs)
        e = env(s, 0.02, 0.9)
        tone = np.sin(2 * np.pi * f * t) * e
        p = i / (len(freqs) - 1)  # pans left to right with the wipe
        out[:, 0] += tone * (1 - 0.6 * p)
        out[:, 1] += tone * (0.4 + 0.6 * p)
    return amp * out


def bloom(start, amp):
    sub = np.sin(2 * np.pi * note(38) * t) + 0.4 * np.sin(2 * np.pi * note(50) * t)
    return amp * sub * env(start, 0.25, 1.8)


def reverb(x, seconds=2.4, mix=0.3):
    n = int(SR * seconds)
    ir_t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-ir_t / (seconds / 6.5))
        ir = lowpass(ir, 5000)
        ir /= np.sqrt((ir ** 2).sum())
        wet = np.fft.irfft(np.fft.rfft(x[:, ch], 2 * N + n) * np.fft.rfft(ir, 2 * N + n))[:N]
        out[:, ch] = x[:, ch] * (1 - mix) + wet * mix * 2.2
    return out


mix = pad()
mix += whoosh(0.85, 1.25, 0.05)
mix += (bell(note(74), 2.05, 1.6, 0.11) + bell(note(81), 2.12, 1.4, 0.05))[:, None] * [1.0, 0.9]
mix += shimmer(3.0, 1.1, 0.035)
low = bloom(4.0, 0.12)
mix += np.stack([low, low], 1)
b = bell(note(62), 4.02, 2.2, 0.09) + bell(note(69), 4.06, 2.0, 0.06) + bell(note(78), 4.1, 1.8, 0.04)
mix += np.stack([b * 0.95, b], 1)

mix = reverb(mix)
# gentle fade on the very end so the cut into the next scene is clean
mix *= np.clip((DUR - t) / 0.5, 0, 1)[:, None]
mix *= np.clip(t / 0.05, 0, 1)[:, None]

peak = np.abs(mix).max()
mix = mix / peak * 10 ** (-3 / 20)  # normalise to -3 dBFS peak

out = Path(__file__).resolve().parent.parent / "public" / "figeac" / "sound.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", out, "rms dBFS", round(20 * np.log10(np.sqrt((mix ** 2).mean())), 1))
