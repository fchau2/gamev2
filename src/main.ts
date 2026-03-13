import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { GameScene } from "./scenes/GameScene";
import { UIScene } from "./scenes/UIScene";
import { EndScene } from "./scenes/EndScene";
import { GameState } from "./state/GameState";

const sharedState = new GameState();

const config: Phaser.Types.Core.GameConfig = {
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
