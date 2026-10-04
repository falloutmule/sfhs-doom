/* SFHS Doom Forge archive adapter. Metadata and packages are never requested at boot. */
(() => {
  "use strict";
  const mirrors = Object.freeze([
    {
      id: "youfailit",
      name: "New York /idgames mirror",
      root: "https://youfailit.net/pub/idgames/",
    },
    {
      id: "infania",
      name: "Sweden /idgames mirror",
      root: "https://ftpmirror.infania.net/pub/idgames/",
    },
    {
      id: "mtu",
      name: "Michigan /idgames mirror",
      root: "https://mirrors.lug.mtu.edu/idgames/",
    },
    {
      id: "fu-berlin",
      name: "Primary /idgames download mirror",
      root: "https://ftp.fu-berlin.de/pc/games/idgames/",
    },
  ]);
  const MAX_METADATA_BYTES = 1024 * 1024,
    DEFAULT_PACKAGE_LIMIT = 128 * 1024 * 1024;
  let source = { schema: "sfhs.doom-archive-catalog@1", entries: [] },
    catalogError = null;
  const cleanPath = (value) =>
    typeof value === "string" &&
    value.length <= 512 &&
    !/[\\\x00-\x20?#%]/.test(value) &&
    !value.startsWith("/") &&
    value.split("/").every((part) => part && part !== "." && part !== "..");
  let catalog = Object.freeze([]);
  const entryMap = new Map();
  function installCatalog(text) {
    source = JSON.parse(text);
    if (
      source.schema !== "sfhs.doom-archive-catalog@1" ||
      !Array.isArray(source.entries)
    )
      throw new Error("Unsupported archive catalog");
    catalog = Object.freeze(
      source.entries
        .filter(
          (entry) =>
            entry &&
            cleanPath(entry.path) &&
            entry.path.toLowerCase().endsWith(".zip"),
        )
        .map((entry) =>
          Object.freeze({
            ...entry,
            id: entry.path,
            filename: entry.path.split("/").pop(),
            permission: entry.permission || "unclear",
            compatibility: entry.compatibility || "unknown",
          }),
        ),
    );
    for (const entry of catalog) entryMap.set(entry.id, entry);
  }
  function rejectCatalog(error) {
    catalogError = String(error.message || error);
    source = { schema: "sfhs.doom-archive-catalog@1", entries: [] };
    catalog = Object.freeze([]);
    entryMap.clear();
  }
  async function decodeCatalog(node) {
    const expected = Number(node.dataset.decodedBytes);
    if (
      !Number.isSafeInteger(expected) ||
      expected < 0 ||
      expected > 64 * 1024 * 1024
    )
      throw new Error("Catalog size is invalid");
    const encoded = window.SFHSForgeCore.base64ToBytes(node.textContent.trim());
    const reader = new Blob([encoded])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"))
      .getReader();
    const parts = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > expected) throw new Error("Catalog exceeds declared size");
        parts.push(value);
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    const blob = new Blob(parts);
    if (
      size !== expected ||
      (await window.SFHSForgeCore.hashBlob(blob)) !== node.dataset.sha256
    )
      throw new Error("Catalog integrity check failed");
    installCatalog(await blob.text());
  }
  let ready = Promise.resolve();
  try {
    const node = document.getElementById("sfhs-archive-catalog");
    if (node?.dataset?.compression === "gzip")
      ready = decodeCatalog(node).catch(rejectCatalog);
    else if (node) installCatalog(node.textContent);
  } catch (error) {
    rejectCatalog(error);
  }
  let enabled = false,
    mirrorId = mirrors[0].id,
    maximumBytes = DEFAULT_PACKAGE_LIMIT,
    onProgress = null,
    lastError = null,
    totalBytes = 0,
    sequence = 0;
  const active = new Map(),
    requests = [];
  const fail = (code, message, entry, extra = {}) =>
    Object.assign(new Error(message), {
      code,
      manualUrl: entry ? urlFor(entry.path) : null,
      ...extra,
    });
  const selectedMirror = () => mirrors.find((item) => item.id === mirrorId);
  const urlFor = (path) => {
    if (!cleanPath(path)) throw fail("archive-path", "Unsafe archive path");
    return (
      selectedMirror().root + path.split("/").map(encodeURIComponent).join("/")
    );
  };
  const canonical = (entry) => {
    const id =
      typeof entry === "string"
        ? entry
        : (entry && entry.id) || (entry && entry.path);
    const result = entryMap.get(id);
    if (!result)
      throw fail(
        "archive-entry",
        "Choose an entry from the verified local catalog.",
      );
    return result;
  };
  function status() {
    return {
      enabled,
      sessionOnly: true,
      mirrorId,
      mirror: selectedMirror(),
      allowedOrigins: mirrors.map((item) => new URL(item.root).origin),
      catalogCount: catalog.length,
      catalogGeneratedAt: source.generatedAt || null,
      catalogSource: source.source || null,
      catalogError,
      active: active.size,
      requests: requests.map((item) => ({ ...item })),
      totalBytes,
      lastError,
      maximumBytes,
    };
  }
  function cancel() {
    for (const controller of active.values()) controller.abort();
    return active.size;
  }
  function enable() {
    enabled = true;
    lastError = null;
    return status();
  }
  function disable() {
    enabled = false;
    cancel();
    return status();
  }
  function configure(options = {}) {
    if (options.mirrorId !== undefined) {
      if (!mirrors.some((item) => item.id === options.mirrorId))
        throw fail("archive-mirror", "Unknown archive mirror");
      if (active.size)
        throw fail(
          "archive-busy",
          "Cancel the active request before changing mirrors",
        );
      mirrorId = options.mirrorId;
    }
    if (options.maxDownloadBytes !== undefined) {
      if (
        !Number.isSafeInteger(options.maxDownloadBytes) ||
        options.maxDownloadBytes <= 0
      )
        throw fail("archive-size-limit", "Invalid download limit");
      maximumBytes = options.maxDownloadBytes;
    }
    if (options.onProgress !== undefined) {
      if (
        options.onProgress !== null &&
        typeof options.onProgress !== "function"
      )
        throw fail("archive-progress", "Invalid progress handler");
      onProgress = options.onProgress;
    }
    return status();
  }
  const norm = (value) => String(value ?? "").toLowerCase();
  const ids = (value) => new Set(Array.isArray(value) ? value : []);
  function search(filters = {}) {
    if (typeof filters === "string") filters = { query: filters };
    const query = norm(filters.query || filters.q).trim(),
      tokens = query.split(/\s+/).filter(Boolean),
      favorites = ids(filters.favoriteIds),
      downloaded = ids(filters.downloadedIds);
    let rows = catalog.filter((entry) => {
      const haystack = [entry.title, entry.author, entry.filename, entry.path]
        .map(norm)
        .join(" ");
      if (tokens.some((token) => !haystack.includes(token))) return false;
      for (const key of ["title", "author", "filename"])
        if (filters[key] && !norm(entry[key]).includes(norm(filters[key])))
          return false;
      const family = filters.family || filters.game;
      if (family && family !== "all" && norm(entry.family) !== norm(family))
        return false;
      for (const key of ["type", "permission", "compatibility"])
        if (
          filters[key] &&
          filters[key] !== "all" &&
          entry[key] !== filters[key]
        )
          return false;
      const maps = Number.isInteger(entry.mapCount) ? entry.mapCount : null;
      if (
        filters.mapCount !== undefined &&
        filters.mapCount !== "" &&
        maps !== Number(filters.mapCount)
      )
        return false;
      if (
        filters.minMaps !== undefined &&
        (maps === null || maps < Number(filters.minMaps))
      )
        return false;
      if (
        filters.maxMaps !== undefined &&
        (maps === null || maps > Number(filters.maxMaps))
      )
        return false;
      if (
        filters.year &&
        String(entry.date || "").slice(0, 4) !== String(filters.year)
      )
        return false;
      if (filters.dateFrom && (!entry.date || entry.date < filters.dateFrom))
        return false;
      if (filters.dateTo && (!entry.date || entry.date > filters.dateTo))
        return false;
      if (filters.favorite === true && !favorites.has(entry.id)) return false;
      if (filters.downloaded === true && !downloaded.has(entry.id))
        return false;
      return true;
    });
    const order = filters.sort || "title";
    rows.sort((a, b) =>
      order === "newest"
        ? String(b.date || "").localeCompare(String(a.date || ""))
        : order === "oldest"
          ? String(a.date || "").localeCompare(String(b.date || ""))
          : order === "size"
            ? (a.bytes || 0) - (b.bytes || 0)
            : order === "author"
              ? String(a.author || "\uffff").localeCompare(
                  String(b.author || "\uffff"),
                )
              : String(a.title || a.filename).localeCompare(
                  String(b.title || b.filename),
                ),
    );
    if (filters.offset !== undefined || filters.limit !== undefined) {
      const offset = Math.max(0, Math.floor(Number(filters.offset) || 0)),
        limit =
          filters.limit === undefined
            ? rows.length
            : Math.max(0, Math.floor(Number(filters.limit) || 0));
      rows = rows.slice(offset, offset + limit);
    }
    return rows;
  }
  async function read(entry, path, kind, limit) {
    if (!enabled)
      throw fail(
        "network-disabled",
        "Online browsing is off. Enable this session before requesting archive data.",
        entry,
      );
    const url = urlFor(path),
      controller = new AbortController(),
      id = ++sequence,
      record = { id, kind, url, status: "pending", bytes: 0 };
    active.set(id, controller);
    requests.push(record);
    if (requests.length > 100) requests.shift();
    lastError = null;
    let reader = null;
    try {
      // The approved URL must never redirect to an undeclared endpoint.
      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        redirect: "error",
        signal: controller.signal,
      });
      if (!response.ok)
        throw fail(
          "archive-http",
          `Archive returned HTTP ${response.status}. Open the download link and import the file locally.`,
          entry,
          { httpStatus: response.status },
        );
      const length = Number(response.headers.get("content-length") || 0);
      if (length > limit)
        throw fail(
          "archive-size",
          `Archive response exceeds the ${limit} byte limit.`,
          entry,
        );
      const pieces = [];
      let bytes = 0;
      if (response.body && typeof response.body.getReader === "function") {
        reader = response.body.getReader();
        while (true) {
          if (!enabled || controller.signal.aborted)
            throw fail(
              "archive-cancelled",
              "Archive request cancelled.",
              entry,
            );
          const part = await reader.read();
          if (part.done) break;
          bytes += part.value.byteLength;
          if (bytes > limit)
            throw fail(
              "archive-size",
              `Archive response exceeds the ${limit} byte limit.`,
              entry,
            );
          pieces.push(part.value);
          record.bytes = bytes;
          if (onProgress)
            try {
              onProgress({ id, kind, url, bytes, total: length || null });
            } catch (_) {}
        }
      } else {
        const bytesValue = new Uint8Array(await response.arrayBuffer());
        bytes = bytesValue.length;
        if (bytes > limit)
          throw fail(
            "archive-size",
            `Archive response exceeds the ${limit} byte limit.`,
            entry,
          );
        pieces.push(bytesValue);
        record.bytes = bytes;
      }
      if (!enabled || controller.signal.aborted)
        throw fail("archive-cancelled", "Archive request cancelled.", entry);
      const output = new Uint8Array(bytes);
      let position = 0;
      for (const piece of pieces) {
        output.set(piece, position);
        position += piece.length;
      }
      totalBytes += bytes;
      record.status = "complete";
      return { bytes: output, url };
    } catch (error) {
      if (reader)
        try {
          await reader.cancel();
        } catch (_) {}
      const failed =
        typeof error.code === "string" && error.code.startsWith("archive-")
          ? error
          : controller.signal.aborted
            ? fail("archive-cancelled", "Archive request cancelled.", entry)
            : fail(
                "archive-unavailable",
                "This mirror could not be read by the browser (CORS, connection, or redirect). Open the archive download and import it locally; no proxy or upload is used.",
                entry,
              );
      record.status = failed.code;
      lastError = {
        code: failed.code,
        message: failed.message,
        url,
        manualUrl: failed.manualUrl,
      };
      throw failed;
    } finally {
      active.delete(id);
    }
  }
  async function inspect(value) {
    const entry = canonical(value),
      result = await read(
        entry,
        entry.path.replace(/\.zip$/i, ".txt"),
        "metadata",
        MAX_METADATA_BYTES,
      );
    let readme;
    try {
      readme = new TextDecoder(entry.readmeEncoding || "utf-8", {
        fatal: true,
      }).decode(result.bytes);
    } catch (_) {
      readme = new TextDecoder("windows-1252").decode(result.bytes);
    }
    return {
      entry,
      readme,
      sourceUrl: result.url,
      manualUrl: urlFor(entry.path),
    };
  }
  async function download(value) {
    const entry = canonical(value);
    if (entry.bytes > maximumBytes)
      throw fail(
        "archive-size",
        `Package is ${entry.bytes} bytes, above the configured ${maximumBytes} byte download limit.`,
        entry,
      );
    const result = await read(entry, entry.path, "package", maximumBytes);
    if (entry.bytes && result.bytes.length !== entry.bytes) {
      const error = fail(
        "archive-length",
        `Archive metadata expected ${entry.bytes} bytes; received ${result.bytes.length}. Refresh metadata or download and inspect locally.`,
        entry,
      );
      lastError = {
        code: error.code,
        message: error.message,
        url: result.url,
        manualUrl: error.manualUrl,
      };
      const record = requests.findLast(
        (item) => item.kind === "package" && item.url === result.url,
      );
      if (record) record.status = error.code;
      throw error;
    }
    return {
      entry,
      name: entry.filename,
      filename: entry.filename,
      bytes: result.bytes,
      blob: new Blob([result.bytes], { type: "application/zip" }),
      source: {
        kind: "idgames",
        url: result.url,
        path: entry.path,
        catalogGeneratedAt: source.generatedAt || null,
      },
      manualUrl: result.url,
    };
  }
  window.SFHSForgeArchive = Object.freeze({
    get catalog() {
      return catalog;
    },
    ready,
    mirrors,
    enable,
    disable,
    status,
    configure,
    cancel,
    search,
    inspect,
    download,
    manualUrl: (value) => urlFor(canonical(value).path),
  });
})();
