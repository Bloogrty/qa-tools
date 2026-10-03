import { shq } from "./shell";

export const MATCH_MODES = [
  { value: "lines", label: "Matching lines" },
  { value: "context", label: "With context" },
  { value: "block", label: "Block" },
];

export function buildLogCmd({
  cli,
  pod,
  ns,
  container,
  since,
  previous,
  search,
  mode,
  before,
  after,
  stop,
}) {
  let cmd = `${cli} logs ${pod} -n ${ns}`;
  if (container) cmd += ` -c ${container}`;
  if (since) cmd += ` --since=${since}`;
  if (previous) cmd += " --previous";

  if (mode === "context") {
    return `${cmd} | grep -F -B ${before || 0} -A ${after || 0} ${shq(search)}`;
  }
  if (mode === "block") {
    // index() matches plain text, so no regex escaping needed
    const awk = stop
      ? `'index($0, s) { f = 1 } f; f && index($0, e) { f = 0 }'`
      : `'index($0, s) { f = 1 } f'`;
    const vars = stop ? `-v s=${shq(search)} -v e=${shq(stop)}` : `-v s=${shq(search)}`;
    return `${cmd} | awk ${vars} ${awk}`;
  }
  return `${cmd} | grep -F ${shq(search)}`;
}
