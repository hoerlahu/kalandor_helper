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

    function collectItemNotesAndBonus(selectedSkill, base, level2, level3, enabledSkillNotes, showCheckboxes) {
        const showCb = showCheckboxes !== false;
        let notesHtml = '';
        let itemBonusTotal = 0;

        const items = window._importedCharacter && window._importedCharacter.inventory && window._importedCharacter.inventory.items;
        if (!selectedSkill || !Array.isArray(items)) {
            return { notesHtml, itemBonusTotal };
        }

        const foundNotes = [];

        items.forEach((item, itemIndex) => {
            const itemNoteElements = [];

            if (Array.isArray(item.skillNotes)) {
                item.skillNotes.forEach((noteObj, noteIndex) => {
                    const noteKey = itemIndex + '-' + noteIndex;
                    const isNoteEnabled = !showCb || (enabledSkillNotes && enabledSkillNotes.has(noteKey));
                    
                    const matchesSkill = noteObj.skill === selectedSkill || noteObj.skill === base || noteObj.skill === level2 || noteObj.skill === level3;
                    if (!matchesSkill) return;

                    if (isNoteEnabled && typeof noteObj.numericalBonus === 'number') {
                        itemBonusTotal += noteObj.numericalBonus;
                    }

                    if (noteObj.note) {
                        const hasNumericalBonus = typeof noteObj.numericalBonus === 'number';
                        const bonusPart = hasNumericalBonus
                            ? ' <strong>(' + (noteObj.numericalBonus >= 0 ? '+' : '') + noteObj.numericalBonus + ')</strong>'
                            : '';
                        
                        if (hasNumericalBonus && showCb) {
                            const noteColor = isNoteEnabled ? '' : 'color:#aaa;';
                            itemNoteElements.push(
                                '<label style="cursor:pointer;display:block;' + noteColor + '">' +
                                '<input class="roll-skill-note-toggle" data-note-key="' + noteKey + '" type="checkbox" ' + (isNoteEnabled ? 'checked' : '') + ' style="margin-right:6px;" />' +
                                escapeHtml(noteObj.note) + bonusPart +
                                '</label>'
                            );
                        } else {
                            itemNoteElements.push(
                                '<div style="display:block;margin-bottom:6px;">' +
                                escapeHtml(noteObj.note) + bonusPart +
                                '</div>'
                            );
                        }
                    }
                });
            }

            if (!itemNoteElements.length) return;

            foundNotes.push(
                '<div class="muted" style="margin-top:8px;border-left:2px solid #999;padding-left:8px;">' +
                '<strong>' + escapeHtml(item.name || ('Item ' + (itemIndex + 1))) + '</strong>' +
                '<div style="margin-top:4px;">' + itemNoteElements.join('') + '</div>' +
                '</div>'
            );
        });

        if (foundNotes.length) {
            notesHtml = '<div style="margin-top:10px;">' + foundNotes.join('') + '</div>';
        }

        return { notesHtml, itemBonusTotal };
    }

    function buildBaseEntry(base, rollConfig, level1, level2, level3, level4, selectedSkill, enabledSkillNotes, idSuffix, showCheckboxes) {
        const skillValue = computeSkillValue(level1, level2, level3, level4, rollConfig);
        const basiswertMultiplier = typeof rollConfig.BasiswertMultiplier === 'number' ? rollConfig.BasiswertMultiplier : 1;
        const basiswert = window._importedCharacter.Attribute.Basiswert[base];
        const zehnerStelle = Math.floor(window._importedCharacter.Attribute.Basiswert[base] / 10);
        const zehnerStelleMultiplikator = rollConfig['10erStelleMultiplikator'] ? rollConfig['10erStelleMultiplikator'] : 0;
        const basisWertPunkte = window._importedCharacter.Attribute.Punkte[base] || 0;
        const basisWertPunkteMultiplikator = rollConfig.BasisWertPunkteMultiplikator || 0;
        const itemNotes = collectItemNotesAndBonus(selectedSkill, base, level2, level3, enabledSkillNotes, showCheckboxes);

        const overallValue = (basiswert * basiswertMultiplier) + skillValue + (zehnerStelle * zehnerStelleMultiplikator) + (basisWertPunkte * basisWertPunkteMultiplikator) + itemNotes.itemBonusTotal;
        const divId = idSuffix == null ? ' id="basiswertInfo"' : '';

        return {
            base,
            content: '<div' + divId + ' data-roll-base="' + escapeHtml(base) + '" style="margin-top:8px;">' +
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

    function buildBasiswertView(baseEntries, preferredBase, idSuffix) {
        if (!baseEntries.length) return '';

        const activeBase = baseEntries.some((entry) => entry.base === preferredBase)
            ? preferredBase
            : baseEntries[0].base;
        const activeEntry = baseEntries.find((entry) => entry.base === activeBase) || baseEntries[0];
        const basiswertOptions = baseEntries
            .map((entry) => '<option value="' + escapeHtml(entry.base) + '"' + (entry.base === activeBase ? ' selected' : '') + '>' + escapeHtml(entry.base) + '</option>')
            .join('');

        const isFav = idSuffix != null;
        const selectAttrs = isFav
            ? 'class="roll-fav-basiswert-select" data-fav-index="' + idSuffix + '"'
            : 'id="basiswertSelect"';
        const labelFor = isFav ? '' : ' for="basiswertSelect"';

        return '<div style="margin-top:8px;">' +
            '<label' + labelFor + ' style="display:block;margin-bottom:8px;"><strong>Basiswert:</strong></label>' +
            '<select ' + selectAttrs + ' style="padding:8px;margin-bottom:12px;">' + basiswertOptions + '</select>' +
            activeEntry.content +
            '</div>';
    }

    function displayRollInfo(level1, level2, level3, level4, enabledSkillNotes, preferredBase, idSuffix, showCheckboxes) {
        if (!level1) return 'No roll selected';

        const selectedSkill = level4 || level3 || level2;
        const config = window._config || {};
        const rollKey = resolveRollKey(config, level1, level2, level3, level4);
        const rollConfig = config[rollKey];

        if (!rollConfig || !Array.isArray(rollConfig.BasisWert)) {
            return 'No configuration found for roll: ' + rollKey;
        }

        const baseEntries = rollConfig.BasisWert.map((base) =>
            buildBaseEntry(base, rollConfig, level1, level2, level3, level4, selectedSkill, enabledSkillNotes, idSuffix, showCheckboxes)
        );

        if (!baseEntries.length) {
            return 'No configuration found for roll: ' + rollKey;
        }

        return buildBasiswertView(baseEntries, preferredBase, idSuffix);
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
        let html = '<div id="rollSelectorInner" style="padding:12px;border-radius:6px;background:#f1f8ff;border:1px solid #cfe6ff;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">';
        html += '<h3 style="margin:0;">What do I roll?</h3>';
        html += '<button id="rollSelectorClose" type="button" class="btn-secondary">Close</button>';
        html += '</div>';
        html += '<div id="rollFavoritesPanel" style="margin:16px 0;padding:0 0 12px 0;border-bottom:1px solid #cfe6ff;">';
        html += '<button id="rollFavoritesToggle" type="button" class="btn-secondary" aria-expanded="false" style="margin-bottom:8px;">Show Favorites</button>';
        html += '<div id="rollFavoritesContent" style="display:none;">';
        html += '<strong>Favorites</strong>';
        html += '<div id="rollFavoritesList"></div>';
        html += '</div>';
        html += '</div>';
        html += '<label style="display:block;margin-bottom:10px;" for="rollSearchInput"><strong>Roll:</strong></label>';
        html += '<input id="rollSearchInput" type="text" list="rollSearchList" autocomplete="off" placeholder="Type to search a roll..." style="padding:8px;margin-bottom:15px;width:100%;" />';
        html += '<datalist id="rollSearchList"></datalist>';
        html += '<div id="rollFavoriteToggleRow" style="display:none;margin-bottom:8px;">';
        html += '<button id="rollFavoriteBtn" type="button" class="btn-secondary">\u2606 Add to Favorites</button>';
        html += '</div>';
        html += '<div id="rollResult" style="margin-top:15px;font-weight:bold;"></div>';
        html += '</div>';
        return html;
    }

    function getFavorites() {
        if (!window._importedCharacter) return [];
        if (!Array.isArray(window._importedCharacter.rollFavorites)) {
            window._importedCharacter.rollFavorites = [];
        }
        return window._importedCharacter.rollFavorites;
    }

    function findFavoriteIndex(path) {
        return getFavorites().findIndex((f) => f.path === path);
    }

    function isFavorite(path) {
        return findFavoriteIndex(path) !== -1;
    }

    function toggleFavorite(path) {
        const favorites = getFavorites();
        const index = findFavoriteIndex(path);
        if (index === -1) {
            favorites.push({ path });
        } else {
            favorites.splice(index, 1);
        }
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
        const rollFavoritesToggle = document.getElementById('rollFavoritesToggle');
        const rollFavoritesContent = document.getElementById('rollFavoritesContent');
        
        // Initialize enabled skill notes - start with all skill notes enabled
        const enabledSkillNotes = new Set();
        const items = charData && charData.inventory && Array.isArray(charData.inventory.items) ? charData.inventory.items : [];
        items.forEach((item, itemIndex) => {
            if (Array.isArray(item.skillNotes)) {
                item.skillNotes.forEach((_, noteIndex) => {
                    enabledSkillNotes.add(itemIndex + '-' + noteIndex);
                });
            }
        });

        function renderRollHtml(nextHtml) {
            rollResult.innerHTML = nextHtml;
            updateFavoriteButton(nextHtml ? rollSearchInput.value.trim() : '');
        }

        function setFavoritesCollapsed(isCollapsed) {
            if (!rollFavoritesToggle || !rollFavoritesContent) return;
            rollFavoritesToggle.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
            rollFavoritesToggle.textContent = isCollapsed ? 'Show Favorites' : 'Hide Favorites';
            rollFavoritesContent.style.display = isCollapsed ? 'none' : '';
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
                renderRollHtml('<strong>' + displayRollInfo(selectedParent, levels.level2, levels.level3, levels.level4, enabledSkillNotes, currentBase) + '</strong>');
                return;
            }

            if (levels.level3) {
                if (typeof level3Value !== 'object' || level3Value === null || Array.isArray(level3Value)) {
                    renderRollHtml('<strong>' + displayRollInfo(selectedParent, levels.level2, levels.level3, undefined, enabledSkillNotes, currentBase) + '</strong>');
                    return;
                }
                renderRollHtml('');
                return;
            }

            if (typeof level2Value !== 'object' || level2Value === null || Array.isArray(level2Value)) {
                renderRollHtml('<strong>' + displayRollInfo(selectedParent, levels.level2, undefined, undefined, enabledSkillNotes, currentBase) + '</strong>');
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

        if (rollFavoritesToggle) {
            rollFavoritesToggle.addEventListener('click', () => {
                const isCollapsed = rollFavoritesToggle.getAttribute('aria-expanded') !== 'true';
                setFavoritesCollapsed(!isCollapsed);
            });
        }

        rollResult.addEventListener('change', (event) => {
            const target = event.target;
            if (target instanceof HTMLSelectElement && target.id === 'basiswertSelect') {
                updateRollResult(target.value);
                return;
            }
            if (!(target instanceof HTMLInputElement) || !target.classList.contains('roll-skill-note-toggle')) return;

            const currentBase = rollResult.querySelector('#basiswertSelect') ? rollResult.querySelector('#basiswertSelect').value : '';
            const noteKey = target.getAttribute('data-note-key');
            if (!noteKey) return;

            if (target.checked) {
                enabledSkillNotes.add(noteKey);
            } else {
                enabledSkillNotes.delete(noteKey);
            }
            updateRollResult(currentBase);
        }, true);

        function renderFavoriteSingleHtml(fav, favIndex) {
            const levels = parseRollPath(fav.path);
            const rollHtml = displayRollInfo(selectedParent, levels.level2, levels.level3, levels.level4, enabledSkillNotes, fav.preferredBase, favIndex, false);
            return '<div class="roll-favorite-entry" data-fav-index="' + favIndex + '" style="margin-top:12px;padding:10px;border:1px solid #cfe6ff;border-radius:4px;">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
                '<strong>' + escapeHtml(fav.path) + '</strong>' +
                '<button type="button" class="btn-secondary roll-favorite-remove" data-path="' + escapeHtml(fav.path) + '" style="padding:2px 8px;font-size:0.85em;" title="Remove from favorites">\u00d7</button>' +
                '</div>' +
                rollHtml +
                '</div>';
        }

        function renderFavoritesList() {
            const rollFavoritesList = document.getElementById('rollFavoritesList');
            if (!rollFavoritesList) return;
            const favorites = getFavorites();
            if (!favorites.length) {
                rollFavoritesList.innerHTML = '<div style="margin-top:4px;color:#888;">No favorites yet.</div>';
                return;
            }
            rollFavoritesList.innerHTML = favorites.map((fav, i) => renderFavoriteSingleHtml(fav, i)).join('');
        }

        function updateFavoriteButton(selectedPath) {
            const rollFavoriteToggleRow = document.getElementById('rollFavoriteToggleRow');
            const rollFavoriteBtnEl = document.getElementById('rollFavoriteBtn');
            if (!rollFavoriteToggleRow || !rollFavoriteBtnEl) return;
            if (!selectedPath || !rollPathSet.has(selectedPath)) {
                rollFavoriteToggleRow.style.display = 'none';
                return;
            }
            rollFavoriteToggleRow.style.display = '';
            rollFavoriteBtnEl.textContent = isFavorite(selectedPath) ? '\u2605 Remove from Favorites' : '\u2606 Add to Favorites';
        }

        document.getElementById('rollFavoriteBtn').addEventListener('click', () => {
            const selectedPath = rollSearchInput.value.trim();
            if (!selectedPath || !rollPathSet.has(selectedPath)) return;
            toggleFavorite(selectedPath);
            updateFavoriteButton(selectedPath);
            renderFavoritesList();
        });

        document.getElementById('rollFavoritesList').addEventListener('change', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLSelectElement) || !target.classList.contains('roll-fav-basiswert-select')) return;
            const favIndex = parseInt(target.getAttribute('data-fav-index'), 10);
            const favorites = getFavorites();
            if (isNaN(favIndex) || favIndex < 0 || favIndex >= favorites.length) return;
            favorites[favIndex].preferredBase = target.value;
            const entryEl = document.querySelector('.roll-favorite-entry[data-fav-index="' + favIndex + '"]');
            if (entryEl) {
                entryEl.outerHTML = renderFavoriteSingleHtml(favorites[favIndex], favIndex);
            }
        }, true);

        document.getElementById('rollFavoritesList').addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('roll-favorite-remove')) {
                const path = target.getAttribute('data-path');
                if (path) {
                    const idx = findFavoriteIndex(path);
                    if (idx !== -1) getFavorites().splice(idx, 1);
                    renderFavoritesList();
                    updateFavoriteButton(rollSearchInput.value.trim());
                }
            }
        });

        renderFavoritesList();
        setFavoritesCollapsed(true);
    });
}
