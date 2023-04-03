import { CollisionGroups } from "../shared/CollisionGroups";

const PhysicsService = game.GetService("PhysicsService");

const collider = CollisionGroups[CollisionGroups.LootCollider];
const collector = CollisionGroups[CollisionGroups.LootCollector];

export function SetCollisionGroups() {
	// create collision groups
	PhysicsService.RegisterCollisionGroup(collider);
	PhysicsService.RegisterCollisionGroup(collector);

	// set collision groups
	PhysicsService.CollisionGroupSetCollidable(collider, collector, true);
	PhysicsService.CollisionGroupSetCollidable(collider, collider, false);
	PhysicsService.CollisionGroupSetCollidable(collector, "Default", false);
}
