// Quản lý âm thanh: Bản thu âm gốc của cô giáo và hiệu ứng âm thanh nốt nhạc tương tác

class SoundService {
  private audioCtx: AudioContext | null = null;
  private teacherAudio: HTMLAudioElement | null = null;
  private onPlaybackStateChange: ((isPlaying: boolean) => void) | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Phát file thu âm gốc của cô giáo từ bộ thẻ
  playTeacherAudio(url: string, onStateChange?: (isPlaying: boolean) => void) {
    if (typeof window === "undefined") return;

    this.stopTeacherAudio();

    this.onPlaybackStateChange = onStateChange || null;
    this.teacherAudio = new Audio(url);

    this.teacherAudio.onplay = () => {
      if (this.onPlaybackStateChange) this.onPlaybackStateChange(true);
    };

    this.teacherAudio.onended = () => {
      if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
      this.teacherAudio = null;
    };

    this.teacherAudio.onerror = () => {
      if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
      this.teacherAudio = null;
    };

    this.teacherAudio.play().catch((err) => {
      console.warn("Lỗi phát audio:", err);
      if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
    });
  }

  // Dừng phát bản thu của cô giáo
  stopTeacherAudio() {
    if (this.teacherAudio) {
      this.teacherAudio.pause();
      this.teacherAudio.currentTime = 0;
      this.teacherAudio = null;
    }
    if (this.onPlaybackStateChange) {
      this.onPlaybackStateChange(false);
    }
  }

  // Kiểm tra xem cô giáo có đang đọc hay không
  isTeacherAudioPlaying(): boolean {
    return !!(this.teacherAudio && !this.teacherAudio.paused);
  }

  // Hiệu ứng âm thanh khi bấm đếm một con vật (nốt nhạc đàn vui tai)
  playCountTone(countIndex: number) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 261.63; // C4
    const scale = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8, 2, 9 / 4, 5 / 2];
    const freq = baseFreq * (scale[(countIndex - 1) % scale.length] || 1);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  // Phát một nốt nhạc đơn tần số freq trong duration giây
  playTone(freq: number, duration: number = 0.15) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Lỗi phát tone:", e);
    }
  }

  // Hiệu ứng hoàn thành thành công (tiếng chuông hân hoan)
  playSuccessSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);

      gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.4);
    });
  }
}

export const sound = new SoundService();
