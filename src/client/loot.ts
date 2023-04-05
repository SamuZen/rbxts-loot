import { CreateCollectorPart } from "./CollectorPart";
import { LootCreationData, LootInstanceData } from "../shared/Loot";
import { NetRemoteNames } from "../shared/NetRemoteNames";
import { LootFactory } from "../shared/Loots/LootFactory";
import Remotes from "../shared/NetRemotes";

const RunService = game.GetService("RunService");
let lootClientInstance: LootClient | undefined = undefined;

class LootClient {
	CreateLoot = Remotes.Client.Get(NetRemoteNames.CreateLoot);
	CollectedLoot = Remotes.Client.Get(NetRemoteNames.CollectedLoot);

	lootFactory = new LootFactory();
	createdLoots = new Map<BasePart, LootInstanceData>();

	constructor(collectorSize: number) {
		this.initialize(collectorSize);
	}

	initialize(collectorSize: number) {
		const collectorPart = CreateCollectorPart(collectorSize);
		collectorPart.Touched.Connect((part: BasePart) => {
			this.onCollectorTouched(part);
		});

		this.CreateLoot.Connect((data: LootCreationData) => {
			this.onCreateLoot(data);
		});
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
}

export function InitializeLootClient(rangeSize: number) {
	assert(RunService.IsClient(), "InitializeLoot() should only be called on the client!");

	if (lootClientInstance === undefined) {
		lootClientInstance = new LootClient(rangeSize);
	}
}
