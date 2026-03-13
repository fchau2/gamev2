import Phaser from "phaser";
import { GameState } from "../state/GameState";

export class MenuScene extends Phaser.Scene {
  private state!: GameState;

  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.state = this.registry.get("state") as GameState;
    this.state.resetRun();

    const { width, height } = this.cameras.main;
    this.add.rectangle(width / 2, height / 2, width, height, 0x101c37, 1);

    for (let i = 0; i < 6; i += 1) {
      this.add.circle(
        Phaser.Math.Between(120, width - 120),
        Phaser.Math.Between(90, height - 90),
        Phaser.Math.Between(26, 52),
        0x63b2ff,
        0.08
      ).setBlendMode(Phaser.BlendModes.ADD);
    }

    this.add.text(width / 2, 122, "Packet Pathways", {
      fontFamily: "Inter, sans-serif",
      fontSize: "62px",
      color: "#f2fbff",
      fontStyle: "700"
    }).setOrigin(0.5);

    this.add.text(width / 2, 188, "Learn packet switching by delivering data safely across the network.", {
      fontFamily: "Inter, sans-serif",
      fontSize: "22px",
      color: "#a9c8f5"
    }).setOrigin(0.5);

    const startButton = this.add.rectangle(width / 2, 356, 280, 74, 0x3da7ff, 1)
      .setStrokeStyle(2, 0xb9ebff, 0.9)
      .setInteractive({ useHandCursor: true });

    this.add.text(startButton.x, startButton.y, "Start Mission", {
      fontFamily: "Inter, sans-serif",
      fontSize: "30px",
      color: "#08152d",
      fontStyle: "700"
    }).setOrigin(0.5);

    startButton.on("pointerover", () => startButton.setFillStyle(0x66c2ff, 1));
    startButton.on("pointerout", () => startButton.setFillStyle(0x3da7ff, 1));
    startButton.on("pointerdown", () => this.scene.start("CharacterSelectScene"));

    this.add.text(width / 2, height - 90, "Phase 1 includes one complete learning level with packet reassembly UI.", {
      fontFamily: "Inter, sans-serif",
      fontSize: "18px",
      color: "#8fa9d4"
    }).setOrigin(0.5);
  }
}
