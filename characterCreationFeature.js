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

function buildCharacterFromForm(panel) {
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

	return character;
}

function panelMarkup(escapeHtml) {
	const generalInputs = GENERAL_FIELDS.map((field) => {
		const label = schemaKey(field);
		const placeholder = label === 'Name' ? 'New Character' : '';
		return `<label class="cc-label">${escapeHtml(label)}<input data-char-field="${escapeHtml(field)}" class="cc-input" placeholder="${escapeHtml(placeholder)}" /></label>`;
	}).join('');

	const basiswertInputs = ATTRIBUTE_KEYS.map((attributeKey) => {
		const label = schemaKey(attributeKey);
		return `<label class="cc-label">${escapeHtml(label)}<input data-attr-basis="${escapeHtml(attributeKey)}" class="cc-input" type="number" value="50" /></label>`;
	}).join('');

	const punkteInputs = ATTRIBUTE_KEYS.map((attributeKey) => {
		const label = schemaKey(attributeKey);
		return `<label class="cc-label">${escapeHtml(label)}<input data-attr-punkte="${escapeHtml(attributeKey)}" class="cc-input" type="number" value="0" /></label>`;
	}).join('');

	const skillsMarkup = Object.keys(AUSBILDUNG_SKILLS).map((category) => {
		const inputs = AUSBILDUNG_SKILLS[category].map((skill, skillIndex) => {
			return `<label class="cc-label">${escapeHtml(skill)}<input id="skill-${escapeHtml(category)}-${skillIndex}" class="cc-input" type="number" value="0" /></label>`;
		}).join('');

		return `<h4>${escapeHtml(category)}</h4><div class="character-creation-grid">${inputs}</div>`;
	}).join('');

	const disziplinenMarkup = DEFAULT_DISZIPLINEN.map((name, index) => {
		return `
			<div class="cc-disziplin-row">
				<input id="disziplin-key-${index}" class="cc-input" value="${escapeHtml(name)}" placeholder="Disziplin name" />
				<input id="disziplin-value-${index}" class="cc-input" type="number" value="0" placeholder="Wert" />
			</div>
		`;
	}).join('');

	return `
		<div class="character-creation-header">
			<h2>Character Creation</h2>
			<button id="characterCreationClose" class="btn-secondary" type="button">Close</button>
		</div>
		<p class="muted">Create a starter character. You can refine skills and inventory after creation.</p>
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
			<button id="createCharacterBtn" class="btn-primary" type="button">Create Character</button>
		</div>
	`;
}

export function setupCharacterCreationFeature(showMessage, escapeHtml) {
	const trigger = document.getElementById('characterCreationFeature');
	if (!trigger) return;

	trigger.addEventListener('click', () => {
		const container = document.querySelector('.container') || document.body;
		let panel = document.getElementById('characterCreationPanel');
		if (panel) return;

		panel = document.createElement('div');
		panel.id = 'characterCreationPanel';
		panel.className = 'character-creation-panel';
		panel.innerHTML = panelMarkup(escapeHtml);
		container.appendChild(panel);

		const closeButton = panel.querySelector('#characterCreationClose');
		const createButton = panel.querySelector('#createCharacterBtn');

		closeButton.addEventListener('click', () => {
			panel.remove();
		});

		createButton.addEventListener('click', () => {
			const character = buildCharacterFromForm(panel);
			window._importedCharacter = character;
			showMessage('Character created successfully! You can now use Inventory, What do I roll, or Export JSON.', false);
			panel.remove();
		});
	});
}
