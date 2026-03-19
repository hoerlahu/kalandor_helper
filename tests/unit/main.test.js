import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Prevent the four feature modules from attaching DOM listeners during main.js evaluation.
vi.mock('../../src/features/whatToRollFeature.js', () => ({ setupWhatToRollFeature: vi.fn() }));
vi.mock('../../src/features/importExportFeature.js', () => ({ setupImportExportFeature: vi.fn() }));
vi.mock('../../src/features/inventoryFeature.js', () => ({ setupInventoryFeature: vi.fn() }));
vi.mock('../../src/features/characterCreationFeature.js', () => ({ setupCharacterCreationFeature: vi.fn() }));

// Minimal DOM matching the structure defined in index.html.
const SHELL_HTML = `
  <input type="checkbox" id="debugModeToggle" />
  <label for="debugModeToggle">Debug</label>
  <div class="container">
    <div id="characterCreationFeature"></div>
    <div id="whatToRollFeature"></div>
    <div id="inventoryFeature"></div>
    <div class="btn-group">
      <button id="learnMoreBtn" type="button">Learn More</button>
      <button id="importBtn" type="button">Import JSON</button>
      <button id="exportBtn" type="button">Export JSON</button>
      <input id="fileInput" type="file" />
    </div>
    <div id="importResult"></div>
    <div id="rollSelector" style="display:none;"></div>
  </div>`;

// Flush all pending microtasks and one round of macrotasks.
const flushPromises = () => new Promise((r) => setTimeout(r, 0));

// Re-evaluates main.js from scratch each call (vi.resetModules() clears the cache).
async function importMain() {
  vi.resetModules();
  return import('../../src/main.js');
}

// ---------------------------------------------------------------------------
// index.html – static structure
// ---------------------------------------------------------------------------
describe('index.html – page structure', () => {
  const html = readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');

  it('declares the correct document language and charset', () => {
    expect(html).toContain('lang="en"');
    expect(html).toContain('charset="UTF-8"');
  });

  it('includes the three feature tiles', () => {
    expect(html).toContain('id="characterCreationFeature"');
    expect(html).toContain('id="whatToRollFeature"');
    expect(html).toContain('id="inventoryFeature"');
  });

  it('includes all action buttons and the hidden file input', () => {
    expect(html).toContain('id="learnMoreBtn"');
    expect(html).toContain('id="importBtn"');
    expect(html).toContain('id="exportBtn"');
    expect(html).toContain('id="fileInput"');
  });

  it('includes the result area and roll-selector container', () => {
    expect(html).toContain('id="importResult"');
    expect(html).toContain('id="rollSelector"');
  });

  it('includes the debug mode toggle checkbox', () => {
    expect(html).toContain('id="debugModeToggle"');
  });

  it('loads main.js as an ES module', () => {
    expect(html).toContain('type="module"');
    expect(html).toContain('src="src/main.js"');
  });
});

