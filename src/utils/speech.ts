// Quản lý âm thanh: Bản thu âm gốc của cô giáo, giọng đọc tiếng Việt tự nhiên và hiệu ứng nốt nhạc

class SoundService {
  private audioCtx: AudioContext | null = null;
  private teacherAudio: HTMLAudioElement | null = null;
  private speechAudio: HTMLAudioElement | null = null;
  private onPlaybackStateChange: ((isPlaying: boolean) => void) | null = null;
  private onSpeechStateChange: ((isPlaying: boolean) => void) | null = null;

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

  // Phát âm giọng đọc tiếng Việt tự nhiên bản ngữ (thay thế giọng robot)
  speak(text: string, onStateChange?: (isPlaying: boolean) => void) {
    if (typeof window === "undefined") return;

    const trimmed = text.trim();
    if (!trimmed) return;

    this.stopSpeech();
    this.onSpeechStateChange = onStateChange || null;

    // 1. Ưu tiên phát bằng Natural TTS API (chuẩn giọng người Việt tự nhiên, có ngữ điệu)
    try {
      const audioUrl = `/api/tts?text=${encodeURIComponent(trimmed)}`;
      this.speechAudio = new Audio(audioUrl);

      this.speechAudio.onplay = () => {
        if (this.onSpeechStateChange) this.onSpeechStateChange(true);
      };

      this.speechAudio.onended = () => {
        if (this.onSpeechStateChange) this.onSpeechStateChange(false);
        this.speechAudio = null;
      };

      this.speechAudio.onerror = () => {
        // Fallback sang Web Speech API nếu lỗi mạng
        this.fallbackWebSpeech(trimmed);
      };

      this.speechAudio.play().catch(() => {
        this.fallbackWebSpeech(trimmed);
      });
    } catch {
      this.fallbackWebSpeech(trimmed);
    }
  }

  // Dự phòng khi offline: Web Speech API có lọc giọng tiếng Việt tự nhiên nhất
  private fallbackWebSpeech(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (this.onSpeechStateChange) this.onSpeechStateChange(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      // Ưu tiên chọn giọng tự nhiên nếu có sẵn trên máy
      const voices = window.speechSynthesis.getVoices();
      const naturalViVoice = voices.find(
        (v) =>
          v.lang.startsWith("vi") &&
          (v.name.includes("Google") ||
            v.name.includes("Linh") ||
            v.name.includes("Nam") ||
            v.name.includes("Natural") ||
            v.name.includes("Premium"))
      ) || voices.find((v) => v.lang.startsWith("vi"));

      if (naturalViVoice) {
        utterance.voice = naturalViVoice;
      }

      utterance.onstart = () => {
        if (this.onSpeechStateChange) this.onSpeechStateChange(true);
      };
      utterance.onend = () => {
        if (this.onSpeechStateChange) this.onSpeechStateChange(false);
      };
      utterance.onerror = () => {
        if (this.onSpeechStateChange) this.onSpeechStateChange(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      if (this.onSpeechStateChange) this.onSpeechStateChange(false);
    }
  }

  // Dừng toàn bộ giọng đọc
  stopSpeech() {
    if (this.speechAudio) {
      this.speechAudio.pause();
      this.speechAudio.currentTime = 0;
      this.speechAudio = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (this.onSpeechStateChange) {
      this.onSpeechStateChange(false);
    }
  }

  // Kiểm tra xem có đang đọc giọng nói không
  isSpeaking(): boolean {
    return !!(
      (this.speechAudio && !this.speechAudio.paused) ||
      (typeof window !== "undefined" &&
        "speechSynthesis" in window &&
        window.speechSynthesis.speaking)
    );
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
