"use strict";

// Defensive allocation limits, not measured limits of any phone or browser.
const LIMITS = Object.freeze({
  inputBytes: 128 * 1024 * 1024,
  zipEntries: 512,
  expandedBytes: 256 * 1024 * 1024,
  entryBytes: 128 * 1024 * 1024,
  textBytes: 2 * 1024 * 1024,
  expansionRatio: 100,
  wadLumps: 131072,
  reportedNames: 96,
  reportedDuplicates: 24,
  reportedSignals: 32,
});
const EXECUTABLE_EXTENSIONS = new Set([
  "exe",
  "com",
  "bat",
  "cmd",
  "js",
  "mjs",
  "cjs",
  "html",
  "htm",
  "svg",
  "msi",
  "scr",
  "ps1",
  "vbs",
  "jar",
]);
const DOCUMENT_EXTENSIONS = new Set([
  "txt",
  "md",
  "nfo",
  "rtf",
  "pdf",
  "doc",
  "docx",
  "html",
  "htm",
]);
const NESTED_ARCHIVE_EXTENSIONS = new Set([
  "zip",
  "7z",
  "rar",
  "tar",
  "gz",
  "bz2",
  "xz",
]);
const ADVANCED_MARKERS = new Set([
  "BEHAVIOR",
  "SCRIPTS",
  "DECORATE",
  "ZSCRIPT",
  "MAPINFO",
  "ZMAPINFO",
  "TEXTMAP",
  "ENDMAP",
  "LOADACS",
  "ANIMDEFS",
  "SNDINFO",
  "DECALDEF",
  "GL_VERT",
  "GL_SEGS",
  "GL_SSECT",
  "GL_NODES",
  "ZNODES",
]);
const UNSUPPORTED_MAP_MARKERS = new Set([
  "BEHAVIOR",
  "SCRIPTS",
  "DECORATE",
  "ZSCRIPT",
  "MAPINFO",
  "ZMAPINFO",
  "TEXTMAP",
  "ENDMAP",
  "LOADACS",
  "ANIMDEFS",
  "SNDINFO",
  "DECALDEF",
  "ZNODES",
  "ANIMATED",
  "SWITCHES",
  "DEHEXTRA",
  "MBF21",
]);
const decoderUtf8 = new TextDecoder("utf-8", { fatal: false }),
  decoderLegacy = new TextDecoder("windows-1252", { fatal: false });

class InspectionError extends Error {
  constructor(code, message, stage = "inspect") {
    super(message);
    this.name = "InspectionError";
    this.code = code;
    this.stage = stage;
  }
}

const viewOf = (bytes) =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
const u16 = (view, at) => view.getUint16(at, true);
const u32 = (view, at) => view.getUint32(at, true);
const extension = (name) => {
  const leaf = name.split("/").pop() || "",
    at = leaf.lastIndexOf(".");
  return at < 0 ? "" : leaf.slice(at + 1).toLowerCase();
};
const cleanText = (value, max = 160) =>
  String(value)
    .replace(/[\u0000-\u001f\u007f]/g, "�")
    .slice(0, max);
const cleanFilename = (value) =>
  cleanText(
    String(value).replaceAll("\\", "/").split("/").pop() || "unnamed",
    120,
  );
const hex = (buffer) =>
  Array.from(new Uint8Array(buffer), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
const sha256 = async (bytes) =>
  hex(await crypto.subtle.digest("SHA-256", bytes));

function safeArchivePath(raw) {
  const value = String(raw).replaceAll("\\", "/");
  if (
    !value ||
    /[\u0000-\u001f\u007f:]/.test(value) ||
    value.startsWith("/") ||
    value.length > 240
  )
    throw new InspectionError(
      "zip-path",
      "Archive contains an absolute, ambiguous, empty, or overlong path.",
      "zip-directory",
    );
  const parts = value.split("/");
  if (parts.some((part) => part === ".." || part === "."))
    throw new InspectionError(
      "zip-traversal",
      "Archive path traversal is not allowed.",
      "zip-directory",
    );
  if (
    parts.some(
      (part) =>
        part &&
        (/[. ]$/.test(part) ||
          /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)),
    )
  )
    throw new InspectionError(
      "zip-path",
      "Archive contains an ambiguous or reserved path.",
      "zip-directory",
    );
  return parts.filter(Boolean).join("/").normalize("NFC");
}

const PRIVATE_PERMISSION = Object.freeze({
  status: "private-local-only",
  label: "Private/local only",
  evidence:
    "User-selected local file; redistribution permission is not established.",
});
function permissionFromText(text) {
  const denied =
    /(?:you\s+)?(?:may|must|can)\s+not\s+(?:re)?distribut[eion]*|(?:re)?distribution\s+(?:is\s+)?(?:not\s+(?:allowed|permitted)|prohibited)|(?:do\s+not|no)\s+(?:re)?distribut[eion]*/i.exec(
      text,
    );
  if (denied)
    return {
      status: "redistribution-prohibited",
      label: "Redistribution prohibited",
      evidence: cleanText(
        text.slice(Math.max(0, denied.index - 50), denied.index + 200),
        250,
      ),
    };
  const allowed =
    /(?:you|anyone|authors)\s+(?:may|are permitted to)\s+(?:freely\s+)?(?:re)?distribute\s+(?:this|the)\s+(?:file|package|wad|archive|work|material)|redistribution and use in source and binary forms[\s\S]{0,120}are permitted|permission is hereby granted,?\s+free of charge[\s\S]{0,650}distribute|(?:this|the)\s+(?:work|package|wad|file)[\s\S]{0,100}(?:dedicated to the public domain|licensed under[\s\S]{0,60}(?:CC0|CC-BY(?:-SA)?\s*[1-4]\.0|Creative Commons Attribution))|Creative Commons Zero v1\.0 Universal[\s\S]{0,100}Statement of Purpose/i.exec(
      text,
    );
  return allowed
    ? {
        status: "redistribution-allowed",
        label: "Redistribution allowed by supplied text",
        evidence: cleanText(allowed[0], 300),
        conditions:
          "Preserve and review the complete supplied license and credits.",
      }
    : { ...PRIVATE_PERMISSION };
}

