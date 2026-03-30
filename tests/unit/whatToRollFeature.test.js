import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupWhatToRollFeature } from '../../src/features/whatToRollFeature.js';

function selectRollPath(pathValue) {
  const rollSearchInput = document.getElementById('rollSearchInput');
  rollSearchInput.value = pathValue;
  rollSearchInput.dispatchEvent(new Event('input'));
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

  it('renders roll info for a leaf roll path selection', () => {
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
    selectRollPath('Ausbildung > Korperlich > Athletik');

    expect(document.getElementById('rollResult').innerHTML).toContain('Grundwert');
    expect(document.getElementById('basiswertSelect')).not.toBeNull();
  });

  it('includes config general skills in type-ahead options even when missing on character', () => {
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

    const optionValues = Array.from(document.querySelectorAll('#rollSearchList option')).map((o) => o.value);
    expect(optionValues).toContain('Absorbtion');
  });

  it('renders a type-ahead input for roll selection', () => {
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

    const rollSearchInput = document.getElementById('rollSearchInput');
    expect(rollSearchInput).not.toBeNull();
    expect(rollSearchInput.getAttribute('list')).toBe('rollSearchList');
    expect(document.getElementById('rollSearchList')).not.toBeNull();
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
    selectRollPath('Ausbildung > Korperlich > Athletik');

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
    selectRollPath('Ausbildung > Korperlich > Athletik');

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
    selectRollPath('Ausbildung > Korperlich > Athletik');

    expect(document.getElementById('rollResult').innerHTML).toContain('Grip Gloves');
    expect(document.getElementById('rollResult').innerHTML).toContain('Add traction bonus');
  });

  it('renders a checkbox for each skill note in the what-to-roll panel', () => {
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
          { name: 'Lucky Charm', skillNotes: [{ skill: 'Athletik', note: 'Luck +', numericalBonus: 2 }, { skill: 'Athletik', note: 'Extra Luck', numericalBonus: 1 }] }
        ]
      }
    };

    setupWhatToRollFeature(showMessage, (s) => String(s));
    document.getElementById('whatToRollFeature').click();
    selectRollPath('Ausbildung > Korperlich > Athletik');

    const checkboxes = document.querySelectorAll('#rollResult .roll-skill-note-toggle');
    expect(checkboxes.length).toBe(3);
  });

  it('uses what-to-roll checkbox state to include or ignore numerical skill note bonus', () => {
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
    selectRollPath('Ausbildung > Korperlich > Athletik');

    let resultHtml = document.getElementById('rollResult').innerHTML;
    expect(resultHtml).toContain('Item-Boni: +10');

    const skillNoteToggle = document.querySelector('#rollResult .roll-skill-note-toggle');
    skillNoteToggle.checked = false;
    skillNoteToggle.dispatchEvent(new Event('change'));

    resultHtml = document.getElementById('rollResult').innerHTML;
    expect(resultHtml).toContain('Item-Boni: +0');
    expect(resultHtml).toContain('color:#aaa;');
    expect(window._importedCharacter.inventory.items[0].applyNumericalModifier).toBeUndefined();
  });

  it('keeps the selected Basiswert when skill note checkbox is toggled', () => {
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
    selectRollPath('Ausbildung > Korperlich > Athletik');

    const basiswertSelect = document.getElementById('basiswertSelect');
    basiswertSelect.value = 'Willenskraft';
    basiswertSelect.dispatchEvent(new Event('change'));

    const skillNoteToggle = document.querySelector('#rollResult .roll-skill-note-toggle');
    skillNoteToggle.checked = false;
    skillNoteToggle.dispatchEvent(new Event('change'));

    const basiswertSelectAfter = document.getElementById('basiswertSelect');
    expect(basiswertSelectAfter).not.toBeNull();
    expect(basiswertSelectAfter.value).toBe('Willenskraft');
    expect(document.querySelector('#basiswertInfo').getAttribute('data-roll-base')).toBe('Willenskraft');
  });

  it('toggles individual skill notes independently', () => {
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
            name: 'Magic Boots',
            skillNotes: [
              { skill: 'Athletik', note: 'Enhanced Speed', numericalBonus: 5 },
              { skill: 'Athletik', note: 'Better Grip', numericalBonus: 3 }
            ]
          }
        ]
      }
    };

    setupWhatToRollFeature(showMessage, (s) => String(s));
    document.getElementById('whatToRollFeature').click();
    selectRollPath('Ausbildung > Korperlich > Athletik');

    let resultHtml = document.getElementById('rollResult').innerHTML;
    expect(resultHtml).toContain('Item-Boni: +8');

    const checkboxes = document.querySelectorAll('#rollResult .roll-skill-note-toggle');
    expect(checkboxes.length).toBe(2);

    // Uncheck the first skill note (Enhanced Speed - bonus 5)
    checkboxes[0].checked = false;
    checkboxes[0].dispatchEvent(new Event('change'));

    resultHtml = document.getElementById('rollResult').innerHTML;
    expect(resultHtml).toContain('Item-Boni: +3');

    // Uncheck the second skill note (Better Grip - bonus 3)
    const checkboxesAfter = document.querySelectorAll('#rollResult .roll-skill-note-toggle');
    checkboxesAfter[1].checked = false;
    checkboxesAfter[1].dispatchEvent(new Event('change'));

    resultHtml = document.getElementById('rollResult').innerHTML;
    expect(resultHtml).toContain('Item-Boni: +0');
  });

  it('only shows checkboxes for skill notes with numerical bonuses', () => {
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
            name: 'Mixed Gear',
            skillNotes: [
              { skill: 'Athletik', note: 'This is just flavor text', numericalBonus: undefined },
              { skill: 'Athletik', note: 'This has a bonus', numericalBonus: 2 },
              { skill: 'Athletik', note: 'Another flavor note' }
            ]
          }
        ]
      }
    };

    setupWhatToRollFeature(showMessage, (s) => String(s));
    document.getElementById('whatToRollFeature').click();
    selectRollPath('Ausbildung > Korperlich > Athletik');

    const resultHtml = document.getElementById('rollResult').innerHTML;
    expect(resultHtml).toContain('This is just flavor text');
    expect(resultHtml).toContain('This has a bonus');
    expect(resultHtml).toContain('Another flavor note');
    expect(resultHtml).toContain('Item-Boni: +2');

    const checkboxes = document.querySelectorAll('#rollResult .roll-skill-note-toggle');
    expect(checkboxes.length).toBe(1);
  });

  describe('Favorites', () => {
    const baseCharacter = () => ({
      Skills: { Ausbildung: { Korperlich: { Athletik: 2 } } },
      Attribute: { Basiswert: { Beweglichkeit: 70 }, Punkte: { Beweglichkeit: 3 } },
      inventory: { items: [] }
    });

    it('starts with the favorites panel collapsed', () => {
      window._importedCharacter = baseCharacter();
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();

      expect(document.getElementById('rollFavoritesToggle').getAttribute('aria-expanded')).toBe('false');
      expect(document.getElementById('rollFavoritesContent').style.display).toBe('none');
    });

    it('expands the favorites panel when the toggle is clicked', () => {
      window._importedCharacter = { ...baseCharacter(), rollFavorites: [{ path: 'Ausbildung > Korperlich > Athletik' }] };
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();

      document.getElementById('rollFavoritesToggle').click();

      expect(document.getElementById('rollFavoritesToggle').getAttribute('aria-expanded')).toBe('true');
      expect(document.getElementById('rollFavoritesContent').style.display).toBe('');
      expect(document.getElementById('rollFavoritesList').innerHTML).toContain('Ausbildung > Korperlich > Athletik');
    });

    it('shows "No favorites yet" when character has no rollFavorites', () => {
      window._importedCharacter = baseCharacter();
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();

      expect(document.getElementById('rollFavoritesList').innerHTML).toContain('No favorites yet');
    });

    it('shows existing favorites with full roll info on panel open', () => {
      window._importedCharacter = { ...baseCharacter(), rollFavorites: [{ path: 'Ausbildung > Korperlich > Athletik' }] };
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();

      const listHtml = document.getElementById('rollFavoritesList').innerHTML;
      expect(listHtml).toContain('Ausbildung > Korperlich > Athletik');
      expect(listHtml).toContain('Grundwert');
    });

    it('hides the favorite toggle row when no roll is selected', () => {
      window._importedCharacter = baseCharacter();
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();

      expect(document.getElementById('rollFavoriteToggleRow').style.display).toBe('none');
    });

    it('shows the favorite toggle row when a valid roll is selected', () => {
      window._importedCharacter = baseCharacter();
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();
      selectRollPath('Ausbildung > Korperlich > Athletik');

      expect(document.getElementById('rollFavoriteToggleRow').style.display).not.toBe('none');
    });

    it('shows "Add to Favorites" text for a roll not yet favorited', () => {
      window._importedCharacter = { ...baseCharacter(), rollFavorites: [] };
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();
      selectRollPath('Ausbildung > Korperlich > Athletik');

      expect(document.getElementById('rollFavoriteBtn').textContent).toContain('Add to Favorites');
    });

    it('shows "Remove from Favorites" text for an already-favorited roll', () => {
      window._importedCharacter = { ...baseCharacter(), rollFavorites: [{ path: 'Ausbildung > Korperlich > Athletik' }] };
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();
      selectRollPath('Ausbildung > Korperlich > Athletik');

      expect(document.getElementById('rollFavoriteBtn').textContent).toContain('Remove from Favorites');
    });

    it('adds roll to character rollFavorites when favorite button is clicked', () => {
      window._importedCharacter = baseCharacter();
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();
      selectRollPath('Ausbildung > Korperlich > Athletik');
      document.getElementById('rollFavoriteBtn').click();

      expect(window._importedCharacter.rollFavorites.some((f) => f.path === 'Ausbildung > Korperlich > Athletik')).toBe(true);
    });

    it('removes roll from rollFavorites when favorite button is clicked again', () => {
      window._importedCharacter = { ...baseCharacter(), rollFavorites: [{ path: 'Ausbildung > Korperlich > Athletik' }] };
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();
      selectRollPath('Ausbildung > Korperlich > Athletik');
      document.getElementById('rollFavoriteBtn').click();

      expect(window._importedCharacter.rollFavorites.some((f) => f.path === 'Ausbildung > Korperlich > Athletik')).toBe(false);
    });

    it('updates button text to "Remove from Favorites" after adding', () => {
      window._importedCharacter = baseCharacter();
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();
      selectRollPath('Ausbildung > Korperlich > Athletik');
      document.getElementById('rollFavoriteBtn').click();

      expect(document.getElementById('rollFavoriteBtn').textContent).toContain('Remove from Favorites');
    });

    it('updates the favorites list after adding a favorite', () => {
      window._importedCharacter = baseCharacter();
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();
      selectRollPath('Ausbildung > Korperlich > Athletik');
      document.getElementById('rollFavoriteBtn').click();

      expect(document.getElementById('rollFavoritesList').innerHTML).toContain('Ausbildung > Korperlich > Athletik');
    });

    it('displays full roll info inline for a favorite', () => {
      window._importedCharacter = { ...baseCharacter(), rollFavorites: [{ path: 'Ausbildung > Korperlich > Athletik', preferredBase: 'Beweglichkeit' }] };
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();

      const listHtml = document.getElementById('rollFavoritesList').innerHTML;
      expect(listHtml).toContain('Grundwert');
      expect(listHtml).toContain('Roll20');
      expect(listHtml).toContain('Basiswert: 70');
    });

    it('uses preferredBase from character data when rendering a favorite', () => {
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
        Skills: { Ausbildung: { Korperlich: { Athletik: 2 } } },
        Attribute: { Basiswert: { Beweglichkeit: 70, Willenskraft: 55 }, Punkte: { Beweglichkeit: 3, Willenskraft: 1 } },
        inventory: { items: [] },
        rollFavorites: [{ path: 'Ausbildung > Korperlich > Athletik', preferredBase: 'Willenskraft' }]
      };
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();

      const listHtml = document.getElementById('rollFavoritesList').innerHTML;
      expect(listHtml).toContain('Basiswert: 55');
      expect(listHtml).not.toContain('Basiswert: 70');
    });

    it('stores preferredBase in character data when Basiswert select in favorites is changed', () => {
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
        Skills: { Ausbildung: { Korperlich: { Athletik: 2 } } },
        Attribute: { Basiswert: { Beweglichkeit: 70, Willenskraft: 55 }, Punkte: { Beweglichkeit: 3, Willenskraft: 1 } },
        inventory: { items: [] },
        rollFavorites: [{ path: 'Ausbildung > Korperlich > Athletik' }]
      };
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();

      const favSelect = document.querySelector('.roll-fav-basiswert-select');
      favSelect.value = 'Willenskraft';
      favSelect.dispatchEvent(new Event('change'));

      expect(window._importedCharacter.rollFavorites[0].preferredBase).toBe('Willenskraft');
    });

    it('re-renders favorite with new Basiswert details after select change', () => {
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
        Skills: { Ausbildung: { Korperlich: { Athletik: 2 } } },
        Attribute: { Basiswert: { Beweglichkeit: 70, Willenskraft: 55 }, Punkte: { Beweglichkeit: 3, Willenskraft: 1 } },
        inventory: { items: [] },
        rollFavorites: [{ path: 'Ausbildung > Korperlich > Athletik', preferredBase: 'Beweglichkeit' }]
      };
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();

      const favSelect = document.querySelector('.roll-fav-basiswert-select');
      favSelect.value = 'Willenskraft';
      favSelect.dispatchEvent(new Event('change'));

      expect(document.getElementById('rollFavoritesList').innerHTML).toContain('Basiswert: 55');
      expect(document.getElementById('rollFavoritesList').innerHTML).not.toContain('Basiswert: 70');
    });

    it('shows item bonus totals in favorites without checkboxes', () => {
      window._importedCharacter = {
        Skills: { Ausbildung: { Korperlich: { Athletik: 2 } } },
        Attribute: { Basiswert: { Beweglichkeit: 70 }, Punkte: { Beweglichkeit: 3 } },
        inventory: { items: [{ name: 'Grip Gloves', skillNotes: [{ skill: 'Athletik', note: 'Traction', numericalBonus: 5 }] }] },
        rollFavorites: [{ path: 'Ausbildung > Korperlich > Athletik' }]
      };
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();

      const listHtml = document.getElementById('rollFavoritesList').innerHTML;
      expect(listHtml).toContain('Item-Boni: +5');
      expect(listHtml).not.toContain('roll-skill-note-toggle');
    });

    it('removes a favorite when the remove button is clicked', () => {
      window._importedCharacter = { ...baseCharacter(), rollFavorites: [{ path: 'Ausbildung > Korperlich > Athletik' }] };
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();

      document.querySelector('.roll-favorite-remove').click();

      expect(window._importedCharacter.rollFavorites.some((f) => f.path === 'Ausbildung > Korperlich > Athletik')).toBe(false);
      expect(document.getElementById('rollFavoritesList').innerHTML).toContain('No favorites yet');
    });

    it('updates favorite button to "Add to Favorites" after removing the currently selected roll', () => {
      window._importedCharacter = { ...baseCharacter(), rollFavorites: [{ path: 'Ausbildung > Korperlich > Athletik' }] };
      setupWhatToRollFeature(showMessage, (s) => String(s));
      document.getElementById('whatToRollFeature').click();
      selectRollPath('Ausbildung > Korperlich > Athletik');

      document.querySelector('.roll-favorite-remove').click();

      expect(document.getElementById('rollFavoriteBtn').textContent).toContain('Add to Favorites');
    });

    it('rollFavorites objects are included when character is exported', () => {
      window._importedCharacter = { ...baseCharacter(), rollFavorites: [{ path: 'Ausbildung > Korperlich > Athletik', preferredBase: 'Beweglichkeit' }] };
      const json = JSON.stringify(window._importedCharacter);
      const parsed = JSON.parse(json);
      expect(parsed.rollFavorites).toEqual([{ path: 'Ausbildung > Korperlich > Athletik', preferredBase: 'Beweglichkeit' }]);
    });
  });
});
