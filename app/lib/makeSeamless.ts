/**
 * Makes an image seamlessly tileable using single-pass 2D edge blending.
 *
 * Improvements over the original 5% two-pass approach:
 *
 * 1. WIDER BLEND ZONE (25%) — On a 1024px image, this blends ~256px on
 *    each edge instead of ~51px, giving much more room to hide transitions.
 *
 * 2. SINGLE-PASS 2D MASK — Instead of blending horizontal then vertical
 *    (which double-blends corners and creates muddy patches), we compute
 *    a single 2D weight for every pixel. The weight is based on its distance
 *    from the nearest edge using a cosine falloff, and we blend with the
 *    wrap-around counterpart pixel in one pass.
 *
 * 3. COSINE INTERPOLATION — Smoother than smoothstep, zero-derivative
 *    at both ends so the transition is invisible.
 *
 * The center of the image is untouched (weight = 0, no blending).
 * Only pixels near edges get blended with their wrap-around counterparts.
 */

export function makeSeamless(sourceImage: HTMLImageElement): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const w = sourceImage.naturalWidth || sourceImage.width;
    const h = sourceImage.naturalHeight || sourceImage.height;

    // Draw source to canvas
    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = w;
    srcCanvas.height = h;
    const srcCtx = srcCanvas.getContext("2d")!;
    srcCtx.drawImage(sourceImage, 0, 0, w, h);
    const src = srcCtx.getImageData(0, 0, w, h);

    // Blend zone: 25% of each dimension from each edge
    const blendFrac = 0.25;
    const blendW = Math.floor(w * blendFrac);
    const blendH = Math.floor(h * blendFrac);

    // Build 1D weight arrays for each axis.
    // Weight = 1 at edge (full blend with opposite side), 0 outside blend zone.
    // Cosine falloff for smooth transition.
    const xWeight = new Float32Array(w);
    for (let x = 0; x < w; x++) {
      const distFromEdge = Math.min(x, w - 1 - x);
      if (distFromEdge < blendW) {
        // Cosine: 1 at edge → 0 at blend boundary
        const t = distFromEdge / blendW; // 0 at edge, 1 at boundary
        xWeight[x] = 0.5 * (1 + Math.cos(Math.PI * t)); // 1 → 0
      }
      // else 0 (default)
    }

    const yWeight = new Float32Array(h);
    for (let y = 0; y < h; y++) {
      const distFromEdge = Math.min(y, h - 1 - y);
      if (distFromEdge < blendH) {
        const t = distFromEdge / blendH;
        yWeight[y] = 0.5 * (1 + Math.cos(Math.PI * t));
      }
    }

    // Single-pass blend.
    // For each pixel, compute a 2D blend weight from the x and y weights.
    // Then blend with the wrap-around counterpart:
    //   wrap pixel for (x,y) = ((x + w/2) % w, (y + h/2) % h)
    //
    // We use max(xWeight, yWeight) rather than multiply to avoid
    // under-blending corners. Corners need the MOST blending (they're
    // near two edges), so taking the max ensures they get enough.
    const halfW = Math.floor(w / 2);
    const halfH = Math.floor(h / 2);

    const result = new ImageData(new Uint8ClampedArray(src.data), w, h);

    for (let y = 0; y < h; y++) {
      const yw = yWeight[y];
      const wrapY = (y + halfH) % h;

      for (let x = 0; x < w; x++) {
        const xw = xWeight[x];
        if (xw === 0 && yw === 0) continue; // center — skip

        // Combine: use max so corners get strong blending
        const blend = Math.max(xw, yw);
        // Scale down to 50% max blend strength to preserve pattern detail
        // At the very edge pixel, blend = 1, so actual mix = 0.5 (50/50 with opposite)
        const alpha = blend * 0.5;
        const keep = 1 - alpha;

        const wrapX = (x + halfW) % w;

        const idx = (y * w + x) * 4;
        const wrapIdx = (wrapY * w + wrapX) * 4;

        result.data[idx] = Math.round(src.data[idx] * keep + src.data[wrapIdx] * alpha);
        result.data[idx + 1] = Math.round(src.data[idx + 1] * keep + src.data[wrapIdx + 1] * alpha);
        result.data[idx + 2] = Math.round(src.data[idx + 2] * keep + src.data[wrapIdx + 2] * alpha);
        result.data[idx + 3] = 255;
      }
    }

    // Write result
    const resultCanvas = document.createElement("canvas");
    resultCanvas.width = w;
    resultCanvas.height = h;
    const resCtx = resultCanvas.getContext("2d")!;
    resCtx.putImageData(result, 0, 0);

    const img = new Image();
    img.onload = () => resolve(img);
    img.src = resultCanvas.toDataURL("image/png");
  });
}
