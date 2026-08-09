import { inflateSync } from 'node:zlib';

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

export function decodePng(png) {
  let offset = 8, width = 0, height = 0, bitDepth = 0, colorType = 0;
  const compressed = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const chunk = png.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0); height = chunk.readUInt32BE(4);
      bitDepth = chunk[8]; colorType = chunk[9];
    } else if (type === 'IDAT') compressed.push(chunk);
    else if (type === 'IEND') break;
  }
  if (bitDepth !== 8 || ![2, 6].includes(colorType)) {
    throw new Error(`Unsupported PNG format: depth=${bitDepth}, colorType=${colorType}`);
  }
  const channels = colorType === 6 ? 4 : 3;
  const packed = inflateSync(Buffer.concat(compressed));
  const stride = width * channels, decoded = Buffer.alloc(stride * height);
  let source = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = packed[source++];
    for (let x = 0; x < stride; x += 1) {
      const value = packed[source++];
      const left = x >= channels ? decoded[y * stride + x - channels] : 0;
      const up = y ? decoded[(y - 1) * stride + x] : 0;
      const upperLeft = y && x >= channels ? decoded[(y - 1) * stride + x - channels] : 0;
      let result = value;
      if (filter === 1) result += left;
      else if (filter === 2) result += up;
      else if (filter === 3) result += Math.floor((left + up) / 2);
      else if (filter === 4) result += paeth(left, up, upperLeft);
      else if (filter !== 0) throw new Error(`Unsupported PNG filter: ${filter}`);
      decoded[y * stride + x] = result & 255;
    }
  }
  return { width, height, channels, data: decoded };
}

function longestFalseRun(values) {
  let best = { start: -1, end: -1, length: 0 }, start = -1;
  for (let index = 0; index <= values.length; index += 1) {
    if (index < values.length && !values[index]) {
      if (start < 0) start = index;
    } else if (start >= 0) {
      const length = index - start;
      if (length > best.length) best = { start, end: index - 1, length };
      start = -1;
    }
  }
  return best;
}

export function analyzeRgbaCoverage(frame, options = {}) {
  const { width, height, data, channels = 4 } = frame;
  const blackThreshold = options.blackThreshold ?? 12;
  const minRowFraction = options.minRowFraction ?? .025;
  const minColumnFraction = options.minColumnFraction ?? .025;
  const minVerticalSpan = options.minVerticalSpan ?? .92;
  const minHorizontalSpan = options.minHorizontalSpan ?? .92;
  const maxBlankBandFraction = options.maxBlankBandFraction ?? .12;
  if (!width || !height || data.length < width * height * channels) {
    throw new Error('Invalid frame dimensions or pixel data.');
  }
  const rows = new Array(height).fill(0), columns = new Array(width).fill(0);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * channels;
      if (data[at] > blackThreshold || data[at + 1] > blackThreshold || data[at + 2] > blackThreshold) {
        rows[y] += 1; columns[x] += 1;
      }
    }
  }
  const rowFloor = Math.max(4, Math.ceil(width * minRowFraction));
  const columnFloor = Math.max(4, Math.ceil(height * minColumnFraction));
  const occupiedRows = rows.map(count => count >= rowFloor);
  const occupiedColumns = columns.map(count => count >= columnFloor);
  const firstOccupiedRow = occupiedRows.indexOf(true);
  const lastOccupiedRow = occupiedRows.lastIndexOf(true);
  const firstOccupiedColumn = occupiedColumns.indexOf(true);
  const lastOccupiedColumn = occupiedColumns.lastIndexOf(true);
  const verticalSpan = firstOccupiedRow < 0 ? 0 : lastOccupiedRow - firstOccupiedRow + 1;
  const horizontalSpan = firstOccupiedColumn < 0 ? 0 : lastOccupiedColumn - firstOccupiedColumn + 1;
  const longestBlankRows = longestFalseRun(occupiedRows);
  const longestBlankColumns = longestFalseRun(occupiedColumns);
  const result = {
    width, height, blackThreshold, rowFloor, columnFloor,
    firstOccupiedRow, lastOccupiedRow, verticalSpan,
    verticalSpanRatio: verticalSpan / height,
    firstOccupiedColumn, lastOccupiedColumn, horizontalSpan,
    horizontalSpanRatio: horizontalSpan / width,
    longestBlankRows,
    longestBlankRowsRatio: longestBlankRows.length / height,
    longestBlankColumns,
    longestBlankColumnsRatio: longestBlankColumns.length / width,
    rowSamples: [0, .1, .25, .5, .75, .9, 1].map(fraction => {
      const index = Math.min(height - 1, Math.round((height - 1) * fraction));
      return { index, nonBackground: rows[index], ratio: rows[index] / width };
    }),
    columnSamples: [0, .1, .25, .5, .75, .9, 1].map(fraction => {
      const index = Math.min(width - 1, Math.round((width - 1) * fraction));
      return { index, nonBackground: columns[index], ratio: columns[index] / height };
    }),
  };
  result.pass = result.verticalSpanRatio >= minVerticalSpan
    && result.horizontalSpanRatio >= minHorizontalSpan
    && result.longestBlankRowsRatio <= maxBlankBandFraction
    && result.longestBlankColumnsRatio <= maxBlankBandFraction;
  return result;
}

export function analyzePngCoverage(png, options) {
  return analyzeRgbaCoverage(decodePng(png), options);
}
