import { setupWhatToRollFeature } from './features/whatToRollFeature.js';
import { setupImportExportFeature } from './features/importExportFeature.js';
import { setupInventoryFeature } from './features/inventoryFeature.js';
import { setupCharacterCreationFeature } from './features/characterCreationFeature.js';

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

export function showMessage(html, isError) {
    if (!importResult) return;

    const styles = isError
        ? 'background:#ffe6e6;border:1px solid #ffb3b3;color:#800;'
        : 'background:#f1f8ff;border:1px solid #cfe6ff;color:#033;';

    importResult.innerHTML = `<div style="padding:12px;border-radius:6px;${styles}">${html}</div>`;
}

export function escapeHtml(value) {
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
        });
}

function loadReadme() {
    return fetch('USER_GUIDE.html')
        .then((response) => {
            if (!response.ok) {
                throw new Error('USER_GUIDE.html could not be loaded.');
            }
            return response.text();
        })
        .then((guideHtml) => {
            const header = `<div style="display:flex;justify-content:flex-end;margin-bottom:8px;">` +
                `<button id="learnMoreCloseBtn" class="btn-secondary" type="button">Close</button></div>`;
            showMessage(header + guideHtml, false);
            const closeBtn = importResult.querySelector('#learnMoreCloseBtn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    importResult.innerHTML = '';
                });
            }
        })
        .catch((error) => {
            showMessage(escapeHtml(error.message || 'Failed to load user guide.'), true);
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