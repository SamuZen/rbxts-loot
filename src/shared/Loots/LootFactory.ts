import { ClassCache } from "@rbxts/class-cache";
import { ILoot, Lootable } from "../Loot";
import { LootTypes } from "../LootTypes";
import { LootMagnetic } from "./LootMagnetic";
import { LootInteractable } from "./LootInteractable";

const Workspace = game.GetService("Workspace");

const magneticTemplate = new LootMagnetic();
const magneticCache = new ClassCache<LootMagnetic>(magneticTemplate, Workspace, 5);

const interactableTemplate = new LootInteractable();
const interactableCache = new ClassCache<LootInteractable>(interactableTemplate, Workspace, 5);

export class LootFactory {
	public createLoot(lootData: Lootable, position: Vector3) {
		let loot: ILoot;
		switch (lootData.lootType) {
			case LootTypes.Magnetic: {
				loot = magneticCache.get();
				break;
			}
			case LootTypes.Interactable: {
				loot = interactableCache.get();
				break;
			}
			default: {
				error("Unknown loot type");
			}
		}
		loot.setup(lootData);
		loot.spawn(position);
		return loot;
	}
}
