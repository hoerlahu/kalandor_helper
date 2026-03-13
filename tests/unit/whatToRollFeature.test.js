import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupWhatToRollFeature } from '../../whatToRollFeature.js';

describe('setupWhatToRollFeature', () => {
  let showMessage;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="whatToRollFeature"></div>
      <div id="rollSelector" style="display:none"></div>
      <div id="importResult"></div>
    `;

    showMessage = vi.fn();
    window._config = {
      __DEFAULT__: {
        BasisWert: ['Beweglichkeit'],
        BasiswertMultiplier: 1,
        '10erStelleMultiplikator': 0,
        BasisWertPunkteMultiplikator: 0,
        WertMultiplikator: 10
      }
    };
  });

  it('shows guidance when no character is imported', () => {
    window._importedCharacter = undefined;

    setupWhatToRollFeature(showMessage, (s) => String(s));
    document.getElementById('whatToRollFeature').click();

    expect(showMessage).toHaveBeenCalledWith(
      'This feature helps you find out what influences your rolls. Import a character first!',
      false
    );
  });

  it('renders roll info for a leaf skill selection', () => {
    window._importedCharacter = {
      Skills: {
        Ausbildung: {
          Korperlich: {
            Athletik: 2
          }
        }
      },
      Attribute: {
        Basiswert: { Beweglichkeit: 70 },
        Punkte: { Beweglichkeit: 3 }
      },
      inventory: {
        items: []
      }
    };

    setupWhatToRollFeature(showMessage, (s) => String(s));
    document.getElementById('whatToRollFeature').click();

    const childSelect = document.getElementById('childSelect');
    childSelect.value = 'Ausbildung';
    childSelect.dispatchEvent(new Event('change'));

    const grandchildSelect = document.getElementById('grandchildSelect');
    grandchildSelect.value = 'Korperlich';
    grandchildSelect.dispatchEvent(new Event('change'));

    const greatgrandchildSelect = document.getElementById('greatgrandchildSelect');
    greatgrandchildSelect.value = 'Athletik';
    greatgrandchildSelect.dispatchEvent(new Event('change'));

    expect(document.getElementById('rollResult').innerHTML).toContain('Grundwert');
  });

  it('includes config general skills in first dropdown even when missing on character', () => {
    window._config = {
      __DEFAULT__: {
        BasisWert: ['Beweglichkeit'],
        BasiswertMultiplier: 1,
        '10erStelleMultiplikator': 0,
        BasisWertPunkteMultiplikator: 0,
        WertMultiplikator: 10
      },
      generalSkills: ['Absorbtion']
    };

    window._importedCharacter = {
      Skills: {
        Ausbildung: {
          Korperlich: {
            Athletik: 2
          }
        }
      },
      Attribute: {
        Basiswert: { Beweglichkeit: 70 },
        Punkte: { Beweglichkeit: 3 }
      },
      inventory: {
        items: []
      }
    };

    setupWhatToRollFeature(showMessage, (s) => String(s));
    document.getElementById('whatToRollFeature').click();

    const childSelect = document.getElementById('childSelect');
    const optionValues = Array.from(childSelect.options).map((o) => o.value);

    expect(optionValues).toContain('Absorbtion');
  });

  it('renders a close button in the roll selector panel', () => {
    window._importedCharacter = {
      Skills: {
        Ausbildung: {
          Korperlich: {
            Athletik: 2
          }
        }
      },
      Attribute: {
        Basiswert: { Beweglichkeit: 70 },
        Punkte: { Beweglichkeit: 3 }
      },
      inventory: {
        items: []
      }
    };

    setupWhatToRollFeature(showMessage, (s) => String(s));
    document.getElementById('whatToRollFeature').click();

    expect(document.getElementById('rollSelectorClose')).not.toBeNull();
  });

  it('hides the roll selector panel when close is clicked', () => {
    window._importedCharacter = {
      Skills: {
        Ausbildung: {
          Korperlich: {
            Athletik: 2
          }
        }
      },
      Attribute: {
        Basiswert: { Beweglichkeit: 70 },
        Punkte: { Beweglichkeit: 3 }
      },
      inventory: {
        items: []
      }
    };

    setupWhatToRollFeature(showMessage, (s) => String(s));
    document.getElementById('whatToRollFeature').click();

    expect(document.getElementById('rollSelector').style.display).toBe('block');
    document.getElementById('rollSelectorClose').click();
    expect(document.getElementById('rollSelector').style.display).toBe('none');
    expect(document.getElementById('rollSelector').innerHTML).toBe('');
  });

  it('renders matching item notes in roll details output', () => {
    window._importedCharacter = {
      Skills: {
        Ausbildung: {
          Korperlich: {
            Athletik: 2
          }
        }
      },
      Attribute: {
        Basiswert: { Beweglichkeit: 70 },
        Punkte: { Beweglichkeit: 3 }
      },
      inventory: {
        items: [
          {
            name: 'Grip Gloves',
            skillNotes: [{ skill: 'Athletik', note: 'Add traction bonus' }]
          }
        ]
      }
    };

    setupWhatToRollFeature(showMessage, (s) => String(s));
    document.getElementById('whatToRollFeature').click();

    const childSelect = document.getElementById('childSelect');
    childSelect.value = 'Ausbildung';
    childSelect.dispatchEvent(new Event('change'));

    const grandchildSelect = document.getElementById('grandchildSelect');
    grandchildSelect.value = 'Korperlich';
    grandchildSelect.dispatchEvent(new Event('change'));

    const greatgrandchildSelect = document.getElementById('greatgrandchildSelect');
    greatgrandchildSelect.value = 'Athletik';
    greatgrandchildSelect.dispatchEvent(new Event('change'));

    expect(document.getElementById('rollResult').innerHTML).toContain('Grip Gloves');
    expect(document.getElementById('rollResult').innerHTML).toContain('Add traction bonus');
  });
});
