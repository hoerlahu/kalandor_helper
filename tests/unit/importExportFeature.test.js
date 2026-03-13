import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupImportExportFeature } from '../../importExportFeature.js';

describe('setupImportExportFeature', () => {
  let showMessage;
  let escapeHtml;
  let originalFileReader;
  let originalCreateObjectURL;
  let originalRevokeObjectURL;

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="importBtn">Import</button>
      <input id="fileInput" type="file" />
      <button id="exportBtn">Export</button>
      <div id="importResult"></div>
    `;

    showMessage = vi.fn();
    escapeHtml = vi.fn((s) => String(s));
    window._importedCharacter = undefined;

    originalFileReader = global.FileReader;
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
  });

  afterEach(() => {
    global.FileReader = originalFileReader;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows an error when exporting without imported character data', () => {
    setupImportExportFeature(showMessage, escapeHtml);

    document.getElementById('exportBtn').click();

    expect(showMessage).toHaveBeenCalledWith(
      'No character data to export. Please import a character first.',
      true
    );
  });

  it('imports valid JSON and stores it on window._importedCharacter', () => {
    class MockFileReader {
      readAsText(file) {
        this.result = file.mockContent;
        this.onload();
      }
    }
    global.FileReader = MockFileReader;

    setupImportExportFeature(showMessage, escapeHtml);

    const fileInput = document.getElementById('fileInput');
    Object.defineProperty(fileInput, 'files', {
      value: [{ mockContent: '{"Allgemein":{"Name":"Aric"},"Attribute":{},"Ausbildung":{},"Disziplinen":{}}' }],
      configurable: true
    });

    fileInput.dispatchEvent(new Event('change'));

    expect(window._importedCharacter).toEqual({
      Allgemein: { Name: 'Aric' },
      Attribute: {},
      Ausbildung: {},
      Disziplinen: {}
    });
    expect(showMessage).toHaveBeenCalled();
  });

  it('opens the hidden file picker when import button is clicked', () => {
    setupImportExportFeature(showMessage, escapeHtml);
    const fileInput = document.getElementById('fileInput');
    const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {});

    document.getElementById('importBtn').click();

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('shows parsing error for invalid JSON', () => {
    class MockFileReader {
      readAsText(file) {
        this.result = file.mockContent;
        this.onload();
      }
    }
    global.FileReader = MockFileReader;

    setupImportExportFeature(showMessage, escapeHtml);

    const fileInput = document.getElementById('fileInput');
    Object.defineProperty(fileInput, 'files', {
      value: [{ mockContent: '{invalid json}' }],
      configurable: true
    });

    fileInput.dispatchEvent(new Event('change'));

    expect(showMessage).toHaveBeenCalledWith(expect.stringContaining('Error parsing JSON:'), true);
  });

  it('shows an error when file reading fails', () => {
    class MockFileReader {
      readAsText() {
        this.onerror();
      }
    }
    global.FileReader = MockFileReader;

    setupImportExportFeature(showMessage, escapeHtml);

    const fileInput = document.getElementById('fileInput');
    Object.defineProperty(fileInput, 'files', {
      value: [{ mockContent: '{}' }],
      configurable: true
    });

    fileInput.dispatchEvent(new Event('change'));

    expect(showMessage).toHaveBeenCalledWith('Failed to read file.', true);
  });

  it('exports character JSON with sanitized filename and success message', () => {
    window._importedCharacter = {
      Allgemein: { Name: 'Aric:/?*' },
      Attribute: {},
      Ausbildung: {},
      Disziplinen: {}
    };

    URL.createObjectURL = vi.fn(() => 'blob:test-url');
    URL.revokeObjectURL = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-13T12:00:00Z'));

    setupImportExportFeature(showMessage, escapeHtml);
    document.getElementById('exportBtn').click();

    const addedLink = appendSpy.mock.calls[0][0];
    expect(addedLink.download).toBe('2026_03_13 Aric.json');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith(addedLink);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    expect(showMessage).toHaveBeenCalledWith('Character exported successfully!', false);
  });
});
