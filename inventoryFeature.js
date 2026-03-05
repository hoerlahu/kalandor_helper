export function setupInventoryFeature(showMessage, escapeHtml) {
    const inv = document.getElementById('inventoryFeature');
    const inventoryKey = "inventory"; // key to look for in the character data; can be customized or expanded as needed
    if (!inv) return; // nothing to do in non-browser environments or during tests

    inv.addEventListener('click', () => {
        // create or show an inventory panel inside the container
        const container = document.querySelector('.container') || document.body;
        let panel = document.getElementById('inventoryPanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'inventoryPanel';
            panel.className = 'inventory-panel';

            panel.innerHTML = `
                <div class="inventory-header">
                    <h2>🎒 Inventory</h2>
                    <button id="inventoryClose" class="btn-secondary">Close</button>
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
                        <button id="addSkillBtn" class="btn-secondary" type="button">Add Skill</button>
                    </div>
                    <div id="itemSkillList" class="skill-list"></div>
                    <div class="ia-row ia-desc">
                        <input id="itemDesc" placeholder="Description" style="flex:1; margin-right:8px;" />
                    </div>
                    <div class="ia-row ia-add">
                        <button id="addItemBtn" class="btn-primary" style="width:100%;">Add</button>
                    </div>
                </div>
            `;

            container.appendChild(panel);

            // wire up close
            panel.querySelector('#inventoryClose').addEventListener('click', () => {
                panel.remove();
            });

            // add item behavior (structured fields)
            const addBtn = panel.querySelector('#addItemBtn');
            const content = panel.querySelector('#inventoryContent');
            const inName = panel.querySelector('#itemName');
            const inQty = panel.querySelector('#itemQty');
            const inDesc = panel.querySelector('#itemDesc');
            const inSkillSelect = panel.querySelector('#itemSkillSelect');
            const inSkillNote = panel.querySelector('#itemSkillNoteText');
            const addSkillBtn = panel.querySelector('#addSkillBtn');
            const skillListDiv = panel.querySelector('#itemSkillList');
            // in-memory list of {skill, note} pairs for the item being edited/created
            let currentSkillPairs = [];

            function renderSkillList() {
                skillListDiv.innerHTML = '';
                if (!currentSkillPairs || !currentSkillPairs.length) return;
                const ul = document.createElement('ul');
                ul.className = 'skill-pairs';
                currentSkillPairs.forEach((p, idx) => {
                    const li = document.createElement('li');
                    li.innerHTML = '<strong>' + escapeHtml(p.skill) + '</strong>' + (p.note ? ' — ' + escapeHtml(p.note) : '');
                    const btn = document.createElement('button');
                    btn.textContent = 'Remove';
                    btn.className = 'btn-secondary';
                    btn.style.marginLeft = '8px';
                    btn.addEventListener('click', () => {
                        currentSkillPairs.splice(idx, 1);
                        renderSkillList();
                    });
                    li.appendChild(btn);
                    ul.appendChild(li);
                });
                skillListDiv.appendChild(ul);
            }

            addSkillBtn.addEventListener('click', () => {
                const sk = inSkillSelect && inSkillSelect.value;
                const note = inSkillNote && inSkillNote.value && inSkillNote.value.trim();
                if (!sk) return; // nothing selected
                // Only keep the lowest node of the skill path
                const lowestSkill = sk.includes('>') ? sk.split('>').pop().trim() : sk.trim();
                currentSkillPairs.push({ skill: lowestSkill, note: note || '' });
                renderSkillList();
                // clear note input
                if (inSkillNote) inSkillNote.value = '';
                if (inSkillSelect) inSkillSelect.selectedIndex = 0;
            });

            // separate container for imported character inventory display
            const importedContainer = document.createElement('div');
            importedContainer.id = 'importedInventory';
            content.innerHTML = '';
            content.appendChild(importedContainer);

            function renderManualList() {
                const ul = content.querySelector('ul.manual') || (function(){
                    const u = document.createElement('ul');
                    u.className = 'manual';
                    // if content already has other lists, append after them
                    content.appendChild(u);
                    return u;
                })();
                return ul;
            }

            function updateImportedInventoryDisplay() {
                importedContainer.innerHTML = '';
                const data = window._importedCharacter;
                if (!data) {
                    importedContainer.innerHTML = '<p class="muted">No character imported. Please import a character to view the inventory.</p>';
                    return;
                }
                const itemsObj = findInventory(data);
                let items = [];
                if (itemsObj && Array.isArray(itemsObj.items)) {
                    items = itemsObj.items;
                } else if (Array.isArray(itemsObj)) {
                    items = itemsObj;
                }
                importedContainer.innerHTML = '<h3>Inventory</h3>';
                if (!items.length) {
                    importedContainer.innerHTML += '<p class="muted">No inventory section found in the imported character. Added items will be stored under "' + escapeHtml(inventoryKey) + '".</p>';
                    return;
                }
                // Render each item as editable/deletable row
                const ul = document.createElement('ul');
                ul.className = 'manual';
                items.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = '<strong>' + escapeHtml(item.name) + '</strong>' +
                        (item.quantity ? ' x' + escapeHtml(item.quantity) : '') +
                        (item.description ? '<div class="muted">' + escapeHtml(item.description) + '</div>' : '') +
                        (item.skillNotes && item.skillNotes.length ? '<div class="muted">' + item.skillNotes.map(s => '<div class="skill-chip">' + escapeHtml(s.skill) + (s.note ? ' — ' + escapeHtml(s.note) : '') + '</div>').join('') + '</div>' : '');

                    // add controls
                    const controls = document.createElement('span');
                    controls.style.marginLeft = '12px';
                    const editBtn = document.createElement('button');
                    editBtn.textContent = 'Edit';
                    editBtn.className = 'btn-secondary';
                    editBtn.style.marginRight = '6px';
                    const delBtn = document.createElement('button');
                    delBtn.textContent = 'Delete';
                    delBtn.className = 'btn-secondary';
                    controls.appendChild(editBtn);
                    controls.appendChild(delBtn);
                    li.appendChild(controls);

                    // wire delete: remove from imported character inventory.items array if exists
                    delBtn.addEventListener('click', () => {
                        if (window._importedCharacter && window._importedCharacter[inventoryKey] && Array.isArray(window._importedCharacter[inventoryKey].items)) {
                            const arr = window._importedCharacter[inventoryKey].items;
                            const idx = arr.findIndex(it => it && it.name === item.name && String(it.quantity) === String(item.quantity));
                            if (idx !== -1) arr.splice(idx, 1);
                            updateImportedInventoryDisplay();
                        }
                        li.remove();
                    });

                    // wire edit: prefill inputs and remove this li; on add it will re-persist
                    editBtn.addEventListener('click', () => {
                        inName.value = item.name;
                        inQty.value = item.quantity || '';
                        inDesc.value = item.description || '';
                        currentSkillPairs = Array.isArray(item.skillNotes) ? item.skillNotes.slice() : [];
                        renderSkillList();
                        // remove existing entry from importedCharacter so re-adding updates it
                        if (window._importedCharacter && window._importedCharacter[inventoryKey] && Array.isArray(window._importedCharacter[inventoryKey].items)) {
                            const arr = window._importedCharacter[inventoryKey].items;
                            const idx = arr.findIndex(it => it && it.name === item.name && String(it.quantity) === String(item.quantity));
                            if (idx !== -1) arr.splice(idx, 1);
                            updateImportedInventoryDisplay();
                        }
                        li.remove();
                    });

                    ul.appendChild(li);
                });
                importedContainer.appendChild(ul);
            }

            // show current imported inventory on open
            updateImportedInventoryDisplay();

            addBtn.addEventListener('click', () => {
                const name = inName.value && inName.value.trim();
                if (!name) return;
                const item = {
                    name: name,
                    quantity: inQty.value ? inQty.value.trim() : '',
                    description: inDesc.value ? inDesc.value.trim() : '',
                    skillNotes: Array.isArray(currentSkillPairs) ? currentSkillPairs.slice() : []
                };

                const ul = renderManualList();
                const li = document.createElement('li');
                li.innerHTML = '<strong>' + escapeHtml(item.name) + '</strong>' +
                    (item.quantity ? ' x' + escapeHtml(item.quantity) : '') +
                    (item.description ? '<div class="muted">' + escapeHtml(item.description) + '</div>' : '') +
                    (item.skillNotes && item.skillNotes.length ? '<div class="muted">' + item.skillNotes.map(s => '<div class="skill-chip">' + escapeHtml(s.skill) + (s.note ? ' — ' + escapeHtml(s.note) : '') + '</div>').join('') + '</div>' : '');

                // add controls
                const controls = document.createElement('span');
                controls.style.marginLeft = '12px';
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edit';
                editBtn.className = 'btn-secondary';
                editBtn.style.marginRight = '6px';
                const delBtn = document.createElement('button');
                delBtn.textContent = 'Delete';
                delBtn.className = 'btn-secondary';
                controls.appendChild(editBtn);
                controls.appendChild(delBtn);
                li.appendChild(controls);

        // wire delete: remove from UI and importedCharacter if present
                delBtn.addEventListener('click', () => {
                    // remove from imported character inventory.items array if exists
                    if (window._importedCharacter && window._importedCharacter[inventoryKey] && Array.isArray(window._importedCharacter[inventoryKey].items)) {
                        const arr = window._importedCharacter[inventoryKey].items;
                        // find an entry matching name+quantity+description roughly
                        const idx = arr.findIndex(it => it && it.name === item.name && String(it.quantity) === String(item.quantity));
                        if (idx !== -1) arr.splice(idx, 1);
                        updateImportedInventoryDisplay();
                    }
                    li.remove();
                });

                // wire edit: prefill inputs and remove this li; on add it will re-persist
                editBtn.addEventListener('click', () => {
                    inName.value = item.name;
                    inQty.value = item.quantity || '';
                    inDesc.value = item.description || '';
                    if (inSkillSelect) inSkillSelect.value = item.skill || '';
                    if (inSkillNote) inSkillNote.value = item.skillNote || '';
                    // remove existing entry from importedCharacter so re-adding updates it
                    if (window._importedCharacter && Array.isArray(window._importedCharacter[inventoryKey])) {
                        const arr = window._importedCharacter[inventoryKey];
                        const idx = arr.findIndex(it => it && it.name === item.name && String(it.quantity) === String(item.quantity));
                        if (idx !== -1) arr.splice(idx, 1);
                        updateImportedInventoryDisplay();
                    }
                    li.remove();
                });

                ul.appendChild(li);

                // clear inputs
                inName.value = '';
                inQty.value = '';
                inDesc.value = '';
                if (inSkillSelect) inSkillSelect.selectedIndex = 0;
                if (inSkillNote) inSkillNote.value = '';
                // clear all skills/notes for next item
                currentSkillPairs = [];
                renderSkillList();
                // persist into imported character if present
                if (window._importedCharacter) {
                    // Always use inventory.items array for storing items
                    if (!window._importedCharacter[inventoryKey]) {
                        window._importedCharacter[inventoryKey] = {};
                    }
                    if (!Array.isArray(window._importedCharacter[inventoryKey].items)) {
                        window._importedCharacter[inventoryKey].items = [];
                    }
                    window._importedCharacter[inventoryKey].items.push({
                        name: item.name,
                        quantity: item.quantity,
                        description: item.description,
                        skillNotes: Array.isArray(item.skillNotes) ? item.skillNotes.slice() : []
                    });
                    // refresh imported inventory display
                    updateImportedInventoryDisplay();
                }
            });

            // populate skills select from imported character (flatten nested Skills)
            function populateSkills() {
                if (!inSkillSelect) return;
                inSkillSelect.innerHTML = '<option value="">(no skill)</option>';
                const charData = window._importedCharacter;
                if (!charData || !charData.Skills) return;
                const parentData = charData.Skills;
                function collectKeys(obj, prefix = '') {
                    const keys = [];
                    for (const k in obj) {
                        if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
                        const v = obj[k];
                        const display = prefix ? (prefix + ' > ' + k) : k;
                        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
                            keys.push(...collectKeys(v, display));
                        } else {
                            keys.push(display);
                        }
                    }
                    return keys;
                }
                const skillKeys = collectKeys(parentData);
                skillKeys.forEach(sk => {
                    const opt = document.createElement('option');
                    opt.value = sk;
                    opt.textContent = sk;
                    inSkillSelect.appendChild(opt);
                });
                const attributes = charData.Attribute.Basiswert;                
                const attributeKeys = collectKeys(attributes);
                attributeKeys.forEach(att => {
                    const opt = document.createElement('option');
                    opt.value = att;
                    opt.textContent = att;
                    inSkillSelect.appendChild(opt);
                });
            }

            // populate skills on open and whenever imported inventory display updates
            populateSkills();

            // allow Enter key to add when focused on any of the add-item inputs
            const addFields = panel.querySelectorAll('.inventory-actions input');
            addFields.forEach(f => {
                if (f.type === 'checkbox') return; // skip checkbox
                f.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addBtn.click();
                    }
                });
            });

            // helper to render nested objects/arrays into HTML
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

            // populate from imported character if available; do NOT auto-load sample files
            const data = window._importedCharacter;

            // recursive search for inventory keys anywhere in the object
            function findInventory(obj) {
                if (!obj || typeof obj !== 'object') return null;
                if (inventoryKey in obj) return obj[inventoryKey];

                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        const v = obj[key];
                        if (typeof v === 'object') {
                            const res = findInventory(v);
                            if (res !== null) return res;
                        }
                    }
                }
                return null;
            }

            if (data) {
                const itemsObj = findInventory(data);
let items = [];
if (itemsObj && Array.isArray(itemsObj.items)) {
    items = itemsObj.items;
} else if (Array.isArray(itemsObj)) {
    items = itemsObj;
}
importedContainer.innerHTML = '<h3>Inventory</h3>';
if (!items.length) {
    importedContainer.innerHTML += '<p class="muted">No inventory section found in the imported character. Added items will be stored under "' + escapeHtml(inventoryKey) + '".</p>';
    return;
}
// Render each item as editable/deletable row
const ul = document.createElement('ul');
ul.className = 'manual';
items.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = '<strong>' + escapeHtml(item.name) + '</strong>' +
        (item.quantity ? ' x' + escapeHtml(item.quantity) : '') +
        (item.description ? '<div class="muted">' + escapeHtml(item.description) + '</div>' : '') +
        (item.skillNotes && item.skillNotes.length ? '<div class="muted">' + item.skillNotes.map(s => '<div class="skill-chip">' + escapeHtml(s.skill) + (s.note ? ' — ' + escapeHtml(s.note) : '') + '</div>').join('') + '</div>' : '');

    // add controls
    const controls = document.createElement('span');
    controls.style.marginLeft = '12px';
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'btn-secondary';
    editBtn.style.marginRight = '6px';
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'btn-secondary';
    controls.appendChild(editBtn);
    controls.appendChild(delBtn);
    li.appendChild(controls);

    // wire delete: remove from imported character inventory.items array if exists
    delBtn.addEventListener('click', () => {
        if (window._importedCharacter && window._importedCharacter[inventoryKey] && Array.isArray(window._importedCharacter[inventoryKey].items)) {
            const arr = window._importedCharacter[inventoryKey].items;
            const idx = arr.findIndex(it => it && it.name === item.name && String(it.quantity) === String(item.quantity));
            if (idx !== -1) arr.splice(idx, 1);
            updateImportedInventoryDisplay();
        }
        li.remove();
    });

    // wire edit: prefill inputs and remove this li; on add it will re-persist
    editBtn.addEventListener('click', () => {
        inName.value = item.name;
        inQty.value = item.quantity || '';
        inDesc.value = item.description || '';
        currentSkillPairs = Array.isArray(item.skillNotes) ? item.skillNotes.slice() : [];
        renderSkillList();
        // remove existing entry from importedCharacter so re-adding updates it
        if (window._importedCharacter && window._importedCharacter[inventoryKey] && Array.isArray(window._importedCharacter[inventoryKey].items)) {
            const arr = window._importedCharacter[inventoryKey].items;
            const idx = arr.findIndex(it => it && it.name === item.name && String(it.quantity) === String(item.quantity));
            if (idx !== -1) arr.splice(idx, 1);
            updateImportedInventoryDisplay();
        }
        li.remove();
    });

    ul.appendChild(li);
});
importedContainer.appendChild(ul);
            } else {
                // no imported character: prompt user to import
                content.innerHTML = '<p class="muted">No character imported. Please import a character to view the inventory.</p>';
            }
        }
    });
}
