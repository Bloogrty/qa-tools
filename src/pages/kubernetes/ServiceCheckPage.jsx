import { useState } from "react";
import CmdBox from "../../components/common/CmdBox";
import PageHeader from "../../components/common/PageHeader";
import ToggleGroup from "../../components/common/ToggleGroup";
import CliToggle from "../../components/kubectl/CliToggle";
import PodTable from "../../components/kubectl/PodTable";
import PodPanel from "../../components/kubectl/PodPanel";
import { useWorkspace } from "../../hooks/useWorkspace";
import { pick } from "../../utils/workspace";
import { parsePods } from "../../utils/pods";

const POD_LABEL_KEYS = ["app", "app.kubernetes.io/name"];

const sLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#555",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 8,
};

const sSection = {
  marginBottom: 16,
  border: "1px solid #eee",
  borderRadius: 8,
  padding: 14,
};

const sTextarea = {
  width: "100%",
  minHeight: 70,
  fontSize: 11,
  fontFamily: "monospace",
  padding: 8,
  border: "1px solid #e0e0e0",
  borderRadius: 6,
  resize: "vertical",
  marginTop: 8,
};

const sStepInput = {
  flex: 1,
  maxWidth: 320,
  padding: "3px 7px",
  fontSize: 11,
  fontFamily: "monospace",
  border: "1px solid #e0e0e0",
  borderRadius: 5,
};

function InfoChip({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "baseline" }}>
      <span
        style={{
          fontSize: 10,
          color: "#888",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </span>
      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#222" }}>
        {value}
      </span>
    </div>
  );
}

function parseIngressYaml(raw) {
  if (!raw.trim()) return null;
  const lines = raw.split("\n");
  const valueOf = (re) => {
    const line = lines.find((l) => re.test(l));
    return line ? line.replace(/^[^:]*:\s*/, "").trim() : null;
  };
  const host = valueOf(/^\s*(- )?host:\s*\S/);
  const ip = valueOf(/^\s+- ip:\s*\S/);
  const lbHost = valueOf(/^\s+- hostname:\s*\S/);
  return host || ip || lbHost ? { host, ip, lbHost } : null;
}

function parseSvcOutput(raw) {
  const lines = raw
    .trim()
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("NAME"));
  if (!lines.length) return null;
  const parts = lines[0].trim().split(/\s+/);
  if (parts.length < 5) return null;
  return {
    type: parts[1],
    clusterIp: parts[2],
    ports: parts[4],
    selector: parts.slice(6).join(" ") || null,
  };
}

