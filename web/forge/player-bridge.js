// Product integration inside the preserved V16 player closure.
const query = new URLSearchParams(location.search),
  oracle = query.get("oracle") === "1",
  audio = query.get("audio") !== "0";
state.oracle = oracle;
const start = document.getElementById("start-doom"),
  renderer = document.getElementById("renderer-mode"),
  setup = document.getElementById("setup-overlay"),
  setupStatus = document.getElementById("setup-status");
const mobileExtraConfig = "/sfhs-doom-mobile-extra.cfg",
  mobileExtraConfigText = "key_prevweapon 51\nkey_nextweapon 52\n";
const IncrementalSha256 = window.SFHSForgeCore.IncrementalSha256;
const analyzerSnapshot = () =>
  window.SFHSForgeApp ? window.SFHSForgeApp.inspection() : null;
let runtimeReady = false;
let preparingRecipe = false;
let resolveRuntime;
const runtimePromise = new Promise((resolve) => {
  resolveRuntime = resolve;
});
function failLaunch(error) {
  forge.mountStage = "failed";
  forge.error = String(error.message || error);
  state.errors.push("forge:" + forge.error);
  setup.hidden = false;
  setupStatus.textContent =
    "Launch failed: " +
    forge.error +
    ". Your recipe is preserved. Return to the library to repair it.";
  window.dispatchEvent(
    new CustomEvent("forge-launch-error", { detail: forge.error }),
  );
}
async function prepareRecipe(recipe, payloads, blobs, saves = []) {
  if (preparingRecipe)
    throw new Error(
      "A recipe is already being prepared. Wait for the current launch.",
    );
  if (state.mainStarted)
    throw new Error(
      "This engine has already run. Return to Forge to switch games.",
    );
  preparingRecipe = true;
  try {
    return await prepareRecipeOnce(recipe, payloads, blobs, saves);
  } finally {
    preparingRecipe = false;
  }
}
async function prepareRecipeOnce(recipe, payloads, blobs, saves = []) {
  await runtimePromise;
  if (state.mainStarted)
    throw new Error(
      "This engine has already run. Return to Forge to switch games.",
    );
  const core = window.SFHSForgeCore,
    fs = window.Module.FS;
  forge.mountStage = "verifying";
  forge.recipeId = recipe.id;
  forge.error = null;
  const ids = [
    recipe.base,
    ...recipe.files.filter((x) => x.enabled !== false).map((x) => x.payloadId),
  ].filter(Boolean);
  if (!recipe.base)
    throw new Error(
      "Select a compatible local base before playing this thin recipe.",
    );
  const mounted = [];
  try {
    core.validateRecipe(recipe, payloads);
    for (const id of new Set(ids)) {
      const payload = payloads.find((x) => x.id === id),
        blob = blobs.get(id);
      if (!payload || !blob) throw new Error("Missing payload " + id);
      if (
        blob.size !== payload.decoded.bytes ||
        (await core.hashBlob(blob)) !== payload.decoded.sha256
      )
        throw new Error("Payload hash mismatch: " + payload.filename);
      fs.mkdirTree("/wads");
      const path = "/wads/" + core.mountName(payload),
        temp = path + ".tmp";
      let stream = null;
      try {
        stream = fs.open(temp, "w");
        let position = 0;
        for await (const chunk of blob.stream()) {
          fs.write(stream, chunk, 0, chunk.length, position);
          position += chunk.length;
        }
        fs.close(stream);
        stream = null;
        try {
          fs.unlink(path);
        } catch (_) {}
        fs.rename(temp, path);
        mounted.push(path);
      } catch (error) {
        if (stream) fs.close(stream);
        try {
          fs.unlink(temp);
        } catch (_) {}
        throw error;
      }
    }
    recipe.saveNamespace = await core.recipeNamespace(recipe);
    fs.mkdirTree("/persist/" + recipe.saveNamespace);
    await core.verifySaves(saves, [recipe]);
    for (const save of saves.filter(
      (x) => x.namespace === recipe.saveNamespace,
    )) {
      const raw = atob(save.data);
      fs.writeFile(
        "/persist/" + save.namespace + "/" + save.filename,
        Uint8Array.from(raw, (x) => x.charCodeAt(0)),
      );
    }
    const args = core.recipeArgs(recipe, payloads);
    forge.args = [
      ...args,
      "-window",
      "-width",
      "320",
      "-height",
      "200",
      "-nograbmouse",
      "-extraconfig",
      mobileExtraConfig,
      ...(audio ? ["-nomusic"] : ["-nosound", "-nomusic"]),
    ];
    window.Module.arguments = [...forge.args];
    forge.mountStage = "ready";
    forge.manifestStatus = "valid";
    forge.mounted = mounted;
    document.body.dataset.sfhsP7Mount = "ready";
    return forge.args;
  } catch (error) {
    for (const path of mounted)
      try {
        fs.unlink(path);
      } catch (_) {}
    failLaunch(error);
    throw error;
  }
}
function startRecipe() {
  if (state.mainStarted || forge.mountStage !== "ready")
    throw new Error("Recipe is not ready, or the engine has already started.");
  requestAppFullscreen();
  const configure = window.Module._sfhs_mobile_present_configure_renderer;
  if (configure(renderer.value === "compatibility" ? 1 : 0) < 0)
    throw new Error("Renderer configuration rejected.");
  state.mainStarted = true;
  state.mainInvocations += 1;
  document.body.dataset.sfhsP6Main = "started";
  document.body.dataset.sfhsP7Main = "started";
  setup.hidden = true;
  settingsToggle.hidden = false;
  try {
    const run = window.Module.callMain(window.Module.arguments);
    document.body.dataset.sfhsP6Presentation = "active";
    document.body.dataset.sfhsP7Presentation = "active";
    state.presentationUpdates += 1;
    if (run && typeof run.catch === "function") run.catch(failLaunch);
    document.getElementById("canvas").focus();
  } catch (error) {
    failLaunch(error);
    throw error;
  }
}
function applyMobilePreferences(value) {
  const clean = validateUiPreferences(value);
  if (!clean) throw new Error("Invalid mobile UI preferences.");
  uiPreferences = clean;
  persistUiPreferences();
  syncLookSettings();
  applyPanelLayout();
  syncWorldScale();
}
window.SFHSForgePlayer = Object.freeze({
  ready: runtimePromise,
  prepare: prepareRecipe,
  start: startRecipe,
  applyMobilePreferences,
  showForge: () => {
    clearLookTapFire("return-to-forge");
    controller.releaseAll("return-to-forge");
    closeUtilities();
    setup.hidden = false;
  },
  release: () => {
    clearLookTapFire("return-to-forge");
    controller.releaseAll("return-to-forge");
  },
  snapshot: () => structuredClone(forge),
});
window.SFHS_P3_MODULE_CONFIG = {
  canvas: document.getElementById("canvas"),
  arguments: [],
  noInitialRun: true,
  ENV: oracle ? { SFHS_ORACLE_OUTPUT: "/oracle-output" } : undefined,
  print: (value) => console.log(String(value)),
  printErr: (value) => {
    state.lastEngineDiagnostic = String(value);
    if (
      state.lastEngineDiagnostic.startsWith(
        "emscripten_set_main_loop_timing: Cannot set timing mode",
      )
    )
      console.warn(state.lastEngineDiagnostic);
    else console.error(state.lastEngineDiagnostic);
  },
  onAbort: failLaunch,
  onRuntimeInitialized: () => {
    runtimeReady = true;
    window.Module.FS.writeFile(mobileExtraConfig, mobileExtraConfigText);
    state.weaponCycleConfig = "ready";
    document.body.dataset.sfhsP7Runtime = "ready";
    resolveRuntime();
  },
};
window.SFHS_P3_MODULE = window.SFHS_P3_MODULE_CONFIG;
