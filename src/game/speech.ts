/** Read maths aloud with the browser's own voice: no key, no network. Speech is a bonus, never a requirement. */
export function sayText(text: string): string {
  return text
    .replace(/(\d)\s*×\s*(\d)/g, '$1 times $2').replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/−/g, ' minus ')
    .replace(/\+/g, ' plus ').replace(/=\s*\?/g, ' equals what?').replace(/=/g, ' equals ').replace(/%/g, ' percent')
    .replace(/\?\s*\(/g, 'what (').replace(/\s+/g, ' ').trim();
}
export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
export function speak(text: string) {
  if (!canSpeak()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(sayText(text));
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch { /* no voice: the words are on screen */ }
}
export function stopSpeaking() { try { if (canSpeak()) window.speechSynthesis.cancel(); } catch { /* ignore */ } }
