This is a tool for the game system Kalandor.

<h1>How to use:</h1>
<ol>
<li>create a character with your DM</li>
<li>fill out the character sheet</li>
<li>make a photo of your character sheet</li>
<li>make an AI turn it into JSON format, that matches the provided JSON schema in the example files folder</li>
<li>import your character into the tool</li>
<li>have fun</li>
</ol>

<<<<<<< HEAD
## Testing

The project now includes:

- Unit/integration tests with `Vitest` + `jsdom`
- Schema contract tests with `Ajv`
- End-to-end smoke test with `Playwright`

### Prerequisites

- Node.js 20+ (includes `npm`)

### Install dependencies

```bash
npm install
```

### Run unit/integration/schema tests

```bash
npm run test
```

### Run e2e tests

```bash
npm run test:e2e
```
=======
<h2>Items:</h2>
Click on the inventory Button to open the inventory panel.

items can affect your rolls, so they might come in handy to track what you actually want to roll.

name: give your item a name, maybe generic, maybe it is actually named
quantity: how much of that item do you have?
rolls: select what roll the item will affect and leave a note of what the effect is
description: describe your item if you like, maybe you want to leave some notes here

press the Add button and it should appear on your character.

if you make changes here, it is possible to export your character and to keep the items you created.

<h2>What to Roll</h2>
Lets be honest... knowing what to roll and what affects your roll is hard. Thats why i decided to create the tool in the first place.

select what you want to roll in the cascading options. Those are based off of your character sheet.

Because the rules of the system are hyper flexible we sometimes roll with odd base attributes. So we just show them all and you (well the DM...) need to choose the specific one that is used for this roll. Once you know the attribute open the collapsable item and see how the roll is being calculated. Items that affect your base attribute or the skill itself should show up witht the corresponding notes you made to remind you what modifiers apply to this roll.
>>>>>>> 5a706e2eede61ecc1f15d3218459dbd3fab82617
