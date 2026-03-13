# Kalandor Character Manager

A browser-based helper tool for the Kalandor game system.

## How To Use

1. Create a character with your DM.
2. Fill out your character sheet.
3. Convert the sheet into JSON that matches the schema in ExampleFiles/sample-character.schema.json.
4. Import your character JSON into the app.
5. Use the roll and inventory tools during play.

## Features

### Inventory

Use the Inventory feature to manage equipment and notes:

- Name: item name.
- Quantity: how many you carry.
- Skill note: choose an affected skill and add a modifier note.
- Description: optional free-form details.

Added items are stored in the imported character under inventory.items and are preserved when exporting.

### What To Roll

Use the What do I roll flow to inspect how roll values are computed:

- Select from cascading skill options.
- Expand calculated attribute rows to inspect each component.
- View matching item notes that affect the selected skill or base attribute.

## Testing

### Prerequisites

- Node.js 20+

### Install

```bash
npm install
```

### Run unit and schema tests

```bash
npm run test
```

### Run e2e tests

```bash
npm run test:e2e
```