// ---------------------------------------------------------------------------
// escapeHtml
// ---------------------------------------------------------------------------
describe('escapeHtml', () => {
  beforeEach(() => {
    document.body.innerHTML = SHELL_HTML;
    localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
  });

  it('escapes &, <, >, ", and \' characters into HTML entities', async () => {
    const { escapeHtml } = await importMain();
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeHtml("it's fine")).toBe("it&#39;s fine");
  });

  it('leaves plain text unchanged', async () => {
    const { escapeHtml } = await importMain();
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('converts numbers to their string representation', async () => {
    const { escapeHtml } = await importMain();
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(3.14)).toBe('3.14');
  });

  it('converts null and undefined to an empty string', async () => {
    const { escapeHtml } = await importMain();
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// showMessage
// ---------------------------------------------------------------------------
describe('showMessage', () => {
  beforeEach(() => {
    document.body.innerHTML = SHELL_HTML;
    localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
  });

  it('renders non-error messages with a blue info style', async () => {
    const { showMessage } = await importMain();
    showMessage('<strong>Success</strong>', false);
    const inner = document.getElementById('importResult').innerHTML;
    expect(inner).toContain('<strong>Success</strong>');
    expect(inner).toContain('background:#f1f8ff');
    expect(inner).toContain('color:#033');
  });

  it('renders error messages with a red error style', async () => {
    const { showMessage } = await importMain();
    showMessage('Something went wrong', true);
    const inner = document.getElementById('importResult').innerHTML;
    expect(inner).toContain('Something went wrong');
    expect(inner).toContain('background:#ffe6e6');
    expect(inner).toContain('color:#800');
  });

  it('replaces previous message content on each call', async () => {
    const { showMessage } = await importMain();
    showMessage('First', false);
    showMessage('Second', false);
    const inner = document.getElementById('importResult').innerHTML;
    expect(inner).toContain('Second');
    expect(inner).not.toContain('First');
  });
});

// ---------------------------------------------------------------------------
// Debug mode toggle
// ---------------------------------------------------------------------------
describe('debug mode toggle', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
  });

  it('reads debug mode from localStorage on load and reflects it on the checkbox', async () => {
    localStorage.setItem('kalandor_debugMode', 'true');
    document.body.innerHTML = SHELL_HTML;
    await importMain();
    expect(window._debugMode).toBe(true);
    expect(document.getElementById('debugModeToggle').checked).toBe(true);
  });

  it('defaults to debug off when localStorage has no saved value', async () => {
    localStorage.clear();
    document.body.innerHTML = SHELL_HTML;
    await importMain();
    expect(window._debugMode).toBe(false);
    expect(document.getElementById('debugModeToggle').checked).toBe(false);
  });

  it('enables debug mode and writes to localStorage when the toggle is checked', async () => {
    localStorage.clear();
    document.body.innerHTML = SHELL_HTML;
    await importMain();
    const toggle = document.getElementById('debugModeToggle');
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    expect(window._debugMode).toBe(true);
    expect(localStorage.getItem('kalandor_debugMode')).toBe('true');
  });

  it('disables debug mode and writes to localStorage when the toggle is unchecked', async () => {
    localStorage.setItem('kalandor_debugMode', 'true');
    document.body.innerHTML = SHELL_HTML;
    await importMain();
    const toggle = document.getElementById('debugModeToggle');
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));
    expect(window._debugMode).toBe(false);
    expect(localStorage.getItem('kalandor_debugMode')).toBe('false');
  });
});

// ---------------------------------------------------------------------------
// loadConfig
// ---------------------------------------------------------------------------
describe('loadConfig', () => {
  beforeEach(() => {
    localStorage.clear();
    window._debugMode = false;
    document.body.innerHTML = SHELL_HTML;
  });

  it('merges config.json data into window._config after load', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ maxLevel: 10, theme: 'dark' })
    });
    await importMain();
    await flushPromises();
    expect(window._config.maxLevel).toBe(10);
    expect(window._config.theme).toBe('dark');
  });

  it('leaves window._config as an empty object when config.json returns non-OK', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    await importMain();
    await flushPromises();
    expect(window._config).toEqual({});
  });

  it('silently catches a failed fetch without throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    await expect(importMain()).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Learn More button / loadReadme
// ---------------------------------------------------------------------------
describe('Learn More button', () => {
  beforeEach(() => {
    localStorage.clear();
    window._debugMode = false;
    document.body.innerHTML = SHELL_HTML;
  });

  it('injects the guide HTML and a close button when Learn More is clicked', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false })                                            // config.json
      .mockResolvedValueOnce({ ok: true, text: async () => '<p>Guide content</p>' }); // USER_GUIDE.html

    await importMain();
    document.getElementById('learnMoreBtn').click();
    await flushPromises();

    const result = document.getElementById('importResult');
    expect(result.innerHTML).toContain('Guide content');
    expect(result.querySelector('#learnMoreCloseBtn')).not.toBeNull();
  });

  it('applies the non-error (info) style when the guide loads successfully', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, text: async () => '<p>Guide</p>' });

    await importMain();
    document.getElementById('learnMoreBtn').click();
    await flushPromises();

    expect(document.getElementById('importResult').innerHTML).toContain('background:#f1f8ff');
  });

  it('close button clears importResult when clicked', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, text: async () => '<p>Guide</p>' });

    await importMain();
    document.getElementById('learnMoreBtn').click();
    await flushPromises();

    document.getElementById('learnMoreCloseBtn').click();
    expect(document.getElementById('importResult').innerHTML).toBe('');
  });

  it('shows a styled error message when the guide file cannot be loaded', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false })   // config.json
      .mockResolvedValueOnce({ ok: false });  // USER_GUIDE.html – triggers error path

    await importMain();
    document.getElementById('learnMoreBtn').click();
    await flushPromises();

    expect(document.getElementById('importResult').innerHTML).toContain('background:#ffe6e6');
  });
});
