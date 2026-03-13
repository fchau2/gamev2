import Phaser from "phaser";
import type { CharacterDefinition } from "../state/GameState";

export function createCharacterTexture(scene: Phaser.Scene, character: CharacterDefinition): string {
  const key = `character-${character.key}`;
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
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

export function createPacketTexture(scene: Phaser.Scene): string {
  const key = "packet-cube";
  if (scene.textures.exists(key)) {
    return key;
  }

  const g = scene.make.graphics({ x: 0, y: 0, add: false });
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

export function createTerminalTexture(scene: Phaser.Scene): string {
  const key = "terminal";
  if (scene.textures.exists(key)) {
    return key;
  }

  const g = scene.make.graphics({ x: 0, y: 0, add: false });
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
