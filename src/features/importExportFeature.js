function getDateStamp() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}_${month}_${day}`;
}

function sanitizeFileName(name) {
    return String(name || 'Character').replace(/[<>:"/\\|?*]/g, '');
}

function getCharacterName(character) {
    if (character && character.Allgemein && character.Allgemein.Name) {
        return character.Allgemein.Name;
    }
    return 'Character';
}

function renderObjectAsHtml(obj, escapeHtml, depth = 0) {
    if (obj === null || obj === undefined) return '';
    if (typeof obj !== 'object') {
        return `<span>${escapeHtml(String(obj))}</span>`;
    }

    let html = `<ul style="margin-left:${depth * 20}px;">`;
    if (Array.isArray(obj)) {
        obj.forEach((item) => {
            html += `<li>${renderObjectAsHtml(item, escapeHtml, depth + 1)}</li>`;
        });
    } else {
        Object.keys(obj).forEach((key) => {
            html += `<li><strong>${escapeHtml(key)}:</strong> ${renderObjectAsHtml(obj[key], escapeHtml, depth + 1)}</li>`;
        });
    }
    html += '</ul>';

    return html;
}

function warnForMissingSections(data) {
    const requiredSections = ['Allgemein', 'Attribute', 'Ausbildung', 'Disziplinen'];
    const missingSections = requiredSections.filter((key) => !(key in data));
    if (missingSections.length) {
        console.warn('Missing sections:', missingSections);
    }
}

export function setupImportExportFeature(showMessage, escapeHtml) {
    const importButton = document.getElementById('importBtn');
    const fileInput = document.getElementById('fileInput');
    const exportButton = document.getElementById('exportBtn');
    const importResult = document.getElementById('importResult');

    if (importButton && fileInput) {
        importButton.addEventListener('click', () => fileInput.click());
    }

    if (exportButton) {
        exportButton.addEventListener('click', () => {
            if (!window._importedCharacter) {
                showMessage('No character data to export. Please import a character first.', true);
                return;
            }

            const dateStamp = getDateStamp();
            const characterName = sanitizeFileName(getCharacterName(window._importedCharacter));
            const json = JSON.stringify(window._importedCharacter, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${dateStamp} ${characterName}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showMessage('Character exported successfully!', false);
        });
    }

    if (!fileInput) return;

    fileInput.addEventListener('change', (event) => {
        const target = event.target;
        const file = target.files && target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                warnForMissingSections(data);

                const closeButtonHtml = '<button id="clearImportResultBtn" class="btn-secondary" style="margin-bottom:10px;">Close</button>';
                if (window._debugMode) {
                    showMessage(`${closeButtonHtml}<h2>Importierte Daten</h2>${renderObjectAsHtml(data, escapeHtml)}`, false);
                } else {
                    showMessage('<h2>Character imported successfully!</h2>', false);
                }

                const clearButton = document.getElementById('clearImportResultBtn');
                if (clearButton && importResult) {
                    clearButton.addEventListener('click', () => {
                        importResult.innerHTML = '';
                    });
                }

                window._importedCharacter = data;
                window.dispatchEvent(new CustomEvent('character-data-changed', {
                    detail: { source: 'import-export-feature', mode: 'import' }
                }));
            } catch (error) {
                showMessage(`Error parsing JSON: ${escapeHtml(error.message || String(error))}`, true);
            }
        };

        reader.onerror = () => showMessage('Failed to read file.', true);
        reader.readAsText(file, 'utf-8');
        fileInput.value = '';
    });
}