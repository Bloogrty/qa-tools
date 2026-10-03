import Badge from "./Badge";

export default function SyncSummary({ result }) {
  return (
    <div
      style={{
        background: "#f9f9f9",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: 13 }}>
        <span style={{ color: "#888" }}>Ref: </span>
        <span style={{ fontWeight: 600 }}>{result.refName}</span>
      </div>
      <div style={{ fontSize: 13 }}>
        <span style={{ color: "#888" }}>Target: </span>
        <span style={{ fontWeight: 600 }}>{result.targetName}</span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Badge color="red">Env missing: {result.missingEnvs.length}</Badge>
        <Badge color="amber">Env conflict: {result.conflictEnvs.length}</Badge>
        <Badge color="green">Env same: {result.sameEnvs.length}</Badge>
        {result.ignoredCount > 0 && (
          <Badge color="blue">Ignored: {result.ignoredCount}</Badge>
        )}
        <Badge color="red">Mounts missing: {result.missingMounts.length}</Badge>
        <Badge color="red">Volumes missing: {result.missingVols.length}</Badge>
      </div>
    </div>
  );
}
