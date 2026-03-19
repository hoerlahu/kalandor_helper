export function setupWhatToRollFeature(showMessage, escapeHtml) {
    const whatToRollFeature = document.getElementById('whatToRollFeature');
    if (!whatToRollFeature) return;

    function resolveRollKey(config, level1, level2, level3, level4) {
        let roll = level1;
        if (level2) roll = level2;
        if (level3) roll = level3;
        if (level4) roll = level4;
        if (!config[roll]) return '__DEFAULT__';
        return roll;
    }

    function computeSkillValue(level1, level2, level3, level4, rollConfig) {
        if (level1 && level2 && level3 && level4) {
            return window._importedCharacter[level1][level2][level3][level4] * rollConfig.WertMultiplikator;
        }
        if (level1 && level2 && level3) {
            return window._importedCharacter[level1][level2][level3] * rollConfig.WertMultiplikator;
        }
        return 0;
    }

    function collectItemNotesAndBonus(selectedSkill, base, level2, level3, enabledItemIndexes) {
        let notesHtml = '';
        let itemBonusTotal = 0;

        const items = window._importedCharacter && window._importedCharacter.inventory && window._importedCharacter.inventory.items;
        if (!selectedSkill || !Array.isArray(items)) {
            return { notesHtml, itemBonusTotal };
        }

        const foundNotes = [];

        items.forEach((item, itemIndex) => {
            const applyNumericalBonus = !enabledItemIndexes || enabledItemIndexes.has(itemIndex);
            const matchedNotes = [];

            if (Array.isArray(item.skillNotes)) {
                item.skillNotes.forEach((noteObj) => {
                    const matchesSkill = noteObj.skill === selectedSkill || noteObj.skill === base || noteObj.skill === level2 || noteObj.skill === level3;
                    if (!matchesSkill) return;

                    if (applyNumericalBonus && typeof noteObj.numericalBonus === 'number') {
                        itemBonusTotal += noteObj.numericalBonus;
                    }

                    if (noteObj.note) {
                        const bonusPart = typeof noteObj.numericalBonus === 'number'
                            ? ' <strong>(' + (noteObj.numericalBonus >= 0 ? '+' : '') + noteObj.numericalBonus + ')</strong>'
                            : '';
                        matchedNotes.push(escapeHtml(noteObj.note) + bonusPart);
                    }
                });
            }

            if (!matchedNotes.length) return;

            const itemColor = applyNumericalBonus ? '' : 'color:#aaa;';
            foundNotes.push(
                '<div class="muted" style="margin-top:4px;' + itemColor + '">' +
                '<label style="cursor:pointer;' + itemColor + '">' +
                '<input class="roll-item-toggle" data-item-index="' + itemIndex + '" type="checkbox" ' + (applyNumericalBonus ? 'checked' : '') + ' style="margin-right:6px;" />' +
                '<strong>' + escapeHtml(item.name || ('Item ' + (itemIndex + 1))) + '</strong>' +
                '</label>' +
                '<div style="margin-left:16px;' + itemColor + '">' + matchedNotes.join('<br>') + '</div>' +
                '</div>'
            );
        });

        if (foundNotes.length) {
            notesHtml = '<div style="margin-top:10px;">' + foundNotes.join('') + '</div>';
        }

        return { notesHtml, itemBonusTotal };
    }

    function buildBaseEntry(base, rollConfig, level1, level2, level3, level4, selectedSkill, enabledItemIndexes) {
        const skillValue = computeSkillValue(level1, level2, level3, level4, rollConfig);
        const basiswertMultiplier = typeof rollConfig.BasiswertMultiplier === 'number' ? rollConfig.BasiswertMultiplier : 1;
        const basiswert = window._importedCharacter.Attribute.Basiswert[base];
        const zehnerStelle = Math.floor(window._importedCharacter.Attribute.Basiswert[base] / 10);
        const zehnerStelleMultiplikator = rollConfig['10erStelleMultiplikator'] ? rollConfig['10erStelleMultiplikator'] : 0;
        const basisWertPunkte = window._importedCharacter.Attribute.Punkte[base] || 0;
        const basisWertPunkteMultiplikator = rollConfig.BasisWertPunkteMultiplikator || 0;
        const itemNotes = collectItemNotesAndBonus(selectedSkill, base, level2, level3, enabledItemIndexes);

        const overallValue = (basiswert * basiswertMultiplier) + skillValue + (zehnerStelle * zehnerStelleMultiplikator) + (basisWertPunkte * basisWertPunkteMultiplikator) + itemNotes.itemBonusTotal;

        return {
            base,
            content: '<div id="basiswertInfo" data-roll-base="' + escapeHtml(base) + '" style="margin-top:8px;">' +
                'Basiswert: ' + basiswert + '<br>' +
                'BasiswertMultiplier: ' + basiswertMultiplier + '<br>' +
                '10s Place Attributes: ' + (rollConfig['10erStelle'] ? (zehnerStelle * zehnerStelleMultiplikator) : 'No') + '<br>' +
                'BasiswertPunkte: ' + (basisWertPunkte * basisWertPunkteMultiplikator) + '<br>' +
                'Skillpunkte: ' + skillValue + '<br>' +
                'Item-Boni: ' + (itemNotes.itemBonusTotal >= 0 ? '+' : '') + itemNotes.itemBonusTotal + '<br>' +
                '<br>' +
                'Grundwert: ' + overallValue + '<br>' +
                '<br>' +
                'Roll20: <code>/r 1d100-' + overallValue + '</code>' +
                ' <button type="button" class="btn-secondary" style="padding:2px 8px;font-size:0.85em;" onclick="navigator.clipboard.writeText(\'/r 1d100-' + overallValue + '\')">Copy</button><br>' +
                '<br>' +
                'Items: ' + (itemNotes.notesHtml ? itemNotes.notesHtml : 'None') + '<br>' +
                '</div>'
        };
    }

    function buildBasiswertView(baseEntries, preferredBase) {
        if (!baseEntries.length) return '';

        const activeBase = baseEntries.some((entry) => entry.base === preferredBase)
            ? preferredBase
            : baseEntries[0].base;
        const activeEntry = baseEntries.find((entry) => entry.base === activeBase) || baseEntries[0];
        const basiswertOptions = baseEntries
            .map((entry) => '<option value="' + escapeHtml(entry.base) + '"' + (entry.base === activeBase ? ' selected' : '') + '>' + escapeHtml(entry.base) + '</option>')
            .join('');

        return '<div style="margin-top:8px;">' +
            '<label for="basiswertSelect" style="display:block;margin-bottom:8px;"><strong>Basiswert:</strong></label>' +
            '<select id="basiswertSelect" style="padding:8px;margin-bottom:12px;">' + basiswertOptions + '</select>' +
            activeEntry.content +
            '</div>';
    }

    function displayRollInfo(level1, level2, level3, level4, enabledItemIndexes, preferredBase) {
        if (!level1) return 'No roll selected';

        const selectedSkill = level4 || level3 || level2;
        const config = window._config || {};
        const rollKey = resolveRollKey(config, level1, level2, level3, level4);
        const rollConfig = config[rollKey];

        if (!rollConfig || !Array.isArray(rollConfig.BasisWert)) {
            return 'No configuration found for roll: ' + rollKey;
        }

        const baseEntries = rollConfig.BasisWert.map((base) =>
            buildBaseEntry(base, rollConfig, level1, level2, level3, level4, selectedSkill, enabledItemIndexes)
        );

        if (!baseEntries.length) {
            return 'No configuration found for roll: ' + rollKey;
        }

        return buildBasiswertView(baseEntries, preferredBase);
    }

    function collectTerminalPaths(value, currentPath, output) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const nestedKeys = Object.keys(value);
            if (!nestedKeys.length && currentPath) {
                output.push(currentPath);
                return;
            }
            nestedKeys.forEach((key) => {
                const nextPath = currentPath ? currentPath + ' > ' + key : key;
                collectTerminalPaths(value[key], nextPath, output);
            });
            return;
        }

        if (currentPath) {
            output.push(currentPath);
        }
    }

    function getRollPathOptions(parentData) {
        const childKeys = Object.keys(parentData);
        const generalSkills = [];

        if (window._config) {
            if (Array.isArray(window._config.generalSkills)) {
                generalSkills.push(...window._config.generalSkills);
            }
            Object.keys(window._config).forEach((key) => {
                const value = window._config[key];
                if (typeof value === 'object' && value.MetaSkill === true && !generalSkills.includes(key)) {
                    generalSkills.push(key);
                }
            });
        }

        const paths = [];
        childKeys.forEach((key) => {
            collectTerminalPaths(parentData[key], key, paths);
        });

        generalSkills.forEach((skill) => {
            if (!paths.includes(skill)) {
                paths.push(skill);
            }
        });

        return paths;
    }

    function parseRollPath(path) {
        const parts = path.split('>').map((part) => part.trim()).filter(Boolean);
        return {
            level2: parts[0],
            level3: parts[1],
            level4: parts[2]
        };
    }

    function createPanelMarkup() {
        let html = '<div style="padding:12px;border-radius:6px;background:#f1f8ff;border:1px solid #cfe6ff;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">';
        html += '<h3 style="margin:0;">What do I roll?</h3>';
        html += '<button id="rollSelectorClose" type="button" class="btn-secondary">Close</button>';
        html += '</div>';
        html += '<label style="display:block;margin-bottom:10px;" for="rollSearchInput"><strong>Roll:</strong></label>';
        html += '<input id="rollSearchInput" type="text" list="rollSearchList" autocomplete="off" placeholder="Type to search a roll..." style="padding:8px;margin-bottom:15px;width:100%;" />';
        html += '<datalist id="rollSearchList"></datalist>';
        html += '<div id="rollResult" style="margin-top:15px;font-weight:bold;"></div>';
        html += '</div>';
        return html;
    }

    whatToRollFeature.addEventListener('click', () => {
        if (!window._importedCharacter) {
            showMessage('This feature helps you find out what influences your rolls. Import a character first!', false);
            return;
        }

        const selectedParent = 'Skills';
        const rollSelector = document.getElementById('rollSelector');
        const charData = window._importedCharacter;

        rollSelector.innerHTML = createPanelMarkup();
        rollSelector.style.display = 'block';

        const importResult = document.getElementById('importResult');
        importResult.style.display = 'none';

        const rollSearchInput = document.getElementById('rollSearchInput');
        const rollSearchList = document.getElementById('rollSearchList');
        const rollResult = document.getElementById('rollResult');
        const rollSelectorClose = document.getElementById('rollSelectorClose');
        const enabledItemIndexes = new Set(
            charData && charData.inventory && Array.isArray(charData.inventory.items)
                ? charData.inventory.items.map((_, index) => index)
                : []
        );

        function renderRollHtml(nextHtml) {
            rollResult.innerHTML = nextHtml;
        }

        const parentData = charData[selectedParent] || {};
        const rollPathOptions = getRollPathOptions(parentData);
        const rollPathSet = new Set(rollPathOptions);

        rollSearchList.innerHTML = '';
        rollPathOptions.forEach((pathValue) => {
            rollSearchList.innerHTML += '<option value="' + escapeHtml(pathValue) + '"></option>';
        });

        function updateRollResult(preferredBase) {
            const selectedPath = rollSearchInput.value.trim();
            const currentBase = preferredBase || (rollResult.querySelector('#basiswertSelect') ? rollResult.querySelector('#basiswertSelect').value : '');

            if (!selectedPath || !rollPathSet.has(selectedPath)) {
                renderRollHtml('');
                return;
            }

            const levels = parseRollPath(selectedPath);
            const level2Value = levels.level2 ? parentData[levels.level2] : undefined;
            const level3Value = levels.level2 && levels.level3 && level2Value ? level2Value[levels.level3] : undefined;

            if (levels.level4) {
                renderRollHtml('<strong>' + displayRollInfo(selectedParent, levels.level2, levels.level3, levels.level4, enabledItemIndexes, currentBase) + '</strong>');
                return;
            }

            if (levels.level3) {
                if (typeof level3Value !== 'object' || level3Value === null || Array.isArray(level3Value)) {
                    renderRollHtml('<strong>' + displayRollInfo(selectedParent, levels.level2, levels.level3, undefined, enabledItemIndexes, currentBase) + '</strong>');
                    return;
                }
                renderRollHtml('');
                return;
            }

            if (typeof level2Value !== 'object' || level2Value === null || Array.isArray(level2Value)) {
                renderRollHtml('<strong>' + displayRollInfo(selectedParent, levels.level2, undefined, undefined, enabledItemIndexes, currentBase) + '</strong>');
                return;
            }

            renderRollHtml('');
        }

        rollSelectorClose.addEventListener('click', () => {
            rollSelector.innerHTML = '';
            rollSelector.style.display = 'none';
            importResult.style.display = '';
        });

        rollSearchInput.addEventListener('input', () => {
            updateRollResult();
        });

        rollSearchInput.addEventListener('change', () => {
            updateRollResult();
        });

        rollResult.addEventListener('change', (event) => {
            const target = event.target;
            if (target instanceof HTMLSelectElement && target.id === 'basiswertSelect') {
                updateRollResult(target.value);
                return;
            }
            if (!(target instanceof HTMLInputElement) || !target.classList.contains('roll-item-toggle')) return;

            const currentBase = rollResult.querySelector('#basiswertSelect') ? rollResult.querySelector('#basiswertSelect').value : '';
            const itemIndex = Number(target.getAttribute('data-item-index'));
            if (!Number.isInteger(itemIndex)) return;

            if (target.checked) {
                enabledItemIndexes.add(itemIndex);
            } else {
                enabledItemIndexes.delete(itemIndex);
            }
            updateRollResult(currentBase);
        }, true);
    });
}
