import { Cachable } from "@rbxts/class-cache";
import { ISpriteLoot, Lootable } from "../Loot";
import { CollisionGroups } from "../CollisionGroups";

const Players = game.GetService("Players");
const TweenService = game.GetService("TweenService");
const tweenInfo = new TweenInfo(0.5, Enum.EasingStyle.Quint, Enum.EasingDirection.In, 0, false, 0);

export class LootMagnetic extends Cachable implements ISpriteLoot {
	handle: BasePart;
	iconLabel: ImageLabel;
	bgLabel: ImageLabel;
	onCollected: BindableEvent<Callback>;

	constructor() {
		super();
		this.onCollected = new Instance("BindableEvent");
		const assembled = this.assemble();

		this.handle = assembled.handle;
		this.iconLabel = assembled.iconLabel;
		this.bgLabel = assembled.bgLabel;
	}

	create(): Cachable {
		return new LootMagnetic();
	}

	hide(): void {
		this.handle.Anchored = true;
		this.handle.PivotTo(this.defaultCFrame);
		this.handle.AssemblyLinearVelocity = new Vector3(0, 0, 0);
		this.handle.CanCollide = false;
	}

	setParent(parent: Instance | undefined): void {
		this.handle.Parent = parent;
	}

	gotten(): void {
		this.handle.Anchored = false;
		this.handle.CanCollide = true;
	}

	clear(): void {}

	/// ### Loot

	setup(lootData: Lootable): void {
		this.handle.Name = lootData.id;
	}

	spawn(position: Vector3): void {
		this.handle.PivotTo(new CFrame(position));

		const distance = 10;
		const height = 50;
		const randomX = math.random(-distance, distance);
		const randomZ = math.random(-distance, distance);
		const force = new Vector3(randomX, height, randomZ);

		this.handle.ApplyImpulse(force.mul(this.handle.AssemblyMass));
	}

	despawn(): void {
		this.cache?.return(this);
	}

	touched(): void {
		this.onCollected.Fire();
	}

	collected(): void {
		this.animateAndDespawn();
	}

	/// ### Internal

	assemble(): {
		handle: BasePart;
		iconLabel: ImageLabel;
		bgLabel: ImageLabel;
	} {
		const size = 3;

		const handle = new Instance("Part");
		handle.Size = new Vector3(size, size, size);
		handle.Transparency = 1;
		handle.Anchored = false;
		handle.CanCollide = true;
		handle.CanQuery = false;
		handle.CanTouch = true;
		handle.CastShadow = false;
		handle.CollisionGroup = CollisionGroups.LootCollider;

		const bilGui = new Instance("BillboardGui");
		bilGui.Size = new UDim2(3, 0, 3, 0);
		bilGui.Parent = handle;
		bilGui.Adornee = handle;

		const iconLabel = new Instance("ImageLabel");
		iconLabel.BackgroundTransparency = 1;
		iconLabel.Image = "";
		iconLabel.Position = new UDim2(0.1, 0, 0.1, 0);
		iconLabel.Size = new UDim2(0.8, 0, 0.8, 0);
		iconLabel.Parent = bilGui;
		iconLabel.ZIndex = 2;

		const bgLabel = new Instance("ImageLabel");
		bgLabel.BackgroundTransparency = 1;
		bgLabel.Image = "";
		bgLabel.Size = new UDim2(1, 0, 1, 0);
		bgLabel.Parent = bilGui;
		bgLabel.ZIndex = 1;

		return {
			handle,
			iconLabel,
			bgLabel,
		};
	}

	animateAndDespawn() {
		this.handle.CanCollide = false;
		this.handle.Anchored = true;

		const percentage = new Instance("NumberValue");
		percentage.Value = 0;

		percentage.Changed.Connect((newValue) => {
			//TODO
			const currentPosition = this.handle.Position;
			const targetPosition = Players.LocalPlayer?.Character?.PrimaryPart?.Position;
			if (targetPosition) {
				const newPosition = currentPosition.Lerp(targetPosition, newValue);
				this.handle.Position = newPosition;
			}
		});

		const tween = TweenService.Create(percentage, tweenInfo, { Value: 1 });
		tween.Play();
		tween.Completed.Once(() => {
			percentage.Destroy();
			this.despawn();
		});
	}
}
