/** TTS Narrator — plays narration on host device only */

const LANG = 'ru-RU';

class Narrator {
  private enabled = true;
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
      // Load voices (async on some browsers)
      const loadVoice = () => {
        const voices = this.synth!.getVoices();
        this.voice = voices.find(v => v.lang.startsWith('ru')) || voices[0] || null;
      };
      loadVoice();
      this.synth.addEventListener('voiceschanged', loadVoice);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  async speak(text: string): Promise<void> {
    if (!this.enabled || !this.synth) return;
    this.stop();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG;
      utterance.rate = 0.9;
      utterance.pitch = 0.85;
      utterance.volume = 1;
      if (this.voice) utterance.voice = this.voice;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      this.synth!.speak(utterance);
    });
  }

  stop() {
    this.synth?.cancel();
  }
}

export const narrator = new Narrator();
