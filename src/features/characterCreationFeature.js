const GENERAL_FIELDS = [
	'Name',
	'Spezies',
	'Alter',
	'Augenfarbe',
	'Haarfarbe',
	'Groesse',
	'Gewicht',
	'Beruf',
	'Disziplin'
];

const ATTRIBUTE_KEYS = [
	'Staerke',
	'Beweglichkeit',
	'Robustheit',
	'Intuition',
	'Charisma',
	'Glueck',
	'Wahrnehmung',
	'Geistesschaerfe',
	'Willenskraft'
];

const AUSBILDUNG_SKILLS = {
	'Körperlich': [
		'Athletik',
		'Fahren',
		'Fallen',
		'Fliegen',
		'Heimlichkeit',
		'Kochen',
		'Liebesspiel',
		'Medizin',
		'Reiten',
		'Schiffe (See/Luft)',
		'Schlösser knacken',
		'Werkstoffbearbeitung'
	],
	Kampf: [
		'Ausweichen',
		'Äxte',
		'Blitzschnelle Reflexe',
		'Bogenschießen',
		'Flegel/Keule',
		'Hieb/Stichwaffen',
		'Schildkampf',
		'Schusswaffen',
		'Schwere Waffen',
		'Stäbe',
		'Waffenlos',
		'Wurfwaffen',
		'Zwei Waffen'
	],
	Sozial: [
		'Aufmerksamkeit',
		'Charme',
		'Einschüchtern',
		'Empathie',
		'Etikette',
		'Führungsqualitäten',
		'Glücksspiel',
		'Navigation',
		'Orientierung',
		'Szenekenntnis',
		'Tierkunde',
		'Verhandeln',
		'Vorgaukeln',
		'Wildnisleben'
	],
	Bildung: [
		'Astronomie',
		'Aufbauwissenschaften',
		'Finanzen',
		'Geisteswissenschaften',
		'Gesetze',
		'Götter/Kulte',
		'Kartographie',
		'Kulturwissenschaften',
		'Linguistik',
		'Magietheorie',
		'Nachforschen',
		'Naturwissenschaften',
		'Pflanzenkunde',
		'Politik',
		'Schach',
		'Taktik'
	]
};

const DEFAULT_DISZIPLINEN = ['Feuerzauber', 'Schmiedekunst', 'Überleben'];

const DISPLAY_TO_SCHEMA_KEY = {
	Groesse: 'Größe',
	Staerke: 'Stärke',
	Glueck: 'Glück',
	Geistesschaerfe: 'Geistesschärfe'
};

function schemaKey(displayKey) {
	return DISPLAY_TO_SCHEMA_KEY[displayKey] || displayKey;
}

function parseInteger(value, fallback) {
	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? fallback : parsed;
}

