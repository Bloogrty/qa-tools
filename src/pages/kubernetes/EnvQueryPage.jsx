import { useState } from "react";
import CmdBox from "../../components/common/CmdBox";
import PageHeader from "../../components/common/PageHeader";
import ToggleGroup from "../../components/common/ToggleGroup";
import CliToggle from "../../components/kubectl/CliToggle";
import { useWorkspace } from "../../hooks/useWorkspace";
import { pick } from "../../utils/workspace";
import { shq } from "../../utils/shell";

const ALL = "all";

function buildQuery(cli, kind, ns, field, value) {
  const containers =
    kind === "pods" ? ".spec.containers[]" : ".spec.template.spec.containers[]";
  const jq = `.items[] | select(any(${containers}.env[]?; .${field} == ${JSON.stringify(value)})) | .metadata.name`;
  return `${cli} get ${kind} -n ${ns} -o json | jq -r ${shq(jq)}`;
}

function QuerySection({ title, description, field, cli }) {
  const { namespaces } = useWorkspace();
  const [value, setValue] = useState("");
  const [nsChoice, setNsChoice] = useState("");

  const nsMode = pick(nsChoice, [...namespaces, ALL]);
  const targets = nsMode === ALL ? namespaces : [nsMode];
  const v = value.trim();

  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{title}</div>
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
          {description}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <ToggleGroup
          label="Namespace"
          options={[...namespaces, ALL]}
          value={nsMode}
          onChange={setNsChoice}
        />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={field === "name" ? "e.g. FEATURE_FLAG_CHECKOUT" : "e.g. https://payments.example.com"}
        style={{
          width: "100%",
          fontFamily: "monospace",
          fontSize: 13,
          padding: "8px 12px",
          border: "1px solid #ddd",
          borderRadius: 6,
          outline: "none",
          background: "#fafafa",
          color: "#111",
          marginBottom: v ? 14 : 0,
        }}
      />

      {v &&
        targets.map((ns) => (
          <div key={ns}>
            {targets.length > 1 && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#aaa",
                  fontFamily: "monospace",
                  letterSpacing: "0.04em",
                  marginBottom: 8,
                  marginTop: 4,
                  paddingTop: 8,
                  borderTop: "1px solid #f0f0f0",
                }}
              >
                {ns}
              </div>
            )}
            <CmdBox label="Running pods" cmd={buildQuery(cli, "pods", ns, field, v)} />
            <CmdBox label="Deployments" cmd={buildQuery(cli, "deploy", ns, field, v)} />
          </div>
        ))}
    </div>
  );
}

export default function EnvQueryPage() {
  const { clis } = useWorkspace();
  const [cliChoice, setCliChoice] = useState("");
  const cli = pick(cliChoice, clis);

  return (
    <div style={{ padding: 16, maxWidth: 920 }}>
      <PageHeader
        title="Find by Env"
        subtitle="Build commands that list pods or deployments by env var name or value (needs jq)"
      />
      <div style={{ marginBottom: 16 }}>
        <CliToggle value={cli} onChange={setCliChoice} />
      </div>
      <QuerySection
        title="By env value"
        description="Pods / deployments where an env var has exactly this value"
        field="value"
        cli={cli}
      />
      <QuerySection
        title="By env name"
        description="Pods / deployments that set an env var with this name"
        field="name"
        cli={cli}
      />
    </div>
  );
}
