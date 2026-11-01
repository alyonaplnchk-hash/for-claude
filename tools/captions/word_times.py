"""Word-level timestamps for every narration clip with a local Whisper model (faster-whisper).
Writes tools/captions/words.json, used by make_word_captions.py.
"""
import json, os, sys
from faster_whisper import WhisperModel
root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
narr = json.load(open(f"{root}/src/film/narration.json"))
m = WhisperModel("small.en", device="cpu", compute_type="int8")
out = {}
import subprocess, numpy as np
def load(path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)
for line in narr["lines"]:
    segs, _ = m.transcribe(load(f"{root}/public/vo/{line['id']}.wav"), word_timestamps=True, beam_size=5, language="en")
    ws = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
    out[line["id"]] = ws
    print(line["id"], " ".join(f"{w['w']}@{w['s']}" for w in ws), flush=True)
json.dump(out, open(f"{root}/tools/captions/words.json", "w"), indent=1)
