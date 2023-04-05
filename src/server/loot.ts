import { LootCollectedAlertData, LootCreationData, Lootable as Lootable } from "../shared/Loot";
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
	CreateLoot = Remotes.Server.Get(NetRemoteNames.CreateLoot);
	CollectedLoot = Remotes.Server.Get(NetRemoteNames.CollectedLoot);

	LootCollectedSignal = new Signal<LootCollectedAlertData>();

	initialized = false;
	playerToLootIdMap = new Map<Player, Array<string>>();
	lootIdToLootDataMap = new Map<string, Lootable>();

	constructor() {
		SetCollisionGroups();
		this.HandlePlayerMap();
		this.CollectedLoot.Connect((player, lootId) => {
			this.OnPlayerCollectedLoot(player, lootId);
		});
	}

	HandlePlayerMap() {
		Players.PlayerAdded.Connect((player) => {
			this.playerToLootIdMap.set(player, []);
		});

		Players.PlayerRemoving.Connect((player) => {
			this.playerToLootIdMap.delete(player);
		});
	}

	OnPlayerCollectedLoot(player: Player, lootId: string) {
		const playerLootIds = this.playerToLootIdMap.get(player);
		if (!playerLootIds) {
			error("Player does not exist in playerToLootIdMap!");
		}

		const lootData = this.lootIdToLootDataMap.get(lootId);
		if (!lootData) {
			error("Loot does not exist in lootIdToLootDataMap!");
		}

		// do something with the loot data
		this.LootCollectedSignal.Fire({
			player,
			loot: lootData,
		});

		// remove the id from the player's loot ids
		this.playerToLootIdMap.set(
			player,
			playerLootIds.filter((id) => id !== lootId),
		);

		// remove the loot data from the loot id map
		this.lootIdToLootDataMap.delete(lootId);
	}

	RegisterToLootCollected(callback: (data: LootCollectedAlertData) => void) {
		return this.LootCollectedSignal.Connect(callback);
	}

	CreateLootForPlayer(player: Player, loot: Lootable, position: Vector3) {
		const id = GenerateUniqueId();

		const creationData: LootCreationData = {
			id,
			loot,
			position,
		};

		const playerLootIds = this.playerToLootIdMap.get(player);
		if (!playerLootIds) {
			error("Player does not exist in playerToLootIdMap!");
		}

		playerLootIds.push(id);
		this.lootIdToLootDataMap.set(id, loot);

		this.CreateLoot.SendToPlayer(player, creationData);
	}
}

export function InitializeLootServer() {
	assert(RunService.IsServer(), "InitializeLoot() should only be called on the server!");
	assert(!lootServerInstance, "InitializeLoot() should only be called once!");

	lootServerInstance = new LootServer();
	initializedEvent.Fire();
}

export function CreateLootForPlayer(player: Player, loot: Lootable, position: Vector3) {
	assert(RunService.IsServer(), "CreateLootForPlayer() should only be called on the server!");
	assert(lootServerInstance, "InitializeLoot() should be called before CreateLootForPlayer()!");

	lootServerInstance.CreateLootForPlayer(player, loot, position);
}

export function RegisterToLootCollected(callback: (data: LootCollectedAlertData) => void) {
	assert(RunService.IsServer(), "RegisterToLootCollected() should only be called on the server!");
	if (!lootServerInstance) {
		initializedEvent.Event.Wait();
	}
	assert(lootServerInstance, "Failed to initialize loot server!");
	return lootServerInstance.RegisterToLootCollected(callback);
}
