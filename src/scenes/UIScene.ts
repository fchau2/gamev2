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
  private progressFill!: Phaser.GameObjects.Rectangle;

  constructor() {
    super("UIScene");
  }

  create(): void {
    this.state = this.registry.get("state") as GameState;
    const gameScene = this.scene.get("GameScene");

    this.createTopBar();
    this.createSidebar();
    this.createPanelGrid();
    this.createControlButtons();

    gameScene.events.on("packet-delivered", (packetId: number) => {
      this.revealPacketCell(packetId);
      this.refreshHud();
    });

    gameScene.events.on("game-state-updated", () => this.refreshHud());

    this.refreshHud();
  }

  private createTopBar(): void {
    this.add.rectangle(590, 29, 1180, 58, 0x0b1833, 0.95).setScrollFactor(0).setDepth(9);
    this.add.rectangle(590, 58, 1180, 2, 0x79cbff, 0.45).setScrollFactor(0).setDepth(10);

    this.levelText = this.makeHudText(24, 12, "", 22);
    this.packetText = this.makeHudText(188, 12, "", 22);
    this.livesText = this.makeHudText(452, 12, "", 22);
    this.characterText = this.makeHudText(700, 12, "", 22);
  }

  private createSidebar(): void {
    this.add.rectangle(1010, 369, 340, 622, 0x122447, 0.95)
      .setStrokeStyle(2, 0x7ec6ff, 0.55)
      .setScrollFactor(0)
      .setDepth(7);

    this.add.text(852, 78, "REASSEMBLY TERMINAL", {
      fontFamily: "Inter, sans-serif",
      fontSize: "18px",
      color: "#e8f7ff",
      fontStyle: "700"
    }).setScrollFactor(0).setDepth(10);

    this.add.text(852, 340, "Mission Brief", {
      fontFamily: "Inter, sans-serif",
      fontSize: "20px",
      color: "#e5f4ff",
      fontStyle: "700"
    }).setScrollFactor(0).setDepth(10);

    this.add.text(852, 372, "Deliver numbered packets to the destination terminal for reassembly.", {
      fontFamily: "Inter, sans-serif",
      fontSize: "14px",
      color: "#bfdcff",
      wordWrap: { width: 304 }
    }).setScrollFactor(0).setDepth(10);

    this.add.text(852, 438, "Upcoming Network Zones", {
      fontFamily: "Inter, sans-serif",
      fontSize: "16px",
      color: "#cce8ff",
      fontStyle: "700"
    }).setScrollFactor(0).setDepth(10);

    this.add.text(852, 464, "• Level 1: Basic cables + routers\n• Level 2: Congestion nodes + tunnels\n• Level 3: Firewall barriers + moving servers", {
      fontFamily: "Inter, sans-serif",
      fontSize: "13px",
      color: "#a8cfff",
      lineSpacing: 7,
      wordWrap: { width: 304 }
    }).setScrollFactor(0).setDepth(10);

    this.add.text(852, 548, "Packets Delivered", {
      fontFamily: "Inter, sans-serif",
      fontSize: "15px",
      color: "#d3edff",
      fontStyle: "700"
    }).setScrollFactor(0).setDepth(10);

    this.add.rectangle(852, 578, 304, 18, 0x203c65, 0.95).setOrigin(0, 0).setScrollFactor(0).setDepth(10);
    this.progressFill = this.add.rectangle(852, 578, 0, 18, 0x74e7ff, 0.95).setOrigin(0, 0).setScrollFactor(0).setDepth(11);

    this.totalPacketText = this.add.text(852, 602, "", {
      fontFamily: "Inter, sans-serif",
      fontSize: "15px",
      color: "#e8f7ff",
      fontStyle: "700"
    }).setScrollFactor(0).setDepth(11);
  }

  private makeHudText(x: number, y: number, value: string, size = 18): Phaser.GameObjects.Text {
    return this.add.text(x, y, value, {
      fontFamily: "Inter, sans-serif",
      fontSize: `${size}px`,
      color: "#d8ecff",
      fontStyle: "700"
    }).setScrollFactor(0).setDepth(10);
  }

  private createPanelGrid(): void {
    const panelX = 852;
    const panelY = 112;

    this.add.rectangle(panelX + 152, panelY + 98, 304, 200, 0x0f2244, 0.9)
      .setStrokeStyle(2, 0x7dc0ff, 0.45)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(9);

    const scan = this.add.rectangle(panelX + 4, panelY + 20, 296, 2, 0x95efff, 0.45).setOrigin(0, 0).setScrollFactor(0).setDepth(12);
    this.tweens.add({ targets: scan, y: panelY + 190, duration: 2200, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    const cellSize = 50;
    const gap = 10;

    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const x = panelX + 20 + col * (cellSize + gap);
        const y = panelY + 38 + row * (cellSize + gap);

        const cell = this.add.rectangle(x, y, cellSize, cellSize, 0x223e69, 0.9)
          .setOrigin(0, 0)
          .setStrokeStyle(2, 0x86baf6, 0.35)
          .setScrollFactor(0)
          .setDepth(10)
          .setInteractive({ useHandCursor: true });

        cell.on("pointerover", () => cell.setStrokeStyle(2, 0xa5eeff, 0.9));
        cell.on("pointerout", () => cell.setStrokeStyle(2, 0x86baf6, 0.35));

        this.packetCells.push(cell);
      }
    }
  }

  private createControlButtons(): void {
    const muteButton = this.button(852, 640, "Mute", 0x9ce0ff);
    const restartButton = this.button(1010, 640, "Restart", 0xffc3cf);

    muteButton.label.on("pointerdown", () => {
      this.state.muted = !this.state.muted;
      muteButton.label.setText(this.state.muted ? "Unmute" : "Mute");
    });

    restartButton.label.on("pointerdown", () => {
      this.state.resetLevelProgress();
      this.scene.stop("GameScene");
      this.scene.stop();
      this.scene.start("GameScene", { restart: false });
      this.scene.launch("UIScene");
    });
  }

  private button(x: number, y: number, text: string, color: number): { box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
    const box = this.add.rectangle(x + 70, y + 20, 140, 40, color, 1)
      .setStrokeStyle(2, 0xe2f7ff, 0.9)
      .setScrollFactor(0)
      .setDepth(11);
    const label = this.add.text(x + 70, y + 20, text, {
      fontFamily: "Inter, sans-serif",
      fontSize: "18px",
      color: "#001733",
      fontStyle: "700"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(12);

    label.on("pointerover", () => box.setAlpha(0.85));
    label.on("pointerout", () => box.setAlpha(1));
    return { box, label };
  }

  private revealPacketCell(packetId: number): void {
    const index = Math.max(0, packetId - 1);
    const cell = this.packetCells[index];
    if (!cell) {
      return;
    }

    cell.setFillStyle(0x84edff, 0.95);
    cell.setStrokeStyle(2, 0xe8fbff, 0.8);

    this.tweens.add({ targets: cell, scaleX: 1.1, scaleY: 1.1, yoyo: true, duration: 180 });

    const tag = this.add.text(cell.x + 18, cell.y + 12, `${packetId}`, {
      fontFamily: "Inter, sans-serif",
      fontSize: "21px",
      color: "#0a2144",
      fontStyle: "700"
    }).setScrollFactor(0).setDepth(11);

    this.tweens.add({ targets: tag, alpha: 0, y: tag.y - 14, delay: 650, duration: 450, onComplete: () => tag.destroy() });
  }

  private refreshHud(): void {
    this.levelText.setText(`Level ${this.state.currentLevel}`);
    this.packetText.setText(`Packets ${this.state.levelProgress.packetsDelivered}/${this.state.levelProgress.totalPackets}`);
    this.characterText.setText(`Character ${this.state.selectedCharacter?.name ?? "None"}`);
    this.livesText.setText(`Health ${this.state.playerStats.health}   Lives ${this.state.playerStats.lives}`);
    this.totalPacketText.setText(`${this.state.totalPacketsDelivered} / 9`);

    const progress = Phaser.Math.Clamp(this.state.totalPacketsDelivered / 9, 0, 1);
    this.progressFill.width = 304 * progress;
  }
}
