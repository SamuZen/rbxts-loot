import { CollisionGroups } from "../shared/CollisionGroups";

const RunService = game.GetService("RunService");
const Workspace = game.GetService("Workspace");
const Players = game.GetService("Players");

const localPlayer = Players.LocalPlayer;

function create(): BasePart {
	const part = new Instance("Part");
	part.Name = CollisionGroups.LootCollector;
	part.Anchored = false;
	part.CanCollide = false;
	part.Size = new Vector3(3, 3, 3);
	part.Shape = Enum.PartType.Ball;
	part.Transparency = 1;
	part.Parent = Workspace;
	part.CollisionGroup = CollisionGroups.LootCollector;

	return part;
}

function followPlayer(part: BasePart) {
	RunService.Heartbeat.Connect(() => {
		if (localPlayer && localPlayer.Character) {
			part.PivotTo(localPlayer.Character.GetPivot());
			part.AssemblyLinearVelocity = Vector3.zero;
		}
	});
	return;
}

export function CreateCollectorPart(): BasePart {
	const collectorPart = create();
	followPlayer(collectorPart);
	return collectorPart;
}
