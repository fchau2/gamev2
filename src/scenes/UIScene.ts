import Phaser from "phaser";
import { GameState } from "../state/GameState";

export class UIScene extends Phaser.Scene {
  private state!: GameState;
  private levelText!: Phaser.GameObjects.Text;
  private packetText!: Phaser.GameObjects.Text;
  private totalPacketText!: Phaser.GameObjects.Text;
  private characterText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private packetCells: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super("UIScene");
  }

  create(): void {
    this.state = this.registry.get("state") as GameState;
    const gameScene = this.scene.get("GameScene");

    const panel = this.add.rectangle(210, 130, 360, 225, 0x122242, 0.9)
      .setStrokeStyle(2, 0x8bc7ff, 0.5)
      .setScrollFactor(0);

    this.levelText = this.makeHudText(62, 58, "");
    this.packetText = this.makeHudText(62, 88, "");
    this.totalPacketText = this.makeHudText(62, 118, "");
    this.characterText = this.makeHudText(62, 148, "");
    this.livesText = this.makeHudText(62, 178, "");

    this.createPanelGrid();
    this.createControlButtons();

    gameScene.events.on("packet-delivered", (packetId: number) => {
      this.revealPacketCell(packetId);
      this.refreshHud();
    });

    gameScene.events.on("game-state-updated", () => this.refreshHud());

    this.refreshHud();
    panel.setDepth(5);
  }

  private makeHudText(x: number, y: number, value: string): Phaser.GameObjects.Text {
    return this.add.text(x, y, value, {
      fontFamily: "Inter, sans-serif",
      fontSize: "18px",
      color: "#d8ecff"
    }).setScrollFactor(0).setDepth(6);
  }

  private createPanelGrid(): void {
    const panelX = 520;
    const panelY = 28;

    this.add.rectangle(panelX + 148, panelY + 105, 300, 210, 0x122242, 0.86)
      .setStrokeStyle(2, 0x8bc7ff, 0.5)
      .setScrollFactor(0)
      .setDepth(5);

    this.add.text(panelX + 16, panelY + 16, "Reassembly Panel", {
      fontFamily: "Inter, sans-serif",
      fontSize: "20px",
      color: "#e5f4ff",
      fontStyle: "700"
    }).setScrollFactor(0).setDepth(6);

    const cellSize = 48;
    const gap = 12;

    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const x = panelX + 24 + col * (cellSize + gap);
        const y = panelY + 52 + row * (cellSize + gap);

        const cell = this.add.rectangle(x, y, cellSize, cellSize, 0x223e69, 0.9)
          .setOrigin(0, 0)
          .setStrokeStyle(2, 0x86baf6, 0.35)
          .setScrollFactor(0)
          .setDepth(6);

        this.packetCells.push(cell);
      }
    }
  }

  private createControlButtons(): void {
    const muteButton = this.add.text(940, 56, "Mute", {
      fontFamily: "Inter, sans-serif",
      fontSize: "18px",
      color: "#001733",
      backgroundColor: "#a4deff",
      padding: { x: 14, y: 8 }
    }).setScrollFactor(0).setInteractive({ useHandCursor: true }).setDepth(8);

    const restartButton = this.add.text(1022, 56, "Restart", {
      fontFamily: "Inter, sans-serif",
      fontSize: "18px",
      color: "#001733",
      backgroundColor: "#ffc9d2",
      padding: { x: 14, y: 8 }
    }).setScrollFactor(0).setInteractive({ useHandCursor: true }).setDepth(8);

    muteButton.on("pointerdown", () => {
      this.state.muted = !this.state.muted;
      muteButton.setText(this.state.muted ? "Unmute" : "Mute");
    });

    restartButton.on("pointerdown", () => {
      this.state.resetLevelProgress();
      this.scene.stop("GameScene");
      this.scene.stop();
      this.scene.start("GameScene", { restart: false });
      this.scene.launch("UIScene");
    });
  }

  private revealPacketCell(packetId: number): void {
    const index = Math.max(0, packetId - 1);
    const cell = this.packetCells[index];
    if (!cell) {
      return;
    }

    cell.setFillStyle(0x84edff, 0.95);
    cell.setStrokeStyle(2, 0xe8fbff, 0.8);

    this.add.text(cell.x + 16, cell.y + 12, `${packetId}`, {
      fontFamily: "Inter, sans-serif",
      fontSize: "22px",
      color: "#0a2144",
      fontStyle: "700"
    }).setScrollFactor(0).setDepth(7);
  }

  private refreshHud(): void {
    this.levelText.setText(`Level: ${this.state.currentLevel}`);
    this.packetText.setText(`Packets in Level: ${this.state.levelProgress.packetsDelivered}/${this.state.levelProgress.totalPackets}`);
    this.totalPacketText.setText(`Total Delivered: ${this.state.totalPacketsDelivered}`);
    this.characterText.setText(`Character: ${this.state.selectedCharacter?.name ?? "None"}`);
    this.livesText.setText(`Lives: ${this.state.playerStats.lives}  Health: ${this.state.playerStats.health}`);
  }
}
