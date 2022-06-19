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
