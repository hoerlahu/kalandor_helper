export function setupInventoryFeature(showMessage, escapeHtml) {
    const inv = document.getElementById('inventoryFeature');
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
                    <input id="newItemInput" placeholder="Add item (e.g. Rope x1)" />
                    <button id="addItemBtn" class="btn-primary">Add</button>
                </div>
            `;

            container.appendChild(panel);

            // wire up close
            panel.querySelector('#inventoryClose').addEventListener('click', () => {
                panel.remove();
            });

            // add item behavior
            const addBtn = panel.querySelector('#addItemBtn');
            const input = panel.querySelector('#newItemInput');
            const content = panel.querySelector('#inventoryContent');

            addBtn.addEventListener('click', () => {
                const text = input.value && input.value.trim();
                if (!text) return;
                const ul = content.querySelector('ul') || (function(){
                    const u = document.createElement('ul');
                    content.innerHTML = '';
                    content.appendChild(u);
                    return u;
                })();
                const li = document.createElement('li');
                li.textContent = text;
                ul.appendChild(li);
                input.value = '';
            });

            // allow Enter key to add
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') addBtn.click();
            });

            // populate from imported character if available
            const data = window._importedCharacter;
            if (data) {
                // try some common keys for inventory-like data
                const possibleKeys = ['Inventar','Inventory','Items','Gegenstände'];
                let items = null;
                for (const k of possibleKeys) {
                    if (k in data) { items = data[k]; break; }
                }
                if (items) {
                    const ul = document.createElement('ul');
                    if (Array.isArray(items)) {
                        items.forEach(i => ul.appendChild(Object.assign(document.createElement('li'), { textContent: String(i) })));
                    } else if (typeof items === 'object') {
                        for (const key in items) {
                            if (Object.prototype.hasOwnProperty.call(items, key)) {
                                const li = document.createElement('li');
                                li.innerHTML = '<strong>' + escapeHtml(key) + ':</strong> ' + escapeHtml(String(items[key]));
                                ul.appendChild(li);
                            }
                        }
                    } else {
                        ul.appendChild(Object.assign(document.createElement('li'), { textContent: String(items) }));
                    }
                    content.innerHTML = '';
                    content.appendChild(ul);
                } else {
                    content.innerHTML = '<p class="muted">No inventory section found in the imported character. Add items manually below.</p>';
                }
            } else {
                content.innerHTML = '<p class="muted">No character imported. Add items manually below.</p>';
            }
        }
    });
}
