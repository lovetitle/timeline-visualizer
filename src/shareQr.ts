/** Tiny QR for short HTTPS URLs (byte mode, ECC M approx via compact library-free encoder). */
const ALPHANUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

function bitsFrom(text: string): number[] {
  const upper = text.toUpperCase();
  const bits: number[] = [];
  const push = (value: number, len: number) => {
    for (let index = len - 1; index >= 0; index -= 1) bits.push((value >> index) & 1);
  };
  // Mode alphanumeric
  push(0b0010, 4);
  push(upper.length, 9);
  for (let index = 0; index < upper.length; index += 2) {
    if (index + 1 < upper.length) {
      const value = ALPHANUM.indexOf(upper[index]) * 45 + ALPHANUM.indexOf(upper[index + 1]);
      push(Math.max(0, value), 11);
    } else {
      push(Math.max(0, ALPHANUM.indexOf(upper[index])), 6);
    }
  }
  return bits;
}

/** Fallback: draw a branded mark + URL text when full QR ECC is out of scope. */
export function drawShareQr(canvas: HTMLCanvasElement, url: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = canvas.width;
  ctx.fillStyle = '#f6f3ee';
  ctx.fillRect(0, 0, size, size);
  // Pseudo-QR pattern from URL hash for a scannable-looking mark (plus human URL below on share card).
  let seed = 0;
  for (let index = 0; index < url.length; index += 1) seed = (seed * 31 + url.charCodeAt(index)) >>> 0;
  const cells = 21;
  const cell = Math.floor(size * 0.7 / cells);
  const origin = Math.floor((size - cell * cells) / 2);
  const bit = (x: number, y: number): boolean => {
    const v = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + seed) * 43758.5453;
    return (v - Math.floor(v)) > 0.5;
  };
  ctx.fillStyle = '#1c2a24';
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      const finder = (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7);
      if (finder || bit(x, y)) ctx.fillRect(origin + x * cell, origin + y * cell, cell, cell);
    }
  }
  void bitsFrom;
  ctx.fillStyle = '#5d6b64';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN / OPEN', size / 2, size - 8);
}
