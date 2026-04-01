/**
 * Makes an image seamlessly tileable using single-pass edge-to-edge blending.
 *
 * When tiling, the seam occurs where x=0 meets x=w-1 (and y=0 meets y=h-1).
 * To fix it, we blend pixels near the left edge with their counterpart near
 * the right edge, and pixels near the top with their counterpart near the
 * bottom. Both edges converge to the same averaged value at the seam line.
 *
 * Key improvements over the original 5% two-pass approach:
 * - 15% blend zone (~154px on 1024) instead of 5% (~51px)
 * - Single pass with 2D weight mask — corners handled correctly
 * - Cosine interpolation for invisible transition boundaries
 * - Center of image is completely untouched
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

    // Blend zone: 15% of each dimension from each edge
    const blendFrac = 0.15;
    const blendW = Math.floor(w * blendFrac);
    const blendH = Math.floor(h * blendFrac);

    // Build 1D weight arrays: how much to blend with opposite edge.
    // 1 at the very edge (pixel 0 / pixel w-1) → 0 at blend boundary.
    // Cosine falloff for smooth transition.
    const xWeight = new Float32Array(w);
    for (let x = 0; x < blendW; x++) {
      const t = x / blendW; // 0 at edge, 1 at boundary
      const weight = 0.5 * (1 + Math.cos(Math.PI * t)); // 1 → 0
      xWeight[x] = weight;          // left edge
      xWeight[w - 1 - x] = weight;  // right edge
    }

    const yWeight = new Float32Array(h);
    for (let y = 0; y < blendH; y++) {
      const t = y / blendH;
      const weight = 0.5 * (1 + Math.cos(Math.PI * t));
      yWeight[y] = weight;          // top edge
      yWeight[h - 1 - y] = weight;  // bottom edge
    }

    // Result starts as a copy of the original
    const result = new ImageData(new Uint8ClampedArray(src.data), w, h);

    // For each pixel near an edge, blend with the opposite-edge counterpart.
    //
    // Horizontal seam fix: pixel at x blends with pixel at (w - 1 - x)
    //   At x=0: 50/50 mix with x=w-1 → both edges become identical
    //   At x=blendW: 100% original → no modification
    //
    // Vertical seam fix: pixel at y blends with pixel at (h - 1 - y)
    //   Same logic for top↔bottom
    //
    // For corners (both xWeight and yWeight > 0), we combine both blends:
    //   We compute the horizontal blend and vertical blend independently,
    //   then combine using the 2D weight = 1 - (1-xw)*(1-yw) which ensures
    //   corners get enough blending without double-blending artifacts.

    for (let y = 0; y < h; y++) {
      const yw = yWeight[y];
      const mirrorY = h - 1 - y;

      for (let x = 0; x < w; x++) {
        const xw = xWeight[x];
        if (xw === 0 && yw === 0) continue; // center pixel — skip

        const mirrorX = w - 1 - x;
        const idx = (y * w + x) * 4;

        // Get original pixel
        const origR = src.data[idx];
        const origG = src.data[idx + 1];
        const origB = src.data[idx + 2];

        let blendedR = origR;
        let blendedG = origG;
        let blendedB = origB;

        if (xw > 0 && yw === 0) {
          // Only near a horizontal edge — blend left↔right
          const oppIdx = (y * w + mirrorX) * 4;
          const alpha = xw * 0.5; // max 50% blend at the seam
          blendedR = Math.round(origR * (1 - alpha) + src.data[oppIdx] * alpha);
          blendedG = Math.round(origG * (1 - alpha) + src.data[oppIdx + 1] * alpha);
          blendedB = Math.round(origB * (1 - alpha) + src.data[oppIdx + 2] * alpha);
        } else if (yw > 0 && xw === 0) {
          // Only near a vertical edge — blend top↔bottom
          const oppIdx = (mirrorY * w + x) * 4;
          const alpha = yw * 0.5;
          blendedR = Math.round(origR * (1 - alpha) + src.data[oppIdx] * alpha);
          blendedG = Math.round(origG * (1 - alpha) + src.data[oppIdx + 1] * alpha);
          blendedB = Math.round(origB * (1 - alpha) + src.data[oppIdx + 2] * alpha);
        } else {
          // Corner region: both edges need blending
          // Blend with horizontal opposite
          const hOppIdx = (y * w + mirrorX) * 4;
          const hAlpha = xw * 0.5;
          const hR = origR * (1 - hAlpha) + src.data[hOppIdx] * hAlpha;
          const hG = origG * (1 - hAlpha) + src.data[hOppIdx + 1] * hAlpha;
          const hB = origB * (1 - hAlpha) + src.data[hOppIdx + 2] * hAlpha;

          // Blend with vertical opposite
          const vOppIdx = (mirrorY * w + x) * 4;
          const vAlpha = yw * 0.5;
          const vR = origR * (1 - vAlpha) + src.data[vOppIdx] * vAlpha;
          const vG = origG * (1 - vAlpha) + src.data[vOppIdx + 1] * vAlpha;
          const vB = origB * (1 - vAlpha) + src.data[vOppIdx + 2] * vAlpha;

          // Also blend with the diagonal opposite (corner counterpart)
          const dOppIdx = (mirrorY * w + mirrorX) * 4;
          const dAlpha = Math.min(xw, yw) * 0.5;
          const dR = origR * (1 - dAlpha) + src.data[dOppIdx] * dAlpha;
          const dG = origG * (1 - dAlpha) + src.data[dOppIdx + 1] * dAlpha;
          const dB = origB * (1 - dAlpha) + src.data[dOppIdx + 2] * dAlpha;

          // Weighted average of the three blend directions
          const totalW = xw + yw + Math.min(xw, yw);
          const wH = xw / totalW;
          const wV = yw / totalW;
          const wD = Math.min(xw, yw) / totalW;

          blendedR = Math.round(hR * wH + vR * wV + dR * wD);
          blendedG = Math.round(hG * wH + vG * wV + dG * wD);
          blendedB = Math.round(hB * wH + vB * wV + dB * wD);
        }

        result.data[idx] = blendedR;
        result.data[idx + 1] = blendedG;
        result.data[idx + 2] = blendedB;
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
