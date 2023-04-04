import { LootCollectedAlertData, LootCreationData, Lootable as Lootable } from "../shared/Loot";
import { SetCollisionGroups } from "./CollisionGroupHandler";
import { GenerateUniqueId } from "../shared/UniqueId";
import { NetRemoteNames } from "../shared/NetRemoteNames";
import Remotes from "../shared/NetRemotes";
import { Signal } from "@rbxts/beacon";

const RunService = game.GetService("RunService");
const Players = game.GetService("Players");

/// ### Net Remotes
const CreateLoot = Remotes.Server.Get(NetRemoteNames.CreateLoot);
const CollectedLoot = Remotes.Server.Get(NetRemoteNames.CollectedLoot);

/// ### Beacon Remotes
const LootCollectedSignal = new Signal<LootCollectedAlertData>();

/// ### Variables
let initialized = false;
const playerToLootIdMap = new Map<Player, Array<string>>();
const lootIdToLootDataMap = new Map<string, Lootable>();

export function InitializeLootServer() {
	assert(RunService.IsServer(), "InitializeLoot() should only be called on the server!");
	assert(!initialized, "InitializeLoot() should only be called once!");

	initialized = true;
	SetCollisionGroups();
	HandlePlayerMap();

	CollectedLoot.Connect(OnPlayerCollectedLoot);
}

function HandlePlayerMap() {
	Players.PlayerAdded.Connect((player) => {
		playerToLootIdMap.set(player, []);
	});

	Players.PlayerRemoving.Connect((player) => {
		playerToLootIdMap.delete(player);
	});
}

function OnPlayerCollectedLoot(player: Player, lootId: string) {
	const playerLootIds = playerToLootIdMap.get(player);
	if (!playerLootIds) {
		error("Player does not exist in playerToLootIdMap!");
	}

	const lootData = lootIdToLootDataMap.get(lootId);
	if (!lootData) {
		error("Loot does not exist in lootIdToLootDataMap!");
	}

	// do something with the loot data
	OnLootCollected(player, lootData);

	// remove the id from the player's loot ids
	playerToLootIdMap.set(
		player,
		playerLootIds.filter((id) => id !== lootId),
	);

	// remove the loot data from the loot id map
	lootIdToLootDataMap.delete(lootId);
}

function OnLootCollected(player: Player, loot: Lootable) {
	LootCollectedSignal.Fire({
		player,
		loot,
	});
}

export function CreateLootForPlayer(player: Player, loot: Lootable, position: Vector3) {
	const id = GenerateUniqueId();

	const creationData: LootCreationData = {
		id,
		loot,
		position,
	};

	const playerLootIds = playerToLootIdMap.get(player);
	if (!playerLootIds) {
		error("Player does not exist in playerToLootIdMap!");
	}

	playerLootIds.push(id);
	lootIdToLootDataMap.set(id, loot);

	CreateLoot.SendToPlayer(player, creationData);
}
