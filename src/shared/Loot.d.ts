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

// Signals server -> server
export type ServerLootCollectedSignalData = {
	player: Player;
	loot: Lootable;
};

export type ServerLootDespawnSignalData = {
	player: Player;
	lootId: string;
};

export type ServerLootSpawnSignalData = {
	player: Player;
	creationData: LootCreationData;
};

// Signals client -> client

export type ClientLootCollectedSignalData = {
	lootInstanceData: LootInstanceData;
};

export type ClientLootDespawnSignalData = {
	lootInstanceData: LootInstanceData;
};

export type ClientLootSpawnSignalData = {
	lootInstanceData: LootInstanceData;
};

export type ClientLootTouchedSignalData = {
	lootInstanceData: LootInstanceData;
};

//

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
