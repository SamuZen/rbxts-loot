import { CreateCollectorPart } from "./CollectorPart";
import {
	LootCreationData,
	LootInstanceData,
	ClientLootCollectedSignalData,
	ClientLootDespawnSignalData,
	ClientLootSpawnSignalData,
	ClientLootTouchedSignalData,
} from "../shared/Loot";
import { NetRemoteNames } from "../shared/NetRemoteNames";
import { LootFactory } from "../shared/Loots/LootFactory";
import Remotes from "../shared/NetRemotes";
import { Signal } from "@rbxts/beacon";

const RunService = game.GetService("RunService");
let lootClientInstance: LootClient | undefined = undefined;

class LootClient {
	//server - client
	SpawnLoot = Remotes.Client.Get(NetRemoteNames.CreateLoot);
	DespawnLoot = Remotes.Client.Get(NetRemoteNames.DespawnLoot);

	//client - server
	CollectedLoot = Remotes.Client.Get(NetRemoteNames.CollectedLoot);

	//client - client
	LootCollectedSignal = new Signal<LootInstanceData>();
	LootSpawnedSignal = new Signal<LootInstanceData>();
	LootDespawnedSignal = new Signal<LootInstanceData>();
	LootTouchedSignal = new Signal<LootInstanceData>();

	//
	lootFactory = new LootFactory();
	instanceDataByHandle = new Map<BasePart, LootInstanceData>();
	instanceDataById = new Map<string, LootInstanceData>();

	collectorPart: BasePart;

	constructor() {
		this.collectorPart = CreateCollectorPart();
		this.collectorPart.Touched.Connect((part: BasePart) => {
			this.CollectorTouched(part);
		});

		this.SpawnLoot.Connect((data: LootCreationData) => {
			this.CreateLoot(data);
		});

		this.DespawnLoot.Connect((lootId: string) => {
			const lootData = this.instanceDataById.get(lootId);
			if (lootData === undefined) return;
			this.RemoveLootInstanceData(lootData);
			this.LootDespawnedSignal.Fire(lootData);
			lootData.loot.despawn();
		});
	}

	// Internal

	AddLootInstanceData(lootData: LootInstanceData) {
		this.instanceDataByHandle.set(lootData.loot.handle, lootData);
		this.instanceDataById.set(lootData.creationData.id, lootData);
	}

	RemoveLootInstanceById(id: string) {
		const lootData = this.instanceDataById.get(id);
		if (lootData === undefined) return;
		this.RemoveLootInstanceData(lootData);
	}

	RemoveLootInstanceData(lootData: LootInstanceData) {
		this.instanceDataByHandle.delete(lootData.loot.handle);
		this.instanceDataById.delete(lootData.creationData.id);
	}

	CreateLoot(creationData: LootCreationData) {
		const loot = this.lootFactory.createLoot(creationData.loot, creationData.position);
		const lootData: LootInstanceData = {
			creationData,
			loot,
		};

		this.AddLootInstanceData(lootData);

		loot.onCollected.Event.Once(() => {
			this.CollectLoot(lootData);
		});

		this.LootSpawnedSignal.Fire(lootData);
	}

	CollectorTouched(handle: BasePart) {
		if (!this.instanceDataByHandle.has(handle)) return;
		const localData = this.instanceDataByHandle.get(handle);
		if (localData === undefined) return;
		localData.loot.touched();

		this.LootTouchedSignal.Fire(localData);
	}

	// External

	SetCollectorSize(size: number) {
		this.collectorPart.Size = new Vector3(size, size, size);
	}

	// Other

	CollectLoot(data: LootInstanceData) {
		if (data === undefined) {
			warn("Loot data was undefined");
			return;
		}

		this.LootCollectedSignal.Fire(data);

		task.spawn(() => {
			data.loot.collected();
		});

		this.instanceDataByHandle.delete(data.loot.handle);
		this.instanceDataById.delete(data.creationData.id);

		this.CollectedLoot.SendToServer(data.creationData.id);
	}

	//Callbacks

	OnLootTouched(callback: (data: LootInstanceData) => void): RBXScriptConnection {
		return this.LootTouchedSignal.Connect(callback);
	}

	OnLootSpawned(callback: (data: LootInstanceData) => void): RBXScriptConnection {
		return this.LootSpawnedSignal.Connect(callback);
	}

	OnLootDespawned(callback: (data: LootInstanceData) => void): RBXScriptConnection {
		return this.LootDespawnedSignal.Connect(callback);
	}

	OnLootCollected(callback: (data: LootInstanceData) => void): RBXScriptConnection {
		return this.LootCollectedSignal.Connect(callback);
	}
}

export function Initialize() {
	assert(RunService.IsClient(), "InitializeLoot() should only be called on the client!");
	if (lootClientInstance === undefined) {
		lootClientInstance = new LootClient();
	}
}

export function SetCollectorSize(size: number) {
	assert(lootClientInstance !== undefined, "InitializeLoot() should be called before setPlayerCollectorSize()!");
	lootClientInstance.SetCollectorSize(size);
}

// client - client

export function OnLootSpawned(callback: (data: LootInstanceData) => void): RBXScriptConnection {
	assert(lootClientInstance !== undefined, "InitializeLoot() should be called before onLootCreated()!");
	return lootClientInstance.OnLootSpawned(callback);
}

export function OnLootDespawned(callback: (data: LootInstanceData) => void): RBXScriptConnection {
	assert(lootClientInstance !== undefined, "InitializeLoot() should be called before onLootCreated()!");
	return lootClientInstance.OnLootDespawned(callback);
}

export function OnLootCollected(callback: (data: LootInstanceData) => void): RBXScriptConnection {
	assert(lootClientInstance !== undefined, "InitializeLoot() should be called before onLootCollected()!");
	return lootClientInstance.OnLootCollected(callback);
}

export function OnLootTouched(callback: (data: LootInstanceData) => void): RBXScriptConnection {
	assert(lootClientInstance !== undefined, "InitializeLoot() should be called before onLootCollected()!");
	return lootClientInstance.OnLootTouched(callback);
}
