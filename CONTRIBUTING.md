# Contributing

All Contributions are welcome. Follow the steps below to set up a development environment.

## Setup

To create a local distribution of the system that Foundry can use, do the following:

1. Clone the repo into a local folder `git clone https://gitlab.com/kp-systems/mythras.git`
2. Install dependencies with `npm install`
3. Configure a `foundryconfig.json` file in the project root folder. An example can be found in `foundryconfig.example.json`.
   - `dataPath` is the location of your FoundryVTT user data. By default Foundry creates this folder at `C:\Users\<user>\AppData\Local\FoundryVTT`.
   - `foundryUri` is the uri that the foundry server runs at locally. Its unlikely that you'll need to change this.
4. For a single build, run `npm run build`. Run `npm run build:dev` to make webpack continuously watch for changes that you make to the system.

## Architecture

starting point of the module is in `src/myhtras.ts` and most registrations of actors
and settings are in `src/scripts/hooks/init.ts`.
For new actor types, sheets and settings look there.

### Actors

Actors inherit from base foundry type and should use `ActorSheetBase` as super class.

There is exists `CreatureSheetMythras` for all general creatures and `CharacterSheetMythras`
as base for all NPC and player characters.

### Items

Most things in Mythras are represented as foundry `Items` and often share sheet classes.
See here `ItemSheetClassRegistry#registerSheetClasses` for item sheet registration and which base
classes are shared.

`ItemSheetBase` is the Mythras base extension of foundry type `ItemSheet` and all other sheets should extend it.
Here is also the Handlebars template lookup for the various item types.

There are several extensions of this base class for spells, skills and physical items

### Themes

Mythras has a many play themes or expansion books. To avoid many individual systems for foundry,
they can be added here. Ingame there is a foundry theme setting with a dropdown.
See `src/module/apps/theme-settings` for a starting point to add themes.

### Templates

Handlebars files are used as a template engine. helper scripts are registered here:
`src/scripts/handlebars.ts`