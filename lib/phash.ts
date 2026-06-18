/**
 * Lightweight perceptual hash (average hash / aHash) computed in the browser.
 * Downscales to 8x8 grayscale, then sets each bit to 1 where the pixel is
 * brighter than the frame's average. Returns a 16-char hex string.
 *
 * This catches "same photo re-uploaded" — the second half of the integrity
 * guard (the first half being the unique QR verification code).
 */
export function averageHashFromCanvas(source: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement): string {
  const size = 8;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(source, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const gray: number[] = [];
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray.push(g);
    sum += g;
  }
  const avg = sum / gray.length;

  let bits = "";
  for (const g of gray) bits += g >= avg ? "1" : "0";

  // pack 64 bits into 16 hex chars
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}
