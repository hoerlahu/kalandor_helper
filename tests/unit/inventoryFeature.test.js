import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupInventoryFeature } from '../../inventoryFeature.js';

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
});
