export function setupWhatToRollFeature(showMessage, escapeHtml, displayRollInfo) {
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
        const parentKeys = Object.keys(charData).filter(k => k == supportedRoll); // exclude Allgemein and Attribute sections from roll selection

        // Create HTML for dropdowns
        let html = '<div style="padding:12px;border-radius:6px;background:#f1f8ff;border:1px solid #cfe6ff;">';
        html += '<h3>What do I roll?</h3>';

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
                rollResult.innerHTML = '<strong>' + displayRollInfo(selectedParent,selectedChild) + '</strong>'
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
                rollResult.innerHTML = '<strong>' + displayRollInfo(selectedParent,selectedChild,selectedGrandchild) + '</strong>';
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

            const value = charData[selectedParent][selectedChild][selectedGrandchild][selectedGreatgrandchild];
            rollResult.innerHTML = '<strong>' + displayRollInfo(selectedParent,selectedChild,selectedGrandchild,selectedGreatgrandchild) + '</strong>';
        });
    });
}