function metadataFromTexts(documents) {
  const text = documents.map((item) => item.text).join("\n"),
    engineRequirements = [],
    requiredFiles = [];
  for (const line of text.split(/\r?\n/)) {
    if (
      /(?:engine|port|requires?|tested\s+(?:with|on)|advanced\s+engine|designed\s+for)\s*[:=]?/i.test(
        line,
      ) &&
      /\b(?:Boom|MBF(?:21)?|ZDoom|GZDoom|UDMF|DSDA[- ]?Doom|PrBoom|Eternity|Chocolate Doom|vanilla)\b/i.test(
        line,
      )
    )
      engineRequirements.push(cleanText(line.trim(), 250));
    if (
      /(?:requires?|other\s+files|additional\s+files|dependencies)\s*[:=]?/i.test(
        line,
      ) &&
      /\.(?:wad|deh|bex)\b/i.test(line)
    )
      requiredFiles.push(cleanText(line.trim(), 250));
  }
  const unsupportedSignals = engineRequirements.filter(
    (line) =>
      /\b(?:Boom|MBF(?:21)?|ZDoom|GZDoom|UDMF|DSDA[- ]?Doom|PrBoom|Eternity)\b/i.test(
        line,
      ) &&
      !/(?:not\s+required|not\s+needed|optional|also\s+(?:works|tested)|tested\s+(?:with|on)|vanilla|Chocolate Doom)/i.test(
        line,
      ),
  );
  const field = (label) =>
    cleanText(
      text
        .match(
          new RegExp("^\\s*" + label + "\\s*[:=]\\s*([^\\r\\n]+)", "im"),
        )?.[1]
        ?.trim() || "",
      300,
    );
  return {
    title: field("Title"),
    author: field("Author(?:s)?"),
    description: field("Description"),
    engineRequirements: [...new Set(engineRequirements)].slice(0, 32),
    requiredFiles: [...new Set(requiredFiles)].slice(0, 32),
    unsupportedSignals,
    permission: permissionFromText(text),
  };
}

function textFromBytes(bytes) {
  if (bytes.length > LIMITS.textBytes) return null;
  // Nonprinting control bytes identify binary data; legacy text remains readable.
  let controls = 0;
  for (const value of bytes)
    if (value === 0 || value < 9 || (value > 13 && value < 32)) controls++;
  if (controls) return null;
  const utf8 = decoderUtf8.decode(bytes);
  return utf8.includes("\ufffd") ? decoderLegacy.decode(bytes) : utf8;
}

function executableBytes(bytes, text) {
  return (
    (bytes[0] === 0x4d && bytes[1] === 0x5a) ||
    (bytes[0] === 0x7f &&
      bytes[1] === 0x45 &&
      bytes[2] === 0x4c &&
      bytes[3] === 0x46) ||
    !!(
      text && /^\s*(?:<!doctype\s+html|<html\b|<script\b|<svg\b|#!)/i.test(text)
    )
  );
}

function parsePatch(text, name) {
  const sections = [...text.matchAll(/^\s*\[([^\]\r\n]+)\]/gm)].map((match) =>
      match[1].toUpperCase(),
    ),
    unsupportedSignals = [];
  if (!/^Patch File for DeHackEd v(?:2\.3|3\.0)\r?\n/.test(text))
    unsupportedSignals.push("Missing Chocolate Doom DeHackEd signature");
  for (const section of sections)
    if (section !== "STRINGS")
      unsupportedSignals.push(`Unsupported BEX section [${section}]`);
  if (
    sections.includes("STRINGS") &&
    !/^\s*#.*\*allow-extended-strings\*/m.test(text)
  )
    unsupportedSignals.push(
      "BEX [STRINGS] requires *allow-extended-strings* comment",
    );
  if (/\b(?:MBF21|DEHEXTRA|DSDHacked|A_[A-Za-z]+|Bits2)\b/i.test(text))
    unsupportedSignals.push("Extended DeHackEd/MBF patch semantics");
  for (const match of text.matchAll(
    /^\s*(Thing|Frame|Sprite|Sound|Ammo|Weapon)\s+(\d+)/gm,
  )) {
    const max = {
      Thing: 138,
      Frame: 966,
      Sprite: 137,
      Sound: 108,
      Ammo: 3,
      Weapon: 8,
    }[match[1]];
    if (Number(match[2]) > max)
      unsupportedSignals.push(`Extended ${match[1]} index ${match[2]}`);
  }
  return {
    name: cleanFilename(name),
    kind: sections.length ? "BEX" : "DEH",
    sections: [...new Set(sections)],
    unsupportedSignals: [...new Set(unsupportedSignals)],
    loadingMethod: "DeHackEd patch (-deh)",
    compatibility: {
      status: unsupportedSignals.length
        ? "unsupported-by-engine"
        : "likely-compatible",
      label: unsupportedSignals.length
        ? "Unsupported by this engine"
        : "Likely compatible",
      targetGame: "unknown",
      recommendedBase: "Choose a compatible IWAD",
      recommendedLoading: "DeHackEd patch (-deh)",
      confidence: "medium",
      evidence: unsupportedSignals.length
        ? unsupportedSignals
        : [
            "Chocolate Doom patch syntax detected; launch validation is still required",
          ],
      unsupportedSignals,
      manualOverride: false,
    },
  };
}

