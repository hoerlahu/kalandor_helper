import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupCharacterCreationFeature } from '../../src/features/characterCreationFeature.js';

function getSkillInput(panel, category, skillName) {
  return panel.querySelector(`[data-skill-category="${category}"][data-skill-name="${skillName}"]`);
}

describe('setupCharacterCreationFeature', () => {
  let showMessage;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="container">
        <div id="characterCreationFeature"></div>
      </div>
      <div id="importResult"></div>
    `;

    showMessage = vi.fn();
    window._importedCharacter = undefined;
  });

  it('renders the character creation panel when feature is clicked', () => {
    setupCharacterCreationFeature(showMessage, (s) => String(s));

    document.getElementById('characterCreationFeature').click();

    expect(document.getElementById('characterCreationPanel')).not.toBeNull();
    expect(document.getElementById('createCharacterBtn')).not.toBeNull();
    expect(document.querySelectorAll('[data-attr-basis]').length).toBe(9);
    expect(document.querySelectorAll('[data-attr-punkte]').length).toBe(9);
    const panel = document.getElementById('characterCreationPanel');
    expect(getSkillInput(panel, 'Körperlich', 'Athletik')).not.toBeNull();
    expect(getSkillInput(panel, 'Kampf', 'Ausweichen')).not.toBeNull();
    expect(getSkillInput(panel, 'Sozial', 'Aufmerksamkeit')).not.toBeNull();
    expect(getSkillInput(panel, 'Bildung', 'Astronomie')).not.toBeNull();
    expect(document.querySelectorAll('.cc-disziplin-row').length).toBe(3);
  });

  it('closes the panel when close is clicked', () => {
    setupCharacterCreationFeature(showMessage, (s) => String(s));

    document.getElementById('characterCreationFeature').click();
    document.getElementById('characterCreationClose').click();

    expect(document.getElementById('characterCreationPanel')).toBeNull();
  });

  it('creates a schema-compatible starter character from form values', () => {
    setupCharacterCreationFeature(showMessage, (s) => String(s));

    document.getElementById('characterCreationFeature').click();

    const panel = document.getElementById('characterCreationPanel');
    panel.querySelector('[data-char-field="Name"]').value = 'Liora';
    panel.querySelector('[data-char-field="Spezies"]').value = 'Mensch';
    panel.querySelector('[data-char-field="Disziplin"]').value = 'Feuerzauber';
    panel.querySelector('[data-attr-basis="Staerke"]').value = '66';
    panel.querySelector('[data-attr-punkte="Willenskraft"]').value = '4';
    getSkillInput(panel, 'Körperlich', 'Athletik').value = '2';
    getSkillInput(panel, 'Kampf', 'Äxte').value = '3';
    panel.querySelector('#disziplin-key-0').value = 'Feuerzauber';
    panel.querySelector('#disziplin-value-0').value = '2';
    panel.querySelector('#disziplin-key-1').value = 'Schmiedekunst';
    panel.querySelector('#disziplin-value-1').value = '1';
    panel.querySelector('#disziplin-key-2').value = 'Überleben';
    panel.querySelector('#disziplin-value-2').value = '3';

    document.getElementById('createCharacterBtn').click();

    expect(window._importedCharacter).toBeTruthy();
    expect(window._importedCharacter.Allgemein.Name).toBe('Liora');
    expect(window._importedCharacter.Allgemein.Disziplin).toBe('Feuerzauber');
    expect(window._importedCharacter.Attribute.Basiswert.Stärke).toBe(66);
    expect(window._importedCharacter.Attribute.Punkte.Willenskraft).toBe(4);
    expect(window._importedCharacter.Skills.Ausbildung.Körperlich.Athletik).toBe(2);
    expect(window._importedCharacter.Skills.Ausbildung.Kampf['Äxte']).toBe(3);
    expect(window._importedCharacter.Skills.Disziplinen).toEqual({
      Feuerzauber: 2,
      Schmiedekunst: 1,
      Überleben: 3
    });
    expect(window._importedCharacter.inventory.items).toEqual([]);
    expect(showMessage).toHaveBeenCalledWith(
      'Character created successfully! You can now use Inventory, What do I roll, or Export JSON.',
      false
    );
  });

  it('does not create a second panel when the feature tile is clicked while one is already open', () => {
    setupCharacterCreationFeature(showMessage, (s) => String(s));

    document.getElementById('characterCreationFeature').click();
    document.getElementById('characterCreationFeature').click();

    expect(document.querySelectorAll('#characterCreationPanel').length).toBe(1);
  });

  it('skips disziplin rows where the key input is left empty', () => {
    setupCharacterCreationFeature(showMessage, (s) => String(s));

    document.getElementById('characterCreationFeature').click();

    const panel = document.getElementById('characterCreationPanel');
    panel.querySelector('#disziplin-key-0').value = 'Feuerzauber';
    panel.querySelector('#disziplin-value-0').value = '5';
    panel.querySelector('#disziplin-key-1').value = ''; // empty – must be skipped
    panel.querySelector('#disziplin-key-2').value = 'Überleben';
    panel.querySelector('#disziplin-value-2').value = '3';

    document.getElementById('createCharacterBtn').click();

    expect(Object.keys(window._importedCharacter.Skills.Disziplinen)).toEqual(['Feuerzauber', 'Überleben']);
  });

  it('defaults Name to "New Character" when the name input is left blank', () => {
    setupCharacterCreationFeature(showMessage, (s) => String(s));

    document.getElementById('characterCreationFeature').click();
    document.getElementById('characterCreationPanel').querySelector('[data-char-field="Name"]').value = '';
    document.getElementById('createCharacterBtn').click();

    expect(window._importedCharacter.Allgemein.Name).toBe('New Character');
  });

  it('defaults Spezies to "Mensch" when the spezies input is left blank', () => {
    setupCharacterCreationFeature(showMessage, (s) => String(s));

    document.getElementById('characterCreationFeature').click();
    document.getElementById('characterCreationPanel').querySelector('[data-char-field="Spezies"]').value = '';
    document.getElementById('createCharacterBtn').click();

    expect(window._importedCharacter.Allgemein.Spezies).toBe('Mensch');
  });

  it('stores attribute keys using correct German names (Staerke → Stärke, Glueck → Glück, Geistesschaerfe → Geistesschärfe)', () => {
    setupCharacterCreationFeature(showMessage, (s) => String(s));

    document.getElementById('characterCreationFeature').click();

    const panel = document.getElementById('characterCreationPanel');
    panel.querySelector('[data-attr-basis="Staerke"]').value = '75';
    panel.querySelector('[data-attr-basis="Glueck"]').value = '42';
    panel.querySelector('[data-attr-basis="Geistesschaerfe"]').value = '30';

    document.getElementById('createCharacterBtn').click();

    const basiswert = window._importedCharacter.Attribute.Basiswert;
    expect(basiswert['Stärke']).toBe(75);
    expect(basiswert['Glück']).toBe(42);
    expect(basiswert['Geistesschärfe']).toBe(30);
    expect(basiswert['Staerke']).toBeUndefined();
  });

  it('defaults Basiswert to 50 when an attribute input is left blank', () => {
    setupCharacterCreationFeature(showMessage, (s) => String(s));

    document.getElementById('characterCreationFeature').click();
    document.getElementById('characterCreationPanel').querySelector('[data-attr-basis="Staerke"]').value = '';
    document.getElementById('createCharacterBtn').click();

    expect(window._importedCharacter.Attribute.Basiswert['Stärke']).toBe(50);
  });

  it('opens in edit mode with loaded character values when a character is already imported', () => {
    window._importedCharacter = {
      Allgemein: {
        Name: 'Aria',
        Spezies: 'Elf',
        Alter: '120',
        Augenfarbe: 'Green',
        Haarfarbe: 'Silver',
        Größe: '170',
        Gewicht: '60',
        Beruf: 'Scout',
        Disziplin: 'Windlauf'
      },
      Attribute: {
        Basiswert: {
          Stärke: 61,
          Beweglichkeit: 72,
          Robustheit: 55,
          Intuition: 66,
          Charisma: 51,
          Glück: 47,
          Wahrnehmung: 62,
          Geistesschärfe: 58,
          Willenskraft: 64
        },
        Punkte: {
          Stärke: 1,
          Beweglichkeit: 2,
          Robustheit: 3,
          Intuition: 4,
          Charisma: 5,
          Glück: 6,
          Wahrnehmung: 7,
          Geistesschärfe: 8,
          Willenskraft: 9
        }
      },
      Skills: {
        Ausbildung: {
          Körperlich: { Athletik: 3 },
          Kampf: { Ausweichen: 4 },
          Sozial: { Aufmerksamkeit: 5 },
          Bildung: { Astronomie: 6 }
        },
        Disziplinen: {
          Windlauf: 3,
          Natursinn: 2,
          Sternkunde: 1
        }
      },
      inventory: { items: [] }
    };

    setupCharacterCreationFeature(showMessage, (s) => String(s));
    document.getElementById('characterCreationFeature').click();

    const panel = document.getElementById('characterCreationPanel');
    expect(panel).not.toBeNull();
    expect(panel.querySelector('h2').textContent).toBe('Character Edit');
    expect(document.getElementById('createCharacterBtn').textContent).toBe('Save Character');
    expect(panel.querySelector('[data-char-field="Name"]').value).toBe('Aria');
    expect(panel.querySelector('[data-attr-basis="Beweglichkeit"]').value).toBe('72');
    expect(panel.querySelector('[data-attr-punkte="Willenskraft"]').value).toBe('9');
    expect(getSkillInput(panel, 'Körperlich', 'Athletik').value).toBe('3');
    expect(panel.querySelector('#disziplin-key-0').value).toBe('Windlauf');
    expect(panel.querySelector('#disziplin-value-0').value).toBe('3');
  });

  it('saves edited character values and shows updated success message in edit mode', () => {
    window._importedCharacter = {
      Allgemein: {
        Name: 'Aria',
        Spezies: 'Elf',
        Alter: '',
        Augenfarbe: '',
        Haarfarbe: '',
        Größe: '',
        Gewicht: '',
        Beruf: '',
        Disziplin: ''
      },
      Attribute: {
        Basiswert: {
          Stärke: 50,
          Beweglichkeit: 50,
          Robustheit: 50,
          Intuition: 50,
          Charisma: 50,
          Glück: 50,
          Wahrnehmung: 50,
          Geistesschärfe: 50,
          Willenskraft: 50
        },
        Punkte: {
          Stärke: 0,
          Beweglichkeit: 0,
          Robustheit: 0,
          Intuition: 0,
          Charisma: 0,
          Glück: 0,
          Wahrnehmung: 0,
          Geistesschärfe: 0,
          Willenskraft: 0
        }
      },
      Skills: {
        Ausbildung: {
          Körperlich: { Athletik: 0 },
          Kampf: { Ausweichen: 0 },
          Sozial: { Aufmerksamkeit: 0 },
          Bildung: { Astronomie: 0 }
        },
        Disziplinen: {
          Feuerzauber: 0,
          Schmiedekunst: 0,
          Überleben: 0
        }
      },
      inventory: { items: [] }
    };

    setupCharacterCreationFeature(showMessage, (s) => String(s));
    document.getElementById('characterCreationFeature').click();

    const panel = document.getElementById('characterCreationPanel');
    panel.querySelector('[data-char-field="Name"]').value = 'Aria Updated';
    panel.querySelector('[data-attr-basis="Staerke"]').value = '77';
    getSkillInput(panel, 'Kampf', 'Ausweichen').value = '5';

    document.getElementById('createCharacterBtn').click();

    expect(window._importedCharacter.Allgemein.Name).toBe('Aria Updated');
    expect(window._importedCharacter.Attribute.Basiswert['Stärke']).toBe(77);
    expect(window._importedCharacter.Skills.Ausbildung.Kampf.Ausweichen).toBe(5);
    expect(showMessage).toHaveBeenCalledWith(
      'Character updated successfully! You can now continue with Inventory, What do I roll, or Export JSON.',
      false
    );
  });

  it('keeps existing inventory items when saving in edit mode', () => {
    window._importedCharacter = {
      Allgemein: {
        Name: 'Aria',
        Spezies: 'Elf',
        Alter: '',
        Augenfarbe: '',
        Haarfarbe: '',
        Größe: '',
        Gewicht: '',
        Beruf: '',
        Disziplin: ''
      },
      Attribute: {
        Basiswert: {
          Stärke: 50,
          Beweglichkeit: 50,
          Robustheit: 50,
          Intuition: 50,
          Charisma: 50,
          Glück: 50,
          Wahrnehmung: 50,
          Geistesschärfe: 50,
          Willenskraft: 50
        },
        Punkte: {
          Stärke: 0,
          Beweglichkeit: 0,
          Robustheit: 0,
          Intuition: 0,
          Charisma: 0,
          Glück: 0,
          Wahrnehmung: 0,
          Geistesschärfe: 0,
          Willenskraft: 0
        }
      },
      Skills: {
        Ausbildung: {
          Körperlich: { Athletik: 0 },
          Kampf: { Ausweichen: 0 },
          Sozial: { Aufmerksamkeit: 0 },
          Bildung: { Astronomie: 0 }
        },
        Disziplinen: {
          Feuerzauber: 0,
          Schmiedekunst: 0,
          Überleben: 0
        }
      },
      inventory: {
        items: [
          { name: 'Rope', quantity: 1 },
          { name: 'Potion', quantity: 2, skillNotes: [{ skill: 'Athletik', note: 'Steady hands', numericalBonus: 1 }] }
        ]
      }
    };

    setupCharacterCreationFeature(showMessage, (s) => String(s));
    document.getElementById('characterCreationFeature').click();

    const panel = document.getElementById('characterCreationPanel');
    panel.querySelector('[data-char-field="Name"]').value = 'Aria Inventory Safe';
    document.getElementById('createCharacterBtn').click();

    expect(window._importedCharacter.Allgemein.Name).toBe('Aria Inventory Safe');
    expect(window._importedCharacter.inventory.items).toEqual([
      { name: 'Rope', quantity: 1 },
      { name: 'Potion', quantity: 2, skillNotes: [{ skill: 'Athletik', note: 'Steady hands', numericalBonus: 1 }] }
    ]);
  });
});
