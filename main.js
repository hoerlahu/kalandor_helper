(function(){
    const importBtn = document.getElementById('importBtn');
    const fileInput = document.getElementById('fileInput');
    const importResult = document.getElementById('importResult');

    function showMessage(html, isError) {
        importResult.innerHTML =
            '<div style="padding:12px;border-radius:6px;'+
            (isError
                ? 'background:#ffe6e6;border:1px solid #ffb3b3;color:#800;'
                : 'background:#f1f8ff;border:1px solid #cfe6ff;color:#033;') +
            '">'+ html + '</div>';
    }

    importBtn.addEventListener('click', () => fileInput.click());

    const exportBtn = document.getElementById('exportBtn');
    exportBtn.addEventListener('click', () => {
        if (!window._importedCharacter) {
            showMessage('No character data to export. Please import a character first.', true);
            return;
        }
        
        // get today's date in YYYY_MM_DD format
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}_${month}_${day}`;
        
        // extract character name from Allgemein section
        const charName = (window._importedCharacter.Allgemein && window._importedCharacter.Allgemein.Name)
            ? window._importedCharacter.Allgemein.Name
            : 'Character';
        
        // sanitize filename (remove special characters)
        const sanitizedName = charName.replace(/[<>:"/\\|?*]/g, '');
        
        // convert character data to JSON string with indentation
        const jsonStr = JSON.stringify(window._importedCharacter, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `${dateStr} ${sanitizedName}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showMessage('Character exported successfully!', false);
    });

    fileInput.addEventListener('change', (e) => {
        const target = e.target;
        const file = target.files && target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);

                // optional validation for expected top-level keys
                const requiredSections = ['Allgemein','Attribute','Ausbildung','Disziplinen'];
                const missingSections = requiredSections.filter(k => !(k in data));
                if (missingSections.length) {
                    // warn but continue to allow generic display
                    console.warn('Missing sections:', missingSections);
                }

                // render object as nested lists for human-readable output
                function renderObj(obj, depth = 0) {
                    if (obj === null || obj === undefined) return '';
                    if (typeof obj !== 'object') {
                        return '<span>' + escapeHtml(String(obj)) + '</span>';
                    }
                    let html = '<ul style="margin-left:' + (depth * 20) + 'px;">';
                    if (Array.isArray(obj)) {
                        for (const item of obj) {
                            html += '<li>' + renderObj(item, depth + 1) + '</li>';
                        }
                    } else {
                        for (const key in obj) {
                            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                                html += '<li><strong>' + escapeHtml(key) + ':</strong> ' + renderObj(obj[key], depth + 1) + '</li>';
                            }
                        }
                    }
                    html += '</ul>';
                    return html;
                }
                const html = '<h2>Importierte Daten</h2>' + renderObj(data);
                showMessage(html, false);

                // store parsed object for later use
                window._importedCharacter = data;
            } catch (err) {
                showMessage(
                    'Error parsing JSON: ' + escapeHtml(err.message || String(err)),
                    true
                );
            }
        };
        reader.onerror = () => showMessage('Failed to read file.', true);
        reader.readAsText(file, 'utf-8');

        // reset input so same file can be re-picked
        fileInput.value = '';
    });

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
})();