function decodeZipName(bytes, utf8) {
  return (utf8 ? decoderUtf8 : decoderLegacy).decode(bytes);
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function readLumpName(bytes, at) {
  let end = at;
  while (end < at + 8 && bytes[end] !== 0) end += 1;
  return cleanText(
    decoderLegacy.decode(bytes.subarray(at, end)).toUpperCase(),
    8,
  );
}

function wadCompatibility(wad) {
  if (wad.unsupportedSignals.length)
    return {
      status: "unsupported-by-engine",
      label: "Unsupported by this engine",
      targetGame: wad.targetGame,
      recommendedBase: wad.recommendedBase,
      recommendedLoading: wad.loadingMethod,
      confidence: "high",
      evidence: [
        `Detected ${wad.unsupportedSignals.join(", ")}`,
        "Current profile is Chocolate Doom 3.1.1",
      ],
      unsupportedSignals: wad.unsupportedSignals,
      manualOverride: false,
    };
  if (wad.mapStructures.some((map) => !map.complete))
    return {
      status: "manual-recipe-required",
      label: "Manual recipe required",
      targetGame: wad.targetGame,
      recommendedBase: wad.recommendedBase,
      recommendedLoading: wad.loadingMethod,
      confidence: "high",
      evidence: [
        "One or more map directories are incomplete or have invalid record sizes; review map structure before launch",
      ],
      unsupportedSignals: [],
      manualOverride: false,
    };
  if (wad.targetGame === "unknown" || wad.targetGame === "mixed")
    return {
      status: "manual-recipe-required",
      label: "Manual recipe required",
      targetGame: wad.targetGame,
      recommendedBase: "Choose after reviewing documentation",
      recommendedLoading: wad.loadingMethod,
      confidence: "medium",
      evidence: ["No unambiguous Doom or Doom II map family was detected"],
      unsupportedSignals: [],
      manualOverride: false,
    };
  return {
    status: "likely-compatible",
    label: "Likely compatible",
    targetGame: wad.targetGame,
    recommendedBase: wad.recommendedBase,
    recommendedLoading: wad.loadingMethod,
    confidence: "medium",
    evidence: [
      "WAD directory is structurally valid",
      "No definite advanced-port requirement was detected",
      "A launch test has not been performed",
    ],
    unsupportedSignals: [],
    manualOverride: false,
  };
}

async function parseWad(bytes, name, knownHash = null) {
  if (bytes.length < 12)
    throw new InspectionError(
      "wad-header",
      "WAD header is truncated.",
      "wad-header",
    );
  const magic = decoderLegacy.decode(bytes.subarray(0, 4));
  if (magic !== "IWAD" && magic !== "PWAD")
    throw new InspectionError(
      "wad-magic",
      "File bytes do not begin with IWAD or PWAD.",
      "identify",
    );
  const view = viewOf(bytes),
    lumpCount = u32(view, 4),
    directoryOffset = u32(view, 8);
  if (lumpCount > LIMITS.wadLumps)
    throw new InspectionError(
      "wad-lump-limit",
      `WAD declares more than ${LIMITS.wadLumps} lumps.`,
      "wad-directory",
    );
  const directoryBytes = lumpCount * 16,
    directoryEnd = directoryOffset + directoryBytes;
  if (
    !Number.isSafeInteger(directoryEnd) ||
    directoryOffset < 12 ||
    directoryEnd > bytes.length
  )
    throw new InspectionError(
      "wad-directory-bounds",
      "WAD lump directory is outside the file.",
      "wad-directory",
    );
  const names = [],
    ranges = [],
    lumps = [],
    counts = new Map();
  let embeddedDehacked = false,
    spriteNamespace = false,
    graphicsNamespace = false;
  for (let index = 0; index < lumpCount; index++) {
    const at = directoryOffset + index * 16,
      position = u32(view, at),
      size = u32(view, at + 4),
      end = position + size,
      nameValue = readLumpName(bytes, at + 8);
    if (
      position > bytes.length ||
      !Number.isSafeInteger(end) ||
      end > bytes.length ||
      (size > 0 && position < 12)
    )
      throw new InspectionError(
        "wad-lump-bounds",
        `Lump ${index} (${nameValue || "unnamed"}) is outside the data region.`,
        "wad-directory",
      );
    if (size > 0 && position < directoryEnd && end > directoryOffset)
      throw new InspectionError(
        "wad-directory-overlap",
        `Lump ${index} (${nameValue || "unnamed"}) overlaps the WAD directory.`,
        "wad-directory",
      );
    if (size > 0) ranges.push({ start: position, end, index, name: nameValue });
    lumps.push({ name: nameValue, position, size });
    names.push(nameValue);
    counts.set(nameValue, (counts.get(nameValue) || 0) + 1);
    if (nameValue === "DEHACKED") embeddedDehacked = true;
    if (["S_START", "SS_START", "S_END", "SS_END"].includes(nameValue))
      spriteNamespace = true;
    if (
      [
        "P_START",
        "PP_START",
        "P_END",
        "PP_END",
        "F_START",
        "FF_START",
        "F_END",
        "FF_END",
      ].includes(nameValue)
    )
      graphicsNamespace = true;
  }
  ranges.sort((a, b) => a.start - b.start || a.end - b.end);
  for (let index = 1; index < ranges.length; index++)
    if (ranges[index].start < ranges[index - 1].end)
      throw new InspectionError(
        "wad-overlap",
        `Lumps ${ranges[index - 1].name || ranges[index - 1].index} and ${ranges[index].name || ranges[index].index} overlap.`,
        "wad-directory",
      );
  const episodeMaps = [
      ...new Set(names.filter((name) => /^E[1-9]M[1-9]$/.test(name))),
    ],
    doom2Maps = [...new Set(names.filter((name) => /^MAP\d\d$/.test(name)))];
  const advancedSignals = [
    ...new Set(names.filter((name) => ADVANCED_MARKERS.has(name))),
  ].slice(0, LIMITS.reportedSignals);
  const unsupportedSignals = [
    ...new Set(names.filter((name) => UNSUPPORTED_MAP_MARKERS.has(name))),
  ].slice(0, LIMITS.reportedSignals);
  const mapStructures = [],
    embeddedPatches = [];
  for (let index = 0; index < lumps.length; index++) {
    const lump = lumps[index];
    if (lump.name === "DEHACKED") {
      const text = textFromBytes(
        bytes.subarray(lump.position, lump.position + lump.size),
      );
      const patch =
        text === null
          ? {
              name: "DEHACKED",
              unsupportedSignals: ["Unreadable embedded DEHACKED"],
            }
          : parsePatch(text, "DEHACKED");
      embeddedPatches.push(patch);
      unsupportedSignals.push(...patch.unsupportedSignals);
    }
    if (!/^(?:E[1-9]M[1-9]|MAP\d\d)$/.test(lump.name)) continue;
    const members = [];
    for (
      let next = index + 1;
      next < lumps.length &&
      !/^(?:E[1-9]M[1-9]|MAP\d\d)$/.test(lumps[next].name);
      next++
    )
      members.push(lumps[next]);
    const byName = new Map(members.map((item) => [item.name, item])),
      format = byName.has("TEXTMAP")
        ? "UDMF"
        : byName.has("BEHAVIOR")
          ? "Hexen"
          : "Doom",
      sizes = {
        THINGS: 10,
        LINEDEFS: 14,
        SIDEDEFS: 30,
        VERTEXES: 4,
        SEGS: 12,
        SSECTORS: 4,
        NODES: 28,
        SECTORS: 26,
      },
      missing = [],
      invalidRecords = [],
      counts = {};
    if (format === "Doom")
      for (const [key, width] of Object.entries(sizes)) {
        const item = byName.get(key);
        if (!item) missing.push(key);
        else {
          counts[key] = item.size / width;
          if (item.size % width) invalidRecords.push(key);
        }
      }
    if (format === "Doom")
      for (const key of ["REJECT", "BLOCKMAP"])
        if (!byName.has(key)) missing.push(key);
    const signals = [];
    if (format === "Doom") {
      const lines = byName.get("LINEDEFS");
      if (lines && lines.size % 14 === 0)
        for (
          let at = lines.position;
          at < lines.position + lines.size;
          at += 14
        ) {
          const special = u16(view, at + 6);
          if (special >= 142) {
            signals.push(
              special >= 0x2f80
                ? "Boom generalized linedefs"
                : `Extended linedef special ${special}`,
            );
            break;
          }
        }
      const sectors = byName.get("SECTORS");
      if (sectors && sectors.size % 26 === 0)
        for (
          let at = sectors.position;
          at < sectors.position + sectors.size;
          at += 26
        )
          if (u16(view, at + 22) >= 32) {
            signals.push("Boom generalized sector flags");
            break;
          }
      const things = byName.get("THINGS");
      if (things && things.size % 10 === 0)
        for (
          let at = things.position;
          at < things.position + things.size;
          at += 10
        ) {
          const type = u16(view, at + 6);
          if ([888, 5001, 5002].includes(type)) {
            signals.push(
              type === 888
                ? "MBF helper dog thing"
                : "Boom point push/pull thing",
            );
            break;
          }
        }
    } else signals.push(`${format} map format`);
    const nodes = byName.get("NODES");
    if (
      nodes &&
      nodes.size >= 4 &&
      /^[XZ]NOD$/.test(
        decoderLegacy.decode(
          bytes.subarray(nodes.position, nodes.position + 4),
        ),
      )
    )
      signals.push("Extended compressed nodes");
    const expectedOrder = [...Object.keys(sizes), "REJECT", "BLOCKMAP"],
      orderValid =
        format === "Doom" &&
        expectedOrder.every((key, offset) => members[offset]?.name === key);
    unsupportedSignals.push(...signals);
    mapStructures.push({
      slot: lump.name,
      format,
      complete:
        format === "Doom" &&
        !missing.length &&
        !invalidRecords.length &&
        orderValid,
      orderValid,
      missing,
      invalidRecords,
      counts,
      unsupportedSignals: signals,
    });
  }
  const duplicates = [...counts]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, LIMITS.reportedDuplicates)
    .map(([lump, count]) => ({ lump, count }));
  const targetGame =
    episodeMaps.length && doom2Maps.length
      ? "mixed"
      : episodeMaps.length
        ? "doom"
        : doom2Maps.length
          ? "doom2"
          : "unknown";
  const recommendedBase =
    magic === "IWAD"
      ? "This IWAD is a base"
      : targetGame === "doom"
        ? "Freedoom Phase 1"
        : targetGame === "doom2"
          ? "Freedoom Phase 2"
          : "Choose a compatible IWAD";
  const loadingMethod =
    magic === "IWAD" ? "IWAD base" : "Ordinary PWAD (-file)";
  const result = {
    name: cleanFilename(name),
    kind: magic,
    bytes: bytes.length,
    sha256: knownHash || (await sha256(bytes)),
    lumpCount,
    directoryOffset,
    directoryValid: true,
    maps: {
      episode: episodeMaps,
      doom2: doom2Maps,
      total: episodeMaps.length + doom2Maps.length,
    },
    mapStructures,
    targetGame,
    embeddedDehacked,
    embeddedPatches,
    namespaces: { sprites: spriteNamespace, graphics: graphicsNamespace },
    advancedSignals,
    unsupportedSignals: [...new Set(unsupportedSignals)].slice(
      0,
      LIMITS.reportedSignals,
    ),
    duplicates,
    duplicateCount: [...counts.values()].filter((count) => count > 1).length,
    loadingMethod,
    recommendedBase,
  };
  result.compatibility = wadCompatibility(result);
  return result;
}

