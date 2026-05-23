export function speak(text: string, onEnd: () => void, onError?: () => void) {
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

  utterance.lang = "en-US";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.voice = pickEnglishVoice();

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

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();

  return (
    voices.find((voice) => voice.lang === "en-US" && voice.localService) ??
    voices.find((voice) => voice.lang === "en-US") ??
    voices.find((voice) => voice.lang.startsWith("en-") && voice.localService) ??
    voices.find((voice) => voice.lang.startsWith("en-")) ??
    null
  );
}

function stripEmojiForSpeech(text: string): string {
  return text
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, " ")
    .replace(/[~*_`#>|[\]{}()<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