export default function ServiceCheckPage({ state, setState }) {
  const { namespaces, clis } = useWorkspace();
  const ns = pick(state.ns, namespaces);
  const cli = pick(state.cli, clis);
  const { service, svcName, podLabel, ingressRaw, svcRaw, podsRaw, pods, selected } =
    state;
  const set = (patch) => setState((prev) => ({ ...prev, ...patch }));
  const [copied, setCopied] = useState(null);

  const svc = (service || "").trim();
  const svcTarget = (svcName || "").trim() || svc || "<name>";
  const podTarget = (podLabel || "").trim() || svc || "<name>";

  const ingressInfo = parseIngressYaml(ingressRaw);
  const svcInfo = parseSvcOutput(svcRaw);

  const handleReset = () => {
    set({
      service: "",
      svcName: "",
      podLabel: "",
      ingressRaw: "",
      svcRaw: "",
      podsRaw: "",
      pods: [],
      selected: null,
    });
    setCopied(null);
  };

  const selectPod = (p) => {
    set({ selected: p });
    setCopied(null);
    const cmd = `${cli} logs -f ${p.name} -n ${ns}`;
    Promise.resolve(navigator.clipboard?.writeText(cmd)).then(() => {
      setCopied(p.name);
      setTimeout(() => setCopied(null), 3000);
    });
  };

  return (
    <div style={{ padding: 16, maxWidth: 920 }}>
      <PageHeader
        title="Service Check"
        subtitle="Walk from an Ingress to its Service to its pods, one command at a time"
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <ToggleGroup
          label="Namespace"
          options={namespaces}
          value={ns}
          onChange={(n) => set({ ns: n })}
        />
        <CliToggle value={cli} onChange={(c) => set({ cli: c })} />
        <input
          value={service || ""}
          onChange={(e) => set({ service: e.target.value })}
          placeholder="Ingress name (e.g. orders-api)"
          style={{
            flex: 1,
            minWidth: 200,
            maxWidth: 400,
            padding: "5px 9px",
            fontSize: 12,
            fontFamily: "monospace",
            border: "1px solid #e0e0e0",
            borderRadius: 6,
          }}
        />
        {svc && (
          <button
            onClick={handleReset}
            style={{
              padding: "4px 9px",
              fontSize: 11,
              cursor: "pointer",
              border: "1px solid #e0e0e0",
              borderRadius: 6,
              background: "#fff",
              color: "#888",
            }}
          >
            reset
          </button>
        )}
      </div>

      <div style={sSection}>
        <div style={sLabel}>1. Ingress</div>
        <CmdBox cmd={`${cli} get ingress ${svc || "<name>"} -n ${ns} -o yaml`} />
        <textarea
          value={ingressRaw}
          onChange={(e) => set({ ingressRaw: e.target.value })}
          placeholder="Paste the get ingress -o yaml output here"
          style={sTextarea}
        />
        {ingressInfo && (
          <div style={{ marginTop: 8, display: "flex", gap: 20, flexWrap: "wrap" }}>
            {ingressInfo.host && <InfoChip label="host" value={ingressInfo.host} />}
            {ingressInfo.ip && <InfoChip label="LB IP" value={ingressInfo.ip} />}
            {ingressInfo.lbHost && (
              <InfoChip label="LB host" value={ingressInfo.lbHost} />
            )}
          </div>
        )}
      </div>

      <div style={sSection}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ ...sLabel, marginBottom: 0 }}>2. Service</div>
          <input
            value={svcName || ""}
            onChange={(e) => set({ svcName: e.target.value })}
            placeholder={svc || "service name, if different"}
            style={sStepInput}
          />
        </div>
        <CmdBox cmd={`${cli} get svc ${svcTarget} -n ${ns} -o wide`} />
        <textarea
          value={svcRaw}
          onChange={(e) => set({ svcRaw: e.target.value })}
          placeholder="Paste the get svc -o wide output here"
          style={sTextarea}
        />
        {svcInfo && (
          <div style={{ marginTop: 8, display: "flex", gap: 20, flexWrap: "wrap" }}>
            <InfoChip label="type" value={svcInfo.type} />
            <InfoChip label="cluster IP" value={svcInfo.clusterIp} />
            <InfoChip label="port(s)" value={svcInfo.ports} />
            {svcInfo.selector && (
              <InfoChip label="selector" value={svcInfo.selector} />
            )}
          </div>
        )}
      </div>

      <div style={sSection}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ ...sLabel, marginBottom: 0 }}>3. Pods</div>
          <input
            value={podLabel || ""}
            onChange={(e) => set({ podLabel: e.target.value })}
            placeholder={svc || "label value, if different"}
            style={sStepInput}
          />
        </div>
        {POD_LABEL_KEYS.map((k) => (
          <CmdBox key={k} cmd={`${cli} get pods -l ${k}=${podTarget} -n ${ns}`} />
        ))}
        <textarea
          value={podsRaw}
          onChange={(e) => set({ podsRaw: e.target.value })}
          placeholder="Paste the get pods output here"
          style={sTextarea}
        />
        <button
          onClick={() => {
            set({ pods: parsePods(podsRaw), selected: null });
            setCopied(null);
          }}
          style={{
            marginTop: 8,
            padding: "6px 14px",
            fontSize: 12,
            cursor: "pointer",
            background: "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
          }}
        >
          Parse pods
        </button>

        {pods.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>
              Click a pod to copy its logs command
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: selected ? "1fr 400px" : "1fr",
                gap: 12,
                alignItems: "start",
              }}
            >
              <PodTable
                pods={pods}
                selected={selected}
                onSelect={selectPod}
                copiedName={copied}
              />
              {selected && (
                <PodPanel key={selected.name} pod={selected} ns={ns} cli={cli} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