function findEocd(bytes) {
  const view = viewOf(bytes),
    minimum = Math.max(0, bytes.length - 65557);
  for (let at = bytes.length - 22; at >= minimum; at--)
    if (
      u32(view, at) === 0x06054b50 &&
      at + 22 + u16(view, at + 20) === bytes.length
    )
      return at;
  throw new InspectionError(
    "zip-eocd",
    "ZIP end-of-central-directory record is missing or invalid.",
    "zip-directory",
  );
}

async function inflateEntry(compressed, method, expected, remaining) {
  const maximum = Math.min(
    expected,
    LIMITS.entryBytes,
    remaining,
    Math.max(1, compressed.length) * LIMITS.expansionRatio,
  );
  if (method === 0) {
    if (compressed.length > maximum)
      throw new InspectionError(
        "zip-expanded-size",
        "Stored entry exceeds its declared size or safety quota.",
        "zip-quota",
      );
    return compressed.slice();
  }
  if (method !== 8)
    throw new InspectionError(
      "zip-method",
      `ZIP compression method ${method} is not supported.`,
      "zip-entry",
    );
  if (typeof DecompressionStream !== "function")
    throw new InspectionError(
      "zip-deflate-unsupported",
      "This browser cannot inspect deflated ZIP entries.",
      "zip-entry",
    );
  let stream;
  try {
    stream = new Blob([compressed])
      .stream()
      .pipeThrough(new DecompressionStream("deflate-raw"));
  } catch (_) {
    throw new InspectionError(
      "zip-deflate-unsupported",
      "This browser cannot inspect raw-deflate ZIP entries.",
      "zip-entry",
    );
  }
  const reader = stream.getReader(),
    chunks = [];
  let length = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > maximum) {
        await reader.cancel();
        throw new InspectionError(
          "zip-expanded-size",
          "Actual decompressed bytes exceed the declared size or safety quota.",
          "zip-quota",
        );
      }
      chunks.push(part.value);
    }
    const decoded = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      decoded.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return decoded;
  } catch (error) {
    if (error instanceof InspectionError) throw error;
    throw new InspectionError(
      "zip-deflate",
      "A ZIP entry could not be decompressed.",
      "zip-entry",
    );
  } finally {
    reader.releaseLock();
  }
}

