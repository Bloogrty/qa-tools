import jsYaml from "js-yaml";
import { isSvcAccountMount, parseIgnoreList } from "./yamlSync";

export function buildMergedDoc(refDoc, targetDoc, opts) {
  const {
    envMode = "add",
    envConflictChoices = {},
    ignoreEnvs = "",
    includeServiceAccountMount = false,
  } = opts;

  const merged = JSON.parse(JSON.stringify(targetDoc));
  const container = merged?.spec?.template?.spec?.containers?.[0];
  const ignoreSet = parseIgnoreList(ignoreEnvs);

  const refEnv = refDoc?.spec?.template?.spec?.containers?.[0]?.env || [];
  const tgtEnv = container?.env || [];
  const tgtEnvByName = Object.fromEntries(tgtEnv.map((e) => [e.name, e]));
  const refEnvByName = Object.fromEntries(refEnv.map((e) => [e.name, e]));

  const withChoices = tgtEnv.map((e) => {
    if (ignoreSet.has(e.name)) return e;
    if (envConflictChoices[e.name] === "ref" && refEnvByName[e.name])
      return refEnvByName[e.name];
    return e;
  });
  const missing = refEnv.filter(
    (e) => !tgtEnvByName[e.name] && !ignoreSet.has(e.name),
  );

  let newEnv;
  if (envMode === "add") newEnv = [...tgtEnv, ...missing];
  else if (envMode === "sync") newEnv = withChoices;
  else newEnv = [...withChoices, ...missing];

  if (container) container.env = newEnv;

  const refMountsRaw =
    refDoc?.spec?.template?.spec?.containers?.[0]?.volumeMounts || [];
  const refMounts = includeServiceAccountMount
    ? refMountsRaw
    : refMountsRaw.filter((m) => !isSvcAccountMount(m));
  const tgtMounts = container?.volumeMounts || [];
  const tgtMountPaths = new Set(tgtMounts.map((m) => m.mountPath));
  const missingMounts = refMounts.filter((m) => !tgtMountPaths.has(m.mountPath));
  if (container) container.volumeMounts = [...tgtMounts, ...missingMounts];

  const excludedMountNames = includeServiceAccountMount
    ? new Set()
    : new Set(refMountsRaw.filter(isSvcAccountMount).map((m) => m.name));
  const refVols = (refDoc?.spec?.template?.spec?.volumes || []).filter(
    (v) => !excludedMountNames.has(v.name),
  );
  const tgtVols = merged?.spec?.template?.spec?.volumes || [];
  const tgtVolNames = new Set(tgtVols.map((v) => v.name));
  const missingVols = refVols.filter((v) => !tgtVolNames.has(v.name));
  if (merged?.spec?.template?.spec) {
    merged.spec.template.spec.volumes = [...tgtVols, ...missingVols];
  }

  return merged;
}

export function dumpMergedYaml(doc) {
  return jsYaml.dump(doc, { indent: 2, lineWidth: -1, noRefs: true });
}
