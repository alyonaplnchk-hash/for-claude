---
name: avu-wine-tips-edit
description: Edit an AVU "Wine Tips" vertical video (two hosts talking at a barrel in the wine shop) in CapCut, matching AVU's house editing style - blurred-store title card, name lower-third, word-by-word captions with script-font keywords, punch-in cuts, coupe/product B-roll and a "Thank you" end card. Use whenever the user asks to edit, cut, caption or finish a Wine Tips / wine-education reel, or says "edit it like the champagne glass video".
---

# AVU Wine Tips – CapCut editing recipe

Reference edit: `IMG_9991.MOV` – "Which glass is best for Champagne?" with Laura Barriales and Ivano Antonini (2:32, 1080×1920, 30 fps).
Everything below was measured from that video. Values marked *(confirm)* were inferred and should be checked against the CapCut project or with the user the first time.

## Inputs to ask for before editing

1. Raw footage clip(s) of the hosts.
2. Topic question for the title card (e.g. "Which glass is best for Champagne?").
3. Host names, in the order shown on screen.
4. Any B-roll the user wants (product bottles, glasses, pouring). If none, ask before using stock footage.
5. Target length. The reference is 2:32; cut only dead air and repetition, never content the user hasn't approved.

## Structure (timeline)

| Time | Segment | What happens |
|---|---|---|
| 0:00–~0:03.5 | **Title card** | Blurred, light-washed shot of the AVU shop interior (ring lights on the ceiling, bottle shelves). "Wine Tips" writes on in gold script, left to right (~1 s). A thin gold divider line appears under it. The AVU logo (gold "U" mark + "AVU LUXURY WINES") fades in above, and the question fades in below in a dark-brown serif. |
| ~0:02–0:03.5 | Transition | ~1 s cross-dissolve from the title card into the first talking shot. Speech can start under the dissolve. |
| ~0:03.5–0:06 | **Name lower-third** | Over the wide two-shot: "Laura Barriales" / script "and" / "Ivano Antonini", white, stacked, left-of-centre at roughly 55 % of frame height, with a short thin line through the "and". Fade in and out, about 2–3 s on screen. |
| 0:06–end-0:06 | **Body** | Conversation with word-by-word captions throughout (see below). B-roll when a specific object is named. |
| ~last 0:06 | **Sign-off** | Hosts say goodbye. Captions "thanks for *following*" / "*and stay tuned!*", with the key words in script. |
| last ~0:03 | **End card** | Cross-dissolve back to the same blurred shop background. "Thank you" writes on in gold script with the divider line under it. Audio fades out over the final ~2.5 s. |

## Cutting style

- **Shot length:** median ~4 s; range 0.8–15 s. There are about 32 shots in 2:32. Hold longer on a clean explanation; cut faster during banter.
- **Three framings, one camera *(confirm)*:** wide two-shot (both hosts + whole barrel), medium single on whoever is speaking, and a tight shot of hands/bottles/glasses on the barrel top. The framings come from the same angle, so they're probably punch-in crops of 4K footage. In CapCut: duplicate the clip and scale to ~130–170 %, re-centering on the speaker.
- **When to cut:** on speaker changes, on a reaction (laugh, "oh my God"), and when a host touches or pours a bottle (cut to the tight shot). Jump-cut out pauses, false starts and "ehm"s. There is no dead air anywhere in the reference.
- **Transitions:** hard cuts inside the conversation. Use cross-dissolves (~1 s) only for title card → footage, footage → B-roll and back, and footage → end card. No zooms, whooshes, glitches or flashy CapCut transitions.
- **B-roll:** when a glass type or object is discussed, cut in a close-up of it. In the reference, champagne coupes appear at ~0:22–0:25 while the coupe is mentioned, dissolving in over the hosts. Keep B-roll warm, dark-background and elegant, 2–4 s long.

## Captions (most distinctive element)

