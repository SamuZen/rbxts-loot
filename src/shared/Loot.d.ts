import { LootTypes } from "./LootTypes";

export type Lootable = {
	id: string;
	icon: string;
	lootType: LootTypes;
};

export type LootCreationData = {
	loot: Lootable;
	position: Vector3;
	id: string;
};

export type LootCollectedAlertData = {
	player: Player;
	loot: Lootable;
};
