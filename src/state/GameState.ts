export type CharacterKey = "robot" | "engineer" | "aibot";

export interface CharacterDefinition {
  key: CharacterKey;
  name: string;
  color: number;
  accent: number;
  description: string;
}

export interface PacketInfo {
  id: number;
  delivered: boolean;
}

export interface LevelProgress {
  levelId: number;
  packetsDelivered: number;
  totalPackets: number;
}

export interface PlayerStats {
  lives: number;
  health: number;
}

export class GameState {
  public selectedCharacter: CharacterDefinition | null = null;
  public currentLevel = 1;
  public totalPacketsDelivered = 0;
  public levelProgress: LevelProgress = {
    levelId: 1,
    packetsDelivered: 0,
    totalPackets: 3
  };
  public packetQueue: PacketInfo[] = [
    { id: 1, delivered: false },
    { id: 2, delivered: false },
    { id: 3, delivered: false }
  ];
  public playerStats: PlayerStats = {
    lives: 3,
    health: 3
  };
  public muted = false;

  resetLevelProgress(): void {
    this.levelProgress.packetsDelivered = 0;
    this.packetQueue.forEach((packet) => {
      packet.delivered = false;
    });
    this.playerStats.health = 3;
  }

  markPacketDelivered(packetId: number): void {
    const packet = this.packetQueue.find((item) => item.id === packetId);
    if (!packet || packet.delivered) {
      return;
    }

    packet.delivered = true;
    this.levelProgress.packetsDelivered += 1;
    this.totalPacketsDelivered += 1;
  }

  getNextUndeliveredPacket(): PacketInfo | undefined {
    return this.packetQueue.find((packet) => !packet.delivered);
  }

  isLevelComplete(): boolean {
    return this.levelProgress.packetsDelivered >= this.levelProgress.totalPackets;
  }

  resetRun(): void {
    this.currentLevel = 1;
    this.totalPacketsDelivered = 0;
    this.levelProgress.levelId = 1;
    this.resetLevelProgress();
    this.playerStats.lives = 3;
  }
}

export const CHARACTERS: CharacterDefinition[] = [
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