function zipCompatibility(
  wads,
  signals,
  patches = [],
  metadata = { unsupportedSignals: [] },
) {
  const unsupported = [
    ...new Set([
      ...wads.flatMap((wad) => wad.unsupportedSignals),
      ...patches.flatMap((patch) => patch.unsupportedSignals),
      ...metadata.unsupportedSignals,
    ]),
  ];
  if (unsupported.length)
    return {
      status: "unsupported-by-engine",
      label: "Unsupported by this engine",
      targetGame:
        [...new Set(wads.map((wad) => wad.targetGame))].join(", ") || "unknown",
      recommendedBase: "Review unsupported signals",
      recommendedLoading: "Do not launch with this engine profile",
      confidence: "high",
      evidence: [`Detected ${unsupported.join(", ")}`],
      unsupportedSignals: unsupported,
      manualOverride: false,
    };
  if (wads.length !== 1 || signals.length)
    return {
      status: "manual-recipe-required",
      label: "Manual recipe required",
      targetGame:
        [...new Set(wads.map((wad) => wad.targetGame))].join(", ") || "unknown",
      recommendedBase:
        wads.length === 1
          ? wads[0].recommendedBase
          : "Choose after reviewing package contents",
      recommendedLoading:
        wads.length === 1
          ? wads[0].loadingMethod
          : "Order package entries manually",
      confidence: "high",
      evidence: [
        wads.length === 0
          ? "No WAD payload was found"
          : `${wads.length} WAD payloads require explicit ordering`,
        ...signals,
      ],
      unsupportedSignals: [],
      manualOverride: false,
    };
  return {
    ...wads[0].compatibility,
    evidence: [
      ...wads[0].compatibility.evidence,
      "ZIP contains one inspectable WAD",
    ],
  };
}

