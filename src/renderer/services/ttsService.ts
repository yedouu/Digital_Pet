export function speak(text: string, onEnd: () => void, onError?: () => void) {
  if (!("speechSynthesis" in window)) {
    onError?.();
    onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "en-US";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

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
