/* Shared capsule launcher, local persistence and player lifecycle. No network. */
(() => {
  "use strict";
  const C = window.SFHSForgeCore,
    $ = (id) => document.getElementById(id),
    clone = (x) => structuredClone(x);
  const state = {
    manifest: null,
    payloads: new Map(),
    blobs: new Map(),
    recipes: [],
    selected: null,
    build: [],
    drafts: [],
    inspection: null,
    imported: [],
    storage: "opening",
    error: null,
    launch: null,
    export: null,
    warnings: [],
  };
  let db = null,
    saveTimer = null,
    saving = null,
    launching = false;
  const memory = new Map();
  function message(value) {
    $("forge-message").textContent = String(value || "");
  }
  function fail(error) {
    state.error = String(error.message || error);
    message(state.error);
    console.warn("Forge: " + state.error);
    return error;
  }
  async function openDB() {
    try {
      db = await new Promise((resolve, reject) => {
        const r = indexedDB.open("sfhs-doom-forge-v3", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("records");
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
        r.onblocked = () =>
          reject(
            new Error("Local library is blocked by another open version."),
          );
      });
      state.storage = "indexeddb";
    } catch (error) {
      state.storage = "memory-only";
      message(
        "Persistent storage is unavailable here. Your session works, but export a backup before closing. " +
          error.message,
      );
    }
  }
  async function get(key) {
    if (!db) return memory.get(key);
    return new Promise((resolve, reject) => {
      const r = db.transaction("records").objectStore("records").get(key);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async function put(key, value) {
    if (!db) {
      memory.set(key, value);
      return;
    }
    try {
      await new Promise((resolve, reject) => {
        const t = db.transaction("records", "readwrite");
        t.objectStore("records").put(value, key);
        t.oncomplete = resolve;
        t.onerror = () =>
          reject(t.error || new Error("Storage transaction failed"));
        t.onabort = () =>
          reject(t.error || new Error("Storage transaction aborted"));
      });
    } catch (error) {
      const estimate = await navigator.storage?.estimate?.().catch(() => ({}));
      throw new Error(
        "Storage write failed (" +
          (error?.name || "StorageError") +
          "). Used " +
          (estimate?.usage || "unknown") +
          " of " +
          (estimate?.quota || "unknown") +
          " bytes. Remove unused library content or export a backup.",
      );
    }
  }
  async function remove(key) {
    if (!db) {
      memory.delete(key);
      return;
    }
    return new Promise((resolve, reject) => {
      const t = db.transaction("records", "readwrite");
      t.objectStore("records").delete(key);
      t.oncomplete = resolve;
      t.onerror = () =>
        reject(t.error || new Error("Storage transaction failed"));
      t.onabort = () =>
        reject(t.error || new Error("Storage transaction aborted"));
    });
  }
  async function keys() {
    if (!db) return [...memory.keys()];
    return new Promise((resolve, reject) => {
      const r = db.transaction("records").objectStore("records").getAllKeys();
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  const workspaceKey = () => "workspace:" + state.manifest.capsule.id;
  async function persist() {
    await put(workspaceKey(), {
      schema: 1,
      recipes: state.recipes,
      selected: state.selected,
      build: state.build,
      drafts: state.drafts,
    });
  }
  function selected() {
    return (
      state.recipes.find((x) => x.id === state.selected) || state.recipes[0]
    );
  }
  function node(tag, text, cls) {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  function button(text, action) {
    const e = node("button", text);
    e.type = "button";
    e.addEventListener("click", () =>
      Promise.resolve().then(action).catch(fail),
    );
    return e;
  }
  function tab(name) {
    document
      .querySelectorAll("[data-panel]")
      .forEach((e) => (e.hidden = e.dataset.panel !== name));
    document
      .querySelectorAll("[data-tab]")
      .forEach((e) =>
        e.setAttribute("aria-selected", String(e.dataset.tab === name)),
      );
    $("forge-start-card").scrollTop = 0;
  }
  function renderGames() {
    const list = $("forge-games");
    list.replaceChildren();
    for (const r of state.recipes) {
      const card = node(
        "article",
        undefined,
        "forge-item" + (r.id === state.selected ? " selected" : ""),
      );
      card.append(
        node("h3", r.title + (state.drafts.includes(r.id) ? " · Draft" : "")),
        node(
          "p",
          (r.author || "Local recipe") +
            " · " +
            (r.family === "doom" ? "Doom" : "Doom II") +
            " · " +
            (r.base
              ? state.payloads.get(r.base)?.filename || "Missing base"
              : "Base required"),
        ),
        node(
          "p",
          (r.compatibility?.label ||
            r.compatibility?.status ||
            "Recipe ready for local test") +
            (r.mapCount ? " · " + r.mapCount + " maps" : ""),
        ),
        node(
          "p",
          r.lastPlayed
            ? "Last played " + new Date(r.lastPlayed).toLocaleString()
            : "Not yet played",
        ),
      );
      if (r.launchTest)
        card.append(
          node(
            "p",
            "Last recorded launch: " +
              r.launchTest.status +
              " · " +
              new Date(
                r.launchTest.finishedAt || r.launchTest.attemptedAt,
              ).toLocaleString(),
          ),
        );
      const actions = node("div", undefined, "actions");
      actions.append(
        button(r.id === state.selected ? "Selected" : "Select", async () => {
          state.selected = r.id;
          await persist();
          render();
        }),
        button(r.favorite ? "★ Favorite" : "☆ Favorite", async () => {
          r.favorite = !r.favorite;
          await persist();
          renderGames();
        }),
      );
      if (state.manifest.capsule.forge)
        actions.append(
          button("Edit recipe", () => {
            state.selected = r.id;
            render();
            tab("recipe");
          }),
          button(
            state.build.includes(r.id) ? "In build" : "Add to build",
            async () => {
              if (!state.build.includes(r.id)) state.build.push(r.id);
              await persist();
              render();
            },
          ),
        );
      card.append(actions);
      list.append(card);
    }
    const r = selected();
    $("thin-base-panel").hidden = !!r?.base;
    $("thin-base-help").textContent =
      "Select a compatible " +
      (r?.family === "doom"
        ? "Doom / Freedoom Phase 1"
        : "Doom II / Freedoom Phase 2") +
      " IWAD. It will stay local.";
  }
  function render() {
    renderGames();
    window.SFHSForgeTools?.render();
  }
  async function quarantine(key, value, error) {
    const reason = String(error?.message || error);
    let preserved = false;
    try {
      await put("recovery:" + Date.now() + ":" + crypto.randomUUID(), {
        key,
        reason,
        value,
      });
      preserved = true;
      await remove(key);
    } catch (_) {}
    const warning =
      "Ignored corrupt local record " +
      key +
      ": " +
      reason +
      ". " +
      (preserved
        ? "A recovery copy was preserved."
        : "The original was left in storage for recovery.");
    state.warnings.push(warning);
    message(warning);
  }
  async function payloadBlob(id) {
    if (state.blobs.has(id)) return state.blobs.get(id);
    const p = state.payloads.get(id);
    if (!p) throw new Error("Missing payload " + id);
    const stored = await get("payload:" + id);
    let blob;
    if (stored !== undefined) {
      try {
        validateStoredPayload("payload:" + id, stored);
        if ((await C.hashBlob(stored.blob)) !== p.decoded.sha256)
          throw new Error("Stored content hash does not match " + p.filename);
        blob = stored.blob;
      } catch (error) {
        await quarantine("payload:" + id, stored, error);
        if (!state.manifest.payloads.some((item) => item.id === id))
          throw new Error(
            "Local payload " +
              p.filename +
              " is corrupt. Import the original file or restore a backup.",
          );
      }
    }
    if (!blob)
      blob = await C.decodePayload(p, document, () =>
        message("Verifying " + p.filename + "…"),
      );
    if (
      blob.size !== p.decoded.bytes ||
      (await C.hashBlob(blob)) !== p.decoded.sha256
    )
      throw new Error("Corrupt payload " + p.filename);
    state.blobs.set(id, blob);
    return blob;
  }
  function validateStoredPayload(key, item) {
    if (!item || !(item.blob instanceof Blob))
      throw new Error("Missing content bytes");
    if (item.schema !== undefined && item.schema !== "sfhs.doom-content@1")
      throw new Error("Unknown local content record schema");
    if (item.launchTests !== undefined) {
      if (
        !item.launchTests ||
        typeof item.launchTests !== "object" ||
        Array.isArray(item.launchTests) ||
        Object.keys(item.launchTests).length > 256
      )
        throw new Error("Invalid content launch tests");
      for (const [namespace, test] of Object.entries(item.launchTests)) {
        C.validateLaunchTest(test);
        if (namespace !== test.saveNamespace)
          throw new Error("Content launch test namespace mismatch");
      }
    }
    C.validatePayload(item.payload);
    if (
      key !== "payload:" + item.payload.id ||
      item.blob.size !== item.payload.decoded.bytes
    )
      throw new Error("Payload key, identity or size does not match");
    if (
      item.aliases !== undefined &&
      (!Array.isArray(item.aliases) ||
        item.aliases.some((name) => typeof name !== "string"))
    )
      throw new Error("Invalid content aliases");
    if (item.sources !== undefined && !Array.isArray(item.sources))
      throw new Error("Invalid content sources");
    return item;
  }
  async function storePayload(payload, blob, keep = false) {
    C.validatePayload(payload);
    if (
      !(blob instanceof Blob) ||
      blob.size !== payload.decoded.bytes ||
      (await C.hashBlob(blob)) !== payload.id
    )
      throw new Error(
        "Imported payload bytes do not match their declared identity",
      );
    let previous = await get("payload:" + payload.id);
    if (previous !== undefined)
      try {
        validateStoredPayload("payload:" + payload.id, previous);
      } catch (error) {
        await quarantine("payload:" + payload.id, previous, error);
        previous = null;
      }
    const aliases = [
        ...new Set([
          ...(previous?.aliases || []),
          ...(Array.isArray(payload.aliases)
            ? payload.aliases.filter((x) => typeof x === "string")
            : []),
          payload.filename,
        ]),
      ],
      sources = [...(previous?.sources || [])];
    if (payload.source) {
      const { records, ...source } = payload.source;
      for (const candidate of [
        source,
        ...(Array.isArray(records) ? records : []),
      ]) {
        if (
          !sources.some((x) => JSON.stringify(x) === JSON.stringify(candidate))
        )
          sources.push(candidate);
      }
    }
    const canonical =
      state.manifest.payloads.find((item) => item.id === payload.id) || payload;
    const record = {
      schema: "sfhs.doom-content@1",
      payload: canonical,
      blob,
      aliases,
      sources,
      launchTests: previous?.launchTests || {},
      keep: keep || previous?.keep || false,
    };
    await put("payload:" + payload.id, record);
    state.payloads.set(payload.id, canonical);
    state.blobs.set(payload.id, blob);
    return record;
  }
  async function loadSaves(r) {
    const namespace = await C.recipeNamespace(r),
      local = await get("saves:" + namespace);
    if (local !== undefined) {
      try {
        await C.verifySaves(local, [{ ...r, saveNamespace: namespace }]);
        return local;
      } catch (error) {
        await quarantine("saves:" + namespace, local, error);
      }
    }
    const embedded =
      state.manifest.saves?.filter((x) => x.namespace === namespace) || [];
    await C.verifySaves(embedded, [{ ...r, saveNamespace: namespace }]);
    return embedded;
  }
  function saveNow() {
    if (saving) return saving;
    if (!state.launch || !window.Module?.FS) return Promise.resolve();
    saving = (async () => {
      const namespace = state.launch.saveNamespace,
        fs = Module.FS,
        path = "/persist/" + namespace;
      let names;
      try {
        names = fs
          .readdir(path)
          .filter(
            (x) =>
              /^[A-Za-z0-9][A-Za-z0-9_.-]*\.dsg$/i.test(x) && !x.includes(".."),
          );
      } catch (_) {
        return;
      }
      const saves = [];
      for (const filename of names) {
        const bytes = fs.readFile(path + "/" + filename);
        saves.push({
          namespace,
          filename,
          bytes: bytes.length,
          sha256: await C.hashBlob(new Blob([bytes])),
          data: C.bytesToBase64(bytes),
        });
      }
      await put("saves:" + namespace, saves);
    })().finally(() => {
      saving = null;
    });
    return saving;
  }
  async function recordLaunchTest(recipe, result) {
    C.validateLaunchTest(result);
    recipe.launchTest = clone(result);
    if (state.launch?.saveNamespace === result.saveNamespace)
      state.launch.launchTest = clone(result);
    await persist();
    const ids = new Set(
      [
        recipe.base,
        ...recipe.files
          .filter((file) => file.enabled)
          .map((file) => file.payloadId),
      ].filter(Boolean),
    );
    for (const id of ids) {
      const key = "payload:" + id,
        item = await get(key);
      if (!item) continue;
      validateStoredPayload(key, item);
      const entries = Object.entries(item.launchTests || {})
        .filter(([namespace]) => namespace !== result.saveNamespace)
        .slice(-255);
      item.schema = "sfhs.doom-content@1";
      item.launchTests = Object.fromEntries([
        ...entries,
        [result.saveNamespace, clone(result)],
      ]);
      await put(key, item);
    }
  }
  async function waitForNativeBoot() {
    const deadline = performance.now() + 15000;
    while (performance.now() < deadline) {
      const player = window.SFHSForgePlayer.snapshot();
      if (player.error || player.mountStage === "failed")
        throw new Error(player.error || "Native engine startup failed");
      const mainInvocations =
          window.SFHS_WASM_TEST.forgeSnapshot().mainInvocations,
        presents =
          window.SFHSDoomMobileControls?.snapshot().presentation.sdl
            ?.presents || 0;
      if (mainInvocations === 1 && presents > 0)
        return { mainInvocations, presents };
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(
      "Native engine did not present a frame within 15 seconds. The recipe is preserved.",
    );
  }
  async function launch(r = selected()) {
    if (launching) throw new Error("A game is already being prepared.");
    launching = true;
    $("start-doom").disabled = true;
    let attempt;
    try {
      if (!r) throw new Error("Choose a recipe.");
      if (window.SFHS_P6_STATE.mainStarted)
        throw new Error("Return to Forge before switching recipes.");
      r.saveNamespace = await C.recipeNamespace(r);
      attempt = {
        status: "attempted",
        saveNamespace: r.saveNamespace,
        attemptedAt: Date.now(),
      };
      await recordLaunchTest(r, attempt);
      if (r.compatibility?.status === "unsupported-by-engine")
        throw new Error(
          "This package requires an unsupported engine: " +
            (r.compatibility.evidence || []).join("; "),
        );
      if (
        r.compatibility?.status === "manual-recipe-required" &&
        !r.manualOverride
      )
        throw new Error(
          "Review this package’s compatibility findings under Advanced and confirm the manual recipe.",
        );
      if (!r.base) {
        tab("games");
        $("thin-base-panel").hidden = false;
        throw new Error("This thin recipe needs a compatible local IWAD.");
      }
      const required = [
          r.base,
          ...r.files.filter((x) => x.enabled !== false).map((x) => x.payloadId),
        ],
        blobs = new Map();
      for (const id of r.documentIds || []) {
        const p = state.payloads.get(id);
        if (p?.inspection?.compatibility?.status === "unsupported-by-engine") {
          throw new Error(
            p.filename + ": " + p.inspection.compatibility.evidence.join("; "),
          );
        }
      }
      for (const id of required) {
        const p = state.payloads.get(id);
        if (!p) throw new Error("Missing recipe payload " + id);
        const compatibility = p.inspection?.compatibility;
        if (compatibility?.status === "unsupported-by-engine")
          throw new Error(
            p.filename +
              ": unsupported by Chocolate Doom. " +
              (compatibility.evidence || []).join("; "),
          );
        if (
          compatibility?.status === "manual-recipe-required" &&
          !r.manualOverride
        )
          throw new Error(
            p.filename +
              ": review Advanced compatibility and confirm the manual recipe.",
          );
        blobs.set(id, await payloadBlob(id));
      }
      r.saveNamespace = await C.recipeNamespace(r);
      await persist();
      message("Preparing " + r.title + "…");
      const saves = await loadSaves(r);
      await window.SFHSForgePlayer.prepare(
        r,
        [...state.payloads.values()],
        blobs,
        saves,
      );
      state.launch = clone(r);
      window.SFHSForgePlayer.start();
      const evidence = await waitForNativeBoot();
      r.lastPlayed = Date.now();
      await recordLaunchTest(r, {
        ...attempt,
        status: "booted",
        finishedAt: Date.now(),
        ...evidence,
      });
      message("");
      saveTimer = setInterval(() => saveNow().catch(fail), 2500);
    } catch (error) {
      if (attempt) {
        try {
          await recordLaunchTest(r, {
            ...attempt,
            status: "failed",
            finishedAt: Date.now(),
            message: String(error.message || error).slice(0, 500),
          });
        } catch (storageError) {
          state.warnings.push(
            "Launch result could not be saved: " + storageError.message,
          );
        }
      }
      if (attempt && window.SFHS_P6_STATE.mainStarted) {
        window.SFHSForgePlayer.showForge();
        window.dispatchEvent(
          new CustomEvent("forge-launch-error", {
            detail: String(error.message || error),
          }),
        );
      }
      throw error;
    } finally {
      launching = false;
      $("start-doom").disabled = false;
    }
  }
  async function returnToForge() {
    window.SFHSForgePlayer.release();
    clearInterval(saveTimer);
    await saveNow();
    await persist();
    if (!db) {
      window.SFHSForgePlayer.showForge();
      tab(state.manifest.capsule.forge ? "build" : "storage");
      message(
        state.manifest.capsule.forge
          ? "Persistent storage is unavailable. Your draft remains open. Export a Forge backup before reopening to switch games."
          : "Persistent storage is unavailable. Export your saves before reopening this file to switch games.",
      );
      return;
    }
    location.reload();
  }
  function externalRuntimeDependencies() {
    const refs = new Set();
    const add = (value) => {
      const url = String(value || "").trim();
      if (url && !/^(?:data:|blob:|about:blank(?:$|#)|#)/i.test(url))
        refs.add(url.slice(0, 500));
    };
    for (const [selector, attribute] of [
      [
        "script[src],iframe[src],frame[src],img[src],audio[src],video[src],source[src],track[src],embed[src],input[type=image][src]",
        "src",
      ],
      ["link[href]", "href"],
      ["video[poster]", "poster"],
      ["object[data]", "data"],
    ])
      for (const element of document.querySelectorAll(selector))
        add(element.getAttribute(attribute));
    for (const element of document.querySelectorAll(
      "img[srcset],source[srcset],link[imagesrcset]",
    )) {
      const value =
        element.getAttribute("srcset") ||
        element.getAttribute("imagesrcset") ||
        "";
      let at = 0;
      while (at < value.length) {
        while (/[\s,]/.test(value[at] || "") && at < value.length) at++;
        const start = at;
        while (at < value.length && !/\s/.test(value[at])) at++;
        const token = value.slice(start, at);
        add(token.replace(/,+$/, ""));
        if (!token.endsWith(","))
          while (at < value.length && value[at] !== ",") at++;
      }
    }
    const cssValues = [...document.querySelectorAll("style")].map(
      (element) => element.textContent,
    );
    cssValues.push(
      ...[...document.querySelectorAll("[style]")].map((element) =>
        element.getAttribute("style"),
      ),
    );
    for (const value of cssValues) {
      const css = String(value)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\\([0-9a-f]{1,6})\s?|\\(.)/gi, (_, hex, literal) =>
          hex
            ? String.fromCodePoint(Math.min(0x10ffff, parseInt(hex, 16)))
            : literal,
        );
      for (const match of css.matchAll(
        /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi,
      ))
        add(match[1] ?? match[2] ?? match[3]);
      for (const match of css.matchAll(/@import\s+["']([^"']+)["']/gi))
        add(match[1]);
    }
    return [...refs];
  }
  async function verify() {
    const report = [];
    try {
      const { manifest } = await C.verifyCapsule(
        JSON.parse($("sfhs-forge-manifest").textContent),
        document,
      );
      report.push(
        "Manifest: PASS · " + manifest.schema,
        "Engine: Chocolate Doom",
        "Payloads: " + manifest.payloads.length,
        "Network policy: offline by default",
      );
      if (manifest.capsule.forge && window.SFHSForgeArchive) {
        await window.SFHSForgeArchive.ready;
        const catalog = window.SFHSForgeArchive.status();
        if (catalog.catalogError)
          throw new Error(
            "Catalog integrity check failed: " + catalog.catalogError,
          );
        report.push("Catalog: " + catalog.catalogCount + " entries");
      }
      for (const p of manifest.payloads)
        report.push(
          "PASS " +
            p.filename +
            " · " +
            p.decoded.bytes +
            " bytes\nSHA-256 " +
            p.decoded.sha256 +
            "\nPermission " +
            p.permission,
        );
      for (const r of manifest.recipes)
        report.push(
          r.title +
            ": " +
            (r.base
              ? "embedded base"
              : "external " + r.family + " IWAD required") +
            " · save namespace " +
            r.saveNamespace,
        );
      const refs = externalRuntimeDependencies();
      if (refs.length)
        throw new Error(
          "Unexpected external runtime dependencies: " + refs.join(", "),
        );
      report.push(
        "External runtime dependencies: 0",
        "Offline: " +
          (manifest.recipes.some((r) => !r.base)
            ? "Requires local base for thin recipes"
            : "PASS"),
        "Capsule permission: " +
          (manifest.capsule.private
            ? "PRIVATE / NOT VERIFIED FOR REDISTRIBUTION"
            : "Redistributable according to carried permission records; original notices included"),
        "Verification: PASS",
      );
      state.verification = { pass: true, report };
    } catch (error) {
      report.push("FAIL: " + error.message);
      state.verification = { pass: false, report };
    }
    $("verify-report").textContent = report.join("\n\n");
    return state.verification;
  }
  async function storage() {
    const all = await keys();
    let payloadBytes = 0,
      saveBytes = 0,
      count = 0;
    for (const key of all) {
      if (String(key).startsWith("payload:")) {
        const x = await get(key);
        payloadBytes += x?.blob?.size || 0;
        count++;
      }
      if (String(key).startsWith("saves:")) {
        const saves = await get(key);
        if (Array.isArray(saves))
          for (const s of saves)
            if (Number.isSafeInteger(s?.bytes) && s.bytes >= 0)
              saveBytes += s.bytes;
      }
    }
    const estimate = await navigator.storage?.estimate?.().catch(() => ({}));
    $("storage-summary").textContent =
      "Storage: " +
      state.storage +
      "\nLibrary: " +
      count +
      " unique payloads · " +
      payloadBytes.toLocaleString() +
      " bytes\nSaves: " +
      saveBytes.toLocaleString() +
      " bytes\nCatalog: embedded snapshot (no cached downloads)\nOrigin usage: " +
      (estimate?.usage || 0).toLocaleString() +
      " / " +
      (estimate?.quota || 0).toLocaleString() +
      " bytes";
    return { payloadBytes, saveBytes, count, ...estimate };
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob),
      a = node("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  async function selectBase(file) {
    if (!(file instanceof Blob)) throw new Error("Choose a local IWAD file.");
    const blob = file,
      bytes = new Uint8Array(await blob.arrayBuffer()),
      v = new DataView(bytes.buffer);
    if (
      bytes.length < 12 ||
      String.fromCharCode(...bytes.subarray(0, 4)) !== "IWAD"
    )
      throw new Error("Choose an IWAD base, not a PWAD add-on.");
    const count = v.getUint32(4, true),
      directory = v.getUint32(8, true);
    if (
      count > 100000 ||
      directory < 12 ||
      directory + count * 16 > bytes.length
    )
      throw new Error("Invalid IWAD directory.");
    let doom = false,
      doom2 = false;
    const unsupported = [];
    for (let i = 0; i < count; i++) {
      const at = directory + i * 16,
        offset = v.getUint32(at, true),
        length = v.getUint32(at + 4, true);
      if (offset + length > bytes.length || (length > 0 && offset < 12))
        throw new Error("Invalid IWAD lump bounds.");
      const name = String.fromCharCode(...bytes.subarray(at + 8, at + 16))
        .replace(/\0.*$/, "")
        .toUpperCase();
      if (/^E\dM\d$/.test(name)) doom = true;
      if (/^MAP\d\d$/.test(name)) doom2 = true;
      if (
        [
          "BEHAVIOR",
          "TEXTMAP",
          "ZSCRIPT",
          "DECORATE",
          "MAPINFO",
          "ZMAPINFO",
          "UMAPINFO",
        ].includes(name)
      )
        unsupported.push(name);
    }
    if (unsupported.length)
      throw new Error(
        "This base contains unsupported engine markers: " +
          [...new Set(unsupported)].join(", "),
      );
    const r = selected();
    if (!(r.family === "doom" ? doom : doom2))
      throw new Error(
        "Base family does not match this " + r.family + " recipe.",
      );
    const hash = await C.hashBlob(blob),
      known = state.manifest.payloads.find((p) => p.id === hash),
      filename =
        String(file.name || "local-base.wad")
          .split(/[\\/]/)
          .pop()
          .replace(/[^a-zA-Z0-9_.-]/g, "_")
          .replace(/\.\.+/g, "_")
          .replace(/^[^a-zA-Z0-9]+/, "")
          .slice(0, 150) || "local-base.wad";
    const p = known || {
      id: hash,
      filename,
      role: "iwad",
      decoded: { bytes: blob.size, sha256: hash },
      encoded: { bytes: blob.size, sha256: hash },
      compression: "none",
      encoding: "base64",
      chunkSize: 262144,
      chunkCount: Math.ceil(blob.size / 262144),
      storage: { kind: "embedded-chunks" },
      permission: "private-local",
      license: "Unverified local IWAD",
      source: { kind: "local" },
      inspection: { targetGame: r.family, kind: "IWAD" },
    };
    C.validateRecipe(
      { ...r, base: hash },
      new Map([...state.payloads, [hash, p]]),
    );
    await storePayload(p, blob);
    r.base = hash;
    r.saveNamespace = await C.recipeNamespace(r);
    await persist();
    render();
    message(
      "Base replaced with " +
        p.filename +
        ". " +
        (known
          ? "Known included license retained."
          : "PRIVATE / NOT VERIFIED FOR REDISTRIBUTION."),
    );
  }
  async function initialize() {
    state.manifest = C.validateManifest(
      JSON.parse($("sfhs-forge-manifest").textContent),
    );
    for (const p of state.manifest.payloads) state.payloads.set(p.id, p);
    state.recipes = clone(state.manifest.recipes);
    state.selected = state.manifest.defaultRecipe || state.recipes[0]?.id;
    state.build = state.recipes.map((x) => x.id);
    await openDB();
    for (const key of await keys())
      if (String(key).startsWith("payload:")) {
        const item = await get(key);
        try {
          validateStoredPayload(key, item);
          if (!state.payloads.has(item.payload.id))
            state.payloads.set(item.payload.id, item.payload);
        } catch (error) {
          await quarantine(key, item, error);
        }
      }
    const saved = await get(workspaceKey());
    if (saved !== undefined) {
      try {
        if (
          saved.schema !== 1 ||
          !Array.isArray(saved.recipes) ||
          !saved.recipes.length ||
          saved.recipes.length > 256
        )
          throw new Error("Invalid workspace record");
        const recipeIds = new Set();
        for (const r of saved.recipes) {
          C.validateRecipe(r, [...state.payloads.values()]);
          if (recipeIds.has(r.id)) throw new Error("Duplicate saved recipe");
          recipeIds.add(r.id);
          r.saveNamespace = await C.recipeNamespace(r);
        }
        if (
          !recipeIds.has(saved.selected) ||
          !Array.isArray(saved.build) ||
          new Set(saved.build).size !== saved.build.length ||
          saved.build.some((id) => !recipeIds.has(id))
        )
          throw new Error("Invalid saved selection or build");
        state.recipes = saved.recipes;
        state.selected = saved.selected;
        state.drafts = Array.isArray(saved.drafts) ? saved.drafts : [];
        state.build = saved.build;
      } catch (error) {
        await quarantine(workspaceKey(), saved, error);
      }
    }
    const prefs = state.manifest.preferences;
    if (
      prefs &&
      !(await get("preferences-applied:" + state.manifest.capsule.id))
    ) {
      try {
        if (prefs.controls)
          window.SFHS_WASM_TEST.setMobileControlsProfile(prefs.controls);
        if (prefs.mobileUi)
          window.SFHSForgePlayer.applyMobilePreferences(prefs.mobileUi);
        await put("preferences-applied:" + state.manifest.capsule.id, true);
      } catch (error) {
        const warning =
          "Optional capsule preferences could not be applied: " + error.message;
        state.warnings.push(warning);
        message(warning);
      }
    }
    $("forge-summary").textContent =
      state.manifest.capsule.name +
      " · " +
      state.manifest.recipes.length +
      " game(s) · " +
      (state.manifest.capsule.private
        ? "PRIVATE / NOT VERIFIED FOR REDISTRIBUTION"
        : "Offline capsule");
    document
      .querySelectorAll("[data-tab]")
      .forEach((e) => e.addEventListener("click", () => tab(e.dataset.tab)));
    $("start-doom").addEventListener("click", () => launch().catch(fail));
    $("return-forge").addEventListener("click", () =>
      returnToForge().catch(fail),
    );
    $("forge-recover-engine").addEventListener("click", () =>
      returnToForge().catch(fail),
    );
    $("forge-base-file").addEventListener("change", (e) => {
      if (e.target.files[0]) selectBase(e.target.files[0]).catch(fail);
      e.target.value = "";
    });
    $("verify-capsule").addEventListener("click", verify);
    $("storage-refresh").addEventListener("click", () => storage().catch(fail));
    $("storage-persist").addEventListener("click", async () =>
      message(
        (await navigator.storage?.persist?.())
          ? "Persistent storage granted."
          : "Persistent storage was not granted; keep a backup.",
      ),
    );
    $("saves-export").addEventListener("click", async () => {
      try {
        await saveNow();
        download(
          new Blob(
            [
              JSON.stringify({
                schema: "sfhs.doom-saves@1",
                saves: await loadSaves(selected()),
              }),
            ],
            { type: "application/json" },
          ),
          "doom-saves.json",
        );
      } catch (error) {
        fail(error);
      }
    });
    $("saves-import").addEventListener("change", async (e) => {
      try {
        const f = e.target.files[0];
        if (!f) return;
        if (f.size > 90 * 1024 * 1024)
          throw new Error("Save backup too large.");
        const doc = JSON.parse(await f.text());
        if (doc.schema !== "sfhs.doom-saves@1")
          throw new Error("Unknown saves format");
        const ns = await C.recipeNamespace(selected());
        await C.verifySaves(doc.saves, [{ ...selected(), saveNamespace: ns }]);
        if (doc.saves.some((s) => s.namespace !== ns))
          throw new Error("These saves belong to a different recipe.");
        await put("saves:" + ns, doc.saves);
        message("Saves restored for this recipe.");
      } catch (error) {
        fail(error);
      } finally {
        e.target.value = "";
      }
    });
    $("saves-clear").addEventListener("click", async () => {
      try {
        await saveNow();
        const ns = await C.recipeNamespace(selected());
        if (state.launch?.saveNamespace === ns && window.Module?.FS) {
          const fs = Module.FS,
            path = "/persist/" + ns;
          for (const name of fs.readdir(path))
            if (
              /^[A-Za-z0-9][A-Za-z0-9_.-]*\.dsg$/i.test(name) &&
              !name.includes("..")
            )
              fs.unlink(path + "/" + name);
        }
        await put("saves:" + ns, []);
        message("Selected recipe saves cleared.");
        await storage();
      } catch (error) {
        fail(error);
      }
    });
    window.addEventListener("forge-launch-error", (e) => {
      clearInterval(saveTimer);
      const recipe = state.recipes.find((item) => item.id === state.launch?.id);
      if (
        recipe?.launchTest?.status === "booted" &&
        recipe.launchTest.saveNamespace === state.launch?.saveNamespace
      )
        recordLaunchTest(recipe, {
          ...recipe.launchTest,
          status: "failed",
          finishedAt: Date.now(),
          message: String(e.detail).slice(0, 500),
        }).catch((error) =>
          state.warnings.push(
            "Launch failure result could not be saved: " + error.message,
          ),
        );
      $("forge-recover-engine").hidden = false;
      $("forge-recover-engine").focus();
      message(
        "Game failed: " +
          e.detail +
          ". Recipe preserved. Use Return to Forge to recover.",
      );
    });
    window.addEventListener("pagehide", () => {
      saveNow().catch(() => {});
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) saveNow().catch(fail);
    });
    if (state.manifest.capsule.forge && window.SFHSForgeTools)
      await window.SFHSForgeTools.init();
    render();
    tab("games");
    await storage();
    await window.SFHSForgePlayer.ready;
    $("setup-status").textContent = "Ready · select a game or import content.";
    state.ready = true;
  }
  window.SFHSForgeApp = {
    state,
    C,
    $,
    node,
    button,
    message,
    fail,
    tab,
    render,
    selected,
    persist,
    get,
    put,
    remove,
    keys,
    storePayload,
    payloadBlob,
    launch,
    selectBase,
    returnToForge,
    saveNow,
    loadSaves,
    storage,
    download,
    verify,
    inspection: () => clone(state.inspection),
    snapshot: () => ({
      ready: state.ready,
      storage: state.storage,
      selected: state.selected,
      recipes: clone(state.recipes),
      payloads: [...state.payloads.values()].map(clone),
      build: [...state.build],
      launch: clone(state.launch),
      error: state.error,
      export: state.export,
      verification: state.verification,
    }),
  };
  document.addEventListener(
    "DOMContentLoaded",
    () =>
      initialize().catch((error) => {
        fail(error);
        $("setup-status").textContent = "Capsule rejected: " + error.message;
        $("start-doom").disabled = true;
      }),
    { once: true },
  );
})();
