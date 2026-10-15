import numpy as np
from PIL import Image, ImageFilter
import cv2

src = np.asarray(Image.open("src.png").convert("RGB")).astype(np.float32)
H, W, _ = src.shape
PHOTO_R = 785  # photo / ivory split column
BG_SAMPLE = slice(935, 945)

# ---------- bottle silhouette ----------
AXIS = 794.5
right = np.full(H, np.nan)
for y in range(H):
    bg = src[y, BG_SAMPLE].mean(0)
    d = np.abs(src[y, 700:950] - bg).sum(1)
    idx = np.where(d > 60)[0]
    if len(idx):
        right[y] = 700 + idx.max() + 0.5
# bottle top / bottom
top, bot = 46, 1052
# label rows: edge is light-on-light, force straight body edge
body_r = 915.5
for y in range(H):
    if y < top or y > bot:
        right[y] = np.nan
    elif 420 <= y <= 1015:
        right[y] = body_r
# smooth the neck/shoulder profile
r = right.copy()
valid = ~np.isnan(r)
ys = np.arange(H)
sm = r.copy()
for y in ys[valid]:
    lo, hi = max(top, y - 3), min(bot, y + 3)
    win = r[lo:hi + 1]
    sm[y] = np.nanmedian(win)
right = sm

xs = np.arange(W)[None, :].astype(np.float32)
half = np.where(np.isnan(right), -1, right - AXIS)[:, None]
px = xs + 0.5 - AXIS
# right side as measured; left side gets 3px extra for the glass rim glow
lim = np.where(px >= 0, half + 1.0, half + 3.0)
dist = lim - np.abs(px)
mask = np.clip(dist + 0.5, 0, 1)
mask[np.isnan(right)] = 0
# rounded base: per-column bottom measured on the ivory side, mirrored
lum_ = src.mean(2)
bottom = np.full(W, -1.0)
for x in range(int(AXIS), 930):
    col = lum_[990:1080, x]
    d = np.where(col < 120)[0]
    if len(d):
        b = 990 + d.max() + 1.5
        bottom[x] = b
        xm = int(round(2 * AXIS - x))
        bottom[xm] = b
        if xm - 1 >= 0 and bottom[xm - 1] < 0: bottom[xm - 1] = b
        if xm - 2 >= 0 and bottom[xm - 2] < 0: bottom[xm - 2] = b
        if xm - 3 >= 0 and bottom[xm - 3] < 0: bottom[xm - 3] = b
for x in range(W):
    if bottom[x] < 0:
        continue
for x in range(W):
    if mask[1000:, x].any() and bottom[x] < 0:
        bottom[x] = 1035.0
ycol = np.arange(H)[:, None].astype(np.float32) + 0.5
bmask = np.clip(bottom[None, :] - ycol + 0.5, 0, 1)
mask = np.where(ycol > 990, np.minimum(mask, bmask), mask)
mask = mask.astype(np.float32)
m8 = (mask * 255).astype(np.uint8)
Image.fromarray(m8).save("bottle_mask.png")

# ---------- clean plate ----------
plate = src.copy()

# right side ivory: smooth model of background fitted on non-text, non-bottle pixels
text_mask = np.zeros((H, W), bool)
yy, xx = np.mgrid[0:H, 0:W]
ivory = (xx >= PHOTO_R)
lum = src.mean(2)
# text detection: deviation from row-wise robust smooth background
cand = ivory & (mask < 0.01)
# the ivory backdrop is a pure horizontal gradient (identical in every row),
# so the clean background is the per-column colour of the top rows,
# which are free of text and bottle
column = np.median(src[0:40], axis=0)
model = np.broadcast_to(column[None], src.shape).copy()
model[~ivory] = 0
# add fine grain back? keep model + small residual noise from original where not text
plate[ivory & (xx >= 787)] = model[ivory & (xx >= 787)]

# photo side behind bottle: mirror-fill + seam blend + inpaint touch-up
cover = cv2.dilate((mask > 0.01).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
for y in range(H):
    cols = np.where(cover[y, :PHOTO_R])[0]
    if not len(cols):
        continue
    x0 = cols.min()
    n = PHOTO_R - x0
    srcx = x0 - 1 - np.arange(n)
    srcx = np.clip(srcx, 0, None)
    plate[y, x0:PHOTO_R] = src[y, srcx]
# ivory under bottle bottom / neck (right of split): model already covers ivory
plate[ivory & cover] = model[ivory & cover]

# soften the mirror seam with inpainting of a thin band
seam = np.zeros((H, W), np.uint8)
for y in range(H):
    cols = np.where(cover[y, :PHOTO_R])[0]
    if len(cols):
        x0 = cols.min()
        seam[y, max(0, x0 - 3):x0 + 3] = 255
p8 = np.clip(plate, 0, 255).astype(np.uint8)
p8 = cv2.inpaint(p8, seam, 5, cv2.INPAINT_TELEA)
plate = p8.astype(np.float32)

Image.fromarray(np.clip(plate, 0, 255).astype(np.uint8)).save("plate.png")

# ---------- text layers ----------
# alpha = soft mask around text components; colour = original pixels
resid = np.abs(src - model).sum(2)
resid[~ivory] = 0
resid[mask > 0.01] = 0
def text_layer(name, y0, y1, x0=940, x1=W):
    region = np.zeros((H, W), bool)
    region[y0:y1, x0:x1] = True
    t = region & (resid > 8)
    t = cv2.dilate(t.astype(np.uint8), np.ones((9, 9), np.uint8))
    a = cv2.GaussianBlur(t.astype(np.float32), (0, 0), 1.2)
    a = np.clip(a * 1.6, 0, 1) * region
    rgba = np.dstack([src, a * 255]).clip(0, 255).astype(np.uint8)
    ys_, xs_ = np.where(a > 0)
    print(name, "bbox", xs_.min(), ys_.min(), xs_.max(), ys_.max())
    Image.fromarray(rgba, "RGBA").save(f"{name}.png")

text_layer("title_series", 150, 380)
text_layer("title_main", 470, 636)
text_layer("title_class", 636, 800)

# bottle layer: original pixels with silhouette alpha
rgba = np.dstack([src, mask * 255]).clip(0, 255).astype(np.uint8)
Image.fromarray(rgba, "RGBA").save("bottle.png")

# debug: recomposite and compare
def over(base, layer):
    a = layer[..., 3:4] / 255.0
    return base * (1 - a) + layer[..., :3] * a
comp = plate.copy()
for n in ["bottle", "title_series", "title_main", "title_class"]:
    comp = over(comp, np.asarray(Image.open(f"{n}.png")).astype(np.float32))
err = np.abs(comp - src)
print("recomposite max err", err.max(), "mean", err.mean(), "p99.9", np.percentile(err, 99.9))
Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8)).save("recomp.png")
Image.fromarray(np.clip(err.sum(2) * 4, 0, 255).astype(np.uint8)).save("err.png")
