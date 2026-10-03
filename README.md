# Dreoarcana

A game system for [Foundry Virtual Tabletop](https://foundryvtt.com/), built on the Foundry VTT Mythras system.

## Installation

In Foundry, go to **Game Systems → Install System** and paste this manifest URL:

```
https://github.com/Ramilleus/Dreoarcana/releases/latest/download/system.json
```

## Development

The source must be compiled before Foundry can load it. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup.

```
npm install
npm run build
```

## Releasing

Publish a GitHub release with a tag like `v0.2.0`. The release workflow builds the system and attaches `system.json` and `dreoarcana.zip` to the release.

## Credits

Based on the [Foundry VTT Mythras system](https://gitlab.com/kp-systems/mythras) by Jonathan Karkour, Tom Paoloni and contributors, used under the MIT License (see [LICENSE](LICENSE)).

This product references the Mythras Imperative rules, available from The Design Mechanism at www.thedesignmechanism.com and all associated logos and trademarks are copyrights of The Design Mechanism. Used with permission. The Design Mechanism makes no representation or warranty as to the quality, viability, or suitability for purpose of this product.
