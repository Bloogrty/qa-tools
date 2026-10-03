# QA Tools Lite

Small browser tools for the copy-paste parts of QA and DevOps work on
Kubernetes: building `kubectl` commands, comparing env vars and Deployment
YAML, diffing JSON, and a few other helpers.

The app does not connect to a cluster. You run the commands it builds in your
own terminal and paste the output back in. Settings are saved in the browser's
localStorage.

## Tools

**Kubernetes**

| Tool | What it does |
| --- | --- |
| Kubectl Console | Paste `get pods` output, click a pod, copy commands for logs, scale, delete, exec, deployment YAML, and editing env vars. |
| Service Check | Step from an Ingress to its Service to its pods, with the host, LB address, ports and selector pulled out of each output. |
| Find by Env | Build `kubectl ... -o json \| jq` commands that list pods or deployments by env var name or value. |
| Log Capture | Build a `logs` command that pulls out the lines for one request or trace ID (matching lines, with context, or a start/stop block). |
| ConfigMap Tools | List, read and edit commands, a JSON clean + escape helper for ConfigMap data values, and restart commands. |
| ConfigMap Editor | Turn plain JSON into a ConfigMap manifest, or edit the JSON inside an existing one. |

**Env & YAML**

| Tool | What it does |
| --- | --- |
| Env Compare | Compare `set env --list` output of two workloads, choose per variable, get one `set env` command for the target. |
| Env Edit | Edit env vars in a table and get both an update command and a rollback command. |
| YAML Sync | Compare two Deployment YAMLs and copy the env, volume and volumeMount snippets the target is missing. |
| YAML Merge | Get the full target Deployment YAML with env, volumes and mounts merged in from the reference. |

**Utilities**

| Tool | What it does |
| --- | --- |
| JSON Diff | Semantic JSON compare with a side-by-side view and a list of value, type and missing-key differences. |
| One-liner | Join a multi-line `\` command into one line and edit its `KEY=VALUE` pairs. |
| Cron Timer | Rings on the wall clock at every even interval (with an optional offset), handy for watching scheduled jobs. |
| TC Renumber | Renumber test case names or files (`TC014_...`) in sequence. |

## Quick start

Needs Node.js 20 or newer.

```
npm install
npm run dev       # local dev server
npm run build     # static build into dist/
npm run preview   # serve the build
npm run lint
```

The build is a plain static site with relative paths, so `dist/` can be
hosted anywhere (GitHub Pages, Netlify, an S3 bucket, or opened locally).
Copy buttons use the Clipboard API, which browsers only allow on `https://`
or `localhost`.

## Password (optional)

The app can ask for a password when it opens. Copy `.env.example` to
`.env.local` and set:

| Variable | What it does |
| --- | --- |
| `VITE_APP_PASSWORD_ENABLED` | `true` turns the password on. Empty or `false` (the default) turns it off. |
| `VITE_APP_PASSWORD` | The password. If it is empty, the gate stays off even when enabled. |

Once entered, the password is remembered in the browser for 30 days. Vite
reads env files at startup, so restart the dev server (or rebuild) after
changing them.

This is a client-side gate only: the password is built into the JavaScript,
so it keeps casual visitors out but is not real security.

## Settings

Open **Settings** in the sidebar to set:

- **Namespaces**: the list every tool offers. The first one is the default.
  Defaults are `default`, `staging`, `production`.
- **CLI commands**: what each command starts with. Defaults are `kubectl` and
  `oc`. An entry can carry flags, for example `kubectl --context=staging`, and
  with more than one entry the tools show a CLI switch.
- **Pod panel sections**: which command groups the Kubectl Console shows for a
  selected pod.

## Project structure

```
src/
  App.jsx              sidebar nav, lifted page state, cron timer loop
  auth/                optional password gate (env driven)
  pages/               one file per tool, grouped by sidebar section
  components/          shared UI (CmdBox, ToggleGroup, PodTable, PodPanel, ...)
  hooks/               useWorkspace (namespaces, CLIs), useSettings (pod panel)
  utils/               pure logic, no JSX (YAML/env/JSON diff, command builders)
  constants/
    defaultStates.js   default state for pages whose state lives in App
```

Pages that keep their content when you switch tabs get their state from
`App.jsx` (Kubectl Console, Service Check, YAML Sync, YAML Merge, JSON Diff,
Cron Timer). The others keep local state.

## Adding a tool

1. Create a page in the matching `src/pages/` folder and export a default
   component. Put reusable logic in `src/utils/`.
2. In `App.jsx`, add a `[key, label]` entry to `NAV` and render the page with
   `{tab === "my-tool" && <MyToolPage />}`.
3. If it should keep its content across tab switches, add a `useState` in
   `App.jsx` (default from `constants/defaultStates.js`) and pass
   `state` / `setState` as props.
4. For namespace or CLI choices, read the lists with `useWorkspace()` and
   resolve the current value with `pick()` from `utils/workspace.js`.

## Conventions

- No em dashes or picture emoji in UI text. Plain symbols (✓, ↺, arrows) are fine.
- Styling is inline style objects, no CSS framework. Light theme: white
  background, `#1a1a1a` for primary, grays for secondary text,
  green/amber/red for status.
- Placeholders and examples use neutral names (`orders-api`, `app-config`,
  `req-12345`).
# qa-tools
