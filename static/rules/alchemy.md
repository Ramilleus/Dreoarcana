# Mythras Alchemy System — Alchemis Conversion

*Converted from Ramilleus's Material System (5e-style ingredient/potion sheet) into native Mythras mechanics, for use in the Alchemis campaign.*

## 1. Overview & design assumptions

The original sheet ran on d20 logic: a Workability **DC**, a 1–6 ingredient **Strength**, dice-pool effect magnitudes (1d4–1d20), and a 7-band Potion **Class** (Trash → Superior). Mythras is d100-under-skill with its own success ladder (Fumble / Failure / Success / Critical — Mythras p.37) and Opposed Rolls (p.50), so this conversion doesn't relabel the old math — it re-derives the same *shape* (six ingredient tiers, a skill test, a quality-banded result, a toxicity subsystem) using Mythras' own tools:

| Original concept | Mythras replacement |
|---|---|
| Ingredient **Strength** (1–6) | **Potency** (1–6, unchanged) — still the ingredient's core rating |
| Workability **DC** (10–22) | **Difficulty Modifier** on the Craft (Alchemy) roll, one step per Potency tier |
| d4–d20 effect dice | Formulas scaled directly off Potency (see §6) |
| Potion **Class** (Trash…Superior, 7 bands) | Mythras' native 5 success tiers, with an optional 7-band variant (§5) |
| Toxin Score / Overdose thresholds | Melfyrium saturation — raw Orie dose vs. SIZ capacity, then an opposed roll against Endurance (§8) |
| Potion **Size** (Tiny…Gargantuan) | **The container you brew into.** Its capacity in charges *is* the dose count, which divides the Orie pool and so sets each dose's Potency (§9) |
| *(no equivalent)* | **New:** potion classes — Mechanical / Mystical / Mundane (§3a), Mothers as the base liquid (§3b), and Mechanical volatility & dermal absorption (§7) |

**Assumption I made:** each ingredient's individual Workability value in the original sheet drifts a little from its tier's default DC (e.g., a Potency-1 ingredient sometimes lists DC 15 instead of 10). I collapsed that noise and assign the Difficulty Modifier purely from Potency, tier-by-tier. This keeps the system a clean formula instead of 96 one-off exceptions — flag any ingredient to me if you want its original DC quirk preserved instead.

## 2. The Craft (Alchemy) skill

Add **Craft (Alchemy)** as a Professional Skill (Mythras' Craft skills default to 0% and are bought with career/skill points). Suggested base formula: **DEX + INT**, matching Mythras' other Craft skills.

Optional specialization: a character who bought Craft (Alchemy) can further specialize the same way Mythras handles other Crafts (e.g., "Craft (Alchemy: Potions)" vs "Craft (Alchemy: Poisons)") if you want brewers and poisoners to diverge mechanically — not required for this conversion to work.

## 3. Potency: Grade, Condition, and Melfyrium content

**Potency measures concentration** — how much active substance is packed into this particular sample. For Mechanical work that substance is Melfyrium; for Mundane work it's ordinary active compounds. Same 1–6 scale, different substance, and the distinction matters (see "Melfyrium content," below).

Effective Potency is built from two parts:

> **Potency = Grade + Condition** (clamped to 1–6)

### Grade (1–6) — intrinsic to the ingredient type

What this *kind* of thing is worth at its best. Unicorn Horn is Grade 6; a copper coin is Grade 1. This is the fixed number in the ingredient table (§10) and never changes for a given ingredient.

### Condition (−1 / 0 / +1) — specific to this sample

What's happened to *this* specimen since harvest. This is where the old "State" names finally earn their keep — previously they were flavour text attached to a number that never moved.

| Condition | State names | Modifier | Typical cause |
|---|---|---|---|
| Degraded | Old, Stale | −1 | Age, heat, sunlight, careless harvest, poor storage |
| Sound | Standard, Fresh | +0 | Normal harvest and storage — the default |
| Enhanced | Excellent, Concentrated, Pure | +1 | Expert harvesting, proper preservation, or deliberate concentration (reduction, distillation, drying) |

Raising Condition is a **Craft (Alchemy)** task in its own right — Standard difficulty, hours of work and proper equipment; a Fumble ruins the sample. This gives harvesting and preservation something real to do: a Grade 3 ingredient in Enhanced condition outperforms a Grade 4 left to rot in a pack.

### Melfyrium content (Mechanical only)

Canon fixes **1 mL of Melfyrium = 1 Orie**, so Potency converts directly into an Orie figure:

> **Orie per dose = Potency²**

| Potency | Orie per dose | Melfyrium volume | Added mass @ 100 g/mL |
|---|---|---|---|
| 1 | 1 | 1 mL | 100 g |
| 2 | 4 | 4 mL | 400 g |
| 3 | 9 | 9 mL | 900 g |
| 4 | 16 | 16 mL | 1.6 kg |
| 5 | 25 | 25 mL | 2.5 kg |
| 6 | 36 | 36 mL | 3.6 kg |

The square is deliberate: it puts Potency 1–3 comfortably *below* a typical humanoid's saturation capacity (SIZ 10–16, per §8) and Potency 4–6 *above* it — so the same threshold that governs volatility and dermal absorption (§7) also governs when a dose becomes dangerous to drink. One line, three consequences.

**A useful side effect:** Melfyrium's absurd density makes Mechanical potions *noticeably heavy for their size* — a Potency 6 dose carries 3.6 kg in a vial you can close your hand around. Hefting an unlabelled potion is a genuine, non-magical way to tell a Mechanical brew from a Mystical or Mundane one, and to estimate its Potency. Alchemists' scales are a real tool of the trade, and Alchemis Dwarves (who sense Melfyrium in ore directly) can do it by feel.

Mundane and Mystical potions have **no Orie content at all**, whatever their Potency — theirs measures ordinary active compounds or Resonance respectively. They never trigger §7, and §8 applies to them only as ordinary poison.

### Adding Xi: channelling through the Crystalline Core

A caster can raise a batch's Potency directly, converting Orie to Xi through their own Crystalline Core and channelling it into the mixture — the same Orie→ξ conversion described in `01 - Magic/01 - Mechanical Casting.md`, aimed at a cauldron instead of a spell.

- **Cost:** each +1 Potency step costs Orie equal to the *difference in Orie content* between the two steps — Potency 3→4 costs 16 − 9 = **7 Orie**. (1 Orie = 1 Xi in perfect conversion, so the ledger stays honest.)
- **Heat:** channelling follows the same rule as a spell. Xi drawn from the brewer's **Stored Orie** makes no Heat; whatever Stored Orie can't cover is converted on the spot, and the brewer takes the Heat (house rule: Heat = Œ^1.3 for the converted part — a brew has no node Complexity, so it is taken as 6). Pushing a batch to Potency 6 from an empty reservoir is how alchemists cook themselves.
- **Ceiling:** Potency 6 is the practical maximum. Beyond it the mixture won't hold the charge — it discharges immediately as a Potency 6 detonation (§7).
- **It makes the potion Mechanical**, even if every ingredient was Mundane. Channelling Xi into a willow-bark tincture produces a genuinely magical analgesic — and a volatile one, if pushed past Potency 3.

**Refined vs. raw — the consequence that matters.** Xi is *converted* energy: it carries none of raw Melfyrium's mass and doesn't sit in tissue waiting to poison the drinker. So a potion that reaches Potency 5 by **channelling** differs meaningfully from one that reaches Potency 5 by being **packed with Melfyrium-rich ingredients**:

| | Raw (Orie-charged) | Refined (Xi-channelled) |
|---|---|---|
| Source of Potency | Melfyrium-rich ingredients | Caster's Crystalline Core |
| Mass | Heavy (Potency² × 100 g) | Normal for a liquid |
| Saturation risk (§8) | Full — its whole Orie content counts | **Only the ingredient-derived portion counts** |
| Volatility (§7) | Yes, at Potency 4+ | Yes, at Potency 4+ — converted charge is no more stable |
| Requires | Ingredients and skill | Ingredients, skill, *and a caster* |

This is the mechanical expression of canon's "like oil before distillation" line: refined potions are safer to drink and lighter to carry, but cost a caster's Magic Points and Heat to make. It's also why Mechanical alchemy and spellcasting tend to be the same profession — the best potions need a Core.

### Difficulty from Potency

The batch's effective Potency sets the Difficulty Grade for the brewing roll:

| Potency | Craft (Alchemy) Modifier |
|---|---|
| 1 | Very Easy (+40%) |
| 2 | Easy (+20%) |
| 3 | Standard (+0%) |
| 4 | Hard (−20%) |
| 5 | Formidable (−40%) |
| 6 | Herculean (−80%) |

These are Mythras' own Difficulty Grades in their **simplified** form — flat percentages, which the rulebook offers as an alternative to its multipliers (Skills, p.38) — used as written, with no invented tiers. (Hopeless, −100%, is deliberately unused: it would make Pure-grade work impossible rather than merely punishing.)

When a recipe combines multiple ingredients (see §4), use the **highest Potency among them** to set the modifier — a single Pure-grade component makes the whole batch as demanding as that component, same as the source sheet's implicit design (harder ingredients don't get easier just because you added filler).