async function parseZip(bytes, name, knownHash = null) {
  if (bytes.length < 22)
    throw new InspectionError(
      "zip-header",
      "ZIP file is truncated.",
      "zip-header",
    );
  const view = viewOf(bytes),
    eocd = findEocd(bytes),
    disk = u16(view, eocd + 4),
    centralDisk = u16(view, eocd + 6),
    diskEntries = u16(view, eocd + 8),
    entryCount = u16(view, eocd + 10),
    centralSize = u32(view, eocd + 12),
    centralOffset = u32(view, eocd + 16);
  if (disk !== 0 || centralDisk !== 0 || diskEntries !== entryCount)
    throw new InspectionError(
      "zip-multidisk",
      "Multi-disk ZIP archives are not supported.",
      "zip-directory",
    );
  if (
    entryCount === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff
  )
    throw new InspectionError(
      "zip64",
      "ZIP64 archives are not supported by this importer.",
      "zip-directory",
    );
  if (entryCount > LIMITS.zipEntries)
    throw new InspectionError(
      "zip-file-count",
      `ZIP contains more than ${LIMITS.zipEntries} entries.`,
      "zip-directory",
    );
  if (centralOffset + centralSize > eocd)
    throw new InspectionError(
      "zip-central-bounds",
      "ZIP central directory is outside the archive.",
      "zip-directory",
    );
  const entries = [],
    seenPaths = new Set(),
    duplicatePaths = [];
  let at = centralOffset,
    totalExpanded = 0,
    totalCompressed = 0;
  for (let index = 0; index < entryCount; index++) {
    if (at + 46 > centralOffset + centralSize || u32(view, at) !== 0x02014b50)
      throw new InspectionError(
        "zip-central-entry",
        `ZIP central entry ${index} is malformed.`,
        "zip-directory",
      );
    const flags = u16(view, at + 8),
      method = u16(view, at + 10),
      crc = u32(view, at + 16),
      compressedSize = u32(view, at + 20),
      expandedSize = u32(view, at + 24),
      nameLength = u16(view, at + 28),
      extraLength = u16(view, at + 30),
      commentLength = u16(view, at + 32),
      localOffset = u32(view, at + 42),
      end = at + 46 + nameLength + extraLength + commentLength;
    if (end > centralOffset + centralSize)
      throw new InspectionError(
        "zip-central-bounds",
        `ZIP central entry ${index} exceeds its directory.`,
        "zip-directory",
      );
    if (flags & 0x2041)
      throw new InspectionError(
        "zip-encrypted",
        "Encrypted ZIP entries are not supported.",
        "zip-directory",
      );
    if (u16(view, at + 34) !== 0)
      throw new InspectionError(
        "zip-multidisk",
        "ZIP entry references another disk.",
        "zip-directory",
      );
    if (((u32(view, at + 38) >>> 16) & 0xf000) === 0xa000)
      throw new InspectionError(
        "zip-symlink",
        "Archive symbolic links are not allowed.",
        "zip-directory",
      );
    if (
      compressedSize === 0xffffffff ||
      expandedSize === 0xffffffff ||
      localOffset === 0xffffffff
    )
      throw new InspectionError(
        "zip64",
        "ZIP64 entries are not supported.",
        "zip-directory",
      );
    if (expandedSize > LIMITS.entryBytes)
      throw new InspectionError(
        "zip-entry-size",
        `ZIP entry ${index} exceeds the per-file expansion limit.`,
        "zip-quota",
      );
    if (expandedSize > 0 && compressedSize === 0)
      throw new InspectionError(
        "zip-ratio",
        `ZIP entry ${index} has an invalid expansion ratio.`,
        "zip-quota",
      );
    if (
      compressedSize > 0 &&
      expandedSize / compressedSize > LIMITS.expansionRatio
    )
      throw new InspectionError(
        "zip-ratio",
        `ZIP entry ${index} exceeds the expansion-ratio limit.`,
        "zip-quota",
      );
    totalExpanded += expandedSize;
    totalCompressed += compressedSize;
    if (totalExpanded > LIMITS.expandedBytes)
      throw new InspectionError(
        "zip-expanded-size",
        "ZIP exceeds the total expanded-byte limit.",
        "zip-quota",
      );
    const rawName = decodeZipName(
        bytes.subarray(at + 46, at + 46 + nameLength),
        Boolean(flags & 0x800),
      ),
      path = safeArchivePath(rawName),
      directory = rawName.endsWith("/") || rawName.endsWith("\\");
    const pathKey = path.toLowerCase();
    if (seenPaths.has(pathKey))
      throw new InspectionError(
        "zip-duplicate-path",
        `Archive repeats the path ${path}.`,
        "zip-directory",
      );
    seenPaths.add(pathKey);
    entries.push({
      index,
      path,
      directory,
      flags,
      method,
      crc,
      compressedSize,
      expandedSize,
      localOffset,
      extension: extension(path),
    });
    at = end;
  }
  if (at !== centralOffset + centralSize)
    throw new InspectionError(
      "zip-central-size",
      "ZIP central-directory size does not match its entries.",
      "zip-directory",
    );
  if (totalExpanded / Math.max(bytes.length, 1) > LIMITS.expansionRatio)
    throw new InspectionError(
      "zip-total-ratio",
      "ZIP exceeds the total expansion-ratio limit.",
      "zip-quota",
    );
  const wads = [],
    documents = [],
    patches = [],
    recipes = [],
    files = [],
    ignored = [],
    nested = [],
    dataRanges = [];
  let actualExpanded = 0;
  for (const entry of entries) {
    if (
      entry.localOffset >= centralOffset ||
      entry.localOffset + 30 > centralOffset ||
      u32(view, entry.localOffset) !== 0x04034b50
    )
      throw new InspectionError(
        "zip-local-header",
        `ZIP local header for ${entry.path} is malformed.`,
        "zip-entry",
      );
    const localFlags = u16(view, entry.localOffset + 6),
      localMethod = u16(view, entry.localOffset + 8),
      localNameLength = u16(view, entry.localOffset + 26),
      localExtraLength = u16(view, entry.localOffset + 28),
      dataStart = entry.localOffset + 30 + localNameLength + localExtraLength,
      dataEnd = dataStart + entry.compressedSize;
    if (
      localFlags !== entry.flags ||
      localMethod !== entry.method ||
      dataStart > centralOffset ||
      dataEnd > centralOffset
    )
      throw new InspectionError(
        "zip-local-bounds",
        `ZIP data for ${entry.path} is inconsistent.`,
        "zip-entry",
      );
    if (
      !(entry.flags & 8) &&
      (u32(view, entry.localOffset + 14) !== entry.crc ||
        u32(view, entry.localOffset + 18) !== entry.compressedSize ||
        u32(view, entry.localOffset + 22) !== entry.expandedSize)
    )
      throw new InspectionError(
        "zip-local-mismatch",
        `ZIP local sizes or checksum differ for ${entry.path}.`,
        "zip-entry",
      );
    const localPath = safeArchivePath(
      decodeZipName(
        bytes.subarray(
          entry.localOffset + 30,
          entry.localOffset + 30 + localNameLength,
        ),
        Boolean(localFlags & 0x800),
      ),
    );
    if (localPath !== entry.path)
      throw new InspectionError(
        "zip-name-mismatch",
        `ZIP local and central names differ for ${entry.path}.`,
        "zip-entry",
      );
    let rangeEnd = dataEnd;
    if (entry.flags & 8) {
      let descriptor = dataEnd;
      if (
        descriptor + 4 <= centralOffset &&
        u32(view, descriptor) === 0x08074b50
      )
        descriptor += 4;
      if (
        descriptor + 12 > centralOffset ||
        u32(view, descriptor) !== entry.crc ||
        u32(view, descriptor + 4) !== entry.compressedSize ||
        u32(view, descriptor + 8) !== entry.expandedSize
      )
        throw new InspectionError(
          "zip-descriptor",
          "ZIP data descriptor is inconsistent.",
          "zip-entry",
        );
      rangeEnd = descriptor + 12;
    }
    if (
      dataRanges.some(
        (range) => entry.localOffset < range.end && rangeEnd > range.start,
      )
    )
      throw new InspectionError(
        "zip-data-overlap",
        `ZIP entry ranges overlap at ${entry.path}.`,
        "zip-entry",
      );
    dataRanges.push({ start: entry.localOffset, end: rangeEnd });
    if (entry.directory) {
      if (entry.expandedSize || entry.compressedSize)
        throw new InspectionError(
          "zip-directory-data",
          "ZIP directory entry contains a payload.",
          "zip-entry",
        );
      continue;
    }
    if (EXECUTABLE_EXTENSIONS.has(entry.extension)) {
      ignored.push({ path: entry.path, reason: "executable-content" });
      continue;
    }
    if (NESTED_ARCHIVE_EXTENSIONS.has(entry.extension)) {
      nested.push(entry.path);
      ignored.push({ path: entry.path, reason: "nested-archive" });
      continue;
    }
    if (entry.method !== 0 && entry.method !== 8) {
      ignored.push({
        path: entry.path,
        reason: `compression-method-${entry.method}`,
      });
      continue;
    }
    const decoded = await inflateEntry(
      bytes.subarray(dataStart, dataEnd),
      entry.method,
      entry.expandedSize,
      LIMITS.expandedBytes - actualExpanded,
    );
    actualExpanded += decoded.length;
    if (decoded.length !== entry.expandedSize)
      throw new InspectionError(
        "zip-expanded-size",
        `Expanded size does not match for ${entry.path}.`,
        "zip-entry",
      );
    if (crc32(decoded) !== entry.crc)
      throw new InspectionError(
        "zip-crc",
        `CRC-32 does not match for ${entry.path}.`,
        "zip-entry",
      );
    const magic =
      decoded.length >= 4 ? decoderLegacy.decode(decoded.subarray(0, 4)) : "";
    if (
      magic.startsWith("PK") ||
      magic.startsWith("7z") ||
      magic === "Rar!" ||
      (decoded[0] === 0x1f && decoded[1] === 0x8b)
    ) {
      nested.push(entry.path);
      ignored.push({ path: entry.path, reason: "nested-archive" });
      continue;
    }
    const content = await classifyContent(decoded, entry.path);
    if (!content) {
      ignored.push({
        path: entry.path,
        reason: "unsupported-or-executable-content",
      });
      continue;
    }
    files.push(content);
    if (content.kind === "IWAD" || content.kind === "PWAD")
      wads.push(content.inspection);
    if (content.kind === "DEH" || content.kind === "BEX")
      patches.push(content.inspection);
    if (content.kind === "RECIPE") recipes.push(content.inspection.recipe);
    if (content.kind === "TEXT")
      documents.push({
        name: entry.path,
        text: content.text,
        sha256: content.sha256,
        permission: content.permission,
      });
  }
  const packageSignals = [];
  if (duplicatePaths.length) packageSignals.push("Duplicate archive paths");
  if (nested.length) packageSignals.push("Nested archives were not extracted");
  if (ignored.some((item) => item.reason.startsWith("compression-method-")))
    packageSignals.push("Unsupported compression methods were skipped");
  const metadata = metadataFromTexts(documents);
  if (metadata.requiredFiles.length)
    packageSignals.push(
      ...metadata.requiredFiles.map(
        (value) => `Review required files: ${value}`,
      ),
    );
  const compatibility = zipCompatibility(
    wads,
    packageSignals,
    patches,
    metadata,
  );
  for (const file of files)
    if (
      metadata.permission.status === "redistribution-prohibited" ||
      (file.permission.status === "private-local-only" &&
        metadata.permission.status !== "private-local-only")
    )
      file.permission = {
        ...metadata.permission,
        source: "Archive documentation",
      };
  return {
    kind: "ZIP",
    name: cleanFilename(name),
    bytes: bytes.length,
    sha256: knownHash || (await sha256(bytes)),
    archive: {
      entryCount,
      compressedBytes: totalCompressed,
      expandedBytes: totalExpanded,
      actualExpandedBytes: actualExpanded,
      expansionRatio:
        Math.round((totalExpanded / Math.max(bytes.length, 1)) * 100) / 100,
      entries: entries.slice(0, LIMITS.reportedNames).map((entry) => ({
        path: entry.path,
        compressedBytes: entry.compressedSize,
        expandedBytes: entry.expandedSize,
        method: entry.method,
        directory: entry.directory,
      })),
      entriesTruncated: Math.max(0, entries.length - LIMITS.reportedNames),
      documents: documents.map((item) => item.name),
      nested: nested.slice(0, 24),
      ignored: ignored.slice(0, 24),
      duplicatePaths,
    },
    wads,
    documents,
    patches,
    recipes,
    metadata,
    files,
    compatibility,
  };
}

