/** Small Web Audio facade. It never creates audio until the first player action. */
export class AudioManager {
  private context: AudioContext | null = null;
  play(kind: 'click' | 'cash' | 'error', volume: number, muted: boolean) {
    if (muted || volume <= 0 || typeof window === 'undefined') return;
    try {
      this.context ??= new AudioContext();
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = kind === 'cash' ? 'triangle' : 'sine';
      osc.frequency.value = kind === 'cash' ? 740 : kind === 'error' ? 170 : 380;
      gain.gain.setValueAtTime(Math.min(0.07, volume / 1000), this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + (kind === 'cash' ? 0.16 : 0.09));
      osc.connect(gain).connect(this.context.destination);
      osc.start(); osc.stop(this.context.currentTime + 0.18);
    } catch { /* audio is optional */ }
  }
}