- **Mode:** auto-captions (CapCut "Auto captions"), then edit every line by hand for spelling, names and wine terms (cuvée, non-vintage, Tuscany, Dom Pérignon, etc.).
- **Chunking:** 1–4 words per caption, lowercase, no punctuation except an occasional "!" at the end. Stack short words on 2–3 lines when it reads naturally ("to know / about the / glass", "I / knew / that").
- **Animation:** word-by-word reveal (karaoke-style). Upcoming words show dimmed grey and turn full white as they're spoken. Use a CapCut caption template with a word highlight or typewriter reveal, white highlight on a grey base.
- **Font:** clean light sans-serif in white, no box and no heavy stroke; a soft shadow at most. *(confirm the exact font — it looks close to "Outfit"/"Lexend Light".)*
- **Size and position:** small and understated (about 4–5 % of frame width per character), centred horizontally at about 62–68 % of frame height (over the top of the barrel). Shift left or right if it would cover a face or a bottle label.
- **Keyword emphasis:** 1–2 words per sentence switch to a **white italic script font**, larger than the sans words, mixed into the same line. Examples from the reference: *traditional style*, *biscuit*, *bubbles*, *not*, *utilize*, *more better*, *strange*, *the oxidation*, *red wine*, *acidic*, *forget the bubbles*, *following*, *and stay tuned!*. Pick the word that carries the meaning: a tasting note, a contrast, a punchline. Don't style more than one emphasis per caption.
- Keep the hosts' natural phrasing ("more better"). Don't correct their grammar in captions.

## Brand look

- **Gold** (script titles, divider, logo): muted antique gold, about `#9C8A5A` *(confirm with the brand file)*.
- **Title-card text:** dark warm brown, about `#2A2015`, in an elegant high-contrast serif (looks like Playfair Display *(confirm)*).
- **Title/end-card background:** the shop interior, heavily blurred (Gaussian ~30–40) with a warm beige/cream overlay at ~50–60 % opacity, so the text dominates.
- **Footage grade:** bright, warm and clean. Keep shelf lights warm white and skin natural. A light darkening gradient at the bottom of the frame helps captions read *(confirm)*. Don't use heavy LUTs or teal-orange looks.

## Audio

- Final mix at **−14 LUFS integrated** (true peak ≤ −1 dBTP), loudness range ~7 LU.
- Lav mics (visible on both hosts); clean speech up front. Use CapCut "Reduce noise" only if there's hum.
- The title card has sound at about −20 LUFS, most likely a soft music sting/bed *(confirm whether music runs under the whole video)*.
- Fade all audio out over the last ~2.5 s, finishing on the end card.

## Export

- 1080×1920, 9:16, 30 fps, HEVC/H.264 at ~10 Mbps (CapCut: 1080p, 30 fps, "Recommended" bitrate or higher).
- Check that captions and the lower-third sit inside the Instagram/TikTok safe area: nothing important in the bottom ~18 % or the right ~12 %, where the UI buttons are.

## Step-by-step in CapCut

1. New project, 9:16, 30 fps. Import the footage, B-roll, AVU logo (transparent PNG) and the shop background shot.
2. **Rough cut:** remove pauses, false starts and off-topic chatter. Keep the intro banter and the sign-off.
3. **Framing pass:** split at speaker changes and alternate wide / medium single / tight-on-barrel using scale + position (punch-ins). Aim for a ~4 s median shot.
4. **B-roll:** place close-ups where objects are named, with ~1 s cross-dissolves in and out.
5. **Title card:** blurred background + overlay, "Wine Tips" script with a write-on/wipe animation, divider line, logo fade-in, question in serif. ~3.5 s total, dissolving into the first shot.
6. **Lower-third:** host names over the first wide shot, fading in and out.
7. **Captions:** auto-generate, fix the text, rechunk to 1–4 words, apply the word-reveal style, then restyle the keywords in script italics.
8. **End card:** dissolve to the blurred background, "Thank you" in script with the divider; fade the audio out.
9. **Audio:** normalise to −14 LUFS, add music if the user wants it (ducked well under speech), fade out at the end.
10. **Review:** watch the whole video once at full speed. Check caption spelling, names, that no caption covers a face or label, and the safe areas. Then export.

## Operating CapCut

- If you control CapCut through computer use, work in the order above and save the project after each numbered step.
- If you use a CapCut draft-generation tool instead, build the timeline from the same values (timings, positions, fonts, colours) and tell the user which parts (script-font keywords, write-on title animation) they need to finish by hand in CapCut.
- When a value here is marked *(confirm)* and the user hasn't confirmed it yet, ask once at the start rather than guessing silently.
