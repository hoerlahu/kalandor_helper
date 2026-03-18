export function setupWhatToRollFeature(showMessage, escapeHtml) {
    // roll computation helper previously in main.js
    function displayRollInfo(level1, level2, level3, level4, enabledItemIndexes) {
        let roll = level1;
        if (!level1) return "No roll selected";
        if (level2) roll = level2;
        if (level3) roll = level3;
        if (level4) roll = level4;
        const selectedSkill = level4 || level3 || level2;

        const config = window._config || {};
        if (!config[roll]) {
            // If no specific config for the selected roll, try to use __DEFAULT__ config if available
            roll = "__DEFAULT__";
        }
        // config object will be imported from main via closure later
        if (config && config[roll]) {
            let output = "";
            config[roll].BasisWert.forEach(base => {
                let skillValue = 0;
                if(level1 && level2 && level3 && level4){
                    skillValue = window._importedCharacter[level1][level2][level3][level4] * config[roll].WertMultiplikator;
                } else if(level1 && level2 && level3){
                    skillValue = window._importedCharacter[level1][level2][level3] * config[roll].WertMultiplikator;
                }
                // Use BasiswertMultiplier if present, default to 1
                const basiswertMultiplier = typeof config[roll].BasiswertMultiplier === 'number' ? config[roll].BasiswertMultiplier : 1;
                const basiswert = window._importedCharacter["Attribute"]["Basiswert"][base];
                
                const zehnerStelle = Math.floor(window._importedCharacter["Attribute"]["Basiswert"][base] / 10);
                const zehnerStelleMultiplikator = config[roll]['10erStelleMultiplikator'] ? config[roll]['10erStelleMultiplikator'] : 0;

                const basisWertPunkte = window._importedCharacter["Attribute"]["Punkte"][base] || 0;
                const basisWertPunkteMultiplikator = config[roll]['BasisWertPunkteMultiplikator'] || 0;

                let notesHtml = '';
                let itemBonusTotal = 0;
                let modifierToggleHtml = '';
                if (selectedSkill && window._importedCharacter && window._importedCharacter.inventory && Array.isArray(window._importedCharacter.inventory.items)) {
                const items = window._importedCharacter.inventory.items;
                let foundNotes = [];

                modifierToggleHtml = '<div class="muted" style="margin-top:8px;">Apply item modifiers:</div>' +
                    items.map((item, itemIndex) => {
                        const applyNumericalBonus = !enabledItemIndexes || enabledItemIndexes.has(itemIndex);
                        return '<label class="muted" style="display:block;margin-top:4px;cursor:pointer;">' +
                            '<input class="roll-item-toggle" data-item-index="' + itemIndex + '" type="checkbox" ' + (applyNumericalBonus ? 'checked' : '') + ' style="margin-right:6px;" />' +
                            escapeHtml(item.name || ('Item ' + (itemIndex + 1))) +
                            '</label>';
                    }).join('');

                items.forEach((item, itemIndex) => {
                    const applyNumericalBonus = !enabledItemIndexes || enabledItemIndexes.has(itemIndex);
                    if (Array.isArray(item.skillNotes)) {
                        item.skillNotes.forEach(noteObj => {
                            if (noteObj.skill === selectedSkill || noteObj.skill === base || noteObj.skill === level2 || noteObj.skill === level3) {
                                if (applyNumericalBonus && typeof noteObj.numericalBonus === 'number') {
                                    itemBonusTotal += noteObj.numericalBonus;
                                }
                                if (noteObj.note) {
                                    const bonusPart = typeof noteObj.numericalBonus === 'number'
                                        ? ' <strong>(' + (noteObj.numericalBonus >= 0 ? '+' : '') + noteObj.numericalBonus + (applyNumericalBonus ? '' : ', ignored') + ')</strong>'
                                        : '';
                                    foundNotes.push('<div class="muted">Item: <strong>' + escapeHtml(item.name) + '</strong> — ' + escapeHtml(noteObj.note) + bonusPart + '</div>');
                                }
                            }
                        });
                    }
                });
                if (foundNotes.length) {
                    notesHtml = '<div style="margin-top:10px;">' + foundNotes.join('') + '</div>';
                }
            }

                const overallValue = (basiswert * basiswertMultiplier) + skillValue + (zehnerStelle * zehnerStelleMultiplikator) + (basisWertPunkte * basisWertPunkteMultiplikator) + itemBonusTotal;
            

                output += "<br>" +
                    "<details data-roll-base='" + escapeHtml(base) + "' style='margin-top:8px;'>" +
                    "<summary style='cursor:pointer;color:#0366d6;'>" + base + "</summary>" +
                    "<div style='margin-left:16px;margin-top:8px;'>" +
                    "Basiswert: " + basiswert + "<br>" +
                    "BasiswertMultiplier: " + basiswertMultiplier + "<br>" +
                    "10s Place Attributes: " + (config[roll]['10erStelle'] ? (zehnerStelle * zehnerStelleMultiplikator) : "No") + "<br>" +
                    "BasiswertPunkte: " + (basisWertPunkte * basisWertPunkteMultiplikator) + "<br>" +
                    "Skillpunkte: " + (skillValue) + "<br>" +
                    "Item-Boni: " + (itemBonusTotal >= 0 ? '+' : '') + itemBonusTotal + "<br>" +
                    "<br>" +
                    "Grundwert: " + overallValue + "<br>" +
                    "<br>" +
                        modifierToggleHtml +
                        "<br>" +
                    "Items: " + (notesHtml ? notesHtml : "None") + "<br>"+
                    "</div>" +
                    "</details>";
            });
            
            return output;
        } else {
            return "No configuration found for roll: " + roll;
        }
    }
    const whatToRollFeature = document.getElementById('whatToRollFeature');
    if (!whatToRollFeature) return; // safety

    whatToRollFeature.addEventListener('click', () => {
        if (!window._importedCharacter) {
            showMessage('This feature helps you find out what influences your rolls. Import a character first!', false);
            return;
        }
        const supportedRoll = 'Skills'; // we focus on Skills section for roll selection
        const rollSelector = document.getElementById('rollSelector');
        const charData = window._importedCharacter;

        // Create HTML for dropdowns
        let html = '<div style="padding:12px;border-radius:6px;background:#f1f8ff;border:1px solid #cfe6ff;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">';
        html += '<h3 style="margin:0;">What do I roll?</h3>';
        html += '<button id="rollSelectorClose" type="button" class="btn-secondary">Close</button>';
        html += '</div>';

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
        const importResult = document.getElementById('importResult');
        importResult.style.display = 'none';

        // Add event listeners
        const childSelect = document.getElementById('childSelect');
        const childLabel = document.getElementById('childLabel');
        const grandchildSelect = document.getElementById('grandchildSelect');
        const grandchildLabel = document.getElementById('grandchildLabel');
        const greatgrandchildSelect = document.getElementById('greatgrandchildSelect');
        const greatgrandchildLabel = document.getElementById('greatgrandchildLabel');
        const rollResult = document.getElementById('rollResult');
        const rollSelectorClose = document.getElementById('rollSelectorClose');
        const enabledItemIndexes = new Set(
            (charData && charData.inventory && Array.isArray(charData.inventory.items)
                ? charData.inventory.items.map((_, index) => index)
                : [])
        );

        function updateRollResult() {
            const selectedChild = childSelect.value;
            const selectedGrandchild = grandchildSelect.value;
            const selectedGreatgrandchild = greatgrandchildSelect.value;

            const openDetails = new Set(
                Array.from(rollResult.querySelectorAll('details[open][data-roll-base]'))
                    .map((detail) => detail.getAttribute('data-roll-base'))
                    .filter(Boolean)
            );

            function renderRollHtml(html) {
                rollResult.innerHTML = html;
                if (!openDetails.size) return;
                rollResult.querySelectorAll('details[data-roll-base]').forEach((detail) => {
                    if (openDetails.has(detail.getAttribute('data-roll-base'))) {
                        detail.open = true;
                    }
                });
            }

            if (!selectedChild) {
                renderRollHtml('');
                return;
            }

            if (selectedGreatgrandchild) {
                renderRollHtml('<strong>' + displayRollInfo(selectedParent, selectedChild, selectedGrandchild, selectedGreatgrandchild, enabledItemIndexes) + '</strong>');
                return;
            }

            if (selectedGrandchild) {
                const grandchildValue = charData[selectedParent][selectedChild][selectedGrandchild];
                if (typeof grandchildValue !== 'object' || grandchildValue === null || Array.isArray(grandchildValue)) {
                    renderRollHtml('<strong>' + displayRollInfo(selectedParent, selectedChild, selectedGrandchild, undefined, enabledItemIndexes) + '</strong>');
                    return;
                }
            }

            const childValue = charData[selectedParent][selectedChild];
            if (typeof childValue !== 'object' || childValue === null || Array.isArray(childValue)) {
                renderRollHtml('<strong>' + displayRollInfo(selectedParent, selectedChild, undefined, undefined, enabledItemIndexes) + '</strong>');
                return;
            }

            renderRollHtml('');
        }

        rollSelectorClose.addEventListener('click', () => {
            rollSelector.innerHTML = '';
            rollSelector.style.display = 'none';
            importResult.style.display = '';
        });

        rollResult.addEventListener('change', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLInputElement)) return;
            if (!target.classList.contains('roll-item-toggle')) return;

            const itemIndex = Number(target.getAttribute('data-item-index'));
            if (!Number.isInteger(itemIndex)) return;

            if (target.checked) {
                enabledItemIndexes.add(itemIndex);
            } else {
                enabledItemIndexes.delete(itemIndex);
            }
            updateRollResult();
        }, true);

        const selectedParent = supportedRoll;
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

        // Get all skill keys, and add 'Absorbtion' if not present
        let childKeys = Object.keys(parentData);
        // Add general skills from config if not present
        let generalSkills = [];
        if (window._config) {
            // Add skills from generalSkills array
            if (Array.isArray(window._config.generalSkills)) {
                generalSkills = window._config.generalSkills.slice();
            }
            // Add any skill with MetaSkill: true
            Object.keys(window._config).forEach(k => {
                const v = window._config[k];
                if (typeof v === 'object' && v.MetaSkill === true && !generalSkills.includes(k)) {
                    generalSkills.push(k);
                }
            });
        }
        generalSkills.forEach(skill => {
            if (!childKeys.includes(skill)) {
                childKeys.push(skill);
            }
        });

        childSelect.innerHTML = '<option value="">Select a property...</option>';
        childKeys.forEach(key => {
            // For general skills, treat as a leaf (number or 0)
            let displayText = escapeHtml(key);
            let val = parentData[key];
            if (generalSkills.includes(key) && (val === undefined || val === null)) {
                val = 0;
            }
            if (typeof val !== 'object' || val === null) {
                displayText += ': ' + escapeHtml(String(val));
            } else {
                displayText += ' (Object)';
            }
            childSelect.innerHTML += '<option value="' + escapeHtml(key) + '">' + displayText + '</option>';
        });

        childSelect.style.display = 'block';
        childLabel.style.display = 'block';

        childSelect.addEventListener('change', () => {
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
                rollResult.innerHTML = '<strong>' + displayRollInfo(selectedParent,selectedChild, undefined, undefined, enabledItemIndexes) + '</strong>';
                grandchildSelect.style.display = 'none';
                grandchildLabel.style.display = 'none';
            }
        });

        grandchildSelect.addEventListener('change', () => {
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
                rollResult.innerHTML = '<strong>' + displayRollInfo(selectedParent,selectedChild,selectedGrandchild, undefined, enabledItemIndexes) + '</strong>';
                greatgrandchildSelect.style.display = 'none';
                greatgrandchildLabel.style.display = 'none';
            }
        });

        greatgrandchildSelect.addEventListener('change', () => {
            const selectedChild = childSelect.value;
            const selectedGrandchild = grandchildSelect.value;
            const selectedGreatgrandchild = greatgrandchildSelect.value;

            if (!selectedGreatgrandchild) {
                rollResult.innerHTML = '';
                return;
            }

            rollResult.innerHTML = '<strong>' + displayRollInfo(selectedParent,selectedChild,selectedGrandchild,selectedGreatgrandchild, enabledItemIndexes) + '</strong>';
        });
    });
}
