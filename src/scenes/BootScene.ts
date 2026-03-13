import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0e1630, 1);
    this.add.circle(width / 2, height / 2, 140, 0x61b7ff, 0.15).setBlendMode(Phaser.BlendModes.ADD);
    this.add.text(width / 2, height / 2 - 20, "Packet Pathways", {
      fontFamily: "Inter, sans-serif",
      fontSize: "48px",
      color: "#e9f6ff",
      fontStyle: "700"
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 42, "Phase 1 Boot Sequence", {
      fontFamily: "Inter, sans-serif",
      fontSize: "20px",
      color: "#9fc8ff"
    }).setOrigin(0.5);

    this.time.delayedCall(900, () => {
      this.scene.start("MenuScene");
    });
  }
}
