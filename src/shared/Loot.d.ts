import { LootTypes } from "./LootTypes";

export type Lootable = {
	id: string;
	icon: string;
	lootType: LootTypes;
	despawnTime?: number;
	extraData?: unknown;
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

export type LootInstanceData = {
	loot: ILoot;
	creationData: LootCreationData;
};

export interface ILoot {
	handle: BasePart;
	onCollected: BindableEvent;

	despawn(): void;
	setup(lootData: Lootable): void;
	spawn(position: Vector3): void;
	collected(): void;
	touched(): void;
}

export interface ISpriteLoot extends ILoot {
	iconLabel: ImageLabel;
	bgLabel: ImageLabel;
}

export interface IInteractableLoot extends ILoot {
	prompt: ProximityPrompt;
}
