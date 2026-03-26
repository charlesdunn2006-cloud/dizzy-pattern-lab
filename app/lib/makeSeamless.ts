/**
 * Makes an image seamlessly tileable using the classic offset + center-blend technique.
 *
 * How it works:
 * 1. Shift the image by half its width and height (wrapping around)
 *    - This moves the original edges to the center of the image
 *    - The new edges come from the interior of the original (already continuous)
 * 2. Blend a diamond/cross gradient over the center seam area
 *    - This smoothly merges the old edges that are now in the center
 *    - Uses a cosine-based gradient for the smoothest possible transition
 * 3. Result: edges are guaranteed to match because they came from the original interior
 */

export function makeSeamless(sourceImage: HTMLImageElement): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const w = sourceImage.naturalWidth || sourceImage.width;
    const h = sourceImage.naturalHeight || sourceImage.height;
    const halfW = Math.floor(w / 2);
    const halfH = Math.floor(h / 2);

    // Step 1: Create the offset version (shift by half in both axes)
    const offsetCanvas = document.createElement("canvas");
    offsetCanvas.width = w;
    offsetCanvas.height = h;
    const offCtx = offsetCanvas.getContext("2d")!;

    // Draw 4 quadrants shifted
    // Top-left gets bottom-right of original
    offCtx.drawImage(sourceImage, halfW, halfH, w - halfW, h - halfH, 0, 0, w - halfW, h - halfH);
    // Top-right gets bottom-left of original
    offCtx.drawImage(sourceImage, 0, halfH, halfW, h - halfH, w - halfW, 0, halfW, h - halfH);
    // Bottom-left gets top-right of original
    offCtx.drawImage(sourceImage, halfW, 0, w - halfW, halfH, 0, h - halfH, w - halfW, halfH);
    // Bottom-right gets top-left of original
    offCtx.drawImage(sourceImage, 0, 0, halfW, halfH, w - halfW, h - halfH, halfW, halfH);

    // Step 2: Create the blended result
    // We need to blend the original and offset images together
    // The blend mask is strongest at the center (where the offset seams are)
    // and weakest at the edges (where the offset image is clean)
    const resultCanvas = document.createElement("canvas");
    resultCanvas.width = w;
    resultCanvas.height = h;
    const resCtx = resultCanvas.getContext("2d")!;

    // Get pixel data from both
    const origCanvas = document.createElement("canvas");
    origCanvas.width = w;
    origCanvas.height = h;
    const origCtx = origCanvas.getContext("2d")!;
    origCtx.drawImage(sourceImage, 0, 0);

    const origData = origCtx.getImageData(0, 0, w, h);
    const offData = offCtx.getImageData(0, 0, w, h);
    const resultData = resCtx.createImageData(w, h);

    // Blend size — how wide the blend zone is (percentage of image)
    const blendFraction = 0.25; // 25% from each side = 50% total blend zone in center
    const blendW = Math.floor(w * blendFraction);
    const blendH = Math.floor(h * blendFraction);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;

        // Calculate blend weight: how much of the ORIGINAL to use
        // 1.0 = all original, 0.0 = all offset
        // We want original in the center area, offset at the edges
        // Actually reversed: offset image has seams at center, original has seams at edges
        // We want: edges from offset (clean), center from original (clean)

        // Distance from center as 0..1
        const dx = Math.abs(x - halfW) / halfW; // 0 at center, 1 at edge
        const dy = Math.abs(y - halfH) / halfH; // 0 at center, 1 at edge

        // Blend factor: smooth transition
        // At center (dx=0,dy=0): use original (factor=1)
        // At edges (dx=1,dy=1): use offset (factor=0)
        // Use smooth cosine interpolation for each axis
        const fx = dx < (1 - blendFraction * 2) ? 1.0
                 : dx > 1.0 ? 0.0
                 : 0.5 + 0.5 * Math.cos(Math.PI * (dx - (1 - blendFraction * 2)) / (blendFraction * 2));

        const fy = dy < (1 - blendFraction * 2) ? 1.0
                 : dy > 1.0 ? 0.0
                 : 0.5 + 0.5 * Math.cos(Math.PI * (dy - (1 - blendFraction * 2)) / (blendFraction * 2));

        // Combine both axes — use minimum so corners blend properly
        const factor = fx * fy;

        // Blend pixels
        resultData.data[idx]     = Math.round(origData.data[idx]     * factor + offData.data[idx]     * (1 - factor));
        resultData.data[idx + 1] = Math.round(origData.data[idx + 1] * factor + offData.data[idx + 1] * (1 - factor));
        resultData.data[idx + 2] = Math.round(origData.data[idx + 2] * factor + offData.data[idx + 2] * (1 - factor));
        resultData.data[idx + 3] = 255;
      }
    }

    resCtx.putImageData(resultData, 0, 0);

    // Convert canvas to image
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = resultCanvas.toDataURL("image/png");
  });
}
