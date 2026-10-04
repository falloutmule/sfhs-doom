/* SFHS Doom Forge product core. SPDX-License-Identifier: GPL-2.0-or-later */
(function (global) {
  "use strict";
  const shaConstants = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  class IncrementalSha256 {
    constructor() {
      this.hash = new Uint32Array([
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
        0x1f83d9ab, 0x5be0cd19,
      ]);
      this.buffer = new Uint8Array(64);
      this.buffered = 0;
      this.bytes = 0;
      this.done = false;
    }
    update(input) {
      if (this.done) throw new Error("sha256 already finalized");
      const data = input instanceof Uint8Array ? input : new Uint8Array(input);
      this.bytes += data.length;
      let at = 0;
      if (this.buffered) {
        const take = Math.min(64 - this.buffered, data.length);
        this.buffer.set(data.subarray(0, take), this.buffered);
        this.buffered += take;
        at = take;
        if (this.buffered === 64) {
          this.block(this.buffer, 0);
          this.buffered = 0;
        }
      }
      for (; at + 64 <= data.length; at += 64) this.block(data, at);
      if (at < data.length) {
        this.buffer.set(data.subarray(at), 0);
        this.buffered = data.length - at;
      }
      return this;
    }
    block(data, offset) {
      const words = new Uint32Array(64);
      for (let i = 0; i < 16; i++) {
        const j = offset + i * 4;
        words[i] =
          ((data[j] << 24) |
            (data[j + 1] << 16) |
            (data[j + 2] << 8) |
            data[j + 3]) >>>
          0;
      }
      for (let i = 16; i < 64; i++) {
        const x = words[i - 15],
          y = words[i - 2],
          s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3),
          s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = this.hash;
      for (let i = 0; i < 64; i++) {
        const s1 =
            ((e >>> 6) | (e << 26)) ^
            ((e >>> 11) | (e << 21)) ^
            ((e >>> 25) | (e << 7)),
          choice = (e & f) ^ (~e & g),
          t1 = (h + s1 + choice + shaConstants[i] + words[i]) >>> 0,
          s0 =
            ((a >>> 2) | (a << 30)) ^
            ((a >>> 13) | (a << 19)) ^
            ((a >>> 22) | (a << 10)),
          majority = (a & b) ^ (a & c) ^ (b & c),
          t2 = (s0 + majority) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + t1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) >>> 0;
      }
      this.hash[0] = (this.hash[0] + a) >>> 0;
      this.hash[1] = (this.hash[1] + b) >>> 0;
      this.hash[2] = (this.hash[2] + c) >>> 0;
      this.hash[3] = (this.hash[3] + d) >>> 0;
      this.hash[4] = (this.hash[4] + e) >>> 0;
      this.hash[5] = (this.hash[5] + f) >>> 0;
      this.hash[6] = (this.hash[6] + g) >>> 0;
      this.hash[7] = (this.hash[7] + h) >>> 0;
    }
    hex() {
      if (this.done) throw new Error("sha256 already finalized");
      this.done = true;
      const total = this.bytes,
        tail = new Uint8Array(128);
      tail.set(this.buffer.subarray(0, this.buffered));
      tail[this.buffered] = 0x80;
      const end = this.buffered < 56 ? 64 : 128,
        bits = BigInt(total) * 8n;
      for (let i = 0; i < 8; i++)
        tail[end - 1 - i] = Number((bits >> BigInt(i * 8)) & 255n);
      this.block(tail, 0);
      if (end === 128) this.block(tail, 64);
      return Array.from(this.hash, (value) =>
        value.toString(16).padStart(8, "0"),
      ).join("");
    }
  }
  const HASH = /^[a-f0-9]{64}$/;
  const NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,159}$/;
  const NAMESPACE = /^forge-[a-f0-9]{32,64}$/;
  const encoder = new TextEncoder();
  const record = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);
  class ForgeError extends Error {
    constructor(code, detail = "") {
      super(detail ? `${code}: ${detail}` : code);
      this.name = "ForgeError";
      this.code = code;
    }
  }
  function need(condition, code, detail) {
    if (!condition) throw new ForgeError(code, detail);
  }
  function cancelled(signal) {
    if (signal && signal.aborted)
      throw new DOMException("Operation cancelled", "AbortError");
  }
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
  function safeJSON(value, max = 2 * 1024 * 1024) {
    const visit = (v, depth) => {
      need(depth <= 12, "metadata-depth");
      if (v === null || typeof v === "boolean" || typeof v === "string") return;
      if (typeof v === "number") {
        need(Number.isFinite(v), "metadata-number");
        return;
      }
      need(record(v) || Array.isArray(v), "metadata-type");
      for (const key of Object.keys(v)) {
        need(
          !["__proto__", "prototype", "constructor"].includes(key),
          "metadata-key",
          key,
        );
        visit(v[key], depth + 1);
      }
    };
    visit(value, 0);
    const text = JSON.stringify(value);
    need(text.length <= max, "metadata-size");
    return JSON.parse(text);
  }
  function keys(value, allowed, code) {
    need(record(value), code);
    for (const key of Object.keys(value))
      need(allowed.includes(key), code, `unknown ${key}`);
  }
  function text(value, max, code, empty = true) {
    need(
      typeof value === "string" &&
        value.length <= max &&
        (empty || value.length > 0),
      code,
    );
  }
  function hashBytes(bytes) {
    return new IncrementalSha256().update(bytes).hex();
  }
  async function hashBlob(blob, { signal, progress } = {}) {
    need(blob instanceof Blob, "payload-blob");
    const hasher = new IncrementalSha256();
    for (let at = 0; at < blob.size; at += 262144) {
      cancelled(signal);
      hasher.update(
        new Uint8Array(await blob.slice(at, at + 262144).arrayBuffer()),
      );
      if (progress)
        progress({
          stage: "hash",
          done: Math.min(at + 262144, blob.size),
          total: blob.size,
        });
      await tick();
    }
    return hasher.hex();
  }
  function bytesToBase64(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 16384)
      binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
    return btoa(binary);
  }
  function base64ToBytes(value, code = "chunk-base64") {
    // A flat character class avoids regexp backtracking-stack growth on multi-MiB templates.
    need(
      typeof value === "string" &&
        value.length % 4 === 0 &&
        /^[A-Za-z0-9+/]*={0,2}$/.test(value),
      code,
    );
    let binary;
    try {
      binary = atob(value);
    } catch (_) {
      throw new ForgeError(code);
    }
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    need(bytesToBase64(bytes) === value, code, "noncanonical padding");
    return bytes;
  }
  function mountName(payload) {
    need(
      payload && HASH.test(payload.id) && NAME.test(payload.filename),
      "mount-name",
    );
    return `${payload.id}-${payload.filename}`;
  }
  function validatePayload(payload) {
    keys(
      payload,
      [
        "id",
        "filename",
        "role",
        "decoded",
        "compression",
        "encoding",
        "encoded",
        "chunkSize",
        "chunkCount",
        "permission",
        "license",
        "source",
        "storage",
        "inspection",
        "mediaType",
        "aliases",
        "readme",
      ],
      "payload-structure",
    );
    need(HASH.test(payload.id), "payload-id");
    need(
      NAME.test(payload.filename) && !payload.filename.includes(".."),
      "payload-filename",
    );
    need(
      ["iwad", "pwad", "deh", "bex", "document"].includes(payload.role),
      "payload-role",
    );
    for (const field of ["decoded", "encoded"]) {
      keys(payload[field], ["bytes", "sha256"], "payload-digest");
      need(
        Number.isSafeInteger(payload[field].bytes) &&
          payload[field].bytes >= 0 &&
          HASH.test(payload[field].sha256),
        "payload-digest",
        field,
      );
    }
    need(payload.id === payload.decoded.sha256, "payload-identity");
    need(["none", "gzip"].includes(payload.compression), "payload-compression");
    need(payload.encoding === "base64", "payload-encoding");
    need(
      Number.isSafeInteger(payload.chunkSize) &&
        payload.chunkSize >= 1 &&
        payload.chunkSize <= 4 * 1024 * 1024,
      "payload-chunk-size",
    );
    need(
      Number.isSafeInteger(payload.chunkCount) &&
        payload.chunkCount >= 0 &&
        payload.chunkCount ===
          Math.ceil(payload.encoded.bytes / payload.chunkSize),
      "payload-chunk-count",
    );
    if (payload.compression === "none")
      need(
        payload.encoded.bytes === payload.decoded.bytes &&
          payload.encoded.sha256 === payload.decoded.sha256,
        "payload-uncompressed-digest",
      );
    need(
      ["redistributable", "private-local", "unclear", "prohibited"].includes(
        payload.permission,
      ),
      "payload-permission",
    );
    text(payload.license, 100000, "payload-license");
    keys(payload.storage, ["kind"], "payload-storage");
    need(payload.storage.kind === "embedded-chunks", "payload-storage");
    if (payload.source !== undefined) safeJSON(payload.source);
    if (payload.inspection !== undefined) safeJSON(payload.inspection);
    return payload;
  }
  function payloadMap(payloads) {
    return payloads instanceof Map
      ? payloads
      : new Map(payloads.map((payload) => [payload.id, payload]));
  }
  function validateLaunchTest(value) {
    keys(
      value,
      [
        "status",
        "saveNamespace",
        "attemptedAt",
        "finishedAt",
        "mainInvocations",
        "presents",
        "message",
      ],
      "launch-test",
    );
    need(
      ["attempted", "booted", "failed"].includes(value.status),
      "launch-test-status",
    );
    need(NAMESPACE.test(value.saveNamespace), "launch-test-namespace");
    need(
      Number.isSafeInteger(value.attemptedAt) && value.attemptedAt >= 0,
      "launch-test-time",
    );
    if (value.finishedAt !== undefined)
      need(
        Number.isSafeInteger(value.finishedAt) &&
          value.finishedAt >= value.attemptedAt,
        "launch-test-time",
      );
    if (value.mainInvocations !== undefined)
      need(
        Number.isSafeInteger(value.mainInvocations) &&
          value.mainInvocations >= 0 &&
          value.mainInvocations <= 1,
        "launch-test-invocations",
      );
    if (value.presents !== undefined)
      need(
        Number.isSafeInteger(value.presents) && value.presents >= 0,
        "launch-test-presents",
      );
    if (value.message !== undefined)
      text(value.message, 500, "launch-test-message");
    if (value.status === "booted")
      need(
        value.mainInvocations === 1 &&
          value.presents > 0 &&
          value.finishedAt !== undefined,
        "launch-test-boot-evidence",
      );
    return value;
  }
  function validateRecipe(recipe, payloads) {
    const byId = payloadMap(payloads);
    keys(
      recipe,
      [
        "schema",
        "id",
        "title",
        "engine",
        "base",
        "family",
        "files",
        "documentIds",
        "warp",
        "skill",
        "options",
        "saveNamespace",
        "manualOverride",
        "embeddedDehacked",
        "compatibility",
        "author",
        "mapCount",
        "lastPlayed",
        "permission",
        "provenance",
        "favorite",
        "launchTest",
      ],
      "recipe-structure",
    );
    need(recipe.schema === "sfhs.doom-recipe@1", "recipe-schema");
    text(recipe.id, 100, "recipe-id", false);
    need(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(recipe.id), "recipe-id");
    text(recipe.title, 300, "recipe-title", false);
    need(recipe.engine === "chocolate-doom", "recipe-engine");
    if (recipe.launchTest !== undefined) validateLaunchTest(recipe.launchTest);
    need(["doom", "doom2"].includes(recipe.family), "recipe-family");
    need(
      recipe.base === null ||
        (HASH.test(recipe.base) && byId.get(recipe.base)?.role === "iwad"),
      "recipe-base",
      recipe.id,
    );
    const baseFamily =
      recipe.base && byId.get(recipe.base)?.inspection?.targetGame;
    if (baseFamily === "doom" || baseFamily === "doom2")
      need(
        baseFamily === recipe.family,
        "recipe-base-family",
        `Recipe requires ${recipe.family}; base is ${baseFamily}.`,
      );
    need(
      Array.isArray(recipe.files) && recipe.files.length <= 1024,
      "recipe-files",
    );
    const seen = new Set();
    for (const entry of recipe.files) {
      keys(entry, ["payloadId", "mode", "enabled"], "recipe-file");
      need(
        HASH.test(entry.payloadId) && byId.has(entry.payloadId),
        "recipe-payload",
        entry.payloadId,
      );
      need(
        !seen.has(entry.payloadId),
        "recipe-duplicate-file",
        entry.payloadId,
      );
      seen.add(entry.payloadId);
      need(
        typeof entry.enabled === "boolean" &&
          ["file", "merge", "deh"].includes(entry.mode),
        "recipe-file",
      );
      const role = byId.get(entry.payloadId).role;
      need(
        entry.mode === "deh" ? ["deh", "bex"].includes(role) : role === "pwad",
        "recipe-load-mode",
        entry.payloadId,
      );
    }
    if (recipe.documentIds !== undefined) {
      need(
        Array.isArray(recipe.documentIds) && recipe.documentIds.length <= 1024,
        "recipe-documents",
      );
      need(
        new Set(recipe.documentIds).size === recipe.documentIds.length,
        "recipe-duplicate-document",
      );
      for (const id of recipe.documentIds)
        need(byId.get(id)?.role === "document", "recipe-document", id);
    }
    need(
      typeof recipe.warp === "string" &&
        (recipe.warp === "" ||
          (recipe.family === "doom2"
            ? /^MAP(?:0[1-9]|[1-9][0-9])$/.test(recipe.warp)
            : /^E[1-9]M[1-9]$/.test(recipe.warp))),
      "recipe-warp",
    );
    need(
      Number.isInteger(recipe.skill) && recipe.skill >= 1 && recipe.skill <= 5,
      "recipe-skill",
    );
    keys(recipe.options, ["nomonsters", "fast", "respawn"], "recipe-options");
    for (const key of Object.keys(recipe.options))
      need(typeof recipe.options[key] === "boolean", "recipe-option", key);
    need(typeof recipe.manualOverride === "boolean", "recipe-manual-override");
    need(
      recipe.embeddedDehacked === undefined ||
        typeof recipe.embeddedDehacked === "boolean",
      "recipe-embedded-deh",
    );
    need(
      typeof recipe.saveNamespace === "string" &&
        NAMESPACE.test(recipe.saveNamespace),
      "recipe-save-namespace",
    );
    return recipe;
  }
  function effectiveFiles(recipe) {
    return ["merge", "file", "deh"].flatMap((mode) =>
      recipe.files.filter((file) => file.enabled && file.mode === mode),
    );
  }
  async function recipeNamespace(recipe) {
    // Titles and provenance are cosmetic. All engine inputs and recipe identity isolate saves.
    const inputs = {
      id: recipe.id,
      engine: recipe.engine,
      base: recipe.base,
      family: recipe.family,
      files: effectiveFiles(recipe).map((file) => [file.mode, file.payloadId]),
      warp: recipe.warp,
      skill: recipe.skill,
      options: ["nomonsters", "fast", "respawn"].map((key) => [
        key,
        Boolean(recipe.options[key]),
      ]),
      embeddedDehacked: Boolean(recipe.embeddedDehacked),
    };
    return `forge-${hashBytes(encoder.encode(JSON.stringify(inputs)))}`;
  }
  function recipeArgs(recipe, payloads) {
    const byId = payloadMap(payloads);
    validateRecipe(recipe, byId);
    need(recipe.base !== null, "recipe-missing-base", recipe.title);
    const args = [
      "-iwad",
      `/wads/${mountName(byId.get(recipe.base))}`,
      "-savedir",
      `/persist/${recipe.saveNamespace}/`,
    ];
    for (const mode of ["merge", "file", "deh"]) {
      const entries = recipe.files.filter(
        (file) => file.enabled && file.mode === mode,
      );
      if (entries.length)
        args.push(
          `-${mode}`,
          ...entries.map(
            (file) => `/wads/${mountName(byId.get(file.payloadId))}`,
          ),
        );
    }
    if (recipe.embeddedDehacked) args.push("-dehlump");
    if (recipe.warp)
      args.push(
        "-warp",
        ...(recipe.family === "doom2"
          ? [String(Number(recipe.warp.slice(3)))]
          : [recipe.warp[1], recipe.warp[3]]),
      );
    args.push("-skill", String(recipe.skill));
    for (const key of ["nomonsters", "fast", "respawn"])
      if (recipe.options[key]) args.push(`-${key}`);
    return args;
  }
  function validateSaves(saves, recipes) {
    need(Array.isArray(saves) && saves.length <= 4096, "saves-structure");
    need(Array.isArray(recipes), "save-recipes-required");
    const namespaces = new Set(recipes.map((recipe) => recipe.saveNamespace)),
      seen = new Set();
    let total = 0;
    for (const save of saves) {
      keys(
        save,
        ["namespace", "filename", "bytes", "sha256", "data"],
        "save-structure",
      );
      need(
        namespaces.has(save.namespace) && NAMESPACE.test(save.namespace),
        "save-namespace",
      );
      need(
        NAME.test(save.filename) && !save.filename.includes(".."),
        "save-filename",
      );
      need(
        Number.isSafeInteger(save.bytes) &&
          save.bytes >= 0 &&
          HASH.test(save.sha256),
        "save-digest",
      );
      need(
        typeof save.data === "string" &&
          save.data.length === Math.ceil(save.bytes / 3) * 4,
        "save-data",
      );
      const key = `${save.namespace}/${save.filename}`;
      need(!seen.has(key), "save-duplicate");
      seen.add(key);
      total += save.bytes;
      need(
        total <= 64 * 1024 * 1024,
        "save-size-limit",
        "64 MiB import safety bound",
      );
    }
  }
  async function verifySaves(saves, recipes, signal) {
    validateSaves(saves, recipes);
    for (const save of saves) {
      cancelled(signal);
      const bytes = base64ToBytes(save.data, "save-base64");
      need(
        bytes.length === save.bytes &&
          (await hashBlob(new Blob([bytes]), { signal })) === save.sha256,
        "save-hash",
        save.filename,
      );
    }
    return true;
  }
  function validateManifest(input) {
    // Metadata is copied before use so a caller cannot mutate a verified recipe underneath launch.
    need(record(input), "manifest-structure");
    const m = safeJSON(input, 96 * 1024 * 1024);
    keys(
      m,
      [
        "schema",
        "capsule",
        "payloads",
        "recipes",
        "defaultRecipe",
        "credits",
        "networkPolicy",
        "licenses",
        "preferences",
        "saves",
        "engine",
        "verification",
        "createdAt",
      ],
      "manifest-structure",
    );
    need(m.schema === "sfhs.doom-capsule@1", "manifest-schema");
    keys(
      m.capsule,
      ["id", "name", "version", "mode", "forge", "private", "buildProfile"],
      "capsule-structure",
    );
    text(m.capsule.id, 100, "capsule-id", false);
    text(m.capsule.name, 300, "capsule-name", false);
    need(
      m.capsule.version === 3 &&
        [
          "FORGE-COMPLETE-1",
          "FORGE-COMPLETE-2",
          "FORGE-COMPLETE-3",
          "FORGE-COMPLETE-4",
        ].includes(m.capsule.buildProfile),
      "capsule-version",
    );
    need(
      ["full", "thin", "collection"].includes(m.capsule.mode) &&
        typeof m.capsule.forge === "boolean" &&
        typeof m.capsule.private === "boolean",
      "capsule-mode",
    );
    need(
      Array.isArray(m.payloads) && m.payloads.length <= 4096,
      "manifest-payloads",
    );
    const ids = new Set();
    for (const payload of m.payloads) {
      validatePayload(payload);
      need(!ids.has(payload.id), "payload-duplicate", payload.id);
      ids.add(payload.id);
    }
    need(
      Array.isArray(m.recipes) &&
        m.recipes.length >= 1 &&
        m.recipes.length <= 256,
      "manifest-recipes",
    );
    const recipeIds = new Set();
    for (const recipe of m.recipes) {
      validateRecipe(recipe, m.payloads);
      need(!recipeIds.has(recipe.id), "recipe-duplicate", recipe.id);
      recipeIds.add(recipe.id);
    }
    need(recipeIds.has(m.defaultRecipe), "manifest-default-recipe");
    need(
      m.capsule.mode !== "thin" ||
        m.recipes.every((recipe) => recipe.base === null),
      "manifest-thin-base",
    );
    need(
      m.capsule.mode !== "full" ||
        m.recipes.every((recipe) => recipe.base !== null),
      "manifest-full-base",
    );
    need(
      m.capsule.mode === "collection" || m.recipes.length === 1,
      "manifest-collection-mode",
    );
    need(
      m.capsule.private ||
        m.payloads.every((payload) => payload.permission === "redistributable"),
      "manifest-private-marker",
    );
    keys(m.networkPolicy, ["default"], "network-policy");
    need(m.networkPolicy.default === "offline", "network-policy");
    need(
      Array.isArray(m.credits) &&
        m.credits.every((credit) => typeof credit === "string"),
      "manifest-credits",
    );
    if (m.preferences !== undefined)
      need(record(m.preferences), "manifest-preferences");
    if (m.saves !== undefined) validateSaves(m.saves, m.recipes);
    return m;
  }
  async function prepareEncoded(
    blob,
    { compression = "none", chunkSize = 262144, signal, progress } = {},
  ) {
    need(blob instanceof Blob, "payload-blob");
    need(["none", "gzip"].includes(compression), "payload-compression");
    need(
      Number.isInteger(chunkSize) &&
        chunkSize > 0 &&
        chunkSize <= 4 * 1024 * 1024,
      "payload-chunk-size",
    );
    const decoded = {
      bytes: blob.size,
      sha256: await hashBlob(blob, { signal, progress }),
    };
    let encodedBlob = blob;
    if (compression === "gzip") {
      need(typeof CompressionStream === "function", "compression-unavailable");
      const reader = blob
          .stream()
          .pipeThrough(new CompressionStream("gzip"))
          .getReader(),
        parts = [];
      let bytes = 0;
      try {
        for (;;) {
          cancelled(signal);
          const next = await reader.read();
          if (next.done) break;
          parts.push(next.value);
          bytes += next.value.length;
          if (progress)
            progress({ stage: "compress", done: bytes, total: blob.size });
          await tick();
        }
      } catch (error) {
        await reader.cancel(error).catch(() => {});
        throw error;
      } finally {
        reader.releaseLock();
      }
      encodedBlob = new Blob(parts);
    }
    const encoded =
      compression === "none"
        ? { ...decoded }
        : {
            bytes: encodedBlob.size,
            sha256: await hashBlob(encodedBlob, { signal, progress }),
          };
    return {
      blob: encodedBlob,
      decoded,
      encoded,
      compression,
      encoding: "base64",
      chunkSize,
      chunkCount: Math.ceil(encoded.bytes / chunkSize),
    };
  }
  async function encodeBlob(blob, options = {}) {
    const prepared = await prepareEncoded(blob, options),
      chunks = [];
    for (let at = 0; at < prepared.blob.size; at += prepared.chunkSize) {
      cancelled(options.signal);
      chunks.push(
        bytesToBase64(
          new Uint8Array(
            await prepared.blob
              .slice(at, at + prepared.chunkSize)
              .arrayBuffer(),
          ),
        ),
      );
      await tick();
    }
    const { blob: ignored, ...metadata } = prepared;
    return { ...metadata, chunks };
  }
  function chunkNodes(payload, root) {
    const all = [...root.querySelectorAll("script[data-forge-payload]")];
    const nodes = all.filter(
      (node) => node.dataset.forgePayload === payload.id,
    );
    need(
      nodes.length === payload.chunkCount,
      "payload-chunks",
      `${payload.filename}: expected ${payload.chunkCount}, found ${nodes.length}`,
    );
    const seen = new Set();
    for (let i = 0; i < nodes.length; i++) {
      const value = nodes[i].getAttribute("data-chunk");
      need(
        value === String(i),
        "chunk-order",
        `${payload.filename}: ${value}, expected ${i}`,
      );
      need(!seen.has(value), "chunk-duplicate", payload.filename);
      seen.add(value);
      need(
        nodes[i].type === "application/octet-stream",
        "chunk-type",
        payload.filename,
      );
    }
    return nodes;
  }
  async function decodePayload(payload, root = document, progress, signal) {
    validatePayload(payload);
    const nodes = chunkNodes(payload, root),
      encodedHasher = new IncrementalSha256(),
      decodedHasher = new IncrementalSha256();
    let index = 0,
      encodedBytes = 0,
      decodedBytes = 0;
    const compressed = new ReadableStream({
      async pull(controller) {
        cancelled(signal);
        if (index === nodes.length) {
          controller.close();
          return;
        }
        const value = nodes[index].textContent.replace(/\s+/g, "");
        need(
          value.length <= Math.ceil(payload.chunkSize / 3) * 4,
          "chunk-size",
          payload.filename,
        );
        const bytes = base64ToBytes(value);
        const expected =
          index + 1 === nodes.length
            ? payload.encoded.bytes - index * payload.chunkSize
            : payload.chunkSize;
        need(
          bytes.length === expected,
          "chunk-size",
          `${payload.filename}: chunk ${index}`,
        );
        encodedHasher.update(bytes);
        encodedBytes += bytes.length;
        index++;
        controller.enqueue(bytes);
        await tick();
      },
    });
    need(
      payload.compression !== "gzip" ||
        typeof DecompressionStream === "function",
      "decompression-unavailable",
    );
    const stream =
      payload.compression === "gzip"
        ? compressed.pipeThrough(new DecompressionStream("gzip"))
        : compressed;
    const reader = stream.getReader(),
      parts = [];
    try {
      for (;;) {
        cancelled(signal);
        const next = await reader.read();
        if (next.done) break;
        decodedBytes += next.value.length;
        need(
          decodedBytes <= payload.decoded.bytes,
          "decoded-size-overflow",
          payload.filename,
        );
        decodedHasher.update(next.value);
        parts.push(next.value);
        if (progress)
          progress({
            stage: "verify",
            payloadId: payload.id,
            done: decodedBytes,
            total: payload.decoded.bytes,
          });
        await tick();
      }
      need(
        encodedBytes === payload.encoded.bytes,
        "encoded-size",
        payload.filename,
      );
      need(
        encodedHasher.hex() === payload.encoded.sha256,
        "encoded-hash",
        payload.filename,
      );
      need(
        decodedBytes === payload.decoded.bytes,
        "decoded-size",
        payload.filename,
      );
      need(
        decodedHasher.hex() === payload.decoded.sha256,
        "decoded-hash",
        payload.filename,
      );
      return new Blob(parts, {
        type: payload.mediaType || "application/octet-stream",
      });
    } catch (error) {
      await reader.cancel(error).catch(() => {});
      throw error;
    } finally {
      reader.releaseLock();
    }
  }
  async function verifyCapsule(
    input,
    root = document,
    { signal, progress } = {},
  ) {
    const manifest = validateManifest(input),
      expected = new Set(manifest.payloads.map((payload) => payload.id)),
      blobs = new Map();
    for (const node of root.querySelectorAll("[data-forge-payload]"))
      need(
        expected.has(node.dataset.forgePayload),
        "undeclared-payload",
        node.dataset.forgePayload,
      );
    for (const recipe of manifest.recipes)
      need(
        recipe.saveNamespace === (await recipeNamespace(recipe)),
        "recipe-stale-namespace",
        recipe.id,
      );
    for (const payload of manifest.payloads)
      blobs.set(
        payload.id,
        await decodePayload(payload, root, progress, signal),
      );
    if (manifest.saves)
      await verifySaves(manifest.saves, manifest.recipes, signal);
    return {
      manifest,
      payloads: blobs,
      report: {
        verified: true,
        payloads: blobs.size,
        recipes: manifest.recipes.length,
        offline: true,
        missingBases: manifest.recipes
          .filter((recipe) => recipe.base === null)
          .map((recipe) => recipe.id),
        private: manifest.capsule.private,
      },
    };
  }
  function scriptJSON(value) {
    return JSON.stringify(value)
      .replace(/</g, "\\u003c")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");
  }
  function stripTools(template) {
    const start = "<!-- FORGE_" + "TOOLS_START -->",
      end = "<!-- FORGE_" + "TOOLS_END -->";
    let output = "",
      position = 0;
    for (;;) {
      const at = template.indexOf(start, position);
      if (at === -1) {
        output += template.slice(position);
        break;
      }
      output += template.slice(position, at);
      const stop = template.indexOf(end, at + start.length);
      const nextStart = template.indexOf(start, at + start.length);
      need(
        stop !== -1 && (nextStart === -1 || nextStart >= stop),
        "template-tools-markers",
      );
      position = stop + end.length;
    }
    need(!output.includes(end), "template-tools-markers");
    return output;
  }
  function getTemplate(root = document) {
    const node = root.getElementById("sfhs-forge-template");
    need(node && node.type === "text/plain", "template-missing");
    return new TextDecoder("utf-8", { fatal: true }).decode(
      base64ToBytes(node.textContent.trim(), "template-base64"),
    );
  }
  async function exportPreparedCapsule({
    manifest: input,
    payloads,
    template,
    includeForge = true,
    engineSource,
    writer,
    signal,
    progress,
  }) {
    need(typeof template === "string", "template-missing");
    let m = safeJSON(input, 96 * 1024 * 1024);
    need(
      record(m) &&
        record(m.capsule) &&
        Array.isArray(m.payloads) &&
        Array.isArray(m.recipes),
      "manifest-structure",
    );
    const referenced = new Set();
    for (const recipe of m.recipes) {
      if (recipe.base) referenced.add(recipe.base);
      need(Array.isArray(recipe.files), "recipe-files");
      recipe.files = recipe.files.filter((file) => file.enabled);
      recipe.files.forEach((file) => referenced.add(file.payloadId));
      (recipe.documentIds || []).forEach((id) => referenced.add(id));
      recipe.saveNamespace = await recipeNamespace(recipe);
    }
    m.payloads = m.payloads.filter((payload) => referenced.has(payload.id));
    m.capsule.forge = Boolean(includeForge);
    m.capsule.mode =
      m.recipes.length > 1
        ? "collection"
        : m.recipes[0].base === null
          ? "thin"
          : "full";
    const privateRequired = m.payloads.some(
      (payload) => payload.permission !== "redistributable",
    );
    need(
      !privateRequired || m.capsule.private,
      "export-private-consent",
      "Non-redistributable or unverified content requires an explicit PRIVATE export.",
    );
    m.networkPolicy = { default: "offline" };
    const encoded = new Map();
    for (const payload of m.payloads) {
      cancelled(signal);
      const blob = payloads.get(payload.id);
      need(blob instanceof Blob, "export-missing-payload", payload.filename);
      const prepared = await prepareEncoded(blob, {
        compression: payload.compression || "gzip",
        chunkSize: 262144,
        signal,
        progress,
      });
      need(
        prepared.decoded.sha256 === payload.id &&
          prepared.decoded.bytes === payload.decoded.bytes,
        "export-payload-hash",
        payload.filename,
      );
      const { blob: encodedBlob, ...metadata } = prepared;
      Object.assign(payload, metadata, {
        storage: { kind: "embedded-chunks" },
      });
      encoded.set(payload.id, encodedBlob);
    }
    m = validateManifest(m);
    if (m.saves) await verifySaves(m.saves, m.recipes, signal);
    const retainedTemplate = template;
    if (!includeForge) template = stripTools(template);
    const markers = ["MANIFEST", "PAYLOADS", "TEMPLATE", "ENGINE"];
    for (const marker of markers)
      need(
        template.split(`<!-- FORGE_${marker} -->`).length === 2,
        "template-marker",
        marker,
      );
    if (engineSource === undefined)
      engineSource =
        typeof document === "undefined"
          ? undefined
          : document.getElementById("sfhs-forge-engine")?.textContent;
    need(
      typeof engineSource === "string" && engineSource.length > 0,
      "engine-source-missing",
    );
    // The executable engine exists once. The carried source template retains only its marker.
    const engine = `<script id="sfhs-forge-engine">${engineSource.replace(/<\/script/gi, "<\\/script")}<\/script>`;
    const pieces = [],
      hasher = new IncrementalSha256();
    let bytes = 0;
    const emit = async (value) => {
      cancelled(signal);
      const data = typeof value === "string" ? encoder.encode(value) : value;
      for (let at = 0; at < data.length; at += 262144) {
        cancelled(signal);
        const part = data.subarray(at, at + 262144);
        hasher.update(part);
        bytes += part.length;
        if (writer) await writer.write(part);
        else pieces.push(part);
        if (progress) progress({ stage: "export", done: bytes, total: null });
        await tick();
      }
    };
    try {
      const pattern = /<!-- FORGE_(MANIFEST|PAYLOADS|TEMPLATE|ENGINE) -->/g;
      let position = 0,
        match;
      while ((match = pattern.exec(template))) {
        await emit(template.slice(position, match.index));
        if (match[1] === "MANIFEST")
          await emit(
            `<script id="sfhs-forge-manifest" type="application/json">${scriptJSON(m)}<\/script>`,
          );
        else if (match[1] === "ENGINE") await emit(engine);
        else if (match[1] === "TEMPLATE" && includeForge) {
          await emit('<script id="sfhs-forge-template" type="text/plain">');
          // Multiples of three preserve base64 boundaries without constructing another template-sized string.
          const source = encoder.encode(retainedTemplate),
            size = 196608;
          for (let at = 0; at < source.length; at += size) {
            await emit(bytesToBase64(source.subarray(at, at + size)));
            await tick();
          }
          await emit("<\/script>");
        } else if (match[1] === "PAYLOADS") {
          for (const payload of m.payloads) {
            const blob = encoded.get(payload.id);
            for (let index = 0; index < payload.chunkCount; index++) {
              const chunk = new Uint8Array(
                await blob
                  .slice(
                    index * payload.chunkSize,
                    (index + 1) * payload.chunkSize,
                  )
                  .arrayBuffer(),
              );
              await emit(
                `<script type="application/octet-stream" data-forge-payload="${payload.id}" data-chunk="${index}">`,
              );
              await emit(bytesToBase64(chunk));
              await emit("<\/script>\n");
              await tick();
            }
          }
        }
        position = match.index + match[0].length;
      }
      await emit(template.slice(position));
      if (writer) await writer.close();
      return {
        ...(writer
          ? {}
          : { blob: new Blob(pieces, { type: "text/html;charset=utf-8" }) }),
        bytes,
        sha256: hasher.hex(),
        manifest: m,
      };
    } catch (error) {
      throw error;
    }
  }
  async function exportCapsule(options) {
    try {
      return await exportPreparedCapsule(options);
    } catch (error) {
      if (options.writer && options.writer.abort)
        await options.writer.abort(error).catch(() => {});
      throw error;
    }
  }
  global.SFHSForgeCore = Object.freeze({
    ForgeError,
    IncrementalSha256,
    hashBytes,
    hashBlob,
    bytesToBase64,
    base64ToBytes,
    mountName,
    validatePayload,
    validateRecipe,
    validateLaunchTest,
    validateManifest,
    recipeArgs,
    effectiveFiles,
    recipeNamespace,
    encodeBlob,
    decodePayload,
    verifyCapsule,
    verifySaves,
    exportCapsule,
    getTemplate,
    stripTools,
  });
})(typeof window === "undefined" ? globalThis : window);