**Rarity** (Common → Mythic) is left untouched as setting/loot-table flavor. If you want it to matter mechanically, use it as the Difficulty Modifier for a **Lore (Alchemy)** or **Lore (Natural World)** roll to *identify* an unfamiliar ingredient in the field, on the same six-step ladder as above (Common = Very Easy, up through Mythic = Herculean).

## 3a. The three kinds of potion

Not every potion is magical, and the distinction matters mechanically — it decides whether §7 (Volatility & Absorption) applies at all.

| Class | What it is | Volatile? | Skin-absorbable? | Toxicity (§8) |
|---|---|---|---|---|
| **Mechanical** | Made with raw Orie, converted Xi, or with Xi channeled into it during brewing. The default for anything using Melfyrium-touched ingredients. | **Only at Potency 4+** | **Only at Potency 4+** | Yes — full Orie/SIZ rules |
| **Mystical** | Divine or spirit-derived: consecrated water, relics, pact-granted blessings, ingredients carrying Resonance rather than Melfyrium. Draws on meaning and belief, not energy conversion. | No | No | Only if the ingredients are independently toxic |
| **Mundane** | Ordinary pharmacology — willow-bark analgesics, poultices, antiseptics, poisons, narcotics. No magic of any kind. | No | No | Only ordinary poison rules |

**How to tell which you're brewing:** the **Mother decides** where it has a Class of its own (§3b) — Holy Water makes a brew Mystical, Fey Dew makes it Mechanical. With a neutral Mother, the reagents decide: if any carries Melfyrium, or the brewer channels Xi into the mixture, it's **Mechanical**; if the active component is consecrated, spirit-touched, or pact-derived, it's **Mystical**; otherwise **Mundane**, behaving like real-world medicine — no volatility, no dermal risk, no saturation.

This is why a village herbalist can safely hand out fever-draughts while a Mechanical alchemist works behind a blast screen — though note that even Mechanical alchemy is only genuinely dangerous at the top of the Potency range (§7); ordinary low-grade Mechanical work is unremarkable to handle. **Mundane potions can still be excellent** — a Mundane painkiller or antitoxin is perfectly effective at what it does. What Mundane brewing *can't* do is produce effects with no physical mechanism (Waterbreathing, Detect Undead, Light, Petrify); those require a Mechanical or Mystical source. Use the effect glossary in §6 to judge: anything marked ξ requires magic.

## 3b. Mothers: the liquid you brew into

A **Mother** is the solvent — the liquid a potion is actually made *of*. The term is borrowed from real practice, where a mother of vinegar or a mother tincture is the living base a preparation grows from. Reagents are what you dissolve into it.

Every brew needs **exactly one Mother**, and it sits **outside** the 2–3 reagent limit. You are always choosing a liquid *and* things to put in it.

This is why `Mother - Water (Clean)` has no effects at all: it isn't a weak ingredient, it's a neutral base that gets out of the way.

### The Mother sets the potion's Class

A Mother with a Class of its own imposes it on the whole brew, overriding the reagents (§3a). A neutral Mother defers to them.

| Mother | Class | What it means |
|---|---|---|
| Water (Holy) | **Mystical** | The way to make a divine potion, whatever else is in it |
| Fey Blood, Fey Dew, Ammonia, Blood | **Mechanical** | Carries Melfyrium — makes a magical potion from mundane herbs, with no caster needed |
| Water (Clean), Common Milk, the Alcohols | **Mundane** | Neutral: the reagents decide |

