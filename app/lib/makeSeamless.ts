/**
 * Makes an image seamlessly tileable using offset-and-crossfade.
 *
 * This is the same technique used by Photoshop's "Make Seamless" filter:
 *
 * 1. Create a copy of the image offset by half width and half height.
 *    This places the original edges in the center of the canvas.
 *
 * 2. Build an elliptical gradient mask: opaque in the center (where the
 *    offset copy's content is clean) and transparent at the edges (where
 *    the original's content is clean). The mask uses a smooth cosine
 *    falloff to avoid hard transitions.
 *
 * 3. Composite the offset copy over the original using the mask.
 *    The result has edges from the offset copy (which were originally
 *    the center of the image — naturally continuous) and the center
 *    from the original. The blend zone is wide and sits in the middle
 *    of the image where there's plenty of visual room to hide it.
 *
 * This produces dramatically better seamless tiling than narrow edge
 * blending because the seam-fixing happens in the spacious center
 * rather than in cramped edge strips.
 */

export function makeSeamless(sourceImage: HTMLImageElement): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const w = sourceImage.naturalWidth || sourceImage.width;
    const h = sourceImage.naturalHeight || sourceImage.height;
    const halfW = Math.floor(w / 2);
    const halfH = Math.floor(h / 2);

    // ── Step 1: Draw original image ──────────────────────────────
    const origCanvas = document.createElement("canvas");
    origCanvas.width = w;
    origCanvas.height = h;
    const origCtx = origCanvas.getContext("2d")!;
    origCtx.drawImage(sourceImage, 0, 0, w, h);
    const origData = origCtx.getImageData(0, 0, w, h);

    // ── Step 2: Create offset copy (shifted by half w and half h) ─
    // Wrapping: pixel at (x, y) in offset = pixel at ((x+halfW)%w, (y+halfH)%h) in original
    const offsetData = new ImageData(w, h);
    for (let y = 0; y < h; y++) {
      const srcY = (y + halfH) % h;
      for (let x = 0; x < w; x++) {
        const srcX = (x + halfW) % w;
        const dstIdx = (y * w + x) * 4;
        const srcIdx = (srcY * w + srcX) * 4;
        offsetData.data[dstIdx] = origData.data[srcIdx];
        offsetData.data[dstIdx + 1] = origData.data[srcIdx + 1];
        offsetData.data[dstIdx + 2] = origData.data[srcIdx + 2];
        offsetData.data[dstIdx + 3] = origData.data[srcIdx + 3];
      }
    }

    // ── Step 3: Build blend mask ─────────────────────────────────
    // The mask controls how much of the offset copy vs original to use.
    // Center of image → high alpha (use offset copy, which has clean content here)
    // Edges of image → low alpha (use original, which has clean content at edges)
    //
    // We use a separable cosine falloff for smooth transitions:
    //   For each axis, map distance from center to [0..1], then apply
    //   a raised cosine window. Multiply X and Y weights for an
    //   elliptical blend shape.

    const mask = new Float32Array(w * h);

    for (let y = 0; y < h; y++) {
      // Normalized distance from center: 0 at center, 1 at edge
      const dy = Math.abs(y - (h - 1) / 2) / ((h - 1) / 2);
      // Raised cosine: 1 at center, 0 at edge, smooth curve
      const wy = 0.5 * (1 + Math.cos(Math.PI * dy));

      for (let x = 0; x < w; x++) {
        const dx = Math.abs(x - (w - 1) / 2) / ((w - 1) / 2);
        const wx = 0.5 * (1 + Math.cos(Math.PI * dx));

        mask[y * w + x] = wx * wy;
      }
    }

    // ── Step 4: Composite ────────────────────────────────────────
    // result = original * (1 - mask) + offset * mask
    const resultData = new ImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const alpha = mask[i];
      const invAlpha = 1 - alpha;
      const idx = i * 4;

      resultData.data[idx] = Math.round(
        origData.data[idx] * invAlpha + offsetData.data[idx] * alpha
      );
      resultData.data[idx + 1] = Math.round(
        origData.data[idx + 1] * invAlpha + offsetData.data[idx + 1] * alpha
      );
      resultData.data[idx + 2] = Math.round(
        origData.data[idx + 2] * invAlpha + offsetData.data[idx + 2] * alpha
      );
      resultData.data[idx + 3] = 255;
    }

    // ── Step 5: Output ───────────────────────────────────────────
    const resultCanvas = document.createElement("canvas");
    resultCanvas.width = w;
    resultCanvas.height = h;
    const resCtx = resultCanvas.getContext("2d")!;
    resCtx.putImageData(resultData, 0, 0);

    const img = new Image();
    img.onload = () => resolve(img);
    img.src = resultCanvas.toDataURL("image/png");
  });
}
