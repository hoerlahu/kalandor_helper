import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupWhatToRollFeature } from '../../src/features/whatToRollFeature.js';

function selectAthletikRoll() {
  const childSelect = document.getElementById('childSelect');
  childSelect.value = 'Ausbildung';
  childSelect.dispatchEvent(new Event('change'));

  const grandchildSelect = document.getElementById('grandchildSelect');
  grandchildSelect.value = 'Korperlich';
  grandchildSelect.dispatchEvent(new Event('change'));

  const greatgrandchildSelect = document.getElementById('greatgrandchildSelect');
  greatgrandchildSelect.value = 'Athletik';
  greatgrandchildSelect.dispatchEvent(new Event('change'));
}

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
    selectAthletikRoll();

    expect(document.getElementById('rollResult').innerHTML).toContain('Grundwert');
    expect(document.getElementById('basiswertSelect')).not.toBeNull();
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

  it('uses the first Basiswert as default and only shows that Basiswert details', () => {
    window._config = {
      __DEFAULT__: {
        BasisWert: ['Beweglichkeit', 'Willenskraft'],
        BasiswertMultiplier: 1,
        '10erStelleMultiplikator': 0,
        BasisWertPunkteMultiplikator: 0,
        WertMultiplikator: 10
      }
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
        Basiswert: { Beweglichkeit: 70, Willenskraft: 55 },
        Punkte: { Beweglichkeit: 3, Willenskraft: 1 }
      },
      inventory: {
        items: []
      }
    };

    setupWhatToRollFeature(showMessage, (s) => String(s));
    document.getElementById('whatToRollFeature').click();
    selectAthletikRoll();

    const basiswertSelect = document.getElementById('basiswertSelect');
    expect(basiswertSelect).not.toBeNull();
    expect(basiswertSelect.value).toBe('Beweglichkeit');
    expect(document.getElementById('rollResult').innerHTML).toContain('Basiswert: 70');
    expect(document.getElementById('rollResult').innerHTML).not.toContain('Basiswert: 55');
    expect(document.querySelectorAll('#rollResult #basiswertInfo').length).toBe(1);
  });

  it('updates the displayed roll info when a different Basiswert is selected', () => {
    window._config = {
      __DEFAULT__: {
        BasisWert: ['Beweglichkeit', 'Willenskraft'],
        BasiswertMultiplier: 1,
        '10erStelleMultiplikator': 0,
        BasisWertPunkteMultiplikator: 0,
        WertMultiplikator: 10
      }
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
        Basiswert: { Beweglichkeit: 70, Willenskraft: 55 },
        Punkte: { Beweglichkeit: 3, Willenskraft: 1 }
      },
      inventory: {
        items: []
      }
    };

    setupWhatToRollFeature(showMessage, (s) => String(s));
    document.getElementById('whatToRollFeature').click();
    selectAthletikRoll();

    const basiswertSelect = document.getElementById('basiswertSelect');
    basiswertSelect.value = 'Willenskraft';
    basiswertSelect.dispatchEvent(new Event('change'));

    expect(document.getElementById('rollResult').innerHTML).toContain('Basiswert: 55');
    expect(document.getElementById('rollResult').innerHTML).not.toContain('Basiswert: 70');
    expect(document.querySelector('#basiswertInfo').getAttribute('data-roll-base')).toBe('Willenskraft');
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
    selectAthletikRoll();

    expect(document.getElementById('rollResult').innerHTML).toContain('Grip Gloves');
    expect(document.getElementById('rollResult').innerHTML).toContain('Add traction bonus');
  });

  it('renders a checkbox for each inventory item in the what-to-roll panel', () => {
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
          { name: 'Grip Gloves', skillNotes: [{ skill: 'Athletik', note: 'Grip +', numericalBonus: 1 }] },
          { name: 'Lucky Charm', skillNotes: [{ skill: 'Athletik', note: 'Luck +', numericalBonus: 2 }] }
        ]
      }
    };

    setupWhatToRollFeature(showMessage, (s) => String(s));
    document.getElementById('whatToRollFeature').click();
    selectAthletikRoll();

    const checkboxes = document.querySelectorAll('#rollResult .roll-item-toggle');
    expect(checkboxes.length).toBe(2);
  });

  it('uses what-to-roll checkbox state to include or ignore numerical item bonus', () => {
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
            skillNotes: [{ skill: 'Athletik', note: 'Add traction bonus', numericalBonus: 10 }]
          }
        ]
      }
    };

    setupWhatToRollFeature(showMessage, (s) => String(s));
    document.getElementById('whatToRollFeature').click();
    selectAthletikRoll();

    let resultHtml = document.getElementById('rollResult').innerHTML;
    expect(resultHtml).toContain('Item-Boni: +10');

    const itemToggle = document.querySelector('#rollResult .roll-item-toggle');
    itemToggle.checked = false;
    itemToggle.dispatchEvent(new Event('change'));

    resultHtml = document.getElementById('rollResult').innerHTML;
    expect(resultHtml).toContain('Item-Boni: +0');
    expect(resultHtml).toContain('color:#aaa;');
    expect(window._importedCharacter.inventory.items[0].applyNumericalModifier).toBeUndefined();
  });

  it('keeps the selected Basiswert when item checkbox is toggled', () => {
    window._config = {
      __DEFAULT__: {
        BasisWert: ['Beweglichkeit', 'Willenskraft'],
        BasiswertMultiplier: 1,
        '10erStelleMultiplikator': 0,
        BasisWertPunkteMultiplikator: 0,
        WertMultiplikator: 10
      }
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
        Basiswert: { Beweglichkeit: 70, Willenskraft: 55 },
        Punkte: { Beweglichkeit: 3, Willenskraft: 1 }
      },
      inventory: {
        items: [
          {
            name: 'Grip Gloves',
            skillNotes: [{ skill: 'Athletik', note: 'Add traction bonus', numericalBonus: 10 }]
          }
        ]
      }
    };

    setupWhatToRollFeature(showMessage, (s) => String(s));
    document.getElementById('whatToRollFeature').click();
    selectAthletikRoll();

    const basiswertSelect = document.getElementById('basiswertSelect');
    basiswertSelect.value = 'Willenskraft';
    basiswertSelect.dispatchEvent(new Event('change'));

    const itemToggle = document.querySelector('#rollResult .roll-item-toggle');
    itemToggle.checked = false;
    itemToggle.dispatchEvent(new Event('change'));

    const basiswertSelectAfter = document.getElementById('basiswertSelect');
    expect(basiswertSelectAfter).not.toBeNull();
    expect(basiswertSelectAfter.value).toBe('Willenskraft');
    expect(document.querySelector('#basiswertInfo').getAttribute('data-roll-base')).toBe('Willenskraft');
  });
});