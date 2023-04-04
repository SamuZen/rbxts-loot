import { CollisionGroups } from "../shared/CollisionGroups";

const RunService = game.GetService("RunService");
const Workspace = game.GetService("Workspace");
const Players = game.GetService("Players");

const localPlayer = Players.LocalPlayer;

function create(range: number): BasePart {
	const part = new Instance("Part");
	part.Name = CollisionGroups.LootCollector;
	part.Anchored = true;
	part.CanCollide = false;
	part.Size = new Vector3(range, range, range);
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
			part.AssemblyAngularVelocity = Vector3.zero;
		}
	});
	return;
}

export function CreateCollectorPart(range: number): BasePart {
	const collectorPart = create(range);
	followPlayer(collectorPart);
	return collectorPart;
}
