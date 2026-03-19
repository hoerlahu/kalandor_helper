import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupInventoryFeature } from '../../src/features/inventoryFeature.js';

describe('setupInventoryFeature', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="container">
        <div id="inventoryFeature"></div>
      </div>
    `;

    window._config = {
      Absorbtion: { MetaSkill: true }
    };
  });

  it('shows inventory panel with no imported character message', () => {
    window._importedCharacter = undefined;

    setupInventoryFeature(vi.fn(), (s) => String(s));
    document.getElementById('inventoryFeature').click();

    expect(document.getElementById('inventoryPanel')).not.toBeNull();
    expect(document.getElementById('inventoryContent').textContent).toContain('No character imported');
  });

  it('adds an item and persists it to imported character inventory', () => {
    window._importedCharacter = {
      Skills: {
        Ausbildung: {
          Korperlich: {
            Athletik: 2
          }
        }
      },
      Attribute: {
        Basiswert: {
          Beweglichkeit: 70
        }
      }
    };

    setupInventoryFeature(vi.fn(), (s) => String(s));
    document.getElementById('inventoryFeature').click();

    document.getElementById('itemName').value = 'Rope';
    document.getElementById('itemQty').value = '2';
    document.getElementById('itemDesc').value = 'Useful rope';
    document.getElementById('addItemBtn').click();

    expect(Array.isArray(window._importedCharacter.inventory.items)).toBe(true);
    expect(window._importedCharacter.inventory.items).toHaveLength(1);
    expect(window._importedCharacter.inventory.items[0]).toMatchObject({
      name: 'Rope',
      quantity: '2',
      description: 'Useful rope'
    });
  });

  it('closes the inventory panel when close is clicked', () => {
    window._importedCharacter = { Skills: {}, Attribute: { Basiswert: {} } };

    setupInventoryFeature(vi.fn(), (s) => String(s));
    document.getElementById('inventoryFeature').click();

    expect(document.getElementById('inventoryPanel')).not.toBeNull();
    document.getElementById('inventoryClose').click();
    expect(document.getElementById('inventoryPanel')).toBeNull();
  });

  it('stores skill notes using only the lowest selected skill node', () => {
    window._importedCharacter = {
      Skills: {
        Ausbildung: {
          Korperlich: {
            Athletik: 2
          }
        }
      },
      Attribute: {
        Basiswert: {
          Beweglichkeit: 70
        }
      }
    };

    setupInventoryFeature(vi.fn(), (s) => String(s));
    document.getElementById('inventoryFeature').click();

    document.getElementById('itemName').value = 'Climbing Hook';
    document.getElementById('itemSkillSelect').value = 'Ausbildung > Korperlich > Athletik';
    document.getElementById('itemSkillNoteText').value = 'Bonus on steep walls';
    document.getElementById('addSkillBtn').click();
    document.getElementById('addItemBtn').click();

    expect(window._importedCharacter.inventory.items[0].skillNotes).toEqual([
      { skill: 'Athletik', note: 'Bonus on steep walls' }
    ]);
  });

  it('does not create a second panel when the inventory tile is clicked while one is already open', () => {
    window._importedCharacter = { Skills: {}, Attribute: { Basiswert: {} } };

    setupInventoryFeature(vi.fn(), (s) => String(s));
    document.getElementById('inventoryFeature').click();
    document.getElementById('inventoryFeature').click();

    expect(document.querySelectorAll('#inventoryPanel').length).toBe(1);
  });

  it('renders existing inventory items when the panel opens', () => {
    window._importedCharacter = {
      Skills: {},
      Attribute: { Basiswert: {} },
      inventory: {
        items: [{ name: 'Sword', quantity: '1', description: 'Sharp blade', skillNotes: [] }]
      }
    };

    setupInventoryFeature(vi.fn(), (s) => String(s));
    document.getElementById('inventoryFeature').click();

    expect(document.getElementById('inventoryContent').textContent).toContain('Sword');
  });

  it('edit button populates the form and Save updates the item in place without duplicating it', () => {
    window._importedCharacter = {
      Skills: {},
      Attribute: { Basiswert: {} },
      inventory: {
        items: [{ name: 'Shield', quantity: '1', description: 'Round shield', skillNotes: [] }]
      }
    };

    setupInventoryFeature(vi.fn(), (s) => String(s));
    document.getElementById('inventoryFeature').click();

    const editButton = document.querySelector('#inventoryContent .btn-secondary');
    editButton.click();

    expect(document.getElementById('itemName').value).toBe('Shield');
    expect(document.getElementById('addItemBtn').textContent).toBe('Save');

    document.getElementById('itemName').value = 'Tower Shield';
    document.getElementById('addItemBtn').click();

    expect(window._importedCharacter.inventory.items).toHaveLength(1);
    expect(window._importedCharacter.inventory.items[0].name).toBe('Tower Shield');
  });

  it('delete button removes the item from the character inventory', () => {
    window._importedCharacter = {
      Skills: {},
      Attribute: { Basiswert: {} },
      inventory: {
        items: [
          { name: 'Sword', quantity: '1', description: '', skillNotes: [] },
          { name: 'Shield', quantity: '1', description: '', skillNotes: [] }
        ]
      }
    };

    setupInventoryFeature(vi.fn(), (s) => String(s));
    document.getElementById('inventoryFeature').click();

    // Each item renders [Edit, Delete]. Index 1 is Delete for the first item.
    const allButtons = document.querySelectorAll('#inventoryContent .btn-secondary');
    allButtons[1].click();

    expect(window._importedCharacter.inventory.items).toHaveLength(1);
    expect(window._importedCharacter.inventory.items[0].name).toBe('Shield');
  });

  it('does not add an item when the name field is empty', () => {
    window._importedCharacter = { Skills: {}, Attribute: { Basiswert: {} } };

    setupInventoryFeature(vi.fn(), (s) => String(s));
    document.getElementById('inventoryFeature').click();

    document.getElementById('itemName').value = '';
    document.getElementById('itemQty').value = '1';
    document.getElementById('addItemBtn').click();

    const items = window._importedCharacter.inventory?.items || [];
    expect(items).toHaveLength(0);
  });

  it('allows editing an existing skill note while editing an item', () => {
    window._importedCharacter = {
      Skills: {
        Ausbildung: {
          Korperlich: {
            Athletik: 2
          }
        }
      },
      Attribute: {
        Basiswert: {
          Beweglichkeit: 70
        }
      },
      inventory: {
        items: [
          {
            name: 'Boots',
            quantity: '1',
            description: 'Old boots',
            skillNotes: [
              { skill: 'Athletik', note: 'Old note', numericalBonus: 1 }
            ]
          }
        ]
      }
    };

    setupInventoryFeature(vi.fn(), (s) => String(s));
    document.getElementById('inventoryFeature').click();

    const editItemButton = document.querySelector('#inventoryContent .btn-secondary');
    editItemButton.click();

    const editSkillButton = document.querySelector('#itemSkillList .btn-secondary');
    editSkillButton.click();

    document.getElementById('itemSkillSelect').value = 'Ausbildung > Korperlich > Athletik';
    document.getElementById('itemSkillNoteText').value = 'Updated note';
    document.getElementById('itemSkillBonus').value = '4';
    document.getElementById('addSkillBtn').click();
    document.getElementById('addItemBtn').click();

    expect(window._importedCharacter.inventory.items).toHaveLength(1);
    expect(window._importedCharacter.inventory.items[0].skillNotes).toEqual([
      { skill: 'Athletik', note: 'Updated note', numericalBonus: 4 }
    ]);
  });

  it('preselects the skill dropdown to the skill note value when editing a skill note', () => {
    window._importedCharacter = {
      Skills: {
        Ausbildung: {
          Korperlich: {
            Athletik: 2
          }
        }
      },
      Attribute: {
        Basiswert: {
          Beweglichkeit: 70
        }
      },
      inventory: {
        items: [
          {
            name: 'Boots',
            quantity: '1',
            description: 'Old boots',
            skillNotes: [
              { skill: 'Athletik', note: 'Old note', numericalBonus: 1 }
            ]
          }
        ]
      }
    };

    setupInventoryFeature(vi.fn(), (s) => String(s));
    document.getElementById('inventoryFeature').click();

    const editItemButton = document.querySelector('#inventoryContent .btn-secondary');
    editItemButton.click();

    const editSkillButton = document.querySelector('#itemSkillList .btn-secondary');
    editSkillButton.click();

    expect(document.getElementById('itemSkillSelect').value).toBe('Ausbildung > Korperlich > Athletik');
  });
});
