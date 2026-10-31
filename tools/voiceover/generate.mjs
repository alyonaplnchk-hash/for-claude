// Generates one WAV per narration line with the open Kokoro-82M model (local, no API key).
// Words written as [word](/ipa/) in narration.json are spoken with the given phonemes,
// which fixes French place and grape names that an English phonemizer gets wrong.
import { KokoroTTS } from "kokoro-js";
import { phonemize } from "phonemizer";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const narration = JSON.parse(fs.readFileSync(path.join(root, "src/film/narration.json"), "utf8"));
const outDir = path.join(root, "public/vo");
fs.mkdirSync(outDir, { recursive: true });

const PUNCT = ';:,.!?¡¿—…"«»“”(){}[]';
const punctRe = new RegExp(`(\\s*[${PUNCT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]+\\s*)+`, "g");

// Same clean-up kokoro-js applies after espeak.
const fix = (s) =>
  s.replace(/ʲ/g, "j").replace(/r/g, "ɹ").replace(/x/g, "k").replace(/ɬ/g, "l");

async function plainToPhonemes(text) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(punctRe)) {
    if (m.index > last) parts.push({ p: false, t: text.slice(last, m.index) });
    parts.push({ p: true, t: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ p: false, t: text.slice(last) });
  let out = "";
  for (const part of parts) {
    if (part.p) out += part.t;
    else if (part.t.trim()) out += fix((await phonemize(part.t, "en-us")).join(" "));
    else out += part.t;
  }
  return out;
}

async function toPhonemes(text) {
  // Phonemize the whole sentence with plain words (keeps natural linking and stress),
  // then swap each override word's espeak phonemes for the given IPA.
  const re = /\[([^\]]+)\]\(\/([^/]+)\/\)/g;
  const overrides = [...text.matchAll(re)].map((m) => ({ word: m[1], ipa: m[2] }));
  let out = await plainToPhonemes(text.replace(re, "$1"));
  for (const o of overrides) {
    const iso = (await plainToPhonemes(o.word)).trim();
    if (out.includes(iso)) out = out.replace(iso, o.ipa);
    else console.warn(`override for "${o.word}" not applied (espeak gave ${iso})`);
  }
  return out.replace(/\s+/g, " ").trim();
}

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
  dtype: "fp32",
  device: "cpu",
});

// Trim silence, light EQ + compression, loudness-normalise, 48 kHz mono.
const MASTER =
  "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse," +
  "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.12,areverse," +
  "highpass=f=70,equalizer=f=200:t=q:w=1:g=1.5,equalizer=f=3500:t=q:w=1.2:g=2," +
  "acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2,loudnorm=I=-17:TP=-2:LRA=7";

const durations = {};
for (const line of narration.lines) {
  const ph = await toPhonemes(line.text);
  const { input_ids } = tts.tokenizer(ph, { truncation: true });
  const audio = await tts.generate_from_ids(input_ids, {
    voice: narration.voice,
    speed: narration.speed,
  });
  const raw = path.join(os.tmpdir(), `${line.id}.raw.wav`);
  await audio.save(raw);
  const out = path.join(outDir, `${line.id}.wav`);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", raw, "-af", MASTER, "-ar", "48000", "-ac", "1", out]);
  const d = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]).toString();
  durations[line.id] = Math.round(parseFloat(d) * 1000) / 1000;
  console.log(line.id, durations[line.id].toFixed(2) + "s", "|", ph);
}
// The timeline reads these to size every shot.
fs.writeFileSync(path.join(root, "src/film/vo-durations.json"), JSON.stringify(durations, null, 1));