async function classifyContent(bytes, name, knownHash = null) {
  const magic =
      bytes.length >= 4 ? decoderLegacy.decode(bytes.subarray(0, 4)) : "",
    text = textFromBytes(bytes),
    hash = knownHash || (await sha256(bytes));
  if (
    EXECUTABLE_EXTENSIONS.has(extension(name)) ||
    executableBytes(bytes, text)
  )
    return null;
  let kind, inspection, readable;
  if (magic === "IWAD" || magic === "PWAD") {
    kind = magic;
    inspection = await parseWad(bytes, name, hash);
  } else if (text !== null) {
    readable = text;
    if (
      /^Patch File for DeHackEd\b/m.test(text) ||
      /^\s*\[(?:STRINGS|CODEPTR|PARS|SOUNDS|SPRITES|MUSIC)\]/m.test(text)
    ) {
      inspection = parsePatch(text, name);
      kind = inspection.kind;
    } else {
      let recipe = null;
      try {
        const parsed = JSON.parse(text);
        if (parsed && parsed.schema === "sfhs.doom-recipe@1") recipe = parsed;
      } catch (_) {}
      kind = recipe ? "RECIPE" : "TEXT";
      inspection = {
        name: cleanFilename(name),
        kind,
        ...(recipe ? { recipe } : {}),
        compatibility: {
          status: "manual-recipe-required",
          label: "Manual recipe required",
          targetGame: "unknown",
          recommendedBase: "Choose after reviewing documentation",
          recommendedLoading: recipe
            ? "Validate and select recipe content"
            : "Read documentation",
          confidence: "high",
          evidence: [
            recipe
              ? "Recipe metadata identified; referenced payloads must be validated separately"
              : "Text documentation is not directly launchable",
          ],
          unsupportedSignals: [],
          manualOverride: false,
        },
      };
      if (!recipe) {
        inspection.metadata = metadataFromTexts([{ text }]);
        if (inspection.metadata.unsupportedSignals.length) {
          inspection.compatibility = {
            ...inspection.compatibility,
            status: "unsupported-by-engine",
            label: "Unsupported by this engine",
            evidence: inspection.metadata.unsupportedSignals,
            unsupportedSignals: inspection.metadata.unsupportedSignals,
          };
        }
      }
    }
  } else return null;
  return {
    name,
    kind,
    sha256: hash,
    bytes: bytes.slice().buffer,
    inspection,
    ...(readable !== undefined ? { text: readable } : {}),
    permission:
      readable === undefined
        ? { ...PRIVATE_PERMISSION }
        : permissionFromText(readable),
  };
}

