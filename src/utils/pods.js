export function parsePods(raw) {
  return raw
    .trim()
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("NAME"))
    .map((l) => {
      const p = l.trim().split(/\s+/);
      return p.length >= 5
        ? { name: p[0], ready: p[1], status: p[2], restarts: p[3], age: p[4] }
        : null;
    })
    .filter(Boolean);
}

export function parsePodNames(raw) {
  return raw
    .trim()
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("NAME"))
    .map((l) => l.trim().split(/\s+/)[0].replace(/^pods?\//, ""))
    .filter(Boolean);
}

// strip the replicaset/pod hash, e.g. -96bb47699-fr82k
export function guessDeployName(podName) {
  const twoSegment = podName.replace(/-[a-z0-9]{5,12}-[a-z0-9]{4,6}$/, "");
  if (twoSegment !== podName) return twoSegment;

  const oneSegment = podName.replace(/-[a-z0-9]{8,}$/, "");
  if (oneSegment !== podName) return oneSegment;

  return podName;
}
