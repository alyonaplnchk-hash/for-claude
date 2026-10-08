"""Synthesises the 7 s music bed for the Producer Spotlight intro.

Soft strings and a felt-piano line, timed to the Écriture animation:
the piano climbs while "Spotlight" is written, the harmony opens when
"in conversation with" appears, and a bell answers each logo.

    python3 scripts/compose-intro-music.py public/music/spotlight-intro.wav
"""

import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
LENGTH = 7.0
FPS = 30
rng = np.random.default_rng(7)


def hz(note: str) -> float:
    names = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    semis = names[note[0]]
    rest = note[1:]
    if rest.startswith("#"):
        semis += 1
        rest = rest[1:]
    elif rest.startswith("b"):
        semis -= 1
        rest = rest[1:]
    midi = 12 * (int(rest) + 1) + semis
    return 440.0 * 2 ** ((midi - 69) / 12)


def at(frame: float) -> float:
    return frame / FPS


def lowpass(x, cutoff, order=2):
    return sosfilt(butter(order, cutoff, "low", fs=SR, output="sos"), x)


def piano(freq, dur=4.5, vel=0.5):
    """Soft felt piano: slightly inharmonic partials, highs decay first."""
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for n in range(1, 12):
        f = freq * n * np.sqrt(1 + 0.00035 * n * n)
        if f > SR / 2.2:
            break
        decay = 1.2 + 0.9 * n
        amp = vel ** (0.6 + 0.12 * n) / n**1.4
        out += amp * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(
            -decay * t / (1 + freq / 900)
        )
    attack = np.minimum(t / 0.008, 1)
    hammer = lowpass(rng.normal(0, 1, len(t)), 900) * np.exp(-t * 60) * 0.02 * vel
    return (out * attack + hammer) * np.exp(-t * 0.4)


def strings(freqs, start, end, fade_in=1.4, fade_out=1.2, gain=0.22):
    """Warm, slightly detuned string pad."""
    n = int((end - start) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        for cents in (-7, 0, 6):
            ff = f * 2 ** (cents / 1200)
            vib = 1 + 0.0018 * np.sin(2 * np.pi * 4.8 * t + rng.uniform(0, 6))
            phase = 2 * np.pi * np.cumsum(ff * vib) / SR
            # band-limited-ish saw
            saw = sum(np.sin(k * phase) / k for k in range(1, 9))
            out += saw
    out = lowpass(out, 1400, 3)
    env = np.minimum(t / fade_in, 1) * np.minimum((t[-1] - t) / fade_out, 1)
    return out * env * gain / len(freqs)


def place(track, sound, start, pan=0.0):
    i = int(start * SR)
    j = min(len(track), i + len(sound))
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    track[i:j, 0] += sound[: j - i] * l
    track[i:j, 1] += sound[: j - i] * r


def reverb(x, seconds=3.2, mix=0.38):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.normal(0, 1, n) * np.exp(-t * 6.9 / seconds)
        ir = lowpass(ir, 5000)
        ir[: int(0.012 * SR)] = 0  # pre-delay
        ir /= np.sqrt(np.sum(ir**2))
        out[:, ch] = fftconvolve(x[:, ch], ir)[: len(x)]
    return x * (1 - mix) + out * mix * 1.6


def main(path):
    track = np.zeros((int(LENGTH * SR), 2))

    # Harmony: Dmaj9 under the title, opening to Gmaj9/D for the guest.
    place(track, strings([hz(n) for n in ["D2", "A2", "F#3", "C#4", "E4"]], 0, at(136)), 0.0)
    place(track, strings([hz(n) for n in ["D2", "G2", "D3", "B3", "F#4", "A4"]], 0, LENGTH - at(122), fade_in=1.0, fade_out=1.6), at(122))

    # Piano climbs with the pen (Spotlight is written from frame 48 to ~110).
    line = [("A4", 48, 0.42), ("C#5", 60, 0.38), ("E5", 71, 0.4), ("F#5", 83, 0.36), ("A5", 96, 0.44)]
    for i, (note, frame, vel) in enumerate(line):
        place(track, piano(hz(note), vel=vel), at(frame), pan=-0.35 + i * 0.15)
    place(track, piano(hz("D3"), vel=0.3, dur=5) * 0.35, at(48), pan=-0.2)

    # Guest logo: an open G chord; AVU logo: a high bell.
    for note, pan in [("B4", -0.2), ("D5", 0.0), ("F#5", 0.15), ("A5", 0.3)]:
        place(track, piano(hz(note), vel=0.3), at(142) + rng.uniform(0, 0.03), pan)
    place(track, piano(hz("G3"), vel=0.3, dur=4) * 0.35, at(142), -0.1)
    place(track, piano(hz("D6"), vel=0.28, dur=3.5) * 0.7, at(150), 0.35)

    track = reverb(track)

    # Fade in the very start, settle out at the end.
    t = np.arange(len(track)) / SR
    env = np.minimum(t / 0.25, 1) * np.clip((LENGTH - t) / 0.9, 0, 1) ** 1.5
    track *= env[:, None]
    track = lowpass(track.T, 9000).T
    track = sosfilt(butter(2, 70, "high", fs=SR, output="sos"), track.T).T

    track *= 10 ** (-3 / 20) / np.max(np.abs(track))
    wavfile.write(path, SR, (track * 32767).astype(np.int16))


if __name__ == "__main__":
    main(sys.argv[1])