async function inspect(message) {
  const started = performance.now(),
    name = cleanFilename(message.name),
    declaredSize = Number(message.size);
  if (
    !(message.bytes instanceof ArrayBuffer) ||
    !Number.isSafeInteger(declaredSize) ||
    declaredSize < 0 ||
    declaredSize !== message.bytes.byteLength
  )
    throw new InspectionError(
      "input-contract",
      "Selected file bytes do not match the declared size.",
      "read",
    );
  if (declaredSize === 0)
    throw new InspectionError(
      "empty-file",
      "The selected file is empty.",
      "read",
    );
  if (declaredSize > LIMITS.inputBytes)
    throw new InspectionError(
      "input-size",
      `File exceeds the ${LIMITS.inputBytes / (1024 * 1024)} MiB inspection limit.`,
      "read",
    );
  const bytes = new Uint8Array(message.bytes),
    identityHash = await sha256(bytes),
    magic = bytes.length >= 4 ? decoderLegacy.decode(bytes.subarray(0, 4)) : "";
  let parsed;
  try {
    if (magic.startsWith("PK"))
      parsed = await parseZip(bytes, name, identityHash);
    else {
      const file = await classifyContent(bytes, name, identityHash);
      if (!file)
        throw new InspectionError(
          "unsupported-type",
          "Selected bytes are not a supported WAD, ZIP, patch, recipe, or text document.",
          "identify",
        );
      const documents =
          file.kind === "TEXT"
            ? [
                {
                  name,
                  text: file.text,
                  sha256: file.sha256,
                  permission: file.permission,
                },
              ]
            : [],
        metadata = metadataFromTexts(documents);
      parsed = {
        kind: ["IWAD", "PWAD"].includes(file.kind) ? "WAD" : file.kind,
        name,
        bytes: bytes.length,
        sha256: identityHash,
        wads: ["IWAD", "PWAD"].includes(file.kind) ? [file.inspection] : [],
        patches: ["DEH", "BEX"].includes(file.kind) ? [file.inspection] : [],
        recipes: file.kind === "RECIPE" ? [file.inspection.recipe] : [],
        documents,
        metadata,
        files: [file],
        compatibility: file.inspection.compatibility,
      };
    }
  } catch (error) {
    error.sha256 = identityHash;
    throw error;
  }
  const permission =
    parsed.metadata.permission.status === "private-local-only" &&
    parsed.files.length === 1
      ? parsed.files[0].permission
      : parsed.metadata.permission;
  const result = {
    schema: "sfhs.doom-inspection@1",
    privacy: "local-only-not-uploaded",
    permission,
    source: {
      name,
      bytes: declaredSize,
      sha256: parsed.sha256,
      type: parsed.kind,
    },
    wads: parsed.wads,
    archive: parsed.archive || null,
    patches: parsed.patches,
    documents: parsed.documents,
    recipes: parsed.recipes,
    metadata: parsed.metadata,
    compatibility: parsed.compatibility,
    limits: { ...LIMITS },
    limitsPurpose: "Defensive safety quotas; not measured phone capacity",
    durationMs: Math.round((performance.now() - started) * 100) / 100,
    storedBytes: 0,
    launchable: false,
  };
  return { result, files: message.extract === true ? parsed.files : [] };
}

self.addEventListener("message", async (event) => {
  const id = event.data && event.data.id;
  try {
    const { result, files } = await inspect(event.data || {});
    self.postMessage(
      { id, ok: true, result, files },
      files.map((file) => file.bytes),
    );
  } catch (error) {
    const known = error instanceof InspectionError;
    self.postMessage({
      id,
      ok: false,
      error: {
        schema: "sfhs.doom-inspection-error@1",
        code: known ? error.code : "inspection-failed",
        stage: known ? error.stage : "inspect",
        message: cleanText((error && error.message) || error, 240),
        sha256: /^[a-f0-9]{64}$/.test((error && error.sha256) || "")
          ? error.sha256
          : null,
        storedBytes: 0,
        launchable: false,
      },
    });
  }
});
