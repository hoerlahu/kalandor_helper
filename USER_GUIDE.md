# Kalandor Character Manager – User Guide

## Feature Guide

### Character Creation

Use **Character Creation** when you want to start from scratch.

How to use:
1. Click **Character Creation**.
2. Fill in **Allgemein** fields (Name, Spezies, etc.).
3. Set **Attribute** values for:
   - `Basiswert`
   - `Punkte`
4. Fill **Skills - Ausbildung** values per category:
   - `Körperlich`
   - `Kampf`
   - `Sozial`
   - `Bildung`
5. Fill **Skills - Disziplinen** key/value rows.
6. Click **Create Character**.

Result:
- The character object is created in memory.
- You can immediately use **Inventory**, **What do I roll?**, and **Export JSON**.

---

### Import JSON

Use **Import JSON** when you already have a character file.

How to use:
1. Click **Import JSON**.
2. Select a `.json` file.
3. The file is parsed and stored as active character data.

Notes:
- In debug mode, imported content is shown in detail.
- Without debug mode, a success message is shown.

---

### Export JSON

Use **Export JSON** to save your current active character.

How to use:
1. Ensure a character is loaded or created.
2. Click **Export JSON**.

Result:
- A JSON file is downloaded.
- File name pattern: `YYYY_MM_DD CharacterName.json`.

---

### Inventory

Use **Inventory** to add and manage items and roll-related notes.

How to use:
1. Click **Inventory**.
2. Add item fields:
   - Name
   - Quantity
   - Description
3. Optionally add skill notes:
   - Select a skill or attribute that will be influenced
   - Enter a note
   - Click **Add Skill**
4. Click **Add** to persist the item.

Additional actions:
- **Edit** existing items
- **Delete** existing items
- **Close** panel

Result:
- Data is stored on the active character.

---

### What do I roll?

Use **What do I roll?** to inspect roll calculation inputs.

How to use:
1. Click **What do I roll?**.
2. Select skill path levels from the cascading selectors.
3. Inspect generated roll details.

The panel shows:
- basis values,
- multipliers,
- computed total,
- matching inventory notes for relevant skills/attributes.

---

### Learn More

The **Learn More** button loads and displays this guide directly in the app.
