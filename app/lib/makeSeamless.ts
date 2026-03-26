/**
 * Makes an image seamlessly tileable using symmetric edge blending.
 *
 * How it works:
 * For each edge pair (left↔right, top↔bottom), pixels within the blend zone
 * are averaged with their opposite-edge counterpart using a smoothstep curve.
 *
 * At the very edge (x=0): pixel = 50% left + 50% right → identical on both sides
 * At the blend boundary: pixel = 100% original → no visible modification
 * Smoothstep interpolation ensures no hard transition lines.
 *
 * This GUARANTEES pixel[0] === pixel[w-1] and pixel[y=0] === pixel[y=h-1]
 * because both edges are blended to the exact same averaged value.
 * Image stays the same size — no cropping.
 */

export function makeSeamless(sourceImage: HTMLImageElement, blendPercent = 0.05): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const w = sourceImage.naturalWidth || sourceImage.width;
    const h = sourceImage.naturalHeight || sourceImage.height;

    // Draw source to canvas
    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = w;
    srcCanvas.height = h;
    const srcCtx = srcCanvas.getContext("2d")!;
    srcCtx.drawImage(sourceImage, 0, 0, w, h);
    const srcData = srcCtx.getImageData(0, 0, w, h);

    // Pass 1: Blend horizontal edges (left ↔ right)
    const hBlendW = Math.floor(w * blendPercent);
    const pass1 = new ImageData(new Uint8ClampedArray(srcData.data), w, h);

    for (let y = 0; y < h; y++) {
      for (let i = 0; i < hBlendW; i++) {
        // Smoothstep: 0 at edge, 1 at blend boundary
        const t = i / hBlendW;
        const smooth = t * t * (3 - 2 * t);
        // blend goes from 0.5 (equal mix at edge) to 1.0 (all original at boundary)
        const keepOriginal = 0.5 + 0.5 * smooth;
        const useOpposite = 1.0 - keepOriginal;

        const leftX = i;
        const rightX = w - 1 - i;

        const leftIdx = (y * w + leftX) * 4;
        const rightIdx = (y * w + rightX) * 4;

        const origLeftR = srcData.data[leftIdx];
        const origLeftG = srcData.data[leftIdx + 1];
        const origLeftB = srcData.data[leftIdx + 2];

        const origRightR = srcData.data[rightIdx];
        const origRightG = srcData.data[rightIdx + 1];
        const origRightB = srcData.data[rightIdx + 2];

        // Left pixel: blend toward right
        pass1.data[leftIdx] = Math.round(origLeftR * keepOriginal + origRightR * useOpposite);
        pass1.data[leftIdx + 1] = Math.round(origLeftG * keepOriginal + origRightG * useOpposite);
        pass1.data[leftIdx + 2] = Math.round(origLeftB * keepOriginal + origRightB * useOpposite);
        pass1.data[leftIdx + 3] = 255;

        // Right pixel: blend toward left (mirror — same weights, swapped sources)
        pass1.data[rightIdx] = Math.round(origRightR * keepOriginal + origLeftR * useOpposite);
        pass1.data[rightIdx + 1] = Math.round(origRightG * keepOriginal + origLeftG * useOpposite);
        pass1.data[rightIdx + 2] = Math.round(origRightB * keepOriginal + origLeftB * useOpposite);
        pass1.data[rightIdx + 3] = 255;
      }
    }

    // Pass 2: Blend vertical edges (top ↔ bottom) on the h-blended result
    const vBlendH = Math.floor(h * blendPercent);
    const pass2 = new ImageData(new Uint8ClampedArray(pass1.data), w, h);

    for (let x = 0; x < w; x++) {
      for (let i = 0; i < vBlendH; i++) {
        const t = i / vBlendH;
        const smooth = t * t * (3 - 2 * t);
        const keepOriginal = 0.5 + 0.5 * smooth;
        const useOpposite = 1.0 - keepOriginal;

        const topY = i;
        const bottomY = h - 1 - i;

        const topIdx = (topY * w + x) * 4;
        const bottomIdx = (bottomY * w + x) * 4;

        const origTopR = pass1.data[topIdx];
        const origTopG = pass1.data[topIdx + 1];
        const origTopB = pass1.data[topIdx + 2];

        const origBottomR = pass1.data[bottomIdx];
        const origBottomG = pass1.data[bottomIdx + 1];
        const origBottomB = pass1.data[bottomIdx + 2];

        // Top pixel
        pass2.data[topIdx] = Math.round(origTopR * keepOriginal + origBottomR * useOpposite);
        pass2.data[topIdx + 1] = Math.round(origTopG * keepOriginal + origBottomG * useOpposite);
        pass2.data[topIdx + 2] = Math.round(origTopB * keepOriginal + origBottomB * useOpposite);
        pass2.data[topIdx + 3] = 255;

        // Bottom pixel
        pass2.data[bottomIdx] = Math.round(origBottomR * keepOriginal + origTopR * useOpposite);
        pass2.data[bottomIdx + 1] = Math.round(origBottomG * keepOriginal + origTopG * useOpposite);
        pass2.data[bottomIdx + 2] = Math.round(origBottomB * keepOriginal + origTopB * useOpposite);
        pass2.data[bottomIdx + 3] = 255;
      }
    }

    // Write result
    const resultCanvas = document.createElement("canvas");
    resultCanvas.width = w;
    resultCanvas.height = h;
    const resCtx = resultCanvas.getContext("2d")!;
    resCtx.putImageData(pass2, 0, 0);

    const img = new Image();
    img.onload = () => resolve(img);
    img.src = resultCanvas.toDataURL("image/png");
  });
}
// force rebuild
