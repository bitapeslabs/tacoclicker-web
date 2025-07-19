import { playClickSound } from "./sounds";
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function clickHandler(callback: () => void): () => void {
  return () => {
    playClickSound();

    callback();
  };
}
