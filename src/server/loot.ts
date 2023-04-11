import {
	ServerLootCollectedSignalData,
	LootCreationData,
	ServerLootDespawnSignalData,
	ServerLootSpawnSignalData,
	Lootable as Lootable,
} from "../shared/Loot";
import { SetCollisionGroups } from "./CollisionGroupHandler";
import { GenerateUniqueId } from "../shared/UniqueId";
import { NetRemoteNames } from "../shared/NetRemoteNames";
import Remotes from "../shared/NetRemotes";
import { Signal } from "@rbxts/beacon";

const RunService = game.GetService("RunService");
const Players = game.GetService("Players");

let lootServerInstance: LootServer | undefined = undefined;

const initializedEvent: BindableEvent = new Instance("BindableEvent");

class LootServer {
	//server - client
	CreateLootEvent = Remotes.Server.Get(NetRemoteNames.CreateLoot);
	DespawnLootEvent = Remotes.Server.Get(NetRemoteNames.DespawnLoot);

	//client - server
	CollectedLoot = Remotes.Server.Get(NetRemoteNames.CollectedLoot);

	//server - server
	LootSpawnedSignal = new Signal<ServerLootSpawnSignalData>();
	LootCollectedSignal = new Signal<ServerLootCollectedSignalData>();
	LootDespawnedSignal = new Signal<ServerLootDespawnSignalData>();

	//
	initialized = false;
	playerToLootIdMap = new Map<Player, Array<string>>();
	lootIdToLootDataMap = new Map<string, Lootable>();

	constructor() {
		SetCollisionGroups();

		// Initialize player maps
		Players.PlayerAdded.Connect((player) => {
			this.playerToLootIdMap.set(player, []);
		});

		Players.PlayerRemoving.Connect((player) => {
			this.playerToLootIdMap.delete(player);
		});

		// Listen client events
		this.CollectedLoot.Connect((player, lootId) => {
			this.PlayerCollectedLoot(player, lootId);
		});
	}

	// Internal

	AddPlayerLoot(player: Player, lootCreationData: LootCreationData) {
		const playerLootIds = this.playerToLootIdMap.get(player);
		if (!playerLootIds) {
			error("Player does not exist in playerToLootIdMap!");
		}

		playerLootIds.push(lootCreationData.id);
		this.lootIdToLootDataMap.set(lootCreationData.id, lootCreationData.loot);
	}

	RemovePlayerLoot(player: Player, lootId: string) {
		const playerLootIds = this.playerToLootIdMap.get(player);
		if (!playerLootIds) {
			error("Player does not exist in playerToLootIdMap!");
		}

		// remove the id from the player's loot ids
		this.playerToLootIdMap.set(
			player,
			playerLootIds.filter((id) => id !== lootId),
		);

		// remove the loot data from the loot id map
		this.lootIdToLootDataMap.delete(lootId);
	}

	PlayerCollectedLoot(player: Player, lootId: string) {
		const lootData = this.lootIdToLootDataMap.get(lootId);
		if (!lootData) {
			warn("Loot does not exist in lootIdToLootDataMap!");
			return;
		}

		this.RemovePlayerLoot(player, lootId);

		// do something with the loot data
		this.LootCollectedSignal.Fire({
			player,
			loot: lootData,
		});
	}

	// External

	CreateLoot(player: Player, loot: Lootable, position: Vector3) {
		const lootId = GenerateUniqueId();
		const creationData: LootCreationData = {
			id: lootId,
			loot,
			position,
		};

		this.AddPlayerLoot(player, creationData);

		// send the loot creation data to the client
		this.CreateLootEvent.SendToPlayer(player, creationData);

		// alert server
		this.LootSpawnedSignal.Fire({ creationData, player });

		// despawn the loot after a certain amount of time
		if (loot.despawnTime !== undefined) {
			delay(loot.despawnTime, () => {
				this.RemovePlayerLoot(player, lootId);
				this.DespawnLootEvent.SendToPlayer(player, lootId);

				this.LootDespawnedSignal.Fire({ lootId, player });
			});
		}
	}

	// Callbacks

	OnLootCollected(callback: (data: ServerLootCollectedSignalData) => void) {
		return this.LootCollectedSignal.Connect(callback);
	}

	onLootSpawned(callback: (data: ServerLootSpawnSignalData) => void) {
		return this.LootSpawnedSignal.Connect(callback);
	}

	OnLootDespawned(callback: (lootId: ServerLootDespawnSignalData) => void) {
		return this.LootDespawnedSignal.Connect(callback);
	}
}

export function Initialize() {
	assert(RunService.IsServer(), "LootServer Initialize() should only be called on the server!");
	assert(!lootServerInstance, "LootServer Initialize() should only be called once!");

	lootServerInstance = new LootServer();
	initializedEvent.Fire();
}

export function CreateLoot(player: Player, loot: Lootable, position: Vector3) {
	assert(RunService.IsServer(), "CreateLoot() should only be called on the server!");
	assert(lootServerInstance, "Initialize() should be called before CreateLoot()!");

	lootServerInstance.CreateLoot(player, loot, position);
}

// server - server

export function OnLootSpawned(callback: (data: ServerLootSpawnSignalData) => void) {
	assert(RunService.IsServer(), "OnLootSpawned() should only be called on the server!");
	if (!lootServerInstance) {
		initializedEvent.Event.Wait();
	}
	assert(lootServerInstance, "Failed to initialize loot server!");
	return lootServerInstance.onLootSpawned(callback);
}

export function OnLootDespawned(callback: (lootId: ServerLootDespawnSignalData) => void) {
	assert(RunService.IsServer(), "OnLootDespawned() should only be called on the server!");
	if (!lootServerInstance) {
		initializedEvent.Event.Wait();
	}
	assert(lootServerInstance, "Failed to initialize loot server!");
	return lootServerInstance.OnLootDespawned(callback);
}

export function OnLootCollected(callback: (data: ServerLootCollectedSignalData) => void) {
	assert(RunService.IsServer(), "OnLootCollected() should only be called on the server!");
	if (!lootServerInstance) {
		initializedEvent.Event.Wait();
	}
	assert(lootServerInstance, "Failed to initialize loot server!");
	return lootServerInstance.OnLootCollected(callback);
}