function normalizeLookupKey(value) {
	return String(value || '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

function findObjectKeyByNormalizedMatch(object, targetKey) {
	if (!object || typeof object !== 'object') return undefined;
	const normalizedTarget = normalizeLookupKey(targetKey);
	return Object.keys(object).find((key) => normalizeLookupKey(key) === normalizedTarget);
}

function hasImportedCharacter() {
	return !!(window._importedCharacter && typeof window._importedCharacter === 'object');
}

function getInitialGeneralValue(existingCharacter, field) {
	const mappedKey = schemaKey(field);
	if (!existingCharacter || !existingCharacter.Allgemein) return '';
	return String(existingCharacter.Allgemein[mappedKey] ?? '');
}

function getInitialAttributeValue(existingCharacter, section, attributeKey, fallbackValue) {
	if (!existingCharacter || !existingCharacter.Attribute || !existingCharacter.Attribute[section]) {
		return String(fallbackValue);
	}

	const source = existingCharacter.Attribute[section];
	const mappedKey = schemaKey(attributeKey);
	const altKey = attributeKey;
	const value = source[mappedKey] ?? source[altKey];
	if (typeof value === 'number') return String(value);
	return String(fallbackValue);
}

function getInitialSkillValue(existingCharacter, category, skill) {
	const ausbildung = existingCharacter
		&& existingCharacter.Skills
		&& existingCharacter.Skills.Ausbildung;
	if (!ausbildung || typeof ausbildung !== 'object') return '0';

	const categoryKey = findObjectKeyByNormalizedMatch(ausbildung, category);
	if (!categoryKey) return '0';

	const categoryBucket = ausbildung[categoryKey];
	if (!categoryBucket || typeof categoryBucket !== 'object') return '0';

	const skillKey = findObjectKeyByNormalizedMatch(categoryBucket, skill);
	if (!skillKey) return '0';

	const value = categoryBucket[skillKey];
	return typeof value === 'number' ? String(value) : '0';
}

function getInitialDisziplinEntries(existingCharacter) {
	const disziplinen = existingCharacter
		&& existingCharacter.Skills
		&& existingCharacter.Skills.Disziplinen;

	if (!disziplinen || typeof disziplinen !== 'object') {
		return DEFAULT_DISZIPLINEN.map((name) => ({ key: name, value: 0 }));
	}

	const existingEntries = Object.keys(disziplinen).map((key) => ({
		key,
		value: typeof disziplinen[key] === 'number' ? disziplinen[key] : 0
	}));

	if (existingEntries.length >= DEFAULT_DISZIPLINEN.length) {
		return existingEntries;
	}

	const merged = [...existingEntries];
	DEFAULT_DISZIPLINEN.forEach((defaultKey) => {
		if (merged.some((entry) => entry.key === defaultKey)) return;
		merged.push({ key: defaultKey, value: 0 });
	});

	return merged;
}

function defaultCharacter() {
	const basiswert = {};
	const punkte = {};
	const ausbildung = {};

	ATTRIBUTE_KEYS.forEach((key) => {
		const mapped = schemaKey(key);
		basiswert[mapped] = 50;
		punkte[mapped] = 0;
	});

	Object.keys(AUSBILDUNG_SKILLS).forEach((category) => {
		ausbildung[category] = {};
		AUSBILDUNG_SKILLS[category].forEach((skill) => {
			ausbildung[category][skill] = 0;
		});
	});

	return {
		Allgemein: {
			Name: 'New Character',
			Spezies: 'Mensch',
			Alter: '',
			Augenfarbe: '',
			Haarfarbe: '',
			Größe: '',
			Gewicht: '',
			Beruf: '',
			Disziplin: ''
		},
		Attribute: {
			Basiswert: basiswert,
			Punkte: punkte
		},
		Skills: {
			Ausbildung: ausbildung,
			Disziplinen: {}
		},
		inventory: {
			items: []
		}
	};
}

function buildCharacterFromForm(panel, options = {}) {
	const mode = options.mode || 'create';
	const existingCharacter = options.existingCharacter;
	const character = defaultCharacter();

	GENERAL_FIELDS.forEach((field) => {
		const element = panel.querySelector(`[data-char-field="${field}"]`);
		const value = element ? element.value.trim() : '';
		const targetKey = schemaKey(field);

		if (targetKey === 'Name') {
			character.Allgemein[targetKey] = value || 'New Character';
			return;
		}

		if (targetKey === 'Spezies') {
			character.Allgemein[targetKey] = value || 'Mensch';
			return;
		}

		character.Allgemein[targetKey] = value;
	});

	ATTRIBUTE_KEYS.forEach((attributeKey) => {
		const mappedKey = schemaKey(attributeKey);
		const basiswertInput = panel.querySelector(`[data-attr-basis="${attributeKey}"]`);
		const punkteInput = panel.querySelector(`[data-attr-punkte="${attributeKey}"]`);

		character.Attribute.Basiswert[mappedKey] = parseInteger(basiswertInput ? basiswertInput.value : '', 50);
		character.Attribute.Punkte[mappedKey] = parseInteger(punkteInput ? punkteInput.value : '', 0);
	});

	Object.keys(AUSBILDUNG_SKILLS).forEach((category) => {
		AUSBILDUNG_SKILLS[category].forEach((skill, skillIndex) => {
			const input = panel.querySelector(`#skill-${category}-${skillIndex}`);
			character.Skills.Ausbildung[category][skill] = parseInteger(input ? input.value : '', 0);
		});
	});

	character.Skills.Disziplinen = {};
	DEFAULT_DISZIPLINEN.forEach((_, index) => {
		const keyInput = panel.querySelector(`#disziplin-key-${index}`);
		const valueInput = panel.querySelector(`#disziplin-value-${index}`);

		const key = keyInput ? keyInput.value.trim() : '';
		if (!key) return;

		character.Skills.Disziplinen[key] = parseInteger(valueInput ? valueInput.value : '', 0);
	});

	if (mode === 'edit' && existingCharacter && existingCharacter.inventory && typeof existingCharacter.inventory === 'object') {
		try {
			character.inventory = JSON.parse(JSON.stringify(existingCharacter.inventory));
		} catch {
			character.inventory = {
				items: Array.isArray(existingCharacter.inventory.items)
					? [...existingCharacter.inventory.items]
					: []
			};
		}
	}

	return character;
}

function panelMarkup(escapeHtml, mode, existingCharacter) {
	const generalInputs = GENERAL_FIELDS.map((field) => {
		const label = schemaKey(field);
		const placeholder = label === 'Name' ? 'New Character' : '';
		const initialValue = getInitialGeneralValue(existingCharacter, field);
		return `<label class="cc-label">${escapeHtml(label)}<input data-char-field="${escapeHtml(field)}" class="cc-input" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(initialValue)}" /></label>`;
	}).join('');

	const basiswertInputs = ATTRIBUTE_KEYS.map((attributeKey) => {
		const label = schemaKey(attributeKey);
		const initialValue = getInitialAttributeValue(existingCharacter, 'Basiswert', attributeKey, 50);
		return `<label class="cc-label">${escapeHtml(label)}<input data-attr-basis="${escapeHtml(attributeKey)}" class="cc-input" type="number" value="${escapeHtml(initialValue)}" /></label>`;
	}).join('');

	const punkteInputs = ATTRIBUTE_KEYS.map((attributeKey) => {
		const label = schemaKey(attributeKey);
		const initialValue = getInitialAttributeValue(existingCharacter, 'Punkte', attributeKey, 0);
		return `<label class="cc-label">${escapeHtml(label)}<input data-attr-punkte="${escapeHtml(attributeKey)}" class="cc-input" type="number" value="${escapeHtml(initialValue)}" /></label>`;
	}).join('');

	const skillsMarkup = Object.keys(AUSBILDUNG_SKILLS).map((category) => {
		const inputs = AUSBILDUNG_SKILLS[category].map((skill, skillIndex) => {
			const initialValue = getInitialSkillValue(existingCharacter, category, skill);
			return `<label class="cc-label">${escapeHtml(skill)}<input id="skill-${escapeHtml(category)}-${skillIndex}" data-skill-category="${escapeHtml(category)}" data-skill-name="${escapeHtml(skill)}" class="cc-input" type="number" value="${escapeHtml(initialValue)}" /></label>`;
		}).join('');

		return `<h4>${escapeHtml(category)}</h4><div class="character-creation-grid">${inputs}</div>`;
	}).join('');

	const disziplinEntries = getInitialDisziplinEntries(existingCharacter);
	const disziplinenMarkup = disziplinEntries.map((entry, index) => {
		return `
			<div class="cc-disziplin-row">
				<input id="disziplin-key-${index}" class="cc-input" value="${escapeHtml(entry.key)}" placeholder="Disziplin name" />
				<input id="disziplin-value-${index}" class="cc-input" type="number" value="${escapeHtml(String(entry.value))}" placeholder="Wert" />
			</div>
		`;
	}).join('');

	const modeTitle = mode === 'edit' ? 'Character Edit' : 'Character Creation';
	const modeDescription = mode === 'edit'
		? 'Edit the loaded character. Changes are applied directly to the imported character data.'
		: 'Create a starter character. You can refine skills and inventory after creation.';
	const modeActionLabel = mode === 'edit' ? 'Save Character' : 'Create Character';

	return `
		<div class="character-creation-header">
			<h2>${escapeHtml(modeTitle)}</h2>
			<button id="characterCreationClose" class="btn-secondary" type="button">Close</button>
		</div>
		<p class="muted">${escapeHtml(modeDescription)}</p>
		<h3>Allgemein</h3>
		<div class="character-creation-grid">
			${generalInputs}
		</div>
		<h3>Attribute - Basiswert</h3>
		<div class="character-creation-grid">
			${basiswertInputs}
		</div>
		<h3>Attribute - Punkte</h3>
		<div class="character-creation-grid">
			${punkteInputs}
		</div>
		<h3>Skills - Ausbildung</h3>
		${skillsMarkup}
		<h3>Skills - Disziplinen</h3>
		<div class="cc-disziplinen-list">${disziplinenMarkup}</div>
		<div class="character-creation-actions">
			<button id="createCharacterBtn" class="btn-primary" type="button">${escapeHtml(modeActionLabel)}</button>
		</div>
	`;
}

export function setupCharacterCreationFeature(showMessage, escapeHtml) {
	const trigger = document.getElementById('characterCreationFeature');
	if (!trigger) return;

	const titleElement = trigger.querySelector('h3');
	const descriptionElement = trigger.querySelector('p');
	const defaultTitle = titleElement ? titleElement.textContent : '';
	const defaultDescription = descriptionElement ? descriptionElement.textContent : '';

	function updateFeatureCardMode() {
		const editMode = hasImportedCharacter();

		if (titleElement) {
			titleElement.textContent = editMode ? '✏️ Character Edit' : defaultTitle;
		}

		if (descriptionElement) {
			descriptionElement.textContent = editMode
				? 'Edit the currently loaded character JSON in-app'
				: defaultDescription;
		}
	}

	updateFeatureCardMode();
	window.addEventListener('character-data-changed', updateFeatureCardMode);

	trigger.addEventListener('click', () => {
		updateFeatureCardMode();

		const container = document.querySelector('.container') || document.body;
		let panel = document.getElementById('characterCreationPanel');
		if (panel) return;

		const mode = hasImportedCharacter() ? 'edit' : 'create';
		const existingCharacter = mode === 'edit' ? window._importedCharacter : undefined;

		panel = document.createElement('div');
		panel.id = 'characterCreationPanel';
		panel.className = 'character-creation-panel';
		panel.innerHTML = panelMarkup(escapeHtml, mode, existingCharacter);
		container.appendChild(panel);

		const closeButton = panel.querySelector('#characterCreationClose');
		const createButton = panel.querySelector('#createCharacterBtn');

		closeButton.addEventListener('click', () => {
			panel.remove();
		});

		createButton.addEventListener('click', () => {
			const character = buildCharacterFromForm(panel, { mode, existingCharacter });
			window._importedCharacter = character;
			window.dispatchEvent(new CustomEvent('character-data-changed', {
				detail: { source: 'character-creation-feature', mode }
			}));
			if (mode === 'edit') {
				showMessage('Character updated successfully! You can now continue with Inventory, What do I roll, or Export JSON.', false);
			} else {
				showMessage('Character created successfully! You can now use Inventory, What do I roll, or Export JSON.', false);
			}
			updateFeatureCardMode();
			panel.remove();
		});
	});
}