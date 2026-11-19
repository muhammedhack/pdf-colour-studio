import type { OCRLanguageOption } from '../../types/ocr';

export const OCR_LANGUAGES: OCRLanguageOption[] = [
  { code: 'eng', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'mal', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'hin', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ara', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪' },
  { code: 'tam', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kan', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'tel', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ben', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'urd', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'spa', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fra', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'deu', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ita', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'por', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'rus', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'chi_sim', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'jpn', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
];

export const DEFAULT_OCR_LANGUAGE = 'eng';
