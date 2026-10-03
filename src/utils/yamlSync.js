import jsYaml from "js-yaml";

export const isSvcAccountMount = (m) =>
  m?.mountPath?.includes("kubernetes.io/serviceaccount");

export function parseIgnoreList(text) {
  return new Set(
    text
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter(Boolean),
  );
}

export function loadYaml(text, which) {
  try {
    return jsYaml.load(text);
  } catch (e) {
    throw new Error(`Failed to parse ${which} YAML: ${e.message}`, { cause: e });
  }
}

export function getContainers(doc) {
  return doc?.spec?.template?.spec?.containers || [];
}

export function getVolumes(doc) {
  return doc?.spec?.template?.spec?.volumes || [];
}

export function envToMap(envList) {
  const map = {};
  const order = [];
  for (const e of envList || []) {
    if (e?.name && !map[e.name]) {
      map[e.name] = e;
      order.push(e.name);
    }
  }
  return { map, order };
}

export function renderEnvValue(e) {
  if (!e) return "(no value)";
  if (e.value !== undefined && e.value !== null) return String(e.value);
  if (e.valueFrom) return JSON.stringify(e.valueFrom);
  return "(no value)";
}

export function envEntryToYaml(e, indent = "            ") {
  if (e.value !== undefined && e.value !== null) {
    const v = String(e.value).replace(/'/g, "''");
    return `${indent}- name: ${e.name}\n${indent}  value: '${v}'`;
  }
  if (e.valueFrom) {
    const vfLines = jsYaml
      .dump(e.valueFrom, { indent: 2, lineWidth: -1 })
      .trimEnd()
      .split("\n")
      .map((l) => `${indent}    ${l}`)
      .join("\n");
    return `${indent}- name: ${e.name}\n${indent}  valueFrom:\n${vfLines}`;
  }
  return `${indent}- name: ${e.name}`;
}

export function volumeToMap(volumes) {
  const map = {};
  for (const v of volumes || []) {
    if (v?.name) map[v.name] = v;
  }
  return map;
}

export function volumeMountToMap(mounts) {
  const map = {};
  for (const m of mounts || []) {
    if (m?.mountPath) map[m.mountPath] = m;
  }
  return map;
}

function indentedDump(item, indent) {
  return jsYaml
    .dump([item], { indent: 2, lineWidth: -1 })
    .trimEnd()
    .split("\n")
    .map((l) => `${indent}${l}`)
    .join("\n");
}

export const volumeToYaml = (v, indent = "        ") => indentedDump(v, indent);

export const volumeMountToYaml = (m, indent = "            ") =>
  indentedDump(m, indent);

export function analyzeDeployments(
  refText,
  targetText,
  { ignoreEnvs = "", includeServiceAccountMount = false },
) {
  const refDoc = loadYaml(refText, "reference");
  const targetDoc = loadYaml(targetText, "target");

  const refContainers = getContainers(refDoc);
  const targetContainers = getContainers(targetDoc);
  if (!refContainers.length)
    throw new Error("No containers found in reference YAML.");
  if (!targetContainers.length)
    throw new Error("No containers found in target YAML.");

  const ignoreSet = parseIgnoreList(ignoreEnvs);

  const refMountsRaw = refContainers[0].volumeMounts || [];
  const refMounts = includeServiceAccountMount
    ? refMountsRaw
    : refMountsRaw.filter((m) => !isSvcAccountMount(m));
  const targetMounts = targetContainers[0].volumeMounts || [];

  const refEnvMap = envToMap(refContainers[0].env);
  const targetEnvMap = envToMap(targetContainers[0].env);

  const excludedMountNames = includeServiceAccountMount
    ? new Set()
    : new Set(refMountsRaw.filter(isSvcAccountMount).map((m) => m.name));
  const refVolMap = volumeToMap(
    getVolumes(refDoc).filter((v) => !excludedMountNames.has(v.name)),
  );
  const targetVolMap = volumeToMap(getVolumes(targetDoc));
  const refMountMap = volumeMountToMap(refMounts);
  const targetMountMap = volumeMountToMap(targetMounts);

  const sameValue = (n) =>
    renderEnvValue(refEnvMap.map[n]) === renderEnvValue(targetEnvMap.map[n]);
  const checked = refEnvMap.order.filter((n) => !ignoreSet.has(n));

  const missingEnvs = checked
    .filter((n) => !targetEnvMap.map[n])
    .map((n) => refEnvMap.map[n]);
  const conflictEnvs = checked
    .filter((n) => targetEnvMap.map[n] && !sameValue(n))
    .map((n) => ({
      name: n,
      ref: refEnvMap.map[n],
      target: targetEnvMap.map[n],
    }));
  const sameEnvs = checked.filter((n) => targetEnvMap.map[n] && sameValue(n));

  const missingMounts = Object.values(refMountMap).filter(
    (m) => !targetMountMap[m.mountPath],
  );
  const missingVols = missingMounts
    .map((m) => refVolMap[m.name])
    .filter(Boolean)
    .filter((v) => !targetVolMap[v.name]);
  const extraMounts = Object.values(targetMountMap).filter(
    (m) => !refMountMap[m.mountPath],
  );

  return {
    refName: refDoc?.metadata?.name || "ref",
    targetName: targetDoc?.metadata?.name || "target",
    refEnvMap,
    targetEnvMap,
    missingEnvs,
    conflictEnvs,
    sameEnvs,
    missingMounts,
    missingVols,
    extraMounts,
    ignoredCount: ignoreSet.size,
  };
}
