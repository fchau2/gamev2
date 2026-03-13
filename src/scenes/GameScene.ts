import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { type CharacterDefinition, GameState } from "../state/GameState";
import { createCharacterTexture, createPacketTexture, createTerminalTexture } from "../utils/TextureFactory";

type CarryPacket = Phaser.Physics.Arcade.Image & { packetId: number };

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private hazard!: Phaser.Physics.Arcade.Image;
  private terminal!: Phaser.Physics.Arcade.Image;
  private currentPacket?: CarryPacket;
  private carriedPacketId: number | null = null;
  private audio!: AudioManager;

  constructor() {
    super("GameScene");
  }

  create(data: { restart?: boolean }): void {
    this.state = this.registry.get("state") as GameState;
    if (!this.state.selectedCharacter) {
      this.scene.start("CharacterSelectScene");
      return;
    }

    if (data.restart) {
      this.state.resetLevelProgress();
    }

    this.audio = new AudioManager(this);
    this.cameras.main.setBackgroundColor(0x0d1a35);
    this.physics.world.setBounds(0, 0, 2300, 680);
    this.cameras.main.setBounds(0, 0, 2300, 680);

    this.drawBackground();
    this.createPlatforms();
    this.createPlayer(this.state.selectedCharacter);
    this.createTerminal();
    this.spawnNextPacket();
    this.createHazard();

    this.cursors = this.input.keyboard?.createCursorKeys();

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.currentPacket ?? this.player, this.platforms);
    this.physics.add.collider(this.hazard, this.platforms);
    this.physics.add.overlap(this.player, this.hazard, this.handleDamage, undefined, this);
    this.physics.add.overlap(this.player, this.terminal, this.handleTerminal, undefined, this);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.events.on("wake", () => this.scene.restart({ restart: false }));
    this.events.emit("game-state-updated");
  }

  update(): void {
    if (!this.player?.active || !this.cursors) {
      return;
    }

    const moveSpeed = 260;
    const body = this.player.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      return;
    }

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-moveSpeed);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(moveSpeed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown && body.blocked.down) {
      this.player.setVelocityY(-520);
      this.audio.playTone("jump", this.state.muted);
    }

    if (this.currentPacket && this.carriedPacketId !== null) {
      this.currentPacket.setPosition(this.player.x, this.player.y - 44);
    }
  }

  private drawBackground(): void {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x102248, 0x102248, 0x1b386b, 0x1b386b, 1);
    sky.fillRect(0, 0, 2300, 680);

    for (let i = 0; i < 30; i += 1) {
      this.add.circle(Phaser.Math.Between(30, 2270), Phaser.Math.Between(30, 460), Phaser.Math.Between(4, 12), 0x75c8ff, 0.14)
        .setBlendMode(Phaser.BlendModes.ADD);
    }

    for (let i = 0; i < 14; i += 1) {
      this.add.rectangle(170 * i + 40, 520, 120, 6, 0x66a0de, 0.22).setAngle(-8 + i);
    }
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();

    const createGround = (x: number, y: number, width: number): void => {
      const block = this.add.rectangle(x, y, width, 36, 0x244983, 1).setStrokeStyle(2, 0x8ed8ff, 0.35);
      this.physics.add.existing(block, true);
      this.platforms.add(block as Phaser.GameObjects.GameObject);
    };

    createGround(240, 642, 480);
    createGround(760, 642, 430);
    createGround(1260, 642, 440);
    createGround(1740, 642, 370);
    createGround(2110, 642, 320);

    createGround(1020, 500, 180);
    createGround(1500, 470, 180);
  }

  private createPlayer(character: CharacterDefinition): void {
    const texture = createCharacterTexture(this, character);
    this.player = this.physics.add.sprite(120, 560, texture).setScale(1.4);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.04);
    this.player.body.setSize(28, 40).setOffset(10, 10);

    this.tweens.add({
      targets: this.player,
      duration: 1200,
      alpha: { from: 0.87, to: 1 },
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  private createTerminal(): void {
    const terminalTexture = createTerminalTexture(this);
    this.terminal = this.physics.add.image(2160, 580, terminalTexture);
    this.terminal.setImmovable(true);
    this.terminal.setAllowGravity(false);

    this.add.text(2160, 528, "Destination Terminal", {
      fontFamily: "Inter, sans-serif",
      fontSize: "18px",
      color: "#d2eeff"
    }).setOrigin(0.5);
  }

  private spawnNextPacket(): void {
    const nextPacket = this.state.getNextUndeliveredPacket();
    if (!nextPacket) {
      return;
    }

    const packetTexture = createPacketTexture(this);
    const spawnMap: Record<number, Phaser.Math.Vector2> = {
      1: new Phaser.Math.Vector2(380, 588),
      2: new Phaser.Math.Vector2(1080, 448),
      3: new Phaser.Math.Vector2(1660, 418)
    };

    const spot = spawnMap[nextPacket.id];
    const packet = this.physics.add.image(spot.x, spot.y, packetTexture) as CarryPacket;
    packet.packetId = nextPacket.id;
    packet.setBounce(0.1);
    packet.setCollideWorldBounds(true);

    const label = this.add.text(packet.x, packet.y, `${packet.packetId}`, {
      fontFamily: "Inter, sans-serif",
      fontSize: "18px",
      color: "#0d1c39",
      fontStyle: "700"
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [packet, label],
      y: `-=${10}`,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.physics.add.collider(packet, this.platforms);
    this.physics.add.overlap(this.player, packet, () => {
      if (this.carriedPacketId !== null) {
        return;
      }
      this.carriedPacketId = packet.packetId;
      this.currentPacket = packet;
      packet.setAllowGravity(false);
      packet.setVelocity(0, 0);
      label.destroy();
      this.audio.playTone("pickup", this.state.muted);
      this.events.emit("packet-picked", this.carriedPacketId);
    });

    this.currentPacket = packet;
  }

  private createHazard(): void {
    const packetTexture = createPacketTexture(this);
    this.hazard = this.physics.add.image(1320, 616, packetTexture);
    this.hazard.setDisplaySize(48, 18);
    this.hazard.setTint(0xff607a);
    this.hazard.setImmovable(true);
    this.hazard.setAllowGravity(false);

    this.tweens.add({
      targets: this.hazard,
      x: 1450,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  private handleDamage(): void {
    this.state.playerStats.health = Math.max(0, this.state.playerStats.health - 1);
    this.audio.playTone("damage", this.state.muted);

    this.cameras.main.shake(120, 0.006);
    this.player.setTint(0xffa5b2);
    this.time.delayedCall(140, () => this.player.clearTint());

    if (this.state.playerStats.health <= 0) {
      this.state.playerStats.lives = Math.max(0, this.state.playerStats.lives - 1);
      this.state.playerStats.health = 3;
      this.player.setPosition(110, 560);
    }

    this.events.emit("game-state-updated");
  }

  private handleTerminal(): void {
    if (this.carriedPacketId === null || !this.currentPacket) {
      return;
    }

    const deliveredId = this.carriedPacketId;
    this.state.markPacketDelivered(deliveredId);
    this.audio.playTone("delivery", this.state.muted);

    this.currentPacket.destroy();
    this.currentPacket = undefined;
    this.carriedPacketId = null;

    this.events.emit("packet-delivered", deliveredId);
    this.events.emit("game-state-updated");

    if (this.state.isLevelComplete()) {
      this.audio.playTone("complete", this.state.muted);
      this.time.delayedCall(500, () => {
        this.scene.stop("UIScene");
        this.scene.start("EndScene");
      });
      return;
    }

    this.time.delayedCall(350, () => this.spawnNextPacket());
  }
}
