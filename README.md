This is a tool for the game system Kalandor.

<h1>How to use:</h1>
<ol>
<li>create a character with your DM</li>
<li>fill out the character sheet</li>
<li>make a photo of your character sheet</li>
<li>make an AI turn it into JSON format, that matches the provided JSON schema in the example files folder</li>
<li>import your character into the tool</li>
<li>have fun</li>
</ol>

## Testing

The project now includes:

- Unit/integration tests with `Vitest` + `jsdom`
- Schema contract tests with `Ajv`
- End-to-end smoke test with `Playwright`

### Prerequisites

- Node.js 20+ (includes `npm`)

### Install dependencies

```bash
npm install
```

### Run unit/integration/schema tests

```bash
npm run test
```

### Run e2e tests

```bash
npm run test:e2e
```
