import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";
import { type CharacterDefinition, GameState } from "../state/GameState";
import { createCharacterTexture, createPacketTexture, createTerminalTexture } from "../utils/TextureFactory";

type CarryPacket = Phaser.Physics.Arcade.Image & {
  packetId: number;
  label?: Phaser.GameObjects.Text;
};

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
  private wasGrounded = false;

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
    this.cameras.main.setViewport(0, 58, 840, 622);
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

    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

    this.events.on("wake", () => this.scene.restart({ restart: false }));
    this.events.emit("game-state-updated");
  }

  update(): void {
    if (!this.player?.active || !this.cursors) {
      return;
    }

    const moveSpeed = 290;
    const accel = 40;
    const body = this.player.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      return;
    }

    const direction = Number(this.cursors.right.isDown) - Number(this.cursors.left.isDown);
    const targetVelocity = direction * moveSpeed;
    const nextVelocity = Phaser.Math.Linear(body.velocity.x, targetVelocity, 0.18);
    this.player.setVelocityX(Math.abs(nextVelocity) < accel ? 0 : nextVelocity);

    if (direction < 0) {
      this.player.setFlipX(true);
    } else if (direction > 0) {
      this.player.setFlipX(false);
    }

    if (this.cursors.up.isDown && body.blocked.down) {
      this.player.setVelocityY(-520);
      this.audio.playTone("jump", this.state.muted);
      this.player.setScale(1.52, 1.26);
      this.tweens.add({ targets: this.player, scaleX: 1.4, scaleY: 1.4, duration: 150, ease: "Sine.out" });
    }

    const grounded = body.blocked.down;
    if (grounded && !this.wasGrounded) {
      this.add.circle(this.player.x, this.player.y + 24, 12, 0xb9e7ff, 0.35)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(3);
      this.player.setScale(1.52, 1.24);
      this.tweens.add({ targets: this.player, scaleX: 1.4, scaleY: 1.4, duration: 170, ease: "Back.out" });
    }
    this.wasGrounded = grounded;

    this.animatePlayer(body);

    if (this.currentPacket && this.carriedPacketId !== null) {
      this.currentPacket.setPosition(this.player.x + (this.player.flipX ? -28 : 28), this.player.y - 34);
      this.currentPacket.setRotation(this.currentPacket.rotation + 0.03);
      this.emitDigitalParticles(this.currentPacket.x, this.currentPacket.y, 0x8ee8ff, 1);
    }
  }

  private animatePlayer(body: Phaser.Physics.Arcade.Body): void {
    if (!body.blocked.down) {
      this.player.setTint(0xd8f3ff);
      return;
    }

    this.player.clearTint();
    const running = Math.abs(body.velocity.x) > 25;
    if (running) {
      const wobble = Math.sin(this.time.now * 0.022) * 0.05;
      this.player.setAngle(wobble * 12);
    } else {
      this.player.setAngle(0);
      this.player.y += Math.sin(this.time.now * 0.005) * 0.02;
    }
  }

  private drawBackground(): void {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x08152f, 0x08152f, 0x15325d, 0x15325d, 1);
    sky.fillRect(0, 0, 2300, 680);

    for (let i = 0; i < 24; i += 1) {
      this.add.rectangle(100 * i + Phaser.Math.Between(-30, 30), 420 + Phaser.Math.Between(-120, 80), Phaser.Math.Between(26, 42), Phaser.Math.Between(80, 180), 0x1a2f57, 0.45)
        .setStrokeStyle(1, 0x7bc6ff, 0.15);
    }

    for (let i = 0; i < 34; i += 1) {
      const line = this.add.rectangle(Phaser.Math.Between(20, 2280), Phaser.Math.Between(80, 640), Phaser.Math.Between(100, 260), 2, 0x73bdff, 0.16).setAngle(Phaser.Math.Between(-15, 15));
      this.tweens.add({ targets: line, alpha: { from: 0.08, to: 0.28 }, duration: Phaser.Math.Between(900, 1600), yoyo: true, repeat: -1 });
    }

    for (let i = 0; i < 60; i += 1) {
      const particle = this.add.circle(Phaser.Math.Between(10, 2290), Phaser.Math.Between(40, 660), Phaser.Math.Between(1, 3), 0x89d8ff, 0.35).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: particle, y: particle.y - Phaser.Math.Between(12, 40), alpha: 0.04, duration: Phaser.Math.Between(2000, 4200), yoyo: true, repeat: -1 });
    }

    for (let i = 0; i < 12; i += 1) {
      const signal = this.add.circle(180 * i + 80, 260 + Phaser.Math.Between(-40, 50), 4, 0xa8ecff, 0.5).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: signal, x: signal.x + Phaser.Math.Between(120, 220), duration: Phaser.Math.Between(2600, 3800), repeat: -1, yoyo: true, ease: "Sine.inOut" });
    }
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();

    const createGround = (x: number, y: number, width: number, style: number): void => {
      const block = this.add.rectangle(x, y, width, 36, style, 1).setStrokeStyle(2, 0x90daff, 0.45);
      this.add.rectangle(x, y - 11, width - 8, 4, 0x91ecff, 0.35).setBlendMode(Phaser.BlendModes.ADD);
      this.physics.add.existing(block, true);
      this.platforms.add(block as Phaser.GameObjects.GameObject);
    };

    createGround(240, 642, 480, 0x244983);
    createGround(760, 642, 430, 0x2a4d7f);
    createGround(1260, 642, 440, 0x294570);
    createGround(1740, 642, 370, 0x214160);
    createGround(2110, 642, 320, 0x244983);

    createGround(1020, 500, 180, 0x305f96);
    createGround(1500, 470, 180, 0x305f96);

    this.add.text(1020, 457, "Router", { fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#cfe9ff" }).setOrigin(0.5);
    this.add.text(1500, 427, "Router", { fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#cfe9ff" }).setOrigin(0.5);
  }

  private createPlayer(character: CharacterDefinition): void {
    const texture = createCharacterTexture(this, character);
    this.player = this.physics.add.sprite(120, 560, texture).setScale(1.4);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.04);

    const playerBody = this.player.body;
    if (playerBody instanceof Phaser.Physics.Arcade.Body) {
      playerBody.setSize(28, 40).setOffset(10, 10);
    }

    this.add.circle(this.player.x, this.player.y - 8, 40, character.accent, 0.17).setBlendMode(Phaser.BlendModes.ADD);
  }

  private createTerminal(): void {
    const terminalTexture = createTerminalTexture(this);
    this.terminal = this.physics.add.image(2160, 580, terminalTexture);
    this.terminal.setImmovable(true);
    const terminalBody = this.terminal.body;
    if (terminalBody instanceof Phaser.Physics.Arcade.Body) {
      terminalBody.setAllowGravity(false);
    }

    this.add.text(2160, 528, "Destination Terminal", {
      fontFamily: "Inter, sans-serif",
      fontSize: "18px",
      color: "#d2eeff"
    }).setOrigin(0.5);

    const pulse = this.add.circle(2160, 574, 46, 0x83e5ff, 0.14).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: pulse, scale: 1.2, alpha: 0.04, duration: 900, yoyo: true, repeat: -1 });
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
    packet.label = label;

    this.tweens.add({ targets: [packet, label], y: `-=${10}`, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: packet, angle: 360, duration: 4600, repeat: -1, ease: "Linear" });

    this.physics.add.collider(packet, this.platforms);
    this.physics.add.overlap(this.player, packet, () => {
      if (this.carriedPacketId !== null) {
        return;
      }
      this.carriedPacketId = packet.packetId;
      this.currentPacket = packet;
      const packetBody = packet.body;
      if (packetBody instanceof Phaser.Physics.Arcade.Body) {
        packetBody.setAllowGravity(false);
      }
      packet.setVelocity(0, 0);
      label.destroy();
      this.emitDigitalParticles(packet.x, packet.y, 0xd5fbff, 18);
      this.audio.playTone("pickup", this.state.muted);
      this.events.emit("packet-picked", this.carriedPacketId);
    });

    this.currentPacket = packet;
  }

  private createHazard(): void {
    const packetTexture = createPacketTexture(this);
    this.hazard = this.physics.add.image(1320, 616, packetTexture);
    this.hazard.setDisplaySize(56, 24);
    this.hazard.setTint(0xff607a);
    this.hazard.setImmovable(true);
    const hazardBody = this.hazard.body;
    if (hazardBody instanceof Phaser.Physics.Arcade.Body) {
      hazardBody.setAllowGravity(false);
    }

    const eyeLeft = this.add.circle(this.hazard.x - 8, this.hazard.y - 2, 2, 0xffffff, 0.8);
    const eyeRight = this.add.circle(this.hazard.x + 8, this.hazard.y - 2, 2, 0xffffff, 0.8);
    this.tweens.add({ targets: [eyeLeft, eyeRight], alpha: 0.12, duration: 220, yoyo: true, repeat: -1, repeatDelay: 1100 });

    this.tweens.add({
      targets: [this.hazard, eyeLeft, eyeRight],
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

    const beam = this.add.rectangle(this.terminal.x, this.terminal.y - 60, 10, 130, 0x9ff3ff, 0.34).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: beam, scaleX: 3, alpha: 0, duration: 300, onComplete: () => beam.destroy() });

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

  private emitDigitalParticles(x: number, y: number, color: number, amount: number): void {
    for (let i = 0; i < amount; i += 1) {
      const p = this.add.circle(x, y, Phaser.Math.Between(1, 3), color, 0.85).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-34, 34),
        y: y + Phaser.Math.Between(-28, 28),
        alpha: 0,
        scale: 0.3,
        duration: Phaser.Math.Between(240, 520),
        onComplete: () => p.destroy()
      });
    }
  }
}
