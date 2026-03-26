/**
 * Makes an image seamlessly tileable using the alpha-gradient overlap technique.
 *
 * Based on the img2texture algorithm (MIT license, Artёm iG):
 * 1. Take the right edge stripe of the image
 * 2. Apply an alpha gradient (opaque→transparent from right to left)
 * 3. Composite it over the LEFT side of the image
 * 4. Crop off the right stripe — now left edge = right edge perfectly
 * 5. Repeat for top/bottom edges
 *
 * The result is a slightly smaller image where opposite edges match
 * perfectly because they are gradient-blended copies of each other.
 */

export function makeSeamless(sourceImage: HTMLImageElement, overlap = 0.25): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const w = sourceImage.naturalWidth || sourceImage.width;
    const h = sourceImage.naturalHeight || sourceImage.height;

    // Step 1: Make horizontal edges seamless
    const hResult = makeSeamlessH(sourceImage, w, h, overlap);

    // Step 2: Make vertical edges seamless on the h-result
    const newW = hResult.width;
    const newH = hResult.height;
    const vResult = makeSeamlessV(hResult, newW, newH, overlap);

    // Convert to HTMLImageElement
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = vResult.toDataURL("image/png");
  });
}

function makeSeamlessH(
  source: HTMLImageElement | HTMLCanvasElement,
  w: number,
  h: number,
  overlap: number
): HTMLCanvasElement {
  const stripeW = Math.floor(w * overlap);
  if (stripeW < 1) return canvasFromSource(source, w, h);

  // Draw source onto a canvas
  const srcCanvas = canvasFromSource(source, w, h);
  const srcCtx = srcCanvas.getContext("2d")!;
  const srcData = srcCtx.getImageData(0, 0, w, h);

  // Create the right stripe with alpha gradient
  // The gradient goes: left side = transparent (0), right side = opaque (255)
  // We paste this OVER the left side of the image
  // This means: at the left edge of the stripe, original pixels show through
  //             at the right edge of the stripe, the copied pixels dominate
  // After cropping the right stripe off, left edge will match right edge
  const resultCanvas = document.createElement("canvas");
  const newW = w - stripeW;
  resultCanvas.width = newW;
  resultCanvas.height = h;
  const resCtx = resultCanvas.getContext("2d")!;

  // Start with the source image data (we'll only keep 0..newW)
  const resultData = resCtx.createImageData(newW, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < newW; x++) {
      const dstIdx = (y * newW + x) * 4;
      const srcIdx = (y * w + x) * 4;

      // Base pixel from source
      let r = srcData.data[srcIdx];
      let g = srcData.data[srcIdx + 1];
      let b = srcData.data[srcIdx + 2];

      // If this pixel is within the stripe zone (0..stripeW), blend with right edge
      if (x < stripeW) {
        // Alpha: 0 at x=0 (keep original), 1 at x=stripeW-1 (use right-edge pixel)
        // Actually reversed: right stripe pixel should be strong at LEFT edge
        // so when we tile, the rightmost column of the cropped image matches
        // the leftmost column because it's a blend of the same data

        // Right edge stripe pixel: from (w - stripeW + x, y)
        const rightX = w - stripeW + x;
        const rightIdx = (y * w + rightX) * 4;
        const rR = srcData.data[rightIdx];
        const rG = srcData.data[rightIdx + 1];
        const rB = srcData.data[rightIdx + 2];

        // Alpha gradient: 1.0 at x=0 (use right stripe), 0.0 at x=stripeW (use original)
        // This means at x=0, we see the right edge pixel (which will also be the
        // pixel at position w-stripeW when tiled) — creating continuity
        const alpha = 1.0 - (x / stripeW);

        r = Math.round(rR * alpha + r * (1 - alpha));
        g = Math.round(rG * alpha + g * (1 - alpha));
        b = Math.round(rB * alpha + b * (1 - alpha));
      }

      resultData.data[dstIdx] = r;
      resultData.data[dstIdx + 1] = g;
      resultData.data[dstIdx + 2] = b;
      resultData.data[dstIdx + 3] = 255;
    }
  }

  resCtx.putImageData(resultData, 0, 0);
  return resultCanvas;
}

function makeSeamlessV(
  source: HTMLCanvasElement,
  w: number,
  h: number,
  overlap: number
): HTMLCanvasElement {
  const stripeH = Math.floor(h * overlap);
  if (stripeH < 1) return source;

  const srcCtx = source.getContext("2d")!;
  const srcData = srcCtx.getImageData(0, 0, w, h);

  const newH = h - stripeH;
  const resultCanvas = document.createElement("canvas");
  resultCanvas.width = w;
  resultCanvas.height = newH;
  const resCtx = resultCanvas.getContext("2d")!;
  const resultData = resCtx.createImageData(w, newH);

  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < w; x++) {
      const dstIdx = (y * w + x) * 4;
      const srcIdx = (y * w + x) * 4;

      let r = srcData.data[srcIdx];
      let g = srcData.data[srcIdx + 1];
      let b = srcData.data[srcIdx + 2];

      // If within the top stripe zone, blend with bottom edge
      if (y < stripeH) {
        const bottomY = h - stripeH + y;
        const bottomIdx = (bottomY * w + x) * 4;
        const bR = srcData.data[bottomIdx];
        const bG = srcData.data[bottomIdx + 1];
        const bB = srcData.data[bottomIdx + 2];

        // Alpha: 1.0 at y=0 (use bottom pixel), 0.0 at y=stripeH (use original)
        const alpha = 1.0 - (y / stripeH);

        r = Math.round(bR * alpha + r * (1 - alpha));
        g = Math.round(bG * alpha + g * (1 - alpha));
        b = Math.round(bB * alpha + b * (1 - alpha));
      }

      resultData.data[dstIdx] = r;
      resultData.data[dstIdx + 1] = g;
      resultData.data[dstIdx + 2] = b;
      resultData.data[dstIdx + 3] = 255;
    }
  }

  resCtx.putImageData(resultData, 0, 0);
  return resultCanvas;
}

function canvasFromSource(
  source: HTMLImageElement | HTMLCanvasElement,
  w: number,
  h: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}
