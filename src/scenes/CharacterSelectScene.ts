import Phaser from "phaser";
import { CHARACTERS, type CharacterDefinition, GameState } from "../state/GameState";
import { createCharacterTexture } from "../utils/TextureFactory";

export class CharacterSelectScene extends Phaser.Scene {
  private state!: GameState;

  constructor() {
    super("CharacterSelectScene");
  }

  create(): void {
    this.state = this.registry.get("state") as GameState;
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

  private createCard(character: CharacterDefinition, x: number, y: number): void {
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
