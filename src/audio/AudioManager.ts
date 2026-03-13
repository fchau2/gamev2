import Phaser from "phaser";

type SfxType = "jump" | "pickup" | "delivery" | "damage" | "complete";

export class AudioManager {
  constructor(private readonly scene: Phaser.Scene) {}

  playTone(type: SfxType, muted: boolean): void {
    if (muted) {
      return;
    }

    const soundManager = this.scene.sound;
    if (!("context" in soundManager)) {
      return;
    }

    const context = soundManager.context;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    const profile: Record<SfxType, { frequency: number; end: number; curve: OscillatorType }> = {
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
