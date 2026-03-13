import Phaser from "phaser";
import { GameState } from "../state/GameState";

export class EndScene extends Phaser.Scene {
  private state!: GameState;

  constructor() {
    super("EndScene");
  }

  create(): void {
    this.state = this.registry.get("state") as GameState;
    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d1a34, 0.96);
    this.add.circle(width / 2, 200, 110, 0x7ce9ff, 0.2).setBlendMode(Phaser.BlendModes.ADD);

    this.add.text(width / 2, 170, "Level 1 Complete!", {
      fontFamily: "Inter, sans-serif",
      fontSize: "60px",
      color: "#effbff",
      fontStyle: "700"
    }).setOrigin(0.5);

    this.add.text(width / 2, 252, "Great routing! You delivered all packets to the terminal.", {
      fontFamily: "Inter, sans-serif",
      fontSize: "24px",
      color: "#afcff6"
    }).setOrigin(0.5);

    this.add.rectangle(width / 2, 332, 900, 84, 0x122447, 0.92).setStrokeStyle(2, 0x90d9ff, 0.5);
    this.add.text(width / 2, 332, "Data is split into packets so it can travel efficiently across a network.", {
      fontFamily: "Inter, sans-serif",
      fontSize: "22px",
      color: "#dff3ff",
      align: "center"
    }).setOrigin(0.5);

    this.add.text(width / 2, 394, `Packets Delivered: ${this.state.levelProgress.packetsDelivered}/3`, {
      fontFamily: "Inter, sans-serif",
      fontSize: "22px",
      color: "#d7ecff"
    }).setOrigin(0.5);

    const replay = this.add.rectangle(width / 2, 476, 260, 70, 0x68c5ff, 1)
      .setStrokeStyle(2, 0xdaf5ff, 0.95)
      .setInteractive({ useHandCursor: true });

    this.add.text(replay.x, replay.y, "Replay Level 1", {
      fontFamily: "Inter, sans-serif",
      fontSize: "28px",
      color: "#0a1a37",
      fontStyle: "700"
    }).setOrigin(0.5);

    replay.on("pointerover", () => replay.setFillStyle(0x86d4ff, 1));
    replay.on("pointerout", () => replay.setFillStyle(0x68c5ff, 1));
    replay.on("pointerdown", () => {
      this.state.resetLevelProgress();
      this.scene.start("GameScene", { restart: false });
      this.scene.launch("UIScene");
    });

    const menu = this.add.text(width / 2, 560, "Back to Menu", {
      fontFamily: "Inter, sans-serif",
      fontSize: "23px",
      color: "#9ac4ed"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menu.on("pointerdown", () => {
      this.scene.start("MenuScene");
    });
  }
}
