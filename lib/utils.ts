import { playClickSound, playClickBackSound } from "./sounds";
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function clickHandler(
  callback: () => void,
  clickBackSound?: boolean
): () => void {
  return () => {
    if (!clickBackSound) {
      playClickSound();
    } else {
      playClickBackSound();
    }
    callback();
  };
}
