const preferredVoiceNames = [
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

  const speechText = stripEmojiForSpeech(text);

  if (!speechText) {
    onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(speechText);
  const voice = await pickNaturalYoungEnglishVoice();

  utterance.lang = voice?.lang ?? "en-US";
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
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));

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
