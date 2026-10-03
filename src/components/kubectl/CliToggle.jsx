import ToggleGroup from "../common/ToggleGroup";
import { useWorkspace } from "../../hooks/useWorkspace";

export default function CliToggle({ value, onChange }) {
  const { clis } = useWorkspace();
  if (clis.length < 2) return null;
  return (
    <ToggleGroup label="CLI" options={clis} value={value} onChange={onChange} />
  );
}
