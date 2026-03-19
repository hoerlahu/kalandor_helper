function findInventorySection(obj, inventoryKey) {
    if (!obj || typeof obj !== 'object') return null;
    if (Object.prototype.hasOwnProperty.call(obj, inventoryKey)) {
        return obj[inventoryKey];
    }

    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
            const result = findInventorySection(value, inventoryKey);
            if (result !== null) return result;
        }
    }

    return null;
}

function getInventoryItems(section) {
    if (section && Array.isArray(section.items)) return section.items;
    if (Array.isArray(section)) return section;
    return [];
}

function ensureInventoryItemsArray(character, inventoryKey) {
    if (!character[inventoryKey]) {
        character[inventoryKey] = {};
    }
    if (!Array.isArray(character[inventoryKey].items)) {
        character[inventoryKey].items = [];
    }
    return character[inventoryKey].items;
}

function collectNestedKeys(obj, options, prefix = '', depth = 1) {
    const { includeSecondLevel = false, includeFirstLevel = false } = options;
    const keys = [];

    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        const value = obj[key];
        const display = prefix ? `${prefix} > ${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            if (includeFirstLevel && depth === 1) {
                keys.push(display);
            }
            if (includeSecondLevel && depth === 2) {
                keys.push(display);
            }
            keys.push(...collectNestedKeys(value, options, display, depth + 1));
        } else {
            keys.push(display);
        }
    }

    return keys;
}

function buildItemHtml(item, escapeHtml) {
    const skillNotesHtml = item.skillNotes && item.skillNotes.length
        ? `<div class="muted">${item.skillNotes
            .map((skillNote) => `<div class="skill-chip">${escapeHtml(skillNote.skill)}${skillNote.note ? ` - ${escapeHtml(skillNote.note)}` : ''}${skillNote.numericalBonus !== undefined ? ` <em>(${skillNote.numericalBonus >= 0 ? '+' : ''}${escapeHtml(String(skillNote.numericalBonus))})</em>` : ''}</div>`)
            .join('')}</div>`
        : '';

    return `<strong>${escapeHtml(item.name)}</strong>${
        item.quantity ? ` x${escapeHtml(item.quantity)}` : ''
    }${
        item.description ? `<div class="muted">${escapeHtml(item.description)}</div>` : ''
    }${skillNotesHtml}`;
}

export function setupInventoryFeature(showMessage, escapeHtml) {
    void showMessage;

    const inventoryFeature = document.getElementById('inventoryFeature');
    const inventoryKey = 'inventory';
    if (!inventoryFeature) return;

    inventoryFeature.addEventListener('click', () => {
        const container = document.querySelector('.container') || document.body;
        let panel = document.getElementById('inventoryPanel');
        if (panel) return;

        panel = document.createElement('div');
        panel.id = 'inventoryPanel';
        panel.className = 'inventory-panel';
        panel.innerHTML = `
            <div class="inventory-header">
                <h2>Inventory</h2>
                <button id="inventoryClose" class="btn-secondary" type="button">Close</button>
            </div>
            <div id="inventoryContent" class="inventory-content">
                <p class="muted">Loading inventory...</p>
            </div>
            <div class="inventory-actions">
                <div class="ia-row ia-name">
                    <input id="itemName" placeholder="Name" />
                </div>
                <div class="ia-row ia-qty">
                    <input id="itemQty" placeholder="Quantity" style="width:120px;" />
                </div>
                <div class="ia-row ia-skill-entry">
                    <select id="itemSkillSelect" style="min-width:200px;"></select>
                    <input id="itemSkillNoteText" placeholder="Skill note" />
                    <input id="itemSkillBonus" placeholder="Modifier" type="number" style="width:90px;" />
                    <button id="addSkillBtn" class="btn-secondary" type="button">Add Skill</button>
                </div>
                <div id="itemSkillList" class="skill-list"></div>
                <div class="ia-row ia-desc">
                    <input id="itemDesc" placeholder="Description" style="flex:1; margin-right:8px;" />
                </div>
                <div class="ia-row ia-add">
                    <button id="addItemBtn" class="btn-primary" type="button" style="width:100%;">Add</button>
                </div>
            </div>
        `;
        container.appendChild(panel);

        const closeButton = panel.querySelector('#inventoryClose');
        const content = panel.querySelector('#inventoryContent');
        const itemNameInput = panel.querySelector('#itemName');
        const itemQtyInput = panel.querySelector('#itemQty');
        const itemDescInput = panel.querySelector('#itemDesc');
        const itemSkillSelect = panel.querySelector('#itemSkillSelect');
        const itemSkillNoteInput = panel.querySelector('#itemSkillNoteText');
        const itemSkillBonusInput = panel.querySelector('#itemSkillBonus');
        const addSkillButton = panel.querySelector('#addSkillBtn');
        const addItemButton = panel.querySelector('#addItemBtn');
        const skillListContainer = panel.querySelector('#itemSkillList');

        let currentSkillPairs = [];
        let editingSkillIndex = null;
        let editingItemRef = null;

        function resolveSkillSelectValueFromNote(skillValue) {
            if (!skillValue) return '';

            const directOption = Array.from(itemSkillSelect.options).find((option) => option.value === skillValue);
            if (directOption) return directOption.value;

            const byLeafOption = Array.from(itemSkillSelect.options).find((option) => {
                const optionValue = option.value;
                if (!optionValue) return false;
                const leaf = optionValue.includes('>') ? optionValue.split('>').pop().trim() : optionValue.trim();
                return leaf === skillValue;
            });

            return byLeafOption ? byLeafOption.value : '';
        }

        function renderSkillList() {
            skillListContainer.innerHTML = '';
            if (!currentSkillPairs.length) return;

            const list = document.createElement('ul');
            list.className = 'skill-pairs';

            currentSkillPairs.forEach((pair, index) => {
                const item = document.createElement('li');
                item.innerHTML = `<strong>${escapeHtml(pair.skill)}</strong>${pair.note ? ` - ${escapeHtml(pair.note)}` : ''}${pair.numericalBonus !== undefined && pair.numericalBonus !== '' ? ` <em>(${pair.numericalBonus >= 0 ? '+' : ''}${escapeHtml(String(pair.numericalBonus))})</em>` : ''}`;

                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.className = 'btn-secondary';
                editButton.style.marginLeft = '8px';
                editButton.addEventListener('click', () => {
                    editingSkillIndex = index;
                    itemSkillSelect.value = resolveSkillSelectValueFromNote(pair.skill);
                    itemSkillNoteInput.value = pair.note || '';
                    itemSkillBonusInput.value = pair.numericalBonus === undefined ? '' : String(pair.numericalBonus);
                    addSkillButton.textContent = 'Update Skill';
                });

                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.className = 'btn-secondary';
                removeButton.style.marginLeft = '8px';
                removeButton.addEventListener('click', () => {
                    currentSkillPairs.splice(index, 1);
                    if (editingSkillIndex === index) {
                        editingSkillIndex = null;
                        itemSkillNoteInput.value = '';
                        itemSkillBonusInput.value = '';
                        itemSkillSelect.selectedIndex = 0;
                        addSkillButton.textContent = 'Add Skill';
                    } else if (editingSkillIndex !== null && editingSkillIndex > index) {
                        editingSkillIndex -= 1;
                    }
                    renderSkillList();
                });

                item.appendChild(editButton);
                item.appendChild(removeButton);
                list.appendChild(item);
            });

            skillListContainer.appendChild(list);
        }

        function clearEditorState() {
            editingItemRef = null;
            addItemButton.textContent = 'Add';
            itemNameInput.value = '';
            itemQtyInput.value = '';
            itemDescInput.value = '';
            itemSkillNoteInput.value = '';
            itemSkillBonusInput.value = '';
            itemSkillSelect.selectedIndex = 0;
            currentSkillPairs = [];
            editingSkillIndex = null;
            addSkillButton.textContent = 'Add Skill';
            renderSkillList();
        }

        function setEditorState(item) {
            editingItemRef = item;
            addItemButton.textContent = 'Save';
            itemNameInput.value = item.name || '';
            itemQtyInput.value = item.quantity || '';
            itemDescInput.value = item.description || '';
            currentSkillPairs = Array.isArray(item.skillNotes) ? item.skillNotes.slice() : [];
            editingSkillIndex = null;
            addSkillButton.textContent = 'Add Skill';
            renderSkillList();
        }

        function removeItemFromCharacter(item) {
            const character = window._importedCharacter;
            if (!character) return;

            const items = ensureInventoryItemsArray(character, inventoryKey);
            const byReferenceIndex = items.indexOf(item);
            if (byReferenceIndex !== -1) {
                items.splice(byReferenceIndex, 1);
                return;
            }

            const fallbackIndex = items.findIndex((entry) =>
                entry && entry.name === item.name && String(entry.quantity) === String(item.quantity)
            );
            if (fallbackIndex !== -1) {
                items.splice(fallbackIndex, 1);
            }
        }

        function renderImportedInventory() {
            content.innerHTML = '';
            const character = window._importedCharacter;

            if (!character) {
                content.innerHTML = '<p class="muted">No character imported. Please import a character to view the inventory.</p>';
                return;
            }

            const section = findInventorySection(character, inventoryKey);
            const items = getInventoryItems(section);

            const heading = document.createElement('h3');
            heading.textContent = 'Inventory';
            content.appendChild(heading);

            if (!items.length) {
                const empty = document.createElement('p');
                empty.className = 'muted';
                empty.textContent = `No inventory section found in the imported character. Added items will be stored under "${inventoryKey}".`;
                content.appendChild(empty);
                return;
            }

            const list = document.createElement('ul');
            list.className = 'manual';

            items.forEach((item) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = buildItemHtml(item, escapeHtml);

                const controls = document.createElement('span');
                controls.style.marginLeft = '12px';

                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.className = 'btn-secondary';
                editButton.style.marginRight = '6px';
                editButton.addEventListener('click', () => setEditorState(item));

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'btn-secondary';
                deleteButton.addEventListener('click', () => {
                    removeItemFromCharacter(item);
                    if (editingItemRef === item) {
                        clearEditorState();
                    }
                    renderImportedInventory();
                });

                controls.appendChild(editButton);
                controls.appendChild(deleteButton);
                listItem.appendChild(controls);
                list.appendChild(listItem);
            });

            content.appendChild(list);
        }

        function populateSkills() {
            itemSkillSelect.innerHTML = '<option value="">(no skill)</option>';

            const character = window._importedCharacter;
            if (!character || !character.Skills) return;

            const values = new Set();
            const skillPaths = Array.from(new Set(
                collectNestedKeys(character.Skills, { includeSecondLevel: true, includeFirstLevel: true })
            ));

            const configMetaSkills = [];
            const config = window._config || {};
            Object.keys(config).forEach((key) => {
                const value = config[key];
                if (value && typeof value === 'object' && value.MetaSkill === true) {
                    configMetaSkills.push(key);
                }
            });

            const attributes = character.Attribute && character.Attribute.Basiswert
                ? collectNestedKeys(character.Attribute.Basiswert, { includeSecondLevel: false, includeFirstLevel: false })
                : [];

            const allOptions = [...skillPaths, ...configMetaSkills, ...attributes];
            allOptions.forEach((optionValue) => {
                if (values.has(optionValue)) return;
                values.add(optionValue);

                const option = document.createElement('option');
                option.value = optionValue;
                option.textContent = optionValue;
                itemSkillSelect.appendChild(option);
            });
        }

        closeButton.addEventListener('click', () => {
            panel.remove();
        });

        addSkillButton.addEventListener('click', () => {
            const selectedPath = itemSkillSelect.value;
            const note = itemSkillNoteInput.value.trim();
            const bonusRaw = itemSkillBonusInput.value.trim();
            if (!selectedPath) return;

            const lowestSkill = selectedPath.includes('>')
                ? selectedPath.split('>').pop().trim()
                : selectedPath.trim();

            const entry = { skill: lowestSkill, note };
            if (bonusRaw !== '') entry.numericalBonus = Number(bonusRaw);
            if (editingSkillIndex !== null && editingSkillIndex >= 0 && editingSkillIndex < currentSkillPairs.length) {
                currentSkillPairs[editingSkillIndex] = entry;
            } else {
                currentSkillPairs.push(entry);
            }
            itemSkillNoteInput.value = '';
            itemSkillBonusInput.value = '';
            itemSkillSelect.selectedIndex = 0;
            editingSkillIndex = null;
            addSkillButton.textContent = 'Add Skill';
            renderSkillList();
        });

        addItemButton.addEventListener('click', () => {
            const name = itemNameInput.value.trim();
            if (!name) return;

            const nextItem = {
                name,
                quantity: itemQtyInput.value.trim(),
                description: itemDescInput.value.trim(),
                skillNotes: currentSkillPairs.slice()
            };

            const character = window._importedCharacter;
            if (character) {
                if (editingItemRef) {
                    editingItemRef.name = nextItem.name;
                    editingItemRef.quantity = nextItem.quantity;
                    editingItemRef.description = nextItem.description;
                    editingItemRef.skillNotes = nextItem.skillNotes.slice();
                } else {
                    ensureInventoryItemsArray(character, inventoryKey).push(nextItem);
                }
            }

            clearEditorState();
            renderImportedInventory();
        });

        panel.querySelectorAll('.inventory-actions input').forEach((field) => {
            if (field.type === 'checkbox') return;
            field.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                addItemButton.click();
            });
        });

        populateSkills();
        renderImportedInventory();
    });
}