import { CreateCollectorPart } from "./CollectorPart";
import { LootCreationData, LootInstanceData } from "../shared/Loot";
import { NetRemoteNames } from "../shared/NetRemoteNames";
import { LootFactory } from "../shared/Loots/LootFactory";
import Remotes from "../shared/NetRemotes";
import { Signal } from "@rbxts/beacon";

const RunService = game.GetService("RunService");
let lootClientInstance: LootClient | undefined = undefined;

class LootClient {
	CreateLoot = Remotes.Client.Get(NetRemoteNames.CreateLoot);
	CollectedLoot = Remotes.Client.Get(NetRemoteNames.CollectedLoot);

	signalLootCollected = new Signal<LootInstanceData>();
	signalLootCreated = new Signal<LootInstanceData>();

	lootFactory = new LootFactory();
	createdLoots = new Map<BasePart, LootInstanceData>();

	collectorPart: BasePart;

	constructor() {
		this.collectorPart = CreateCollectorPart();
		this.collectorPart.Touched.Connect((part: BasePart) => {
			this.onCollectorTouched(part);
		});

		this.CreateLoot.Connect((data: LootCreationData) => {
			this.onCreateLoot(data);
		});
	}

	setCollectorSize(size: number) {
		this.collectorPart.Size = new Vector3(size, size, size);
	}

	onCollectorTouched(part: BasePart) {
		if (!this.createdLoots.has(part)) return;
		const localData = this.getLocalDataFromHandle(part);
		if (localData === undefined) return;
		localData.loot.touched();
	}

	onCreateLoot(creationData: LootCreationData) {
		const loot = this.lootFactory.createLoot(creationData.loot, creationData.position);
		const lootData: LootInstanceData = {
			creationData,
			loot,
		};

		this.signalLootCreated.Fire(lootData);

		this.createdLoots.set(loot.handle, lootData);
		loot.onCollected.Event.Once(() => {
			this.collectLoot(lootData);
		});
	}

	collectLoot(data: LootInstanceData) {
		if (data === undefined) {
			warn("Loot data was undefined");
			return;
		}

		this.signalLootCollected.Fire(data);

		task.spawn(() => {
			data.loot.collected();
		});

		this.createdLoots.delete(data.loot.handle);
		this.CollectedLoot.SendToServer(data.creationData.id);
	}

	getLocalDataFromHandle(handle: BasePart) {
		const lootData = this.createdLoots.get(handle);
		if (lootData === undefined) {
			warn("Loot data was undefined");
			return;
		}
		return lootData;
	}

	onLootCollected(callback: (data: LootInstanceData) => void): RBXScriptConnection {
		return this.signalLootCollected.Connect(callback);
	}

	onLootCreated(callback: (data: LootInstanceData) => void): RBXScriptConnection {
		return this.signalLootCreated.Connect(callback);
	}
}

export function InitializeLootClient() {
	assert(RunService.IsClient(), "InitializeLoot() should only be called on the client!");
	if (lootClientInstance === undefined) {
		lootClientInstance = new LootClient();
	}
}

export function onLootCreated(callback: (data: LootInstanceData) => void): RBXScriptConnection {
	assert(lootClientInstance !== undefined, "InitializeLoot() should be called before onLootCreated()!");
	return lootClientInstance.onLootCreated(callback);
}

export function onLootCollected(callback: (data: LootInstanceData) => void): RBXScriptConnection {
	assert(lootClientInstance !== undefined, "InitializeLoot() should be called before onLootCollected()!");
	return lootClientInstance.onLootCollected(callback);
}

export function setPlayerCollectorSize(size: number) {
	assert(lootClientInstance !== undefined, "InitializeLoot() should be called before setPlayerCollectorSize()!");
	lootClientInstance.setCollectorSize(size);
}
