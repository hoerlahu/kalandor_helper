import { setupWhatToRollFeature } from './whatToRollFeature.js';
import { setupImportExportFeature } from './importExportFeature.js';
import { setupInventoryFeature } from './inventoryFeature.js';
import { setupCharacterCreationFeature } from './characterCreationFeature.js';

const DEBUG_FLAG_KEY = 'kalandor_debugMode';
window._config = {};
window._debugMode = localStorage.getItem(DEBUG_FLAG_KEY) === 'true';

const debugToggle = document.getElementById('debugModeToggle');
if (debugToggle) {
    debugToggle.checked = window._debugMode;
    debugToggle.addEventListener('change', function onDebugToggleChange() {
        window._debugMode = this.checked;
        localStorage.setItem(DEBUG_FLAG_KEY, String(window._debugMode));
        console.log(window._debugMode ? '[DEBUG] Debug mode enabled' : '[DEBUG] Debug mode disabled');
    });
}

const importResult = document.getElementById('importResult');
const learnMoreButton = document.getElementById('learnMoreBtn');

function showMessage(html, isError) {
    if (!importResult) return;

    const styles = isError
        ? 'background:#ffe6e6;border:1px solid #ffb3b3;color:#800;'
        : 'background:#f1f8ff;border:1px solid #cfe6ff;color:#033;';

    importResult.innerHTML = `<div style="padding:12px;border-radius:6px;${styles}">${html}</div>`;
}

function escapeHtml(value) {
    const entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };

    const normalized = typeof value === 'string' ? value : String(value ?? '');
    return normalized.replace(/[&<>"']/g, (character) => entityMap[character]);
}

function loadConfig() {
    return fetch('config.json')
        .then((response) => {
            if (!response.ok) return null;
            return response.json();
        })
        .then((data) => {
            if (!data) return;
            window._config = { ...window._config, ...data };
        })
        .catch(() => {
            // Fallback to default in-memory config if config.json is unavailable.
        });
}

function loadReadme() {
    return fetch('README.md')
        .then((response) => {
            if (!response.ok) {
                throw new Error('README.md could not be loaded.');
            }
            return response.text();
        })
        .then((readmeText) => {
            showMessage(
                `<pre style="text-align:left;white-space:pre-wrap;">${escapeHtml(readmeText)}</pre>`,
                false
            );
        })
        .catch((error) => {
            showMessage(escapeHtml(error.message || 'Failed to load README.md.'), true);
        });
}

loadConfig().then(() => {
    if (!window._debugMode) return;

    showMessage(
        `<pre style="text-align:left;white-space:pre-wrap;">${escapeHtml(JSON.stringify(window._config, null, 2))}</pre>`,
        false
    );
});

if (learnMoreButton) {
    learnMoreButton.addEventListener('click', () => {
        loadReadme();
    });
}

setupWhatToRollFeature(showMessage, escapeHtml);
setupImportExportFeature(showMessage, escapeHtml);
setupInventoryFeature(showMessage, escapeHtml);
setupCharacterCreationFeature(showMessage, escapeHtml);
