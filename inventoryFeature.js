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
                    <input id="itemName" placeholder="Name" />
                    <input id="itemQty" placeholder="Quantity" style="width:80px;" />
                    <input id="itemWeight" placeholder="Weight" style="width:100px;" />
                    <input id="itemType" placeholder="Type" style="width:120px;" />
                    <input id="itemValue" placeholder="Value" style="width:100px;" />
                    <input id="itemDesc" placeholder="Description" />
                    <label style="display:inline-flex;align-items:center;gap:6px;margin-left:6px;"><input id="itemEquipped" type="checkbox" /> Equipped</label>
                    <button id="addItemBtn" class="btn-primary">Add</button>
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
            const inWeight = panel.querySelector('#itemWeight');
            const inType = panel.querySelector('#itemType');
            const inValue = panel.querySelector('#itemValue');
            const inDesc = panel.querySelector('#itemDesc');
            const inEquipped = panel.querySelector('#itemEquipped');

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

            addBtn.addEventListener('click', () => {
                const name = inName.value && inName.value.trim();
                if (!name) return;
                const item = {
                    name: name,
                    quantity: inQty.value ? inQty.value.trim() : '',
                    weight: inWeight.value ? inWeight.value.trim() : '',
                    type: inType.value ? inType.value.trim() : '',
                    value: inValue.value ? inValue.value.trim() : '',
                    description: inDesc.value ? inDesc.value.trim() : '',
                    equipped: !!inEquipped.checked
                };

                const ul = renderManualList();
                const li = document.createElement('li');
                li.innerHTML = '<strong>' + escapeHtml(item.name) + '</strong>' +
                    (item.quantity ? ' x' + escapeHtml(item.quantity) : '') +
                    (item.type ? ' (' + escapeHtml(item.type) + ')' : '') +
                    (item.equipped ? ' <em>[equipped]</em>' : '') +
                    (item.description ? '<div class="muted">' + escapeHtml(item.description) + '</div>' : '') +
                    (item.weight ? '<div class="muted">Weight: ' + escapeHtml(item.weight) + '</div>' : '') +
                    (item.value ? '<div class="muted">Value: ' + escapeHtml(item.value) + '</div>' : '');
                ul.appendChild(li);

                // clear inputs
                inName.value = '';
                inQty.value = '';
                inWeight.value = '';
                inType.value = '';
                inValue.value = '';
                inDesc.value = '';
                inEquipped.checked = false;
            });

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
                const items = findInventory(data);
                if (items) {
                    content.innerHTML = '<h3>Inventory</h3>' + renderObj(items);
                } else {
                    content.innerHTML = '<p class="muted">No inventory section found in the imported character. Add items manually below.</p>';
                }
            } else {
                // no imported character: prompt user to import
                content.innerHTML = '<p class="muted">No character imported. Please import a character to view the inventory.</p>';
            }
        }
    });
}
