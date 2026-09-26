# dep-inspector-cli

> DevOps-grade dependency, security & infrastructure scanner for Node.js projects.

[![npm version](https://img.shields.io/npm/v/dep-inspector-cli)](https://www.npmjs.com/package/dep-inspector-cli)
[![npm downloads](https://img.shields.io/npm/dw/dep-inspector-cli)](https://www.npmjs.com/package/dep-inspector-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Nevin100/Dep-inspector-cli/pulls)

---

## What's new in v2

Version 2 transforms `dep-inspector` from a dependency analyzer into a full **DevOps security toolkit** — covering secrets, Docker, CI/CD pipelines, ports, and logging. All features work **without any API key**. AI insights are optional.

- **v2.2.1** — `--fail-on high|medium|low` exit codes on every finding-based command.

---

## Features

| Command | What it does |
| --- | --- |
| `dep-inspector` | Dependency tree + vulnerability scan (v1) |
| `scan:secrets` | Detect hardcoded API keys, .env leaks, private keys |
| `scan:docker` | Dockerfile security analysis |
| `scan:ci` | GitHub Actions workflow linting |
| `scan:ports` | Open port detection & process monitoring |
| `scan:logs` | Winston/Morgan/Pino logger health check |
| `scan:all` | Run everything, one report, one exit code |

---

## Installation

```bash
npm install -g dep-inspector-cli
```

---

## Usage

### Dependency Analysis (v1)

```bash
dep-inspector                   # Full analysis
dep-inspector analyze           # Same, explicit subcommand
dep-inspector --depth 3         # Limit tree depth
dep-inspector --json            # Machine-readable output
dep-inspector --ai              # AI-powered insights (optional, needs GROQ_API_KEY)
```

### Security Scans (v2)

```bash
dep-inspector scan:secrets               # Scan current directory
dep-inspector scan:secrets --dir ./src   # Scan specific directory
dep-inspector scan:secrets --ai          # With AI explanations (optional)

dep-inspector scan:docker                # Analyze Dockerfile
dep-inspector scan:docker --file ./docker/Dockerfile

dep-inspector scan:ci                    # Lint GitHub Actions workflows
dep-inspector scan:ci --dir .github/workflows

dep-inspector scan:ports                 # Check open ports

dep-inspector scan:logs                  # Logger health check

dep-inspector scan:all                   # Full DevOps scan
dep-inspector scan:all --report          # + saves HTML report
dep-inspector scan:all --json            # + JSON output
dep-inspector scan:all --ai              # + AI summary (optional)

dep-inspector scan:all --fail-on high    # Exit code 1 only on HIGH findings
```

### Baseline mode (for legacy repos)

200 old findings shouldn't block CI adoption. Bless the current state once, then fail only on new findings:

```bash
# Bless all current findings as "known" (creates .dep-inspector-baseline.json)
dep-inspector scan:all --update-baseline

# From now on, only NEW findings fail the build
dep-inspector scan:all --baseline

# Custom baseline file location
dep-inspector scan:all --baseline --baseline-file ./config/baseline.json
```

- Works on `analyze`, `scan:secrets`, `scan:docker`, `scan:ci`, `scan:all`
- One shared `.dep-inspector-baseline.json`, fingerprints namespaced per scanner
- `--baseline-file <path>` for a custom location
- Fingerprints use relative paths and include the installed version for deps — works across laptop and CI, and re-reports a package after you upgrade it

---

## What gets detected

### `scan:secrets`

- AWS Access Keys & Secret Keys
- OpenAI, Groq, GitHub tokens
- Hardcoded JWT secrets
- MongoDB / PostgreSQL connection strings
- Stripe & Razorpay live keys
- Generic `password=` / `secret=` assignments
- `.env` files committed to git (checked via `git ls-files`, not filename guessing)
- `.env` missing from `.gitignore`
- Previews are redacted — full secrets never hit your terminal or CI logs

### `scan:docker`

- Container running as root (no non-root `USER`)
- Missing `HEALTHCHECK`
- `:latest` tag usage (non-reproducible builds)
- Secrets hardcoded in `ENV`/`ARG`
- Missing `.dockerignore`
- `npm install` without `--omit=dev` in production
- Single-stage builds (image size warning)

### `scan:ci`

- Hardcoded secrets in workflow YAML
- Deprecated `::set-output` command
- `pull_request_target` + `actions/checkout` (privilege escalation risk)
- Actions pinned to `@main` / `@latest` instead of a version
- Missing dependency cache
- No `timeout-minutes` (stuck jobs)

### `scan:ports`

- Lists all open/listening ports, deduplicated
- Flags database ports (Redis, MongoDB, PostgreSQL, MySQL) publicly exposed
- Flags FTP, Telnet, and other insecure services

### `scan:logs`

- Detects missing logger (console.log in production)
- Checks for `winston-daily-rotate-file` (log rotation)
- Container-aware: recommends stdout JSON logging instead of file transports when a Dockerfile is present
- Validates `LOG_LEVEL` environment variable (only when a real logger exists — no false positives for CLI tools)

---

## Output

All commands support `--json` for machine-readable output:

```bash
dep-inspector scan:secrets --json > secrets-report.json
dep-inspector scan:all --json > full-report.json
```

JSON includes `baselineSuppressed` counts when baseline mode is on.

Severity levels: `HIGH` · `MEDIUM` · `LOW`

### Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Clean (or only below-threshold findings) |
| 1 | Findings at/above `--fail-on` threshold |
| 2 | Invalid `--fail-on` level |

---

## AI Setup (optional)

The `--ai` flag sends findings to Groq LLM for human-readable explanations and fix suggestions. It is **completely optional** — every scan works without it. Secret previews are redacted before anything leaves your machine.

```bash
# Set once in your shell profile or .env
export GROQ_API_KEY=your_key_here

dep-inspector scan:secrets --ai
dep-inspector scan:all --ai
```

Get a free key at [console.groq.com](https://console.groq.com). If the key is missing, the tool runs normally and skips AI output with a note.

---

## CI/CD Integration

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  dep-inspector:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dep-inspector
        run: npm install -g dep-inspector-cli

      - name: Scan secrets
        run: dep-inspector scan:secrets --json > secrets.json

      - name: Scan dependencies
        run: dep-inspector --json > deps.json

      - name: Lint CI workflows
        run: dep-inspector scan:ci

      - name: Upload reports
        uses: actions/upload-artifact@v4
        with:
          name: dep-inspector-reports
          path: "*.json"
```

First time on a legacy repo? Bless the baseline once and commit it:

```bash
dep-inspector scan:all --update-baseline
git add .dep-inspector-baseline.json
git commit -m "chore: bless existing findings baseline"
```

**Fail build on HIGH severity secrets:**

```bash
dep-inspector scan:secrets --json | node -e "
  let d = '';
  process.stdin.on('data', c => d += c);
  process.stdin.on('end', () => {
    const { findings } = JSON.parse(d);
    const high = findings.filter(f => f.severity === 'HIGH').length;
    if (high > 0) { console.error(high + ' HIGH severity secrets found. Failing build.'); process.exit(1); }
    console.log('No HIGH severity secrets found.');
  });
"
```

---

## Project Structure

```
dep-inspector/
├── src/
│   ├── index.ts                   # CLI entry — all commands registered here
│   ├── commands/
│   │   ├── analyze.ts             # v1 dependency analysis
│   │   ├── scan-secrets.ts        # secrets & key scanner
│   │   ├── scan-docker.ts         # Dockerfile analysis
│   │   ├── scan-ci.ts             # GitHub Actions linter
│   │   ├── scan-ports.ts          # port monitor
│   │   ├── scan-logs.ts           # logger health check
│   │   └── scan-all.ts            # full scan orchestrator
│   └── utils/
│       ├── ai.ts                  # optional Groq integration
│       ├── audit.ts               # npm audit wrapper
│       ├── deps.ts                # npm ls wrapper
│       ├── tree.ts                # tree printer
│       └── version.ts             # semver comparison
├── package.json
└── tsconfig.json
```

---

## Requirements

- Node.js >= 16
- npm in PATH
- `GROQ_API_KEY` — only needed for `--ai` flag

---

## Tech Stack

- **TypeScript** — fully typed
- **Commander.js** — CLI argument parsing
- **Chalk** — colored output
- **Ora** — terminal spinners
- **Groq SDK** — optional AI layer (direct, no LangChain dependency)
- **Semver** — version comparison

---

## Roadmap

- [ ] `--format sarif` — findings straight into GitHub's Security tab
- [ ] `scan:supply` — preinstall/postinstall hook audit across node_modules (supply-chain)
- [ ] `score <package>` — dependency trust score before you `npm install`
- [ ] SBOM export (CycloneDX)
- [ ] `scan:repo` — GitHub repo settings audit (branch protection, secret scanning, Dependabot)
- [ ] `scan:env` — `.env` vs `.env.example` drift detection
- [ ] `scan:secrets --history` — scan git history for deleted-but-committed keys

---

## Contributing

```bash
git clone https://github.com/Nevin100/Dep-inspector-cli
cd Dep-inspector-cli
npm install
npm run build
```

Pull requests welcome. For major changes, open an issue first.

---

## License

MIT © [Nevin Bali](https://github.com/Nevin100)