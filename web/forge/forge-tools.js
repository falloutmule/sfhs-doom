/* Forge authoring tools. This complete block is omitted from player exports. */
(() => {
  "use strict";
  let A,
    S,
    C,
    $,
    worker = null,
    pendingReject = null,
    exportAbort = null,
    archivePage = 0,
    archiveMatches = [],
    favoriteIds = new Set(),
    downloadedIds = new Set();
  const copy = (x) => structuredClone(x),
    id = () => "game-" + crypto.randomUUID(),
    safeName = (x) =>
      String(x)
        .split(/[\\/]/)
        .pop()
        .replace(/[^a-zA-Z0-9_.-]/g, "_")
        .replace(/\.\./g, "_")
        .replace(/^[^a-zA-Z0-9]+/, "")
        .slice(0, 150) || "content.bin";
  const role = (kind) =>
    ({ IWAD: "iwad", PWAD: "pwad", DEH: "deh", BEX: "bex", TEXT: "document" })[
      kind
    ];
  function cancel() {
    if (worker) {
      worker.terminate();
      worker = null;
    }
    if (pendingReject) {
      pendingReject(new DOMException("Import cancelled", "AbortError"));
      pendingReject = null;
    }
    $("cancel-work").hidden = true;
  }
  function newRecipe(title = "New Doom game", family = "doom2") {
    return {
      schema: "sfhs.doom-recipe@1",
      id: id(),
      title,
      engine: "chocolate-doom",
      family,
      base:
        [...S.payloads.values()].find(
          (p) =>
            p.role === "iwad" &&
            (p.inspection?.targetGame === family ||
              p.filename ===
                (family === "doom" ? "freedoom1.wad" : "freedoom2.wad")),
        )?.id || null,
      files: [],
      documentIds: [],
      warp: family === "doom" ? "E1M1" : "MAP01",
      skill: 3,
      options: {},
      saveNamespace: "forge-" + "0".repeat(64),
      manualOverride: false,
      embeddedDehacked: false,
    };
  }
  async function importCapsule(file) {
    const html = await file.text(),
      scripts = [
        ...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi),
      ];
    const manifests = scripts.filter((match) =>
      /\bid=["']sfhs-forge-manifest["']/.test(match[1]),
    );
    if (manifests.length !== 1)
      throw new Error(
        "This HTML needs exactly one supported Forge V3 manifest. No HTML or scripts were executed.",
      );
    const m = C.validateManifest(JSON.parse(manifests[0][2])),
      root = document.createElement("div");
    for (const match of scripts) {
      const p = match[1].match(/\bdata-forge-payload=["']([a-f0-9]{64})["']/),
        n = match[1].match(/\bdata-chunk=["'](\d+)["']/);
      if (!p) continue;
      if (!n) throw new Error("Capsule chunk lacks an index");
      const el = document.createElement("script");
      el.type = "application/octet-stream";
      el.dataset.forgePayload = p[1];
      el.dataset.chunk = n[1];
      el.textContent = match[2];
      root.append(el);
    }
    const verified = await C.verifyCapsule(m, root);
    for (const p of m.payloads)
      await A.storePayload(p, verified.payloads.get(p.id), true);
    for (const r of m.recipes) {
      const imported = copy(r);
      if (S.recipes.some((x) => x.id === r.id)) imported.id = id();
      imported.saveNamespace = await C.recipeNamespace(imported);
      const saves = (m.saves || [])
        .filter((save) => save.namespace === r.saveNamespace)
        .map((save) => ({ ...save, namespace: imported.saveNamespace }));
      if (saves.length) {
        await C.verifySaves(saves, [imported]);
        await A.put("saves:" + imported.saveNamespace, saves);
      }
      S.recipes.push(imported);
      if (!S.build.includes(imported.id)) S.build.push(imported.id);
    }
    S.selected = S.recipes.at(-1).id;
    await A.persist();
    A.render();
    A.message(
      "Capsule content imported and verified. Its executable code was not run.",
    );
    return m;
  }
  async function importFile(file, source = { kind: "local" }) {
    if (!(file instanceof Blob)) throw new Error("Choose a local file.");
    A.message("Inspecting " + file.name + " locally…");
    const prefix = await file.slice(0, 200).text();
    if (/^\s*(?:<!doctype html|<html)/i.test(prefix))
      return importCapsule(file);
    if (file.size > 128 * 1024 * 1024)
      throw new Error(
        "This input exceeds the analyzer’s 128 MiB defensive safety quota. It is not a measured phone capacity limit.",
      );
    cancel();
    $("cancel-work").hidden = false;
    const bytes = await file.arrayBuffer(),
      url = URL.createObjectURL(
        new Blob([$("sfhs-forge-import-worker").textContent], {
          type: "text/javascript",
        }),
      );
    let response;
    try {
      response = await new Promise((resolve, reject) => {
        pendingReject = reject;
        worker = new Worker(url);
        worker.onerror = (e) =>
          reject(new Error("Import worker: " + e.message));
        worker.onmessage = (e) => {
          if (e.data.ok) resolve(e.data);
          else
            reject(
              new Error(
                file.name +
                  ": " +
                  e.data.error.message +
                  " (" +
                  e.data.error.code +
                  ")",
              ),
            );
        };
        worker.postMessage(
          { id: 1, name: file.name, size: file.size, bytes, extract: true },
          [bytes],
        );
      });
    } finally {
      pendingReject = null;
      if (worker) worker.terminate();
      worker = null;
      URL.revokeObjectURL(url);
      $("cancel-work").hidden = true;
    }
    S.inspection = response.result;
    S.imported = [];
    for (const f of [...response.files].sort(
      (a, b) => Number(a.kind === "RECIPE") - Number(b.kind === "RECIPE"),
    )) {
      if (f.kind === "RECIPE") {
        const r = copy(f.inspection.recipe);
        C.validateRecipe(r, [...S.payloads.values()]);
        if (S.recipes.some((x) => x.id === r.id)) r.id = id();
        r.saveNamespace = await C.recipeNamespace(r);
        S.recipes.push(r);
        S.selected = r.id;
        continue;
      }
      const fileRole = role(f.kind);
      if (!fileRole) continue;
      const blob = new Blob([f.bytes]),
        permission =
          f.permission.status === "redistribution-allowed"
            ? "redistributable"
            : f.permission.status === "redistribution-prohibited"
              ? "prohibited"
              : "private-local";
      const p = {
        id: f.sha256,
        filename: safeName(f.name),
        role: fileRole,
        decoded: { bytes: blob.size, sha256: f.sha256 },
        encoded: { bytes: blob.size, sha256: f.sha256 },
        compression: "none",
        encoding: "base64",
        chunkSize: 262144,
        chunkCount: Math.ceil(blob.size / 262144),
        storage: { kind: "embedded-chunks" },
        permission,
        license:
          f.permission.evidence || "No redistribution permission established",
        source: { ...source, name: file.name },
        inspection: f.inspection,
        readme: f.text || "",
      };
      await A.storePayload(p, blob);
      S.imported.push(p.id);
    }
    await A.persist();
    renderInspection();
    await renderLibrary();
    A.message("Inspected " + file.name + ". Nothing was uploaded.");
    return response.result;
  }
  function renderInspection() {
    const root = $("inspection-card");
    root.replaceChildren();
    const result = S.inspection;
    if (!result) return;
    const card = A.node("article", undefined, "forge-item");
    card.append(
      A.node("h3", result.source.name),
      A.node("p", result.compatibility.label),
      A.node("p", result.compatibility.evidence.join(" · ")),
      A.node(
        "p",
        "Target: " +
          result.compatibility.targetGame +
          " · Suggested base: " +
          result.compatibility.recommendedBase,
      ),
      A.node("p", "Permission: " + result.permission.label),
      A.node("code", "SHA-256 " + result.source.sha256),
      A.node(
        "p",
        result.source.bytes.toLocaleString() +
          " bytes" +
          (result.archive
            ? " · " +
              result.archive.entryCount +
              " files · " +
              result.archive.expandedBytes.toLocaleString() +
              " expanded bytes"
            : ""),
      ),
    );
    for (const w of result.wads)
      card.append(
        A.node(
          "p",
          w.name +
            " · " +
            w.kind +
            " · " +
            w.maps.total +
            " maps · " +
            w.loadingMethod,
        ),
      );
    for (const d of result.documents || []) {
      const details = A.node("details");
      details.append(
        A.node("summary", "Read original " + d.name),
        A.node("pre", d.text),
      );
      card.append(details);
    }
    root.append(card);
    $("import-actions").hidden = !S.imported.length;
  }
  async function importFiles(files) {
    const imported = [],
      inspections = [];
    for (const file of files) {
      const result = await importFile(file);
      if (result?.schema === "sfhs.doom-inspection@1") {
        imported.push(...S.imported);
        inspections.push(copy(result));
      }
    }
    if (inspections.length > 1) {
      const main = inspections.find((x) => x.wads.length) || inspections[0],
        documents = inspections.flatMap((x) => x.documents || []);
      main.documents = documents;
      main.wads = inspections.flatMap((x) => x.wads);
      for (const field of ["title", "author", "description"]) {
        main.metadata[field] =
          inspections.map((x) => x.metadata?.[field]).find(Boolean) || "";
      }
      for (const field of [
        "engineRequirements",
        "requiredFiles",
        "unsupportedSignals",
      ]) {
        main.metadata[field] = [
          ...new Set(inspections.flatMap((x) => x.metadata?.[field] || [])),
        ];
      }
      main.compatibility.evidence.push(
        "Selected together: " +
          inspections.map((x) => x.source.name).join(", "),
      );
      const denied = documents.find(
          (x) => x.permission?.status === "redistribution-prohibited",
        ),
        allowed = documents.find(
          (x) => x.permission?.status === "redistribution-allowed",
        ),
        notice = denied || allowed;
      S.imported = [...new Set(imported)];
      S.inspection = main;
      if (notice) {
        for (const pid of S.imported) {
          const p = S.payloads.get(pid);
          if (p.role === "iwad") continue;
          const updated = {
            ...p,
            permission: denied ? "prohibited" : "redistributable",
            license: notice.permission.evidence || notice.text,
            source: { ...p.source, permissionDocument: notice.name },
          };
          await A.storePayload(updated, await A.payloadBlob(pid));
        }
        main.permission = notice.permission;
      }
      for (const finding of inspections) {
        if (finding.compatibility.status === "unsupported-by-engine")
          main.compatibility = copy(finding.compatibility);
      }
      if (
        main.wads.length > 1 &&
        main.compatibility.status !== "unsupported-by-engine"
      ) {
        main.compatibility.status = "manual-recipe-required";
        main.compatibility.label = "Manual recipe required";
        main.compatibility.evidence.push(
          "Multiple selected WADs require explicit load-order review.",
        );
      }
      renderInspection();
      await A.persist();
      A.message(
        "Selected files are ready together. The displayed hash identifies " +
          main.source.name +
          ". Individual hashes are retained for every file.",
      );
    }
    return S.inspection;
  }
  async function addImported({ newGame = true } = {}) {
    if (!S.imported.length)
      throw new Error("Import WAD or patch content first.");
    const ps = S.imported.map((x) => S.payloads.get(x)),
      wad = ps.find((x) => x.role === "pwad" || x.role === "iwad"),
      family = wad?.inspection?.targetGame === "doom" ? "doom" : "doom2";
    let r = newGame
      ? newRecipe(
          S.inspection?.metadata?.title || wad?.filename || "Imported game",
          family,
        )
      : A.selected();
    for (const p of ps) {
      if (p.role === "iwad") {
        r.base = p.id;
        r.family = p.inspection?.targetGame === "doom" ? "doom" : "doom2";
        r.warp = r.family === "doom" ? "E1M1" : "MAP01";
      } else if (p.role === "document") {
        if (!r.documentIds.includes(p.id)) r.documentIds.push(p.id);
      } else if (!r.files.some((f) => f.payloadId === p.id))
        r.files.push({
          payloadId: p.id,
          mode:
            p.role === "pwad"
              ? p.inspection?.loadingMethod?.includes("merge")
                ? "merge"
                : "file"
              : "deh",
          enabled: true,
        });
      if (p.inspection?.embeddedDehacked) r.embeddedDehacked = true;
    }
    r.compatibility = copy(S.inspection?.compatibility || {});
    r.mapCount = wad?.inspection?.maps?.total || 0;
    r.author = S.inspection?.metadata?.author || "";
    r.saveNamespace = await C.recipeNamespace(r);
    if (newGame) {
      S.recipes.push(r);
      S.drafts.push(r.id);
    }
    S.selected = r.id;
    if (!S.build.includes(r.id)) S.build.push(r.id);
    await A.persist();
    A.render();
    A.tab("recipe");
    return r;
  }
  function recommended(p) {
    return p.role === "pwad"
      ? p.inspection?.loadingMethod?.includes("merge")
        ? "merge"
        : "file"
      : "deh";
  }
  function readRecipe() {
    const r = A.selected();
    r.title = $("recipe-title").value.trim() || "Untitled game";
    r.family = $("recipe-family").value;
    r.base = $("recipe-base").value || null;
    r.warp = $("recipe-warp").value.trim().toUpperCase();
    r.skill = Number($("recipe-skill").value);
    r.manualOverride = $("recipe-override").checked;
    for (const x of ["nomonsters", "fast", "respawn"])
      r.options[x] = $("option-" + x).checked;
    return r;
  }
  async function saveRecipe() {
    const r = readRecipe();
    r.saveNamespace = await C.recipeNamespace(r);
    C.validateRecipe(r, [...S.payloads.values()]);
    S.drafts = S.drafts.filter((x) => x !== r.id);
    for (const pid of [
      r.base,
      ...r.files.map((f) => f.payloadId),
      ...(r.documentIds || []),
    ].filter(Boolean)) {
      if (!S.manifest.payloads.some((p) => p.id === pid))
        await A.storePayload(
          S.payloads.get(pid),
          await A.payloadBlob(pid),
          true,
        );
    }
    await A.persist();
    A.render();
    A.message("Recipe saved. Its save namespace tracks its launch inputs.");
    return r;
  }
  function renderRecipe() {
    const r = A.selected();
    if (!r) return;
    $("recipe-title").value = r.title;
    $("recipe-family").value = r.family;
    $("recipe-base").replaceChildren();
    $("recipe-base").append(new Option("No base · thin capsule", ""));
    for (const p of S.payloads.values())
      if (p.role === "iwad")
        $("recipe-base").append(
          new Option(p.filename + " · " + p.permission, p.id),
        );
    $("recipe-base").value = r.base || "";
    $("recipe-warp").value = r.warp;
    $("recipe-skill").value = String(r.skill);
    $("recipe-override").checked = r.manualOverride;
    for (const x of ["nomonsters", "fast", "respawn"])
      $("option-" + x).checked = !!r.options[x];
    $("base-status").textContent = r.base
      ? "Current base: " + S.payloads.get(r.base)?.filename
      : "Leave base behind: this recipe will request a local IWAD.";
    $("recipe-files").replaceChildren();
    r.files.forEach((f, i) => {
      const p = S.payloads.get(f.payloadId),
        card = A.node("article", undefined, "forge-item");
      card.append(A.node("h3", p?.filename || "Missing payload"));
      const enabled = A.node("input");
      enabled.type = "checkbox";
      enabled.checked = f.enabled;
      enabled.addEventListener("change", async () => {
        f.enabled = enabled.checked;
        await A.persist();
        renderRecipe();
      });
      const label = A.node("label", " Enabled ");
      label.prepend(enabled);
      const mode = A.node("select");
      for (const value of p?.role === "pwad" ? ["file", "merge"] : ["deh"])
        mode.append(new Option("-" + value, value));
      mode.value = f.mode;
      mode.addEventListener("change", async () => {
        f.mode = mode.value;
        await A.persist();
        renderRecipe();
      });
      card.append(label, mode);
      const actions = A.node("div", undefined, "actions");
      actions.append(
        A.button("↑", async () => {
          if (i) {
            [r.files[i - 1], r.files[i]] = [r.files[i], r.files[i - 1]];
            await A.persist();
            renderRecipe();
          }
        }),
        A.button("↓", async () => {
          if (i < r.files.length - 1) {
            [r.files[i + 1], r.files[i]] = [r.files[i], r.files[i + 1]];
            await A.persist();
            renderRecipe();
          }
        }),
        A.button("Recommendation", () => {
          f.mode = recommended(p);
          renderRecipe();
        }),
        A.button("Remove", async () => {
          r.files.splice(i, 1);
          await A.persist();
          renderRecipe();
        }),
      );
      card.append(actions);
      $("recipe-files").append(card);
    });
    try {
      $("recipe-command").textContent =
        "chocolate-doom " +
        C.recipeArgs(r, [...S.payloads.values()])
          .map((x) => (x.includes(" ") ? JSON.stringify(x) : x))
          .join(" ");
    } catch (error) {
      $("recipe-command").textContent = error.message;
    }
    $("recipe-compatibility").textContent = [
      r.compatibility?.label,
      ...(r.compatibility?.evidence || []),
    ]
      .filter(Boolean)
      .join("\n");
  }
  async function renderLibrary() {
    const root = $("content-library");
    root.replaceChildren();
    for (const key of await A.keys()) {
      if (!String(key).startsWith("payload:")) continue;
      const item = await A.get(key);
      if (!item?.keep) continue;
      const p = item.payload,
        card = A.node("article", undefined, "forge-item");
      card.append(
        A.node("h3", p.filename),
        A.node(
          "p",
          p.role +
            " · " +
            p.decoded.bytes.toLocaleString() +
            " bytes · " +
            p.permission,
        ),
        A.node("code", p.id),
        A.node("p", "Aliases: " + item.aliases.join(", ")),
      );
      card.append(
        A.button("Add to recipe", async () => {
          S.imported = [p.id];
          S.inspection = {
            compatibility: p.inspection?.compatibility || {},
            metadata: {},
          };
          await addImported({ newGame: false });
        }),
        A.button("Remove local copy", async () => {
          if (
            S.recipes.some(
              (r) =>
                r.base === p.id || r.files.some((x) => x.payloadId === p.id),
            )
          )
            throw new Error(
              "This content is still used by a recipe. Remove that recipe or file first.",
            );
          await A.remove(key);
          if (!S.manifest.payloads.some((x) => x.id === p.id)) {
            S.payloads.delete(p.id);
            S.blobs.delete(p.id);
          }
          await renderLibrary();
        }),
      );
      root.append(card);
    }
  }
  function renderBuild() {
    const root = $("build-games");
    root.replaceChildren();
    const order = [
      ...S.build.map((x) => S.recipes.find((r) => r.id === x)).filter(Boolean),
      ...S.recipes.filter((r) => !S.build.includes(r.id)),
    ];
    for (const r of order) {
      const row = A.node("article", undefined, "forge-item"),
        check = A.node("input");
      check.type = "checkbox";
      check.checked = S.build.includes(r.id);
      check.addEventListener("change", async () => {
        S.build = S.build.filter((x) => x !== r.id);
        if (check.checked) S.build.push(r.id);
        await A.persist();
        renderBuild();
      });
      const label = A.node("label", r.title);
      label.prepend(check);
      row.append(
        label,
        A.button("↑", async () => {
          const i = S.build.indexOf(r.id);
          if (i > 0) {
            [S.build[i], S.build[i - 1]] = [S.build[i - 1], S.build[i]];
            await A.persist();
            renderBuild();
          }
        }),
        A.button("↓", async () => {
          const i = S.build.indexOf(r.id);
          if (i >= 0 && i < S.build.length - 1) {
            [S.build[i], S.build[i + 1]] = [S.build[i + 1], S.build[i]];
            await A.persist();
            renderBuild();
          }
        }),
        A.button("Set default", async () => {
          S.build = [r.id, ...S.build.filter((x) => x !== r.id)];
          await A.persist();
          renderBuild();
        }),
      );
      if (S.build[0] === r.id) row.append(A.node("span", " Default game"));
      root.append(row);
    }
  }
  async function exportBuild(options = {}) {
    exportAbort = new AbortController();
    const includeForge = options.includeForge ?? $("build-forge").checked,
      privateExport = options.private ?? $("build-private").checked,
      leave = (options.basePolicy || $("build-base").value) === "leave",
      chosen = options.recipeIds || S.build;
    const recipes = chosen
      .map((x) => copy(S.recipes.find((r) => r.id === x)))
      .filter(Boolean);
    if (!recipes.length)
      throw new Error("Select at least one game for the build.");
    if (options.includeLibrary) {
      const referenced = new Set(
        recipes.flatMap((r) => [
          r.base,
          ...r.files.filter((f) => f.enabled).map((f) => f.payloadId),
          ...(r.documentIds || []),
        ]),
      );
      for (const key of await A.keys()) {
        if (!String(key).startsWith("payload:")) continue;
        const item = await A.get(key);
        if (!item?.keep) continue;
        const p = item.payload;
        S.payloads.set(p.id, {
          ...p,
          aliases: item.aliases,
          source: { ...p.source, records: item.sources },
        });
        if (referenced.has(p.id)) continue;
        if (p.role === "document") {
          recipes[0].documentIds = [
            ...new Set([...(recipes[0].documentIds || []), p.id]),
          ];
          continue;
        }
        const r = newRecipe(
          "Library · " + p.filename,
          p.inspection?.targetGame === "doom" ? "doom" : "doom2",
        );
        if (p.role === "iwad") r.base = p.id;
        else
          r.files.push({
            payloadId: p.id,
            mode: recommended(p),
            enabled: true,
          });
        r.compatibility = copy(p.inspection?.compatibility || {});
        r.embeddedDehacked = !!p.inspection?.embeddedDehacked;
        recipes.push(r);
        referenced.add(p.id);
      }
    }
    if (leave) for (const r of recipes) r.base = null;
    const required = new Set();
    for (const r of recipes) {
      if (r.base) required.add(r.base);
      for (const f of r.files) if (f.enabled) required.add(f.payloadId);
      for (const doc of r.documentIds || []) required.add(doc);
      r.saveNamespace = await C.recipeNamespace(r);
    }
    const payloads = [...required].map((x) => copy(S.payloads.get(x)));
    if (payloads.some((x) => !x))
      throw new Error("A selected payload is missing.");
    if (
      payloads.some((p) => p.permission !== "redistributable") &&
      !privateExport
    )
      throw new Error(
        "This build contains private or unclear permissions. Choose PRIVATE export, or remove those files.",
      );
    const title = options.title || $("build-title").value || "Doom capsule",
      manifest = {
        schema: "sfhs.doom-capsule@1",
        capsule: {
          id: "capsule-" + crypto.randomUUID(),
          name: title,
          version: 3,
          mode: recipes.length > 1 ? "collection" : leave ? "thin" : "full",
          forge: includeForge,
          private: privateExport,
          buildProfile: "FORGE-COMPLETE-4",
        },
        payloads,
        recipes,
        defaultRecipe: recipes[0].id,
        credits: copy(S.manifest.credits),
        licenses: copy(S.manifest.licenses || []),
        networkPolicy: { default: "offline" },
      };
    if (options.includeSaves ?? $("build-saves").checked) {
      manifest.saves = [];
      for (const r of recipes) {
        const saves = await A.loadSaves(r);
        manifest.saves.push(
          ...saves.filter((x) => x.namespace === r.saveNamespace),
        );
      }
      if (leave)
        A.message(
          "Thin export includes only saves matching the base-free recipe namespace. Keep a separate saves backup for a carried-base game.",
        );
    }
    const prefs = {};
    if (options.includeControls ?? $("build-controls").checked)
      prefs.controls = window.SFHS_WASM_TEST.mobileControlsProfile();
    if (options.includeMobile ?? $("build-mobile").checked)
      prefs.mobileUi = window.SFHS_WASM_TEST.mobileUiSnapshot().preferences;
    if (Object.keys(prefs).length) manifest.preferences = prefs;
    const blobs = new Map();
    for (const p of payloads) blobs.set(p.id, await A.payloadBlob(p.id));
    let writer = options.writer;
    A.message("Building " + title + "…");
    const result = await C.exportCapsule({
      manifest,
      payloads: blobs,
      template: C.getTemplate(),
      includeForge,
      writer,
      signal: exportAbort.signal,
      progress: (p) => {
        $("export-result").textContent =
          p.stage +
          " · " +
          p.done.toLocaleString() +
          (p.total ? " / " + p.total.toLocaleString() : "") +
          " bytes";
      },
    });
    const filename =
      (privateExport ? "PRIVATE-" : "") +
      safeName(title).replace(/\.html?$/i, "") +
      ".html";
    if (result.blob && options.download !== false)
      A.download(result.blob, filename);
    S.export = {
      filename,
      bytes: result.bytes,
      sha256: result.sha256,
      recipes: result.manifest.recipes.length,
      payloads: result.manifest.payloads.length,
      basePolicy: leave ? "left behind" : "selected bases only",
      private: privateExport,
    };
    $("export-result").textContent =
      "Capsule created\n" +
      JSON.stringify(S.export, null, 2) +
      "\nEmbedded payload hashes verified during export. Reopen and use Verify to check the saved file.\nOffline network policy; no external runtime assets.";
    A.message("Export complete.");
    return result;
  }
  function archiveStatus() {
    const p = window.SFHSForgeArchive.status();
    $("network-state").textContent = p.enabled
      ? "ONLINE PERMISSION"
      : "OFFLINE";
    $("archive-network").textContent = JSON.stringify(p, null, 2);
  }
  function renderArchive() {
    const root = $("archive-results");
    root.replaceChildren();
    const rows = archiveMatches.slice(0, (archivePage + 1) * 30);
    for (const e of rows) {
      const card = A.node("article", undefined, "forge-item");
      card.append(
        A.node("h3", e.title || e.filename || e.path),
        A.node(
          "p",
          (e.author || "Author unknown") +
            " · " +
            (e.year || e.date || "Date unknown") +
            " · " +
            (e.family || e.game || "Target unknown"),
        ),
        A.node(
          "p",
          (e.mapCount || "?") +
            " maps · " +
            (e.bytes || e.size || "?") +
            " bytes · " +
            (e.compatibility?.label ||
              e.compatibility ||
              "Compatibility unknown"),
        ),
        A.node(
          "p",
          "Permission: " + (e.permission?.status || e.permission || "unclear"),
        ),
      );
      const actions = A.node("div", undefined, "actions");
      for (const action of [
        "Inspect",
        "Quick Play",
        "Add to Library",
        "Add to Build",
      ])
        actions.append(A.button(action, () => archiveAction(e, action)));
      actions.append(
        A.button("Read original metadata", () => archiveAction(e, "Inspect")),
        A.button(
          favoriteIds.has(e.id) ? "★ Favorite" : "☆ Favorite",
          async () => {
            if (favoriteIds.has(e.id)) favoriteIds.delete(e.id);
            else favoriteIds.add(e.id);
            await A.put("archive-favorites", [...favoriteIds]);
            renderArchive();
          },
        ),
      );
      card.append(actions);
      root.append(card);
    }
    $("archive-count").textContent =
      archiveMatches.length +
      " matches · showing " +
      rows.length +
      " · unrecorded facts remain unknown";
    $("archive-more").hidden = rows.length >= archiveMatches.length;
  }
  async function archiveAction(entry, action) {
    try {
      if (action === "Inspect") {
        const data = await window.SFHSForgeArchive.inspect(entry);
        const card = A.node(
          "pre",
          typeof data === "string" ? data : JSON.stringify(data, null, 2),
        );
        $("archive-results").prepend(card);
        return;
      }
      const data = await window.SFHSForgeArchive.download(entry),
        blob = data instanceof Blob ? data : data.blob;
      const file = new File(
        [blob],
        entry.filename || entry.path.split("/").pop(),
      );
      await importFile(file, {
        kind: "idgames",
        url: entry.sourceUrl || entry.url || entry.path,
      });
      downloadedIds.add(entry.id);
      await A.put("archive-downloads", [...downloadedIds]);
      const r = await addImported();
      if (action === "Add to Library") {
        for (const pid of S.imported)
          await A.storePayload(
            S.payloads.get(pid),
            await A.payloadBlob(pid),
            true,
          );
      }
      if (action === "Quick Play") await A.launch(r);
      else A.tab("recipe");
    } catch (error) {
      if (error.manualUrl) {
        A.message(
          error.message +
            " Use the normal archive download below, then Import the saved ZIP.",
        );
        const link = A.node("a", "Open archive download");
        link.href = error.manualUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        $("archive-results").prepend(link);
      } else throw error;
    }
  }
  function render() {
    renderRecipe();
    renderBuild();
    renderLibrary().catch(A.fail);
  }
  async function init() {
    await window.SFHSForgeArchive.ready;
    A = window.SFHSForgeApp;
    S = A.state;
    C = A.C;
    $ = A.$;
    $("forge-inspect-file").addEventListener("change", async (e) => {
      try {
        await importFiles([...e.target.files]);
      } catch (error) {
        A.fail(error);
      }
      e.target.value = "";
    });
    $("cancel-work").addEventListener("click", cancel);
    $("import-recipe").addEventListener("click", () =>
      addImported().catch(A.fail),
    );
    $("import-library").addEventListener("click", async () => {
      try {
        for (const pid of S.imported)
          await A.storePayload(
            S.payloads.get(pid),
            await A.payloadBlob(pid),
            true,
          );
        await renderLibrary();
        A.message("Content saved in your local library.");
      } catch (error) {
        A.fail(error);
      }
    });
    $("import-test").addEventListener("click", () =>
      addImported()
        .then((r) => A.launch(r))
        .catch(A.fail),
    );
    for (const x of [
      "recipe-title",
      "recipe-family",
      "recipe-base",
      "recipe-warp",
      "recipe-skill",
      "recipe-override",
      "option-nomonsters",
      "option-fast",
      "option-respawn",
    ])
      $(x).addEventListener("change", async () => {
        try {
          const r = readRecipe();
          r.saveNamespace = await C.recipeNamespace(r);
          await A.persist();
          renderRecipe();
        } catch (error) {
          A.fail(error);
        }
      });
    $("recipe-save").addEventListener("click", () =>
      saveRecipe().catch(A.fail),
    );
    $("recipe-test").addEventListener("click", () =>
      saveRecipe()
        .then((r) => A.launch(r))
        .catch(A.fail),
    );
    $("base-keep").addEventListener("click", () =>
      A.message(
        "The selected base will be carried when you choose Keep selected recipe bases in Build.",
      ),
    );
    $("base-replace").addEventListener("click", () =>
      $("forge-base-file").click(),
    );
    $("base-leave").addEventListener("click", async () => {
      A.selected().base = null;
      await A.persist();
      A.render();
    });
    $("recipe-duplicate").addEventListener("click", async () => {
      const r = copy(readRecipe());
      r.id = id();
      r.title += " copy";
      r.saveNamespace = await C.recipeNamespace(r);
      S.recipes.push(r);
      S.selected = r.id;
      await A.persist();
      A.render();
    });
    $("recipe-delete").addEventListener("click", async () => {
      if (S.recipes.length === 1)
        throw A.fail(new Error("Keep at least one recipe."));
      const r = A.selected();
      S.recipes = S.recipes.filter((x) => x.id !== r.id);
      S.build = S.build.filter((x) => x !== r.id);
      S.selected = S.recipes[0].id;
      await A.persist();
      A.render();
    });
    $("recipe-json").addEventListener("click", async () =>
      A.download(
        new Blob([JSON.stringify(await saveRecipe(), null, 2)], {
          type: "application/json",
        }),
        "doom-recipe.json",
      ),
    );
    $("build-export").addEventListener("click", async () => {
      let writer;
      try {
        if (typeof showSaveFilePicker === "function") {
          const file = await showSaveFilePicker({
            suggestedName: safeName($("build-title").value) + ".html",
            types: [
              {
                description: "Doom HTML capsule",
                accept: { "text/html": [".html"] },
              },
            ],
          });
          writer = await file.createWritable();
        }
        await exportBuild({ writer });
      } catch (error) {
        if (writer?.abort) await writer.abort().catch(() => {});
        A.fail(error);
      }
    });
    $("build-cancel").addEventListener("click", () => exportAbort?.abort());
    $("library-backup").addEventListener("click", () =>
      exportBuild({
        includeForge: true,
        private: true,
        includeSaves: true,
        includeLibrary: true,
        basePolicy: "keep",
        recipeIds: S.recipes.map((x) => x.id),
        title: "Doom-library-backup",
      }).catch(A.fail),
    );
    $("clear-catalog").addEventListener("click", async () => {
      await A.remove("archive-cache");
      A.message(
        "Catalog cache cleared. The bundled catalog remains available.",
      );
    });
    $("network-enable").addEventListener("click", () => {
      window.SFHSForgeArchive.enable();
      archiveStatus();
    });
    $("network-disable").addEventListener("click", () => {
      window.SFHSForgeArchive.disable();
      archiveStatus();
    });
    $("archive-cancel").addEventListener("click", () =>
      window.SFHSForgeArchive.cancel(),
    );
    $("archive-search").addEventListener("click", () => {
      try {
        archiveMatches = window.SFHSForgeArchive.search({
          query: $("archive-query").value,
          game: $("archive-game").value,
          family: $("archive-game").value,
          type: $("archive-type").value,
          year: $("archive-year").value,
          sort: $("archive-sort").value,
          compatibility: $("archive-compat").value,
          permission: $("archive-open").checked ? "redistributable" : "",
          favoriteIds: [...favoriteIds],
          downloadedIds: [...downloadedIds],
          favorite: $("archive-sort").value === "favorites",
          downloaded: $("archive-sort").value === "downloaded",
        });
        archivePage = 0;
        renderArchive();
      } catch (error) {
        A.fail(error);
      }
    });
    $("archive-more").addEventListener("click", () => {
      archivePage++;
      renderArchive();
    });
    favoriteIds = new Set((await A.get("archive-favorites")) || []);
    downloadedIds = new Set((await A.get("archive-downloads")) || []);
    archiveStatus();
  }
  window.SFHSForgeTools = {
    init,
    render,
    importFile,
    importFiles,
    addImported,
    saveRecipe,
    exportBuild,
    cancel,
  };
})();
