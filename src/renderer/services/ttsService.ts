const preferredVoiceNames = [
  "microsoft guy",
  "microsoft ryan",
  "microsoft christopher",
  "microsoft eric",
  "microsoft david",
  "guy",
  "ryan",
  "christopher",
  "eric",
  "daniel",
  "david",
  "male",
  "boy",
  "young"
];

export async function speak(text: string, onEnd: () => void, onError?: () => void) {
  if (!("speechSynthesis" in window)) {
    onError?.();
    onEnd();
    return;
  }

  const speechText = prepareEnglishSpeechText(text);

  if (!speechText) {
    onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(speechText);
  const voice = await pickNaturalYoungEnglishVoice();

  utterance.lang = voice?.lang || "en-US";
  utterance.voice = voice;
  utterance.rate = 0.94;
  utterance.pitch = 1.16;
  utterance.volume = 1.0;

  utterance.onend = () => {
    onEnd();
  };

  utterance.onerror = () => {
    onError?.();
    onEnd();
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

async function pickNaturalYoungEnglishVoice(): Promise<SpeechSynthesisVoice | null> {
  const voices = await getVoices();
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en-"));

  return (
    findPreferredVoice(englishVoices, true) ??
    findPreferredVoice(englishVoices, false) ??
    englishVoices.find((voice) => voice.lang === "en-US" && voice.localService) ??
    englishVoices.find((voice) => voice.lang === "en-US") ??
    englishVoices.find((voice) => voice.localService) ??
    englishVoices[0] ??
    null
  );
}

export function prepareEnglishSpeechText(text: string): string {
  return stripEmojiForSpeech(text)
    .replace(/(\d+(?:\.\d+)?)\s*小时/g, "$1 hours")
    .replace(/(\d+(?:\.\d+)?)\s*分钟/g, "$1 minutes")
    .replace(/(\d+(?:\.\d+)?)\s*秒/g, "$1 seconds")
    .replace(/[，。！？：；、]/g, (mark) => {
      const punctuation: Record<string, string> = {
        "，": ",",
        "。": ".",
        "！": "!",
        "？": "?",
        "：": ":",
        "；": ";",
        "、": ","
      };

      return punctuation[mark] ?? " ";
    })
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+/gu, " ")
    .replace(/\b\d+(?:\.\d+)?\b/g, (value) => numberToEnglish(value))
    .replace(/\s+([,.!?:;])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function findPreferredVoice(voices: SpeechSynthesisVoice[], localOnly: boolean): SpeechSynthesisVoice | null {
  return (
    voices.find((voice) => {
      const name = voice.name.toLowerCase();
      return (!localOnly || voice.localService) && preferredVoiceNames.some((preferred) => name.includes(preferred));
    }) ?? null
  );
}

function getVoices(): Promise<SpeechSynthesisVoice[]> {
  const voices = window.speechSynthesis.getVoices();

  if (voices.length > 0) {
    return Promise.resolve(voices);
  }

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.speechSynthesis.onvoiceschanged = null;
      resolve(window.speechSynthesis.getVoices());
    }, 800);

    window.speechSynthesis.onvoiceschanged = () => {
      window.clearTimeout(timeout);
      window.speechSynthesis.onvoiceschanged = null;
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

function stripEmojiForSpeech(text: string): string {
  return text
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, " ")
    .replace(/[:;=8xX][-']?[)(DPpOo/\\|]/g, " ")
    .replace(/[~*_`#>|[\]{}<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numberToEnglish(value: string): string {
  if (value.includes(".")) {
    const [integerPart, decimalPart] = value.split(".");
    const integerText = integerToEnglish(integerPart);
    const decimalText = decimalPart
      .split("")
      .map((digit) => digitToEnglish(digit))
      .join(" ");

    return `${integerText} point ${decimalText}`;
  }

  return integerToEnglish(value);
}

function integerToEnglish(value: string): string {
  if (value.length > 1 && value.startsWith("0")) {
    return value
      .split("")
      .map((digit) => digitToEnglish(digit))
      .join(" ");
  }

  const numberValue = Number(value);

  if (!Number.isSafeInteger(numberValue) || numberValue < 0) {
    return value
      .split("")
      .map((digit) => digitToEnglish(digit))
      .join(" ");
  }

  return safeIntegerToEnglish(numberValue);
}

function safeIntegerToEnglish(value: number): string {
  const smallNumbers = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen"
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

  if (value < 20) {
    return smallNumbers[value];
  }

  if (value < 100) {
    const ten = Math.floor(value / 10);
    const rest = value % 10;
    return rest === 0 ? tens[ten] : `${tens[ten]} ${smallNumbers[rest]}`;
  }

  if (value < 1000) {
    const hundred = Math.floor(value / 100);
    const rest = value % 100;
    return rest === 0 ? `${smallNumbers[hundred]} hundred` : `${smallNumbers[hundred]} hundred ${safeIntegerToEnglish(rest)}`;
  }

  if (value < 1000000) {
    const thousand = Math.floor(value / 1000);
    const rest = value % 1000;
    return rest === 0
      ? `${safeIntegerToEnglish(thousand)} thousand`
      : `${safeIntegerToEnglish(thousand)} thousand ${safeIntegerToEnglish(rest)}`;
  }

  return value
    .toString()
    .split("")
    .map((digit) => digitToEnglish(digit))
    .join(" ");
}

function digitToEnglish(digit: string): string {
  const digits: Record<string, string> = {
    "0": "zero",
    "1": "one",
    "2": "two",
    "3": "three",
    "4": "four",
    "5": "five",
    "6": "six",
    "7": "seven",
    "8": "eight",
    "9": "nine"
  };

  return digits[digit] ?? digit;
}
