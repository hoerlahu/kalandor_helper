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

    const whatToRollFeature = document.getElementById('whatToRollFeature');
    whatToRollFeature.addEventListener('click', () => {
        if (!window._importedCharacter) {
            showMessage('This feature helps you find out what influences your rolls. Import a character first!', false);
            return;
        }
        
        const rollSelector = document.getElementById('rollSelector');
        const charData = window._importedCharacter;
        const parentKeys = Object.keys(charData).filter(k => k!=='Allgemein'); // exclude Allgemein section from roll selection
        
        // Create HTML for dropdowns
        let html = '<div style="padding:12px;border-radius:6px;background:#f1f8ff;border:1px solid #cfe6ff;">';
        html += '<h3>What do I roll?</h3>';
        
        // Parent dropdown
        html += '<label style="display:block;margin-bottom:10px;"><strong>Category:</strong></label>';
        html += '<select id="parentSelect" style="padding:8px;margin-bottom:15px;">';
        html += '<option value="">Select a category...</option>';
        parentKeys.forEach(key => {
            html += '<option value="' + escapeHtml(key) + '">' + escapeHtml(key) + '</option>';
        });
        html += '</select>';
        
        // Child dropdown (hidden initially)
        html += '<label style="display:block;margin-bottom:10px;" id="childLabel"><strong>Property:</strong></label>';
        html += '<select id="childSelect" style="padding:8px;margin-bottom:15px;display:none;">';
        html += '</select>';
        
        // Grandchild dropdown (hidden initially)
        html += '<label style="display:block;margin-bottom:10px;" id="grandchildLabel"><strong>Sub-property:</strong></label>';
        html += '<select id="grandchildSelect" style="padding:8px;margin-bottom:15px;display:none;">';
        html += '</select>';
        
        // Great-grandchild dropdown (hidden initially)
        html += '<label style="display:block;margin-bottom:10px;" id="greatgrandchildLabel"><strong>Sub-sub-property:</strong></label>';
        html += '<select id="greatgrandchildSelect" style="padding:8px;margin-bottom:15px;display:none;">';
        html += '</select>';
        
        // Result display
        html += '<div id="rollResult" style="margin-top:15px;font-weight:bold;"></div>';
        html += '</div>';
        
        rollSelector.innerHTML = html;
        rollSelector.style.display = 'block';
        importResult.style.display = 'none';
        
        // Add event listeners
        const parentSelect = document.getElementById('parentSelect');
        const childSelect = document.getElementById('childSelect');
        const childLabel = document.getElementById('childLabel');
        const grandchildSelect = document.getElementById('grandchildSelect');
        const grandchildLabel = document.getElementById('grandchildLabel');
        const greatgrandchildSelect = document.getElementById('greatgrandchildSelect');
        const greatgrandchildLabel = document.getElementById('greatgrandchildLabel');
        const rollResult = document.getElementById('rollResult');
        
        parentSelect.addEventListener('change', () => {
            const selectedParent = parentSelect.value;
            rollResult.innerHTML = '';
            
            if (!selectedParent) {
                childSelect.style.display = 'none';
                childLabel.style.display = 'none';
                grandchildSelect.style.display = 'none';
                grandchildLabel.style.display = 'none';
                greatgrandchildSelect.style.display = 'none';
                greatgrandchildLabel.style.display = 'none';
                return;
            }
            
            const parentData = charData[selectedParent];
            const childKeys = Object.keys(parentData);
            
            childSelect.innerHTML = '<option value="">Select a property...</option>';
            childKeys.forEach(key => {
                const val = parentData[key];
                let displayText = escapeHtml(key);
                if (typeof val !== 'object' || val === null) {
                    displayText += ': ' + escapeHtml(String(val));
                } else {
                    displayText += ' (Object)';
                }
                childSelect.innerHTML += '<option value="' + escapeHtml(key) + '">' + displayText + '</option>';
            });
            
            childSelect.style.display = 'block';
            childLabel.style.display = 'block';
        });
        
        childSelect.addEventListener('change', () => {
            const selectedParent = parentSelect.value;
            const selectedChild = childSelect.value;
            rollResult.innerHTML = '';
            
            if (!selectedChild) {
                grandchildSelect.style.display = 'none';
                grandchildLabel.style.display = 'none';
                greatgrandchildSelect.style.display = 'none';
                greatgrandchildLabel.style.display = 'none';
                return;
            }
            
            const value = charData[selectedParent][selectedChild];
            
            // Check if value is an object
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const grandchildKeys = Object.keys(value);
                
                grandchildSelect.innerHTML = '<option value="">Select a sub-property...</option>';
                grandchildKeys.forEach(key => {
                    grandchildSelect.innerHTML += '<option value="' + escapeHtml(key) + '">' + escapeHtml(key) + ': ' + escapeHtml(String(value[key])) + '</option>';
                });
                
                grandchildSelect.style.display = 'block';
                grandchildLabel.style.display = 'block';
            } else {
                // Leaf value reached
                rollResult.innerHTML = '<strong>' + escapeHtml(selectedParent) + ' > ' + escapeHtml(selectedChild) + ':</strong> ' + escapeHtml(String(value));
                grandchildSelect.style.display = 'none';
                grandchildLabel.style.display = 'none';
            }
        });
        
        grandchildSelect.addEventListener('change', () => {
            const selectedParent = parentSelect.value;
            const selectedChild = childSelect.value;
            const selectedGrandchild = grandchildSelect.value;
            rollResult.innerHTML = '';
            
            if (!selectedGrandchild) {
                greatgrandchildSelect.style.display = 'none';
                greatgrandchildLabel.style.display = 'none';
                return;
            }
            
            const value = charData[selectedParent][selectedChild][selectedGrandchild];
            
            // Check if value is an object
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const greatgrandchildKeys = Object.keys(value);
                
                greatgrandchildSelect.innerHTML = '<option value="">Select a sub-sub-property...</option>';
                greatgrandchildKeys.forEach(key => {
                    greatgrandchildSelect.innerHTML += '<option value="' + escapeHtml(key) + '">' + escapeHtml(key) + ': ' + escapeHtml(String(value[key])) + '</option>';
                });
                
                greatgrandchildSelect.style.display = 'block';
                greatgrandchildLabel.style.display = 'block';
            } else {
                // Leaf value reached
                rollResult.innerHTML = '<strong>' + escapeHtml(selectedParent) + ' > ' + escapeHtml(selectedChild) + ' > ' + escapeHtml(selectedGrandchild) + ':</strong> ' + escapeHtml(String(value));
                greatgrandchildSelect.style.display = 'none';
                greatgrandchildLabel.style.display = 'none';
            }
        });
        
        greatgrandchildSelect.addEventListener('change', () => {
            const selectedParent = parentSelect.value;
            const selectedChild = childSelect.value;
            const selectedGrandchild = grandchildSelect.value;
            const selectedGreatgrandchild = greatgrandchildSelect.value;
            
            if (!selectedGreatgrandchild) {
                rollResult.innerHTML = '';
                return;
            }
            
            const value = charData[selectedParent][selectedChild][selectedGrandchild][selectedGreatgrandchild];
            rollResult.innerHTML = '<strong>' + escapeHtml(selectedParent) + ' > ' + escapeHtml(selectedChild) + ' > ' + escapeHtml(selectedGrandchild) + ' > ' + escapeHtml(selectedGreatgrandchild) + ':</strong> ' + escapeHtml(String(value));
        });
    });

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
