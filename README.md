# Kalandor Character Manager

A browser-based helper tool for Kalandor character data.

The app helps you:
- create a starter character JSON in-app,
- import existing character JSON,
- inspect roll influences,
- manage inventory items and skill notes,
- export your updated character.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start a static server from the project root (example):

```bash
npx serve -l 4173 .
```

3. Open http://127.0.0.1:4173 in your browser.

## Data Model

Character files are expected to follow:
- `ExampleFiles/sample-character.schema.json`

Reference sample:
- `ExampleFiles/sample-character.json`

## User Guide

User-facing feature instructions are in [`USER_GUIDE.html`](USER_GUIDE.html).
This file is also displayed in-app via the **Learn More** button.

## Debug Mode

The **Debug** toggle is stored in local storage.

When enabled:
- loaded config can be displayed,
- import output is shown with more detail.

## Testing

### Run unit + schema tests

```bash
npm run test
```

### Run e2e test

```bash
npm run test:e2e
```

If Playwright browsers are missing:

```bash
npx playwright install
```