That makes §3a a *choice* rather than something you inherit. Holy Water is how a devout alchemist works; Fey Dew is how a hedge-witch with no Core makes something genuinely magical.

### Volume, and what boils off

A Mother's weight is its volume — at water's density a kilogram is a litre, which fills **twenty 50 mL doses**. Multiply by how many units you're carrying: three litres of Clean Water is sixty doses of capacity.

**The Mother caps the yield.** You cannot fill more doses than you had liquid for, however large the vessel or generous the Quality.

You open as many measures as the batch needs, and **whatever is left in the last one boils off** with the brew rather than going back in the bottle. Brewing five doses from a full litre spends the whole litre. Brewing twenty-one opens a second and wastes nineteen.

So batch size has a second consideration beyond concentration: **filling to a litre boundary is the efficient play**. A careless alchemist burns through their stores making small batches.

### The Mother is still an ingredient

Its own effects count toward overlap (§4) exactly like a reagent's, and if it's Mechanical it contributes its Grade² to the Orie pool (§3). Common Milk genuinely pairs with anti-poison reagents; Fey Blood brings Grade 4 of Melfyrium to the mixture before you add anything else.

It is spent at the *decant* step rather than at commitment, because how much liquid a batch needs isn't known until you decide how many doses to fill. The herbs are committed when you start; the liquid is measured as you pour.

## 4. Brewing procedure

Corrected from the first draft: this is a **Skyrim-style overlap system**, not a base-ingredient-plus-additions system. Each ingredient's four effect slots (Primary/Secondary/Tertiary/Quaternary) are just its *possible* effects — an effect only actually manifests in the finished potion if it's shared by **two or more** of the ingredients you combine, the Mother included. An effect that appears on only one ingredient contributes nothing (that ingredient's unique properties are wasted unless paired with something else that shares them).

1. **Choose a Mother** — the liquid you're brewing into (§3b). It sets the potion's Class, caps how many doses you can fill, and joins the overlap check as an ingredient in its own right.
2. **Combine 2 reagents** into it (2 is the baseline; up to 3 by default for an advanced alchemist, adjustable in the module settings). The Mother doesn't count toward this limit.
3. **Check for overlap.** Compare every effect tag across the Mother and the reagents together. Any tag that appears on **2 or more** of them manifests in the potion. Most combinations share only one or two tags, which is the point — finding good ones is the alchemist's skill.
4. **Total the batch's Orie pool** — Σ (each Mechanical ingredient's Grade², the Mother included), plus any Xi the brewer channels in (§3). This is the material you have to work with, and it doesn't grow later. **The reagents are spent at this moment** — a ruined batch still costs you the herbs.
5. **Roll Craft (Alchemy)**, at the Difficulty Grade for the *highest-Grade ingredient in the mix* (§3) — you're judged on the hardest thing you're handling. Add any lab/tool bonuses.
6. **Read Quality** off the table in §5: duration, magnitude multiplier, and the maximum number of portions you're allowed to split the batch into.
7. **Decant.** Choose a container. Its capacity in charges is the dose count, capped by both Quality's max portions and the Mother's remaining volume (§3b). This sets **Potency per dose = ⌊√(pool ÷ doses)⌋** (§9) — the trade between few strong doses and many weak ones. **The Mother is measured out here**, and any surplus in the last measure boils off.
8. **Apply the manifesting effects** using the formulas in §6 at the final per-dose Potency and Quality. Check §7 for volatility/absorption and §8 for saturation, both of which follow from that Potency.

**Optional — Discovery (§4a).** A character doesn't automatically know an unfamiliar ingredient's effects. Knowledge is tracked **per slot, per character**, so two people can know different things about the same herb. Three ways to learn one:

- **Taste it** — reveals the Primary at once, but you've swallowed it: the full undiluted dose counts against your SIZ (§8).
- **Study it** — a Lore (Alchemy) roll at the ingredient's Rarity difficulty (§3) reveals the next unknown slot; a critical reveals two.
- **Brew with it** — any effect that actually manifests in a potion reveals itself on every ingredient that contributed it.

