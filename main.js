import { setupWhatToRollFeature } from './whatToRollFeature.js';
import { setupImportExportFeature } from './importExportFeature.js';

// default configuration – can be overridden by config.json
let config = {};

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
                    config = { ...config, ...data };
                }
            })
            .catch(() => {
                // ignore failures – we'll just use defaults
            });
    }

    // update UI strings based on configuration
    // (no longer used; we simply display config contents for debugging)
    function applyConfigToUI() {
        // intentionally empty
    }

    const importResult = document.getElementById('importResult');

    // load configuration early and then show its contents
    loadConfig().then(() => {
        // show config in message area for visibility
        showMessage('<pre style="text-align:left;white-space:pre-wrap;">' +
            escapeHtml(JSON.stringify(config, null, 2)) + '</pre>', false);
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

    function displayRollInfo(level1, level2, level3, level4) {
        let roll = level1;
        if(!level1) return "No roll selected";
        if(level2) roll = level2;
        if(level3) roll = level3;
        if(level4) roll = level4;

        if(config && config[roll]) {
            let output = "";
            config[roll].BasisWert.forEach(base => {
                
                let overallValue = window._importedCharacter["Attribute"][base]+ window._importedCharacter[level1][level2][level3][level4] * config[roll].WertMultiplikator;

                output += "<br>" +
                "Base Attributes: " + base + "<br>" +
                "10s Place Attributes: " + (config[roll]['10erStelle'] || []).join(', ') + "<br>" +
                "Multiplier: " + (config[roll].WertMultiplikator) + "<br>"+ 
                "Gesamt: "+ overallValue + "<br>";
            });
            return output;
        } else {
            return "No configuration found for roll: " + roll;
        }
    }

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
setupWhatToRollFeature(showMessage, escapeHtml, displayRollInfo);
setupImportExportFeature(showMessage, escapeHtml);
