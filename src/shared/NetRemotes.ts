import Net, { Definitions } from "@rbxts/net";
import { LootCreationData } from "./Loot";
import { NetRemoteNames } from "./NetRemoteNames";

const Remotes = Net.CreateDefinitions({
	[NetRemoteNames.CreateLoot]: Definitions.ServerToClientEvent<[LootCreationData]>(),
	[NetRemoteNames.DespawnLoot]: Definitions.ServerToClientEvent<[string]>(),

	[NetRemoteNames.CollectedLoot]: Definitions.ClientToServerEvent<[string]>(),
});

export = Remotes;