This is a layer you can bolt on or leave off (it's a module setting); the overlap mechanic works either way.

## 5. Potion Quality (result of the Craft roll)

Quality sets two things: how long the effect lasts, and **how many doses you can divide the batch into** — a skilled alchemist extracts more usable portions from the same material.

**Default (5-tier, recommended):**

| Craft (Alchemy) result | Quality | Duration | Max portions | Magnitude multiplier |
|---|---|---|---|---|
| Fumble | Trash | — | — | Ruined; the batch is lost |
| Failure | Mundane | 1 Melee Round | 3 | ×1 Potency |
| Success | Good | 7 Melee Rounds | 9 | ×1.5 Potency (round down) |
| Special Success | Greater | 13 Melee Rounds | 15 | ×2 Potency |
| Critical Success | Superior | 16 Melee Rounds | 18 | ×3 Potency, and **every** effect on the combined ingredients manifests — not just the ones that overlapped |

**Optional 7-band variant**, matching the source sheet exactly: band a **successful** roll by how far under your skill you rolled (as a fraction of your skill %) — bottom third = **Basic** (4 rounds, 6 portions), middle third = **Good** (7/9), top third = **Fine** (10/12); Special = **Greater** (13/15); Critical = **Superior** (16/18). Failure (**Mundane**, 1/3) and Fumble (**Trash**) are unchanged.

**Reading the roll.** Mythras has no Special Success of its own (Skills, p.37: Critical, Success, Failure, Fumble). Here a success within **one fifth** of the target counts as Special, the convention this table was written from. Every other edge follows the rulebook: 01–05 always succeeds, 96–00 always fails, 99–00 fumbles (only 00 above 100%), and a Critical is a roll within one tenth of the target.

A Mythras Melee Round is **five seconds** (p.69), close to the original system's six-second round, so the Durations above carry over at about the same real-time pace.

**Durations on the table.** Every effect the glossary (§6) says lasts "for Duration" goes on the drinker as a timed effect and counts down in game time — five seconds a round, in combat or out. A few are unconditional and are applied to the sheet for you: **Fortify Self** and **Fortify Restoration** (Endurance), **Frenzy** (Combat Styles up; Evade and INT-based skills down), **Increase Intelligence** (INT-based skills) and **Speed** (+1 Action Point). The rest — wards against a named threat, courage against fear, senses — are shown with the time left and applied at the table. **Lucky** adds its Luck Points straight away.

## 6. Effect glossary

Effects are grouped by mechanical category. Look up an ingredient's effect tag(s) in the ingredient table (§10), then apply the formula here at the batch's final Potency and Quality (§5).

**ξ marks effects that require a magical source** (Mechanical or Mystical class, §3a) — there's no mundane pharmacology that produces them. Unmarked effects can be achieved Mundanely.

**A note on scaling.** Quality (§5) multiplies magnitude: ×1 Mundane, ×1.5 Good, ×2 Greater, ×3 Superior, rounded down with a floor of 1. **Magnitude** below means Potency × Quality — so a Potency 4 healing draught restores 4 HP at Mundane and 12 at Superior.

Three things deliberately *don't* scale with Quality, and it's worth knowing why:

- **Raw Orie doses** (the §8 saturation figures) are a physical quantity of Melfyrium. Better craft doesn't change how much substance is in the vial.
- **Action Points** are capped at +1 regardless. AP is the single most powerful currency in Mythras combat.
- **Binary abilities** — Waterbreathing, Cat's Eye, Foresight, Wild, Labor, Hair Growth, Midas Touch. You either can breathe water or you can't; a finer brew doesn't make it more true.

Mythras characters are fragile and their numbers small — 2–3 Action Points, 5–7 Hit Points *per location*, characteristics in the 3–18 band that quietly drive HP, Magic Points, Healing Rate, and skill bases. Effects below therefore avoid touching raw characteristics wherever a skill-percentage or flat-point bonus does the same narrative job.

| Category | Effect tags | Mythras mechanic |
|---|---|---|
| **Ward (specific)** | Resist Acid/Disease/Exhaustion/Fire/Frost/Lightning/Necrotic/Petrify/Poison/Radiant | +(Magnitude × 10)% to Endurance, Willpower, or the relevant Resistance Roll against that specific threat, for Duration |
| **Ward (minor)** | Aversion to Fire/Frost/Lightning/Necrotic/Poison/Radiant | As above but single-use: applies to one specific instance of that threat, then expires |
| **General resilience** | Fortify Self, Fortify Restoration | +(Magnitude × 10)% to Endurance rolls, for Duration. *Not* a CON increase — raw CON drives HP and Healing Rate, and shouldn't yo-yo mid-scene |
| **Utility** ξ | Waterbreathing | Breathe water freely for Duration. Binary — does not scale |
| **Instant healing** | Restore Health | Heals **Magnitude** HP to one damaged hit location (player's choice), to that location's normal total. Does not restore a location below 0 (see Mythras' Serious/Major Wound rules) unless Potency ≥ 5 |
| **Healing over time** | Regenerate Health | Heals 1 HP per Melee Round to one damaged location, to a maximum of **Magnitude** HP across the effect |
| **Cure** | Cure Disease, Cure Poison | Opposed roll: potion POT = **Magnitude × 10** vs. the affliction's own POT. Success ends it; failure still reduces its POT by Magnitude |
| **Detox** | Lower Toxicity | Reduces an active toxin's effective POT by **Magnitude × 2** |
| **Resource restore** ξ | Restore Melfyrium | Restores **Magnitude** Stored Orie (Dreoarcana's name for Magic Points), up to the drinker's normal maximum. *Listed as "Restore Malferia" in the original spreadsheet — the superseded name for Melfyrium.* **Caution:** restoring raw Orie counts toward the drinker's saturation capacity (§8) — topping off a nearly-saturated caster is how alchemists poison themselves |
| **Toxic/damaging** | Poison, Toxicity, Disease, Nausea | Opposed POT = **Magnitude × 10**. Separately, the dose delivers **Potency² raw Orie** against SIZ (§8) — that figure is physical and does *not* scale with Quality |
| | Acid, Damage Health | **Magnitude** damage to a hit location, plus the same Potency² raw Orie (§8) |
| | Drain Intelligence, Drain Max HP | Drains **Magnitude** points on a failed Resistance Roll, plus Potency² raw Orie (§8) |
| | Explode | Volatile at any Potency; detonates one step above it (§7). Keyed to the blast table, so it doesn't scale with Quality |
| | Petrify, Cursed (inflicted) | Resistance Roll vs. POT **Magnitude × 10** |
| **Speed/tempo** ξ | Speed | +1 Action Point for Duration, and only at Potency ≥ 4. Never stacks past +1, and does not scale with Quality |
| | Slow | Target Resists (Endurance vs. POT **Magnitude × 10**) or loses 1 Action Point for Duration |
| **Combat state** | Frenzy | +(Magnitude × 10)% to Combat Style, −(Magnitude × 10)% to Evade and to all INT-based skills, for Duration. The drinker may not voluntarily disengage while it lasts |
| | Wild ξ | The GM rolls a random Special Effect on each of the drinker's successful attacks, instead of the player choosing. Binary — does not scale |
| | Liquid Courage | +(Magnitude × 10)% to Willpower against fear, intimidation, and despair, for Duration |
| | Fear ξ | Target Resists (Willpower vs. POT **Magnitude × 10**) or must flee, or is frozen if unable to flee, for Duration |
| **Luck** ξ | Lucky | Grants 1 additional Luck Point for the scene (2 at Potency ≥ 5), above the drinker's normal maximum. Unspent bonus points vanish at scene's end. Tiered by Potency, not Quality |
| **Labor/endurance** | Labor | Removes one level of Fatigue immediately, and delays the next by Duration. Binary — does not scale |
| **Senses** ξ | Cat's Eye | See normally in dim light, and treat total darkness as dim, for Duration. Binary — does not scale |
| ξ | Light, Darkness | Creates light (or quenches it) in a radius of **Magnitude × 2** metres, for Duration |
| ξ | Detect Life, Detect Undead | Sense the presence and rough direction of the named category within **Magnitude × 10** metres, through obstacles, for Duration |
| ξ | Foresight | Once, before Duration expires, reroll one failed roll or force one enemy to reroll a success. Binary — does not scale |
| **Divine/undead** ξ | Holy, Damage Undead | POT **Magnitude × 10** against undead and similar entities only; harmless to the living |
| **Mental** ξ | Increase Intelligence | +(Magnitude × 5)% to all INT-based skills for Duration. *Not* a raw INT increase — INT drives Magic Points and several skill bases and shouldn't fluctuate |
| **Flavor only** | Hair Growth, Midas Touch | No mechanical effect — cosmetic and roleplay hooks. (Midas Touch gilds a small object's surface; genuinely useless for anything but fraud) |
| **Empty slot** | Null | No effect — this slot simply isn't used on this ingredient |

## 6a. Slot order: raw potency and falloff

An ingredient's four effect slots are **ordered by strength**, not arbitrary. The Primary is what that ingredient fundamentally *is*; the later slots are progressively fainter properties that only proper alchemy can coax out.

> **Effect Potency = batch Potency − slot index**
> (Primary −0, Secondary −1, Tertiary −2, Quaternary −3)

An effect reduced below Potency 1 doesn't manifest at all — so a Quaternary effect needs a batch of at least Potency 4 to appear, and a weak brew simply can't reach an ingredient's subtler properties. This gives high-Potency brewing a second reason to exist beyond raw magnitude: **it unlocks depth, not just strength.**

### Eating it raw

Consume an ingredient without brewing and **only its Primary effect manifests — at the ingredient's own full Potency**, undiminished. Raw consumption is the most potent single-effect delivery in the system.

The trade-offs are severe, and they're what make brewing worth the trouble:

- **One effect only.** No overlap, no combination, no stacking — whatever sits in the Primary slot, and nothing else.
- **No Quality multiplier.** There's no Craft roll, so no ×1.5/×2/×3 magnitude and no extended duration; assume the briefest duration on the §5 table.
- **Full raw saturation.** For a Mechanical ingredient the drinker takes the *entire* undiluted Orie load (Potency²) against their SIZ capacity (§8). Nothing has been refined, diluted, or split into doses.
- **No portioning.** One ingredient, one use.

This is the desperate option — a wounded character swallowing a Grade 5 Heartberry whole for its Primary heal, and risking Melfyrium poisoning to get it. It's also how most people on Alchemis who aren't alchemists actually use ingredients.

### Slots when ingredients overlap

When an effect appears on more than one combined ingredient, use the **best (earliest) slot** any contributor offers it. A Primary source effectively carries a weaker partner: if Heartberry lists Regenerate Health as Primary and Tree Root lists it as Tertiary, the pair produces it at Primary strength.

That gives ingredient selection a second axis beyond "do these share an effect at all" — *where* they share it matters just as much.


## 7. Volatility & dermal absorption (Mechanical potions only)

**Applies only to Mechanically magical potions** (§3a) — those made with raw Orie, converted Xi, or with Xi channelled in during brewing. Mystical and Mundane potions are inert in both respects: a consecrated healing draught or a willow-bark tincture can be dropped, thrown, or spilled on skin with no more consequence than the mess.

The reason is the same canon that drives everything else here: raw Melfyrium is unstable, seeps readily into organic material, and doesn't belong in this world. A Mechanical potion is a container of barely-restrained planar energy — the more Potent, the less restrained.

### Volatility

Only **high-Potency** Mechanical potions are volatile. Below Potency 4, a broken vial is just a wasted dose and a stain — there isn't enough concentrated Orie in it to discharge dangerously. Volatility begins at the same threshold as dermal absorption (below), which is the point where the mixture stops behaving like a liquid carrying magic and starts behaving like restrained planar energy.

At Potency 4+, a Mechanical potion detonates if its container is broken, struck hard, or exposed to open flame:

| Batch Potency | Blast damage | Radius | Notes |
|---|---|---|---|
| 1–3 | — | — | **Not volatile.** Spills and is wasted; no blast |
| 4 | 1d6 | 2 m | A sharp prismatic crack; ignites flammables |
| 5 | 2d6 | 4 m | Leaves a lingering Flux disturbance for minutes |
| 6 | 4d6 | 8 m | Blast plus a brief, genuine Flux zone (GM's call on duration) |

Damage strikes a random hit location per Mythras' standard rules, and is **not** reduced by Armour Points at Potency 5+ — planar discharge at that concentration doesn't care about plate. If a character is struck in a location carrying Potency 4+ potions, the GM may rule they go off; a Luck Point spent to Cheat Fate (Mythras p.81) can avoid it.

**Deliberate use.** Alchemists have obviously noticed this. A Potency 4+ potion thrown as an improvised grenade uses the same table — Combat Style (Thrown) or Athletics to hit.

**Mitigation.** Purpose-built cases — padded, lead-lined, or gel-suspended — are standard equipment for anyone carrying Potency 4+ regularly, and reduce blast damage by one step. Their expense is a decent reason a party can only carry so many high-grade potions at once.

### Dermal absorption

At higher Potency, a Mechanical potion doesn't need to be swallowed — it soaks straight through skin, exactly as canon says raw Melfyrium soaks into organic material.

| Batch Potency | Absorption on skin contact |
|---|---|
| 1–3 | None — must be ingested to have any effect |
| 4 | Partial: half the batch's effects manifest, at half Duration |
| 5 | Full effect, delayed by 1d3 Melee Rounds |
| 6 | Full effect, immediate |

This cuts both ways, and both are worth playing:

- **As a delivery method** — a Potency 5–6 healing draught can be poured over an unconscious or convulsing patient who can't swallow. Smeared on a blade, an offensive potion becomes a contact poison.
- **As a hazard** — an alchemist who spills a Potency 6 batch on bare hands has *taken the full dose*, whether they wanted it or not, and immediately owes a saturation check (§8). Gloves and sealed vessels aren't set dressing for Mechanical alchemy; they're why the alchemist is still alive.

Skin contact delivers the **full raw Orie load** for §8 purposes — absorption bypasses the digestive dilution that makes drinking marginally safer, so use the undiluted dose when checking against SIZ.

## 8. Toxicity, poison & overdose

This section now follows Dreoarcana's own canon mechanism directly, rather than a generic reskin: raw Melfyrium is safely tolerated at **1 mL (= 1 Orie) per 3.8 L (1 gallon) of body water**, and a baseline human (~42 L / ~11.1 gal of body water) has a safe threshold of about **11 Orie**. Two Mythras characteristics do two different jobs here, matching two different questions the canon rule is actually asking:

- **SIZ answers "does this body have the capacity to safely absorb this dose?"** — SIZ is derived from height+weight, which is exactly what "gallons of body water" is standing in for. A baseline human's SIZ (Mythras average ~13) lines up closely with the ~11 Orie canon threshold, so no conversion factor is needed: **use the target's SIZ score directly as their safe Orie capacity.**
- **CON answers "how badly does it go once that capacity is exceeded?"** — CON is general hardiness, not size, which is the right stat for *how well the target copes* with a toxic load it couldn't dilute.

**Resolution:**

1. A brewed potion (or ingredient used raw) has a raw dose of **Orie = Potency²** (§3). For a **refined** (Xi-channelled) potion, count only the ingredient-derived portion — the channelled Xi contributes no raw Orie.
2. **Capacity check:** if that dose ≤ the target's SIZ, it's absorbed safely — no roll, no risk.
3. **Resistance roll** (only if the dose exceeds SIZ): as for any Mythras poison (Disease and Poison, p.74), the dose's Potency is set against the target's **Endurance** in an Opposed Roll (p.50) — the better level of success wins, and on equal levels the higher roll still within its skill. The *excess* (dose − SIZ) sets that Potency at **5% per point over** (house scale; the canon names no factor). Stage a loss by the Differential Roll's levels of success (p.51):
   - **The target wins, or both fail:** no effect.
   - **The dose wins by one level** (or on equal levels): Minor overdose — nausea, −10% to physical skills for 1d6 Melee Rounds.
   - **By two levels:** Moderate overdose — −20%, plus the **Nausea** condition (p.75) until treated.
   - **By three levels, or the dose rolls a Critical:** Severe overdose — Potency points drained from the relevant characteristic, and Nausea until treated.
4. Repeated doses in a short period should stack the effective Orie total against the same SIZ capacity, rather than each dose being checked independently.

   **On the table (house rule — the canon doesn't say how short "a short period" is):** the raw Orie a body carries is tracked, and every new dose — drunk, eaten raw, or tasted — is added to it before the check. The body clears its **Healing Rate** in raw Orie every **hour** of game time (a setting can make it per day, or only on rest). The Laboratory shows it as *Saturation* beside the character's SIZ.

A bigger creature can shrug off a dose that would badly poison something Halfling-sized, purely from having more SIZ to dilute it in — matching the canon note that the safe threshold "vari[es] with mass and adaptation." Two creatures of equal SIZ but different CON still diverge in how rough an overdose feels once capacity is exceeded.

## 9. Batch size, concentration & yield

Size is no longer a free choice — it trades directly against Potency. This is what makes Potency mean "concentration" (§3) rather than a number conjured from nowhere: **the Orie in a batch is conserved**, so spreading it across more doses makes each one weaker.

### Containers

One **charge** = **50 mL** = one dose. Container capacity sets the ceiling on how many doses a batch can be decanted into:

| Size | Volume | Charges | Cost |
|---|---|---|---|
| Tiny | 50 mL | 1 | 1 gp |
| Small | 100 mL | 2 | 2 gp |
| Standard | 250 mL | 5 | 5 gp |
| Medium | 500 mL | 10 | 10 gp |
| Large | 750 mL | 15 | 15 gp |
| Huge | 1000 mL | 20 | 20 gp |
| Gargantuan | 5000 mL | 100 | 100 gp |

Cost is for the vessel and consumables, not the ingredients — those are spent regardless.

### The concentration formula

> **Batch Orie pool** = Σ (each Mechanical ingredient's Grade², the Mother included) + any Xi channelled in (§3)
>
> **Doses** = min(container charges, Quality's max portions, the Mother's remaining volume)
>
> **Potency per dose** = ⌊√(pool ÷ doses)⌋

The container is not a separate cost from the yield — it *is* the yield. One charge is 50 mL is one dose is one drink. So the alchemist's real decision is **which vessel to decant into**: a Tiny vial concentrates the whole batch into a single powerful dose, a Standard flask spreads it across five weaker ones. Quality caps how finely the batch can be divided at all, and the Mother caps it by sheer volume (§3b) — so a clumsy brewer wastes material they can't split, and a poorly-supplied one can't fill the vessel they've got.

### Concentration lookup table

So nobody has to compute square roots mid-session. Find your pool on the left, your chosen dose count along the top; the cell is the Potency of every dose. **X** means that split is impossible (see "The physical ceiling," below); **–** means the pool is too small to fill that many doses at all.

| pool \ doses | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 15 | 18 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **2** | 1 | 1 | – | – | – | – | – | – | – | – | – |
| **4** | 2 | 1 | 1 | 1 | – | – | – | – | – | – | – |
| **8** | 2 | 2 | 1 | 1 | 1 | 1 | 1 | – | – | – | – |
| **12** | 3 | 2 | 2 | 1 | 1 | 1 | 1 | 1 | 1 | – | – |
| **18** | 4 | 3 | 2 | 2 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| **25** | 5 | 3 | 2 | 2 | 2 | 2 | 1 | 1 | 1 | 1 | 1 |
| **32** | 5 | 4 | 3 | 2 | 2 | 2 | 2 | 1 | 1 | 1 | 1 |
| **40** | 6 | 4 | 3 | 3 | 2 | 2 | 2 | 2 | 1 | 1 | 1 |
| **50** | 7 | 5 | 4 | 3 | 3 | 2 | 2 | 2 | 2 | 1 | 1 |
| **61** | 7 | 5 | 4 | 3 | 3 | 3 | 2 | 2 | 2 | 2 | 1 |
| **72** | X | 6 | 4 | 4 | 3 | 3 | 3 | 2 | 2 | 2 | 2 |
| **90** | X | 6 | 5 | 4 | 4 | 3 | 3 | 3 | 2 | 2 | 2 |
| **108** | X | 7 | 6 | 5 | 4 | 4 | 3 | 3 | 3 | 2 | 2 |
| **144** | X | X | 6 | 6 | 5 | 4 | 4 | 3 | 3 | 3 | 2 |

For a pool between listed rows, round down to the row below — or take the square root if you'd rather be exact.

### The physical ceiling, and Potency 7

The cap isn't arbitrary. A dose is 50 mL, and Potency² is the *millilitres of Melfyrium in that dose* — so Potency is literally a measure of how much of the vial is Melfyrium:

| Potency | Melfyrium per 50 mL dose | Share of the vial |
|---|---|---|
| 4 | 16 mL | 32% |
| 5 | 25 mL | 50% |
| 6 | 36 mL | 72% |
| **7** | 49 mL | **98% — essentially undiluted** |
| 8 | 64 mL | *impossible: more Melfyrium than container* |

Potency 8 cannot exist. There is no room for it.

**Potency 7 — Supercritical.** Achievable, but not a stable substance; it's very nearly raw Melfyrium wearing a potion's shape. A Potency 7 dose:

- **Is always volatile**, whatever its effects — it does not need the Explode tag, and it detonates as Potency 6 (§7) with the radius one step wider.
- **Cannot be stored.** It discharges or degrades to Potency 6 within a few hours; overnight is never safe. Purpose-built containment can extend this, at the GM's discretion, but nothing makes it indefinite.
- **Absorbs on contact instantly**, and delivers its full 49 Orie to the §8 saturation check — far beyond any ordinary SIZ capacity.
- **Uses Potency 6 for every effect formula in §6.** The 1–6 scale is what the effect glossary and difficulty table are built on; Supercritical is a *hazard* tier, not a power tier. Brewing at 7 buys you nothing but danger — which is exactly the point, and exactly why only the desperate or the reckless do it.

**Overflow detonates.** If a batch cannot be divided finely enough to bring every dose to Potency 7 or below — because Quality caps the portions, or the container lacks the charges — the surplus has nowhere to go. The excess discharges immediately as a **Potency 6 detonation** (§7), destroying the batch and whatever the alchemist was working over. In practice this bites hardest when a caster channels Xi into a pool that's already near the ceiling: the mixture simply will not hold it.

> **Minimum doses = ⌈pool ÷ 49⌉.** Below that count, the batch overflows.

A pleasant consequence: exceptionally rich ingredients don't produce *stronger* potions, they produce **more doses at full strength**. Two Grade 6 ingredients (pool 72) cannot make one monstrous vial; they make two excellent ones.

**Worked example.** Two Grade 4 ingredients → pool = 16 + 16 = **32 Orie**. The roll comes up a Success (Good: 7 rounds, max 9 portions), so the batch may be split up to 9 ways. Choosing the vessel chooses the concentration:

| Container | Charges | Doses | Potency each | Result |
|---|---|---|---|---|
| Tiny | 1 | 1 | 5 | Concentrated, volatile, skin-absorbable, over most SIZ capacities |
| Small | 2 | 2 | 4 | Still volatile and absorbable; risky to drink |
| Standard | 5 | 5 | 2 | Safe to handle and drink; modest effects |
| Medium+ | 10+ | 9 (Quality cap) | 1 | Barely worth drinking — the batch is spread too thin |

Note the last row: Quality caps the split at 9 portions, so a bigger vessel buys nothing here — it just wastes container. And because Potency floors to an integer, filling to the top of a Potency band is the efficient play, which rewards a player who checks the table before decanting.

**Consistency check.** Mass, saturation risk, and volatility all follow automatically, because they're all functions of Potency. That 1-dose Potency 5 vial carries 25 mL of Melfyrium (2.5 kg — conspicuously heavy, §3); the 5-dose version carries 4 mL (400 g) per dose. The Orie never multiplies, it only redistributes.

**Mundane and Mystical batches** have no Orie pool. For them, use the **Quality's max portions** (capped by container Charges) as a straightforward yield, and set Potency from the ingredients' Grades directly — they aren't concentration-limited in the same way, because there's no Melfyrium to conserve.

Currency is left as the original gp/sp/cp denominations — swap in Alchemis's own coinage if your campaign uses different names; the ratios carry over unchanged.

## 10. Ingredient compendium

All 96 ingredients, converted, are in the companion file **`Mythras Alchemy Ingredients.csv`**. Columns: Name, Rarity, **Grade (1–6)**, **Class**, **Orie/dose (Grade²)**, Primary/Secondary/Tertiary/Quaternary Effect, Weight (kg), Value.

**Reading the table.** *Grade* is the intrinsic value (§3); add this specimen's *Condition* (−1/0/+1) to get effective Potency at the table. There's deliberately no per-row difficulty column — difficulty follows effective Potency, not Grade, so a fixed column would be wrong half the time. Every ingredient's default Condition is **Sound (+0)** unless the GM says otherwise.

*Orie/dose* is filled in only for Mechanical ingredients; Mystical and Mundane ones show — because they carry no Melfyrium at all (§3).

**How Class was assigned — and why you should review it.** Class is derived from the system's own rule rather than guessed from names: **an ingredient that can produce a magic-only (ξ) effect must itself be magical.** Anything offering Waterbreathing, Detect Undead, Light/Darkness, Petrify, Foresight, Lucky, Speed, Wild, Holy, Explode, Cursed, Midas Touch, Cat's Eye, Increase Intelligence, or Restore Melfyrium is therefore Mechanical; five overtly consecrated items (Holy Water, Phoenix Feather, Unicorn Horn, the Philosopher's Stone, and Silver coin) are Mystical; the rest are Mundane. That yields 49 Mechanical / 42 Mundane / 5 Mystical, with zero internal contradictions.

This is a *mechanically consistent* pass, not a lore-authoritative one, and a few results deserve a second look:

- **Dragon Horn** lands Mundane (its four effects are all ordinary resistances) while **Dragon Scale** lands Mechanical — defensible, but odd for the same creature.
- **Ordinary animal eyes** (herbivore, predator, rabbit) come out Mechanical because they grant Darkness/Detect Life. Fine if Alchemis's fauna is broadly Melfyrium-touched; wrong if you intend those as mundane butchery.
- **Eggshells** are Mechanical purely on a Petrify tag.
- **Hominid/Elf/Goblin body parts** are Mechanical, which implies Alchemis's peoples carry Melfyrium in their tissue — consistent with canon, but worth confirming you want it stated this plainly.

Override any of these directly in the Class column; nothing else in the system depends on how they were derived.

## 11. In Dreoarcana

Alchemy is part of the Dreoarcana system. Everything happens in one window, the **Laboratory**, opened from a character's Equipment tab, the Items directory, or any ingredient or potion.

- **Ingredients and potions are their own item types.** They sit in the Equipment list with ENC, quantity, value and storage like any gear. Grade, Condition, Class, Rarity, the four slots and what each character has discovered are stored on the item.
- **The catalogue** is the system compendium *Alchemy Ingredients*. The GM's own additions (written in the Laboratory or imported from CSV) go to a world compendium, which wins over the system copy by name.
- **Brew tab** runs §4 end to end: Mother, reagents, overlap, Orie pool, Craft (Alchemy), Quality, then the container — all on one page, with no dialogs between. Reagents are spent when the mixture is committed; the Mother at decant.
- **Stock tab** holds what the character carries: taste, study (Lore (Alchemy)), eat raw, drink, throw, break, and — for the GM — reveal, edit, author and import.
- **Channelling** draws from Stored Orie and adds Heat for anything converted on the spot, as a spell does (§3).
- **Saturation** stacks doses and rolls them against Endurance automatically (§8).
- **Durations** become timed effects on the drinker; the unconditional bonuses apply to the sheet (§5).
- **Forage tab** sends a character out for a day (§12).
- **Refine** (Stock tab) raises one unit a step of Condition (§3). **Preserve** stops a perishable stack spoiling, and **Pad** puts a potion in a padded case (§7). See §13.
- **Vessels** are items in the compendium, *Vessel - Tiny* to *Vessel - Gargantuan*, priced as §9 gives. Decanting uses one up; without one, the card states the price of a new vessel.
- **The recipe book**: every batch decanted is written into the brewer's book in the Brew tab, to be laid out on the bench again.
- **Hit points are not applied automatically**: Mythras HP is per location, so the card states the figure and leaves the choice to the player. Stored Orie from Restore Melfyrium is applied.

Every optional rule is a system setting under **Configure Settings → Dreoarcana**, prefixed "Alchemy:".

## 12. Foraging

*House rules: the Codex names foraging as the one unbuilt piece of alchemy. These are built from rules that already exist, and mark what they add.*

**Where.** The GM describes **foraging grounds** — a name, how hard the place is to work, and which catalogue ingredients grow there. *Anywhere* is always available and draws on the whole catalogue.

**A day's work.** Mythras gives foraging to **Survival**, rolled once a day in the wild (p.49). Roll it at the ground's difficulty (the Simplified grades of §3):

| Survival result | Finds | Notes |
|---|---|---|
| Critical | 1d3+1 | A good source, harvested by an expert hand: everything is **Enhanced** (+1 Condition, §3) |
| Special | 1d3+1 | A rich patch |
| Success | 1d3 | |
| Failure | — | Nothing worth gathering |
| Fumble | — | An accident (p.49): a fierce creature, exposure, or something poisonous tasted |

**What turns up.** Each find is drawn from the ground's list by **Rarity**, each step half as likely as the one before: Common 64, Uncommon 32, Unusual 16, Rare 8, Very Rare 4, Legendary 2, Mythic 1. The Laboratory shows the chance of each.

**Knowing what it is.** Anything the forager doesn't already carry by name is identified in the field with **Lore (Alchemy)** or **Lore (Natural World)**, whichever is higher, at its Rarity difficulty (§3). A critical also shows its Primary property (a critical Lore gives real insight, p.47). A failure leaves it *Unidentified* — a plant, a mushroom, an eye — to be worked out later in the Stock tab with the same roll, or revealed by the GM. It can still be brewed with; it just won't say what it is.

## 13. The gaps, filled

The canon names these rules but gives no numbers, or none the table can run. Each is a system setting, and each number below is a **house rule**.

- **Raising Condition (§3).** Craft (Alchemy) at Standard, hours of work. A success lifts one unit a step, up to Enhanced; a failure does nothing; a fumble ruins it. The unit comes off its stack.
- **Spoilage (§3).** Condition falls with "age, heat, sunlight … poor storage". Perishables — herbs, flowers, fruit, berries, fungi, roots, reeds, flesh, blood, eyes, ears, hearts, eggs, insects — lose one step of Condition every **14 days** of game time, down to Degraded. Minerals, metals, gems, coins, bone, teeth, horn, scale, shell, feather, hair, wood, resin and the Mothers keep. A **preserved** stack (salted, dried, sealed) does not spoil; the GM decides what preserving it takes.
- **Padded cases (§7).** A carried potion in a padded case does the damage of the tier below if it breaks; below Potency 4 the burst is smothered. A thrown potion has left its case.
- **Supercritical decay (§9).** "Within a few hours" is read as **3 hours** of game time, **6** in a padded case. Then roll 1d6: on 1–3 the dose settles to Potency 6; on 4–6 it discharges as a Potency 7 blast.
- **Vessels (§9).** A carried vessel of the chosen size is used up at decant. The setting can require one.
- **Wearable radiators.** The world says only that they "dissipate conversion heat". A radiator adds its metal's conductance ÷ 100 to the Heat vented each Melee Round, using the Materials table: silver 4, copper 4, gold 3, aluminium 2, magnesium, iridium, rhodium, ruthenium, zinc, manganese and cobalt 1; iron, nickel, chromium, tin, lead and titanium nothing. Mark any gear as a radiator on its sheet.

## 14. Flux

Mechanical Casting: "Converting large amounts of Xi produces a cascade of dimensional entropy — this is Flux. Melfyrium converting itself into undirected energy is also Flux." A Mechanical potion is restrained planar energy (§7), and channelling is the same conversion as a spell (§3), so Flux reaches alchemy the same ways. It uses the same Flux zones as spells: circles on the map that weaken a step each hour of game time, and the same setting turns them off.

- **Detonations leave it**, as §7 says. A Potency 5 blast leaves **Flux 1**, a disturbance that fades within ten minutes; Potency 6 leaves **Flux 2**; a Supercritical discharge **Flux 3**. The zone covers the blast radius. A thrown potion bursts on the one token targeted.
- **Channelling leaves it.** Xi channelled into a brew leaves Flux by the spell tiers: 26 Xi or more (Tier III) leaves Flux 1, 51+ Flux 2, 101+ Flux 3. A ruined batch with Xi in it is undirected conversion, and adds 1. An overflow (§9) is a Potency 6 discharge, and leaves Flux 2.
- **Brewing a Mechanical batch inside Flux** rolls a d10, as a spell does. The lowest faces, as many as the intensity, **amplify** the batch: its Orie pool ×1.5 (more Potency, and more risk of overflow). The highest **misfire** it: Quality one band lower. Mundane and Mystical brews carry no planar charge and are untouched.
- **A Supercritical dose carried in Flux** runs out faster: its hours divided by 1 + intensity ÷ 2.

The Laboratory's rail says when the alchemist stands in Flux, and the bench shows it among the readout.

*House rules: the numbers, as for spells. The canon says what Flux does, not by how much.*

