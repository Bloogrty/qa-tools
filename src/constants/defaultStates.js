export const KUBECTL_DEFAULT_STATE = {
  ns: "",
  cli: "",
  service: "",
  panes: {},
};

export const SERVICE_CHECK_DEFAULT_STATE = {
  ns: "",
  cli: "",
  service: "",
  svcName: "",
  podLabel: "",
  ingressRaw: "",
  svcRaw: "",
  podsRaw: "",
  pods: [],
  selected: null,
};

export const JSON_DIFF_DEFAULT_STATE = {
  leftRaw: "",
  rightRaw: "",
  sortKeysOn: true,
  diffs: null,
  parsedLeft: null,
  parsedRight: null,
  errors: { left: null, right: null },
  ran: false,
  activeTab: "sidebyside",
};

export const YAML_SYNC_DEFAULT_STATE = {
  refText: "",
  targetText: "",
  result: null,
  error: "",
  activeSection: "env",
  envMode: "add",
  envConflictChoice: {},
  ignoreEnvs: "",
  includeServiceAccountMount: false,
};

export const YAML_MERGE_DEFAULT_STATE = {
  refText: "",
  targetText: "",
  result: null,
  error: "",
  envMode: "add",
  envConflictChoice: {},
  ignoreEnvs: "",
  includeServiceAccountMount: false,
};

export const TIMER_DEFAULT_STATE = {
  intervalSec: 120,
  running: false,
  remaining: null,
  ringCount: 0,
  ringTimes: [],
  offsetSec: 0,
};
