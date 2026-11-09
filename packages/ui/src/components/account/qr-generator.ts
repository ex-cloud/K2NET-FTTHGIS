// Minimal, self-contained QR Code Generator (ISO/IEC 18004 compliant)
// Supports byte-mode encoding for OTPAuth URIs (Version 1-8, Error Correction Level L)
// Zero external dependencies, pure TypeScript.

const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gmult(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
}

function rsGenPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gmult(poly[j], EXP_TABLE[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data: Uint8Array, poly: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length + poly.length - 1);
  result.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = result[i];
    if (coef !== 0) {
      for (let j = 0; j < poly.length; j++) {
        result[i + j] ^= gmult(poly[j], coef);
      }
    }
  }
  return result.slice(data.length);
}

interface VersionSpec {
  version: number;
  totalCodewords: number;
  dataCodewords: number;
  ecCodewordsPerBlock: number;
  numBlocksGroup1: number;
  dataCodewordsBlockGroup1: number;
  numBlocksGroup2: number;
  dataCodewordsBlockGroup2: number;
  alignmentPositions: number[];
}

const VERSION_SPECS: VersionSpec[] = [
  // v1
  { version: 1, totalCodewords: 26, dataCodewords: 19, ecCodewordsPerBlock: 7, numBlocksGroup1: 1, dataCodewordsBlockGroup1: 19, numBlocksGroup2: 0, dataCodewordsBlockGroup2: 0, alignmentPositions: [] },
  // v2
  { version: 2, totalCodewords: 44, dataCodewords: 34, ecCodewordsPerBlock: 10, numBlocksGroup1: 1, dataCodewordsBlockGroup1: 34, numBlocksGroup2: 0, dataCodewordsBlockGroup2: 0, alignmentPositions: [6, 18] },
  // v3
  { version: 3, totalCodewords: 70, dataCodewords: 55, ecCodewordsPerBlock: 15, numBlocksGroup1: 1, dataCodewordsBlockGroup1: 55, numBlocksGroup2: 0, dataCodewordsBlockGroup2: 0, alignmentPositions: [6, 22] },
  // v4
  { version: 4, totalCodewords: 100, dataCodewords: 80, ecCodewordsPerBlock: 20, numBlocksGroup1: 1, dataCodewordsBlockGroup1: 80, numBlocksGroup2: 0, dataCodewordsBlockGroup2: 0, alignmentPositions: [6, 26] },
  // v5
  { version: 5, totalCodewords: 134, dataCodewords: 108, ecCodewordsPerBlock: 26, numBlocksGroup1: 1, dataCodewordsBlockGroup1: 108, numBlocksGroup2: 0, dataCodewordsBlockGroup2: 0, alignmentPositions: [6, 30] },
  // v6
  { version: 6, totalCodewords: 172, dataCodewords: 136, ecCodewordsPerBlock: 18, numBlocksGroup1: 2, dataCodewordsBlockGroup1: 68, numBlocksGroup2: 0, dataCodewordsBlockGroup2: 0, alignmentPositions: [6, 34] },
  // v7
  { version: 7, totalCodewords: 196, dataCodewords: 156, ecCodewordsPerBlock: 20, numBlocksGroup1: 2, dataCodewordsBlockGroup1: 78, numBlocksGroup2: 0, dataCodewordsBlockGroup2: 0, alignmentPositions: [6, 22, 38] },
  // v8
  { version: 8, totalCodewords: 242, dataCodewords: 194, ecCodewordsPerBlock: 24, numBlocksGroup1: 2, dataCodewordsBlockGroup1: 97, numBlocksGroup2: 0, dataCodewordsBlockGroup2: 0, alignmentPositions: [6, 24, 42] },
];

