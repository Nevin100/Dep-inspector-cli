# dep-inspector-cli

> Advanced CLI tool to analyze your Node.js project dependencies — with vulnerability scanning, outdated version detection, dependency chain tracing, and optional AI-powered insights via Groq.

[![npm version](https://img.shields.io/npm/v/dep-inspector-cli)](https://www.npmjs.com/package/dep-inspector-cli)
[![npm downloads](https://img.shields.io/npm/dw/dep-inspector-cli)](https://www.npmjs.com/package/dep-inspector-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

---

## What it does

- 🌳 **Dependency tree** — visual tree of all your dependencies with outdated version highlights
- 🛡️ **Vulnerability scan** — runs `npm audit` and surfaces issues with severity levels
- 🔗 **Dependency chains** — traces exactly which package pulled in a vulnerable dependency
- 📦 **Package info** — shows homepage, author, repo link for each flagged package
- 🔄 **Alternatives** — suggests modern replacements for deprecated/risky packages
- 🤖 **AI insights** — optional Groq-powered analysis with actionable fix suggestions
- 📄 **JSON output** — machine-readable output for CI/CD pipelines

---

## Installation

```bash
npm install -g dep-inspector-cli
```

---

## Usage

Run from your project root (where `package.json` lives):

```bash
# Basic analysis
dep-inspector

# Same as above using explicit subcommand
dep-inspector analyze

# Enable AI-powered insights (requires GROQ_API_KEY)
dep-inspector --ai

# Output as JSON (great for CI/CD pipelines)
dep-inspector --json

# Limit dependency tree depth (useful for large projects)
dep-inspector --depth 3

# Combine flags
dep-inspector --ai --depth 2
dep-inspector analyze --json --depth 4
```

---

## Commands & Flags

| Command / Flag | Description |
|---|---|
| `dep-inspector` | Run full analysis (default) |
| `dep-inspector analyze` | Explicit analyze subcommand |
| `--ai` | Enable AI analysis via Groq LLM |
| `--json` | Output results as JSON |
| `--depth <n>` | Limit dependency tree to n levels deep |

---

## Example Output

```
🌳 Dependency Tree

└── my-project@1.0.0
    ├── axios@0.21.1 (latest: 1.7.2) ❌ HIGH
    ├── express@4.18.2
    │   ├── body-parser@1.20.1
    │   └── serve-static@1.15.0
    └── lodash@4.17.21

⚠️  Vulnerability Analysis

📦 axios
  Severity   : HIGH
  Version    : 0.21.1 → 1.7.2
  ⚠️  Breaking change possible!
  About      : Promise based HTTP client
  Docs       : https://axios-http.com
  Author     : Matt Zabriskie
  Repo       : https://github.com/axios/axios
  Alternative: —
  Tests      :
    - Test API calls
    - Validate request/response headers
  🔗 Chain: root → axios

💡 Fix Suggestions

  → axios: npm install axios@latest

✨ Analysis Complete
```

---

## AI Setup (optional)

The `--ai` flag uses [Groq](https://console.groq.com) to provide detailed security analysis for each vulnerable package.

1. Get a free API key at [console.groq.com](https://console.groq.com)
2. Create a `.env` file in your project root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

The AI will provide:
- Issue explanation
- Security impact assessment
- Recommended fix
- Alternative package suggestions

---

## CI/CD Integration

Use `--json` flag to integrate into your pipeline:

```bash
# Generate JSON report
dep-inspector --json > dep-report.json

# Fail build if any vulnerabilities found
dep-inspector --json | node -e "
  let data = '';
  process.stdin.on('data', d => data += d);
  process.stdin.on('end', () => {
    const r = JSON.parse(data);
    const count = Object.keys(r.vulnerabilities).length;
    if (count > 0) {
      console.error('Found ' + count + ' vulnerabilities. Failing build.');
      process.exit(1);
    }
    console.log('No vulnerabilities found.');
  });
"
```

**GitHub Actions example:**

```yaml
- name: Check dependencies
  run: dep-inspector --json > dep-report.json

- name: Upload report
  uses: actions/upload-artifact@v3
  with:
    name: dependency-report
    path: dep-report.json
```

---

## Requirements

- Node.js >= 16
- npm (must be available in PATH)
- `GROQ_API_KEY` in `.env` (only required for `--ai` flag)

---

## Tech Stack

- **TypeScript** — fully typed codebase
- **Commander.js** — CLI argument parsing
- **Chalk** — colored terminal output
- **Ora** — terminal spinner
- **LangChain + Groq** — AI analysis
- **Semver** — version comparison

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

```bash
git clone https://github.com/Nevin100/Dep-inspector-nevin
cd Dep-inspector-nevin
npm install
npm run build
```

---

## License

MIT © [Nevin Bali](https://github.com/Nevin100)