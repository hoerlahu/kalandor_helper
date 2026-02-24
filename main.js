import { setupWhatToRollFeature } from './whatToRollFeature.js';
import { setupImportExportFeature } from './importExportFeature.js';

// default configuration – can be overridden by config.json
window._config = {};

    // try to load external config file automatically; no user action required
    function loadConfig() {
        return fetch('config.json')
            .then(resp => {
                if (!resp.ok) return null; // file not found or error
                return resp.json();
            })
            .then(data => {
                if (data) {
                    // shallow merge – expand as needed
                    window._config = { ...window._config, ...data };
                }
            })
            .catch(() => {
                // ignore failures – we'll just use defaults
            });
    }

    const importResult = document.getElementById('importResult');

    // load configuration early and then show its contents
    loadConfig().then(() => {
        // show config in message area for visibility
        showMessage('<pre style="text-align:left;white-space:pre-wrap;">' +
            escapeHtml(JSON.stringify(window._config, null, 2)) + '</pre>', false);
    });

    function showMessage(html, isError) {
        importResult.innerHTML =
            '<div style="padding:12px;border-radius:6px;'+
            (isError
                ? 'background:#ffe6e6;border:1px solid #ffb3b3;color:#800;'
                : 'background:#f1f8ff;border:1px solid #cfe6ff;color:#033;') +
            '">'+ html + '</div>';
    }

    // import/export and file handling logic has been moved to importExportFeature.js

// displayRollInfo has been moved into whatToRollFeature.js

    function escapeHtml(s) {
        const entityMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return s.replace(/[&<>\"']/g, function(c) {
            return entityMap[c];
        });
    }

// initialize extracted features after helpers are available
setupWhatToRollFeature(showMessage, escapeHtml);
setupImportExportFeature(showMessage, escapeHtml);
