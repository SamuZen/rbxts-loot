import { CreateCollectorPart } from "./CollectorPart";
import { LootCreationData, LootInstanceData } from "../shared/Loot";
import { NetRemoteNames } from "../shared/NetRemoteNames";
import { LootFactory } from "../shared/Loots/LootFactory";
import Remotes from "../shared/NetRemotes";

const RunService = game.GetService("RunService");

const CreateLoot = Remotes.Client.Get(NetRemoteNames.CreateLoot);
const CollectedLoot = Remotes.Client.Get(NetRemoteNames.CollectedLoot);

const lootFactory = new LootFactory();
const createdLoots = new Map<BasePart, LootInstanceData>();

export function InitializeLootClient() {
	assert(RunService.IsClient(), "InitializeLoot() should only be called on the client!");

	const collectorPart = CreateCollectorPart(10);
	collectorPart.Touched.Connect(OnCollectorTouched);

	CreateLoot.Connect(OnCreateLoot);
}

function OnCollectorTouched(part: BasePart) {
	if (!isValidHandle(part)) return;
	const localData = getLocalDataFromHandle(part);
	if (localData === undefined) return;
	localData.loot.touched();
}

function OnCreateLoot(creationData: LootCreationData) {
	const loot = lootFactory.createLoot(creationData.loot, creationData.position);
	const lootData: LootInstanceData = {
		creationData,
		loot,
	};
	createdLoots.set(loot.handle, lootData);
	loot.onCollected.Event.Once(() => {
		CollectLoot(lootData);
	});
}

function CollectLoot(data: LootInstanceData) {
	if (data === undefined) {
		warn("Loot data was undefined");
		return;
	}

	task.spawn(() => {
		data.loot.collected();
	});

	createdLoots.delete(data.loot.handle);
	CollectedLoot.SendToServer(data.creationData.id);
}

// Helpers

function getLocalDataFromHandle(handle: BasePart) {
	const lootData = createdLoots.get(handle);
	if (lootData === undefined) {
		warn("Loot data was undefined");
		return;
	}
	return lootData;
}

function isValidHandle(handle: BasePart) {
	return createdLoots.has(handle);
}
