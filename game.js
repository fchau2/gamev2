(() => {
  class GameState {
    constructor() {
      this.selectedCharacter = null;
      this.currentLevel = 1;
      this.totalPacketsDelivered = 0;
      this.levelProgress = { levelId: 1, packetsDelivered: 0, totalPackets: 3 };
      this.packetQueue = [
        { id: 1, delivered: false },
        { id: 2, delivered: false },
        { id: 3, delivered: false }
      ];
      this.playerStats = { lives: 3, health: 3 };
      this.muted = false;
    }

    resetLevelProgress() {
      this.levelProgress.packetsDelivered = 0;
      this.packetQueue.forEach((packet) => {
        packet.delivered = false;
      });
      this.playerStats.health = 3;
    }

    markPacketDelivered(packetId) {
      const packet = this.packetQueue.find((item) => item.id === packetId);
      if (!packet || packet.delivered) {
        return;
      }

      packet.delivered = true;
      this.levelProgress.packetsDelivered += 1;
      this.totalPacketsDelivered += 1;
    }

    getNextUndeliveredPacket() {
      return this.packetQueue.find((packet) => !packet.delivered);
    }

    isLevelComplete() {
      return this.levelProgress.packetsDelivered >= this.levelProgress.totalPackets;
    }

    resetRun() {
      this.currentLevel = 1;
      this.totalPacketsDelivered = 0;
      this.levelProgress.levelId = 1;
      this.resetLevelProgress();
      this.playerStats.lives = 3;
    }
  }

  const CHARACTERS = [
    {
      key: "robot",
      name: "Robot Courier",
      color: 0x57c7ff,
      accent: 0x90f5ff,
      description: "Precision delivery drone built for reliable packet transfer."
    },
    {
      key: "engineer",
      name: "Network Engineer",
      color: 0xf2a75b,
      accent: 0xffe3be,
      description: "Adaptive field specialist who keeps data flowing smoothly."
    },
    {
      key: "aibot",
      name: "Cute AI Bot",
      color: 0x8cf28c,
      accent: 0xd8ffd1,
      description: "Friendly autonomous helper with excellent routing instincts."
    }
  ];

  function createCharacterTexture(scene, character) {
    const key = `character-${character.key}`;
    if (scene.textures.exists(key)) {
      return key;
    }

    const graphics = scene.add.graphics();
    graphics.fillStyle(character.color, 1);
    graphics.fillRoundedRect(4, 8, 40, 44, 14);
    graphics.fillStyle(character.accent, 1);
    graphics.fillCircle(24, 18, 11);
    graphics.fillStyle(0x0f1d37, 0.95);
    graphics.fillCircle(19, 16, 2);
    graphics.fillCircle(29, 16, 2);
    graphics.fillStyle(0xffffff, 0.45);
    graphics.fillRoundedRect(13, 30, 22, 8, 4);

    graphics.generateTexture(key, 48, 56);
    graphics.destroy();
    return key;
  }

  function createPacketTexture(scene) {
    const key = "packet-cube";
    if (scene.textures.exists(key)) {
      return key;
    }

    const g = scene.add.graphics();
    g.fillStyle(0x7dd3ff, 1);
    g.fillRoundedRect(2, 2, 28, 28, 6);
    g.lineStyle(2, 0xdaf6ff, 0.9);
    g.strokeRoundedRect(2, 2, 28, 28, 6);
    g.fillStyle(0xffffff, 0.35);
    g.fillRoundedRect(6, 6, 12, 8, 4);
    g.generateTexture(key, 32, 32);
    g.destroy();

    return key;
  }

  function createTerminalTexture(scene) {
    const key = "terminal";
    if (scene.textures.exists(key)) {
      return key;
    }

    const g = scene.add.graphics();
    g.fillStyle(0x223868, 1);
    g.fillRoundedRect(0, 8, 72, 56, 10);
    g.fillStyle(0x74e8ff, 0.85);
    g.fillRoundedRect(8, 16, 56, 28, 8);
    g.fillStyle(0x0f1d37, 0.8);
    g.fillRoundedRect(20, 48, 32, 8, 4);
    g.generateTexture(key, 72, 64);
    g.destroy();

    return key;
  }

  class AudioManager {
    constructor(scene) {
      this.scene = scene;
    }

    playTone(type, muted) {
      if (muted) {
        return;
      }

      const soundManager = this.scene.sound;
      if (!Object.prototype.hasOwnProperty.call(soundManager, "context") && !("context" in soundManager)) {
        return;
      }

      const context = soundManager.context;
      if (!context) {
        return;
      }

      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      const profile = {
        jump: { frequency: 260, end: 380, curve: "triangle" },
        pickup: { frequency: 420, end: 560, curve: "sine" },
        delivery: { frequency: 520, end: 700, curve: "square" },
        damage: { frequency: 180, end: 120, curve: "sawtooth" },
        complete: { frequency: 380, end: 820, curve: "triangle" }
      };

      const selected = profile[type];
      oscillator.type = selected.curve;
      oscillator.frequency.setValueAtTime(selected.frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(selected.end, 40), now + 0.2);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.24);
    }
  }

  class BootScene extends Phaser.Scene {
    constructor() {
      super("BootScene");
    }

    create() {
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

  class MenuScene extends Phaser.Scene {
    constructor() {
      super("MenuScene");
    }

    create() {
      this.state = this.registry.get("state");
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

  class CharacterSelectScene extends Phaser.Scene {
    constructor() {
      super("CharacterSelectScene");
    }

    create() {
      this.state = this.registry.get("state");
      const { width, height } = this.cameras.main;

      this.add.rectangle(width / 2, height / 2, width, height, 0x111f3e, 1);
      this.add.text(width / 2, 78, "Choose Your Courier", {
        fontFamily: "Inter, sans-serif",
        fontSize: "46px",
        color: "#eaf7ff",
        fontStyle: "700"
      }).setOrigin(0.5);

      const cardY = 340;
      CHARACTERS.forEach((character, index) => {
        this.createCard(character, 250 + index * 340, cardY);
      });

      this.add.text(width / 2, height - 46, "All characters play the same — your choice is visual identity.", {
        fontFamily: "Inter, sans-serif",
        fontSize: "18px",
        color: "#95b6e5"
      }).setOrigin(0.5);
    }

    createCard(character, x, y) {
      const card = this.add.rectangle(x, y, 300, 390, 0x17294f, 0.98)
        .setStrokeStyle(2, character.accent, 0.65)
        .setInteractive({ useHandCursor: true });

      const glow = this.add.circle(x, y - 80, 64, character.color, 0.2).setBlendMode(Phaser.BlendModes.ADD);
      const texture = createCharacterTexture(this, character);

      this.add.image(x, y - 80, texture).setScale(2.2);
      this.add.text(x, y + 10, character.name, {
        fontFamily: "Inter, sans-serif",
        fontSize: "28px",
        color: "#f2fbff",
        fontStyle: "700"
      }).setOrigin(0.5);

      this.add.text(x, y + 74, character.description, {
        fontFamily: "Inter, sans-serif",
        fontSize: "16px",
        color: "#c7defd",
        align: "center",
        wordWrap: { width: 240 }
      }).setOrigin(0.5);

      this.add.text(x, y + 160, "Select", {
        fontFamily: "Inter, sans-serif",
        fontSize: "22px",
        color: "#0d1b37",
        backgroundColor: "#85deff",
        padding: { x: 18, y: 8 }
      }).setOrigin(0.5);

      card.on("pointerover", () => {
        card.setFillStyle(0x1f376a, 1);
        glow.setScale(1.08);
      });

      card.on("pointerout", () => {
        card.setFillStyle(0x17294f, 0.98);
        glow.setScale(1);
      });

      card.on("pointerdown", () => {
        this.state.selectedCharacter = character;
        this.scene.start("GameScene", { restart: true });
        this.scene.launch("UIScene");
      });
    }
  }

  class GameScene extends Phaser.Scene {
    constructor() {
      super("GameScene");
      this.carriedPacketId = null;
      this.wasGrounded = false;
    }

    create(data) {
      this.state = this.registry.get("state");
      if (!this.state.selectedCharacter) {
        this.scene.start("CharacterSelectScene");
        return;
      }

      if (data && data.restart) {
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

      this.cursors = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;

      this.physics.add.collider(this.player, this.platforms);
      this.physics.add.collider(this.currentPacket || this.player, this.platforms);
      this.physics.add.collider(this.hazard, this.platforms);
      this.physics.add.overlap(this.player, this.hazard, this.handleDamage, undefined, this);
      this.physics.add.overlap(this.player, this.terminal, this.handleTerminal, undefined, this);

      this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

      this.events.on("wake", () => this.scene.restart({ restart: false }));
      this.events.emit("game-state-updated");
    }

    update() {
      if (!this.player || !this.player.active || !this.cursors) {
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

    animatePlayer(body) {
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

    drawBackground() {
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

    createPlatforms() {
      this.platforms = this.physics.add.staticGroup();

      const createGround = (x, y, width, style) => {
        const block = this.add.rectangle(x, y, width, 36, style, 1).setStrokeStyle(2, 0x90daff, 0.45);
        this.add.rectangle(x, y - 11, width - 8, 4, 0x91ecff, 0.35).setBlendMode(Phaser.BlendModes.ADD);
        this.physics.add.existing(block, true);
        this.platforms.add(block);
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

    createPlayer(character) {
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

    createTerminal() {
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

    spawnNextPacket() {
      const nextPacket = this.state.getNextUndeliveredPacket();
      if (!nextPacket) {
        return;
      }

      const packetTexture = createPacketTexture(this);
      const spawnMap = {
        1: new Phaser.Math.Vector2(380, 588),
        2: new Phaser.Math.Vector2(1080, 448),
        3: new Phaser.Math.Vector2(1660, 418)
      };

      const spot = spawnMap[nextPacket.id];
      const packet = this.physics.add.image(spot.x, spot.y, packetTexture);
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

      this.tweens.add({ targets: [packet, label], y: "-=10", duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
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

    createHazard() {
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

    handleDamage() {
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

    handleTerminal() {
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

    emitDigitalParticles(x, y, color, amount) {
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

  class UIScene extends Phaser.Scene {
    constructor() {
      super("UIScene");
      this.packetCells = [];
    }

    create() {
      this.state = this.registry.get("state");
      const gameScene = this.scene.get("GameScene");

      this.createTopBar();
      this.createSidebar();
      this.createPanelGrid();
      this.createControlButtons();

      gameScene.events.on("packet-delivered", (packetId) => {
        this.revealPacketCell(packetId);
        this.refreshHud();
      });

      gameScene.events.on("game-state-updated", () => this.refreshHud());

      this.refreshHud();
    }

    createTopBar() {
      this.add.rectangle(590, 29, 1180, 58, 0x0b1833, 0.95).setScrollFactor(0).setDepth(9);
      this.add.rectangle(590, 58, 1180, 2, 0x79cbff, 0.45).setScrollFactor(0).setDepth(10);

      this.levelText = this.makeHudText(24, 12, "", 22);
      this.packetText = this.makeHudText(188, 12, "", 22);
      this.livesText = this.makeHudText(452, 12, "", 22);
      this.characterText = this.makeHudText(700, 12, "", 22);
    }

    createSidebar() {
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

    makeHudText(x, y, value, size = 18) {
      return this.add.text(x, y, value, {
        fontFamily: "Inter, sans-serif",
        fontSize: `${size}px`,
        color: "#d8ecff",
        fontStyle: "700"
      }).setScrollFactor(0).setDepth(10);
    }

    createPanelGrid() {
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

    createControlButtons() {
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

    button(x, y, text, color) {
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

    revealPacketCell(packetId) {
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

    refreshHud() {
      this.levelText.setText(`Level ${this.state.currentLevel}`);
      this.packetText.setText(`Packets ${this.state.levelProgress.packetsDelivered}/${this.state.levelProgress.totalPackets}`);
      this.characterText.setText(`Character ${this.state.selectedCharacter ? this.state.selectedCharacter.name : "None"}`);
      this.livesText.setText(`Health ${this.state.playerStats.health}   Lives ${this.state.playerStats.lives}`);
      this.totalPacketText.setText(`${this.state.totalPacketsDelivered} / 9`);

      const progress = Phaser.Math.Clamp(this.state.totalPacketsDelivered / 9, 0, 1);
      this.progressFill.width = 304 * progress;
    }
  }

  class EndScene extends Phaser.Scene {
    constructor() {
      super("EndScene");
    }

    create() {
      this.state = this.registry.get("state");
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

  const sharedState = new GameState();

  const config = {
    type: Phaser.AUTO,
    width: 1180,
    height: 680,
    parent: "app",
    backgroundColor: "#0e1630",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 950, x: 0 },
        debug: false
      }
    },
    scene: [BootScene, MenuScene, CharacterSelectScene, GameScene, UIScene, EndScene],
    callbacks: {
      preBoot: (game) => {
        game.registry.set("state", sharedState);
      }
    }
  };

  new Phaser.Game(config);
})();
