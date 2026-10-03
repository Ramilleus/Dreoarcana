import { CharacterData, NpcData } from "./data/actor.mjs";
import { ItemData } from "./data/item.mjs";

Hooks.once("init", () => {
  console.log("Dreo Arcana | Initializing system");

  CONFIG.Actor.dataModels = {
    character: CharacterData,
    npc: NpcData
  };

  CONFIG.Item.dataModels = {
    item: ItemData
  };
});
