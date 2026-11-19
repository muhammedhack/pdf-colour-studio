export interface TTSCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: Error) => void;
  onWordBoundary?: (word: string, charIndex: number) => void;
}

export interface TTSOptions {
  rate?: number; // 0.5 to 2.0
  pitch?: number; // 0.5 to 1.5
  lang?: string;
}

class TextToSpeechService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isPaused = false;
  private currentCallbacks: TTSCallbacks = {};

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  /**
   * Find best matching voice for a language code (e.g., 'eng' -> 'en', 'mal' -> 'ml', 'hin' -> 'hi')
   */
  public findVoiceForLang(langCode: string): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (!voices || voices.length === 0) return null;

    const langMap: Record<string, string> = {
      eng: 'en',
      mal: 'ml',
      hin: 'hi',
      ara: 'ar',
      tam: 'ta',
      kan: 'kn',
      tel: 'te',
      ben: 'bn',
      urd: 'ur',
      spa: 'es',
      fra: 'fr',
      deu: 'de',
      ita: 'it',
      por: 'pt',
      rus: 'ru',
      chi_sim: 'zh',
      jpn: 'ja',
    };

    const targetPrefix = langMap[langCode] || langCode.slice(0, 2);
    // Find voice starting with targetPrefix
    const match = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));
    return match || null;
  }

  public speak(text: string, options: TTSOptions = {}, callbacks: TTSCallbacks = {}): void {
    if (!this.isSupported()) {
      callbacks.onError?.(new Error('Speech synthesis is not supported in this browser.'));
      return;
    }

    this.stop();

    if (!text.trim()) {
      callbacks.onEnd?.();
      return;
    }

    this.currentCallbacks = callbacks;

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    if (options.lang) {
      const voice = this.findVoiceForLang(options.lang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      this.currentCallbacks.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.currentCallbacks.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      // 'interrupted' is normal when user hits stop
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        this.currentCallbacks.onError?.(new Error(`TTS Error: ${e.error}`));
      }
    };

    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        const charIndex = e.charIndex;
        const remaining = text.slice(charIndex);
        const match = remaining.match(/^\S+/);
        const word = match ? match[0] : '';
        this.currentCallbacks.onWordBoundary?.(word, charIndex);
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err: unknown) {
      this.currentCallbacks.onError?.(err instanceof Error ? err : new Error('Failed to start speech synthesis'));
    }
  }

  public pause(): void {
    if (this.isSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      this.isPaused = true;
    }
  }

  public resume(): void {
    if (this.isSupported() && this.isPaused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
    }
  }

  public stop(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
    }
  }

  public getStatus(): { isSpeaking: boolean; isPaused: boolean; hasActiveUtterance: boolean } {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      hasActiveUtterance: this.currentUtterance !== null,
    };
  }
}

export const ttsService = new TextToSpeechService();