export function generateQrMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(text);

  // Find smallest version that fits
  let spec: VersionSpec | undefined;
  for (const s of VERSION_SPECS) {
    // Byte mode overhead: 4 bits mode + 8 bits length count (versions 1-9) + 4 bits terminator = 16 bits = 2 bytes minimum
    if (s.dataCodewords >= rawBytes.length + 3) {
      spec = s;
      break;
    }
  }

  if (!spec) {
    spec = VERSION_SPECS[VERSION_SPECS.length - 1];
  }

  // 1. Bit buffer construction (Byte mode = 0100)
  const bits: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  // Mode indicator: 0100 for Byte
  pushBits(0b0100, 4);
  // Character count indicator (8 bits for v1-9)
  pushBits(rawBytes.length, 8);
  // Data bytes
  for (let i = 0; i < rawBytes.length; i++) {
    pushBits(rawBytes[i], 8);
  }
  // Terminator (up to 4 zeroes)
  const totalDataBits = spec.dataCodewords * 8;
  const termLen = Math.min(4, totalDataBits - bits.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad with alternating 0xEC and 0x11
  let padByte = 0xec;
  while (bits.length < totalDataBits) {
    pushBits(padByte, 8);
    padByte = padByte === 0xec ? 0x11 : 0xec;
  }

  // Convert bits to byte array
  const dataBytes = new Uint8Array(spec.dataCodewords);
  for (let i = 0; i < spec.dataCodewords; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataBytes[i] = b;
  }

  // 2. Block division and Reed-Solomon calculation
  const totalBlocks = spec.numBlocksGroup1 + spec.numBlocksGroup2;
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  const poly = rsGenPoly(spec.ecCodewordsPerBlock);

  let byteOffset = 0;
  for (let i = 0; i < spec.numBlocksGroup1; i++) {
    const blockData = dataBytes.slice(byteOffset, byteOffset + spec.dataCodewordsBlockGroup1);
    byteOffset += spec.dataCodewordsBlockGroup1;
    dataBlocks.push(blockData);
    ecBlocks.push(rsRemainder(blockData, poly));
  }
  for (let i = 0; i < spec.numBlocksGroup2; i++) {
    const blockData = dataBytes.slice(byteOffset, byteOffset + spec.dataCodewordsBlockGroup2);
    byteOffset += spec.dataCodewordsBlockGroup2;
    dataBlocks.push(blockData);
    ecBlocks.push(rsRemainder(blockData, poly));
  }

  // 3. Interleave data codewords then EC codewords
  const interleavedCodewords: number[] = [];
  const maxDataBlockLen = Math.max(spec.dataCodewordsBlockGroup1, spec.dataCodewordsBlockGroup2 || 0);

  for (let i = 0; i < maxDataBlockLen; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      if (i < dataBlocks[b].length) {
        interleavedCodewords.push(dataBlocks[b][i]);
      }
    }
  }

  for (let i = 0; i < spec.ecCodewordsPerBlock; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      interleavedCodewords.push(ecBlocks[b][i]);
    }
  }

  // Final bitstream
  const finalBits: number[] = [];
  for (const cw of interleavedCodewords) {
    for (let i = 7; i >= 0; i--) {
      finalBits.push((cw >> i) & 1);
    }
  }

  // 4. Matrix construction
  const size = 17 + 4 * spec.version;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setFunction(r: number, c: number, val: boolean) {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  }

  // Finder pattern helper
  function drawFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        const isBorder = r === -1 || r === 7 || c === -1 || c === 7;
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        setFunction(nr, nc, !isBorder && (isOuter || isInner));
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Alignment patterns
  if (spec.alignmentPositions.length > 0) {
    const coords = spec.alignmentPositions;
    for (const r of coords) {
      for (const c of coords) {
        // Skip finders
        if (
          (r === 6 && c === 6) ||
          (r === 6 && c === coords[coords.length - 1] && c === size - 7) ||
          (r === coords[coords.length - 1] && r === size - 7 && c === 6)
        ) {
          continue;
        }
        if (isFunction[r][c]) continue;

        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isRing = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            setFunction(r + dr, c + dc, isRing || isCenter);
          }
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setFunction(6, i, i % 2 === 0);
    if (!isFunction[i][6]) setFunction(i, 6, i % 2 === 0);
  }

  // Dark module
  setFunction(4 * spec.version + 9, 8, true);

  // Reserve format information areas
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) setFunction(8, i, false);
    if (!isFunction[i][8]) setFunction(i, 8, false);
  }
  for (let i = size - 8; i < size; i++) {
    if (!isFunction[8][i]) setFunction(8, i, false);
    if (!isFunction[i][8]) setFunction(i, 8, false);
  }

  // Reserve version information areas for versions >= 7
  if (spec.version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = size - 11; j < size - 8; j++) {
        setFunction(i, j, false);
        setFunction(j, i, false);
      }
    }
  }

  // 5. Data placement
  let bitIndex = 0;
  let upwards = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const cols = [right, right - 1];

    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of cols) {
        if (!isFunction[r][c]) {
          const bit = bitIndex < finalBits.length ? finalBits[bitIndex++] : 0;
          // Apply Mask 0: (row + col) % 2 == 0
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = (bit === 1) !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  // 6. Format info for Mask 0, Error Correction Level L
  // Format bit integer for L + Mask 0 is 0x77C4 (0b111011111000100) per ISO/IEC 18004
  const formatInfo = 0x77c4;

  // Vertical placement referencing modules[i][8] (canonical ISO 18004 / qrcode.js layout)
  for (let i = 0; i < 15; i++) {
    const mod = ((formatInfo >> i) & 1) === 1;
    if (i < 6) {
      matrix[i][8] = mod;
    } else if (i < 8) {
      matrix[i + 1][8] = mod;
    } else {
      matrix[size - 15 + i][8] = mod;
    }
  }

  // Horizontal placement referencing modules[8][j]
  for (let i = 0; i < 15; i++) {
    const mod = ((formatInfo >> i) & 1) === 1;
    if (i < 8) {
      matrix[8][size - i - 1] = mod;
    } else if (i < 9) {
      matrix[8][15 - i - 1 + 1] = mod;
    } else {
      matrix[8][15 - i - 1] = mod;
    }
  }

  // 7. Version information for versions >= 7 (BCH 18,6 code)
  if (spec.version >= 7) {
    const VERSION_BCH: Record<number, number> = {
      7: 0x07c94,
      8: 0x085bc,
      9: 0x09a99,
      10: 0x0a4d3,
    };
    const vInfo = VERSION_BCH[spec.version] || 0x07c94;
    for (let i = 0; i < 18; i++) {
      const mod = ((vInfo >> i) & 1) === 1;
      const r = Math.floor(i / 3);
      const c = size - 11 + (i % 3);
      matrix[r][c] = mod;
      matrix[c][r] = mod;
    }
  }

  // Ensure dark module is dark
  matrix[size - 8][8] = true;

  return matrix.map((row) => row.map((cell) => Boolean(cell)));
}

