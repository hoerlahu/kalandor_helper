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
});
