export function playCrunchSound() {
  const audio = new Audio("/sounds/crunch.wav");
  audio.volume = 0.5; // Adjust volume as needed
  audio.play().catch((error) => {
    console.log("Error playing crunch sound:", error);
  });
}

export function playClickSound() {
  const audio = new Audio("/sounds/click.wav");
  audio.volume = 0.5; // Adjust volume as needed
  audio.play().catch((error) => {
    console.log("Error playing click sound:", error);
  });
}

export function play1xMultiplierSound() {
  const audio = new Audio("/sounds/multipliers/1x.mp3");
  audio.volume = 0.5; // Adjust volume as needed
  audio.play().catch((error) => {
    console.log("Error playing 1x multiplier sound:", error);
  });
}

export function play2xMultiplierSound() {
  const audio = new Audio("/sounds/multipliers/2x.wav");
  audio.volume = 0.5; // Adjust volume as needed
  audio.play().catch((error) => {
    console.log("Error playing 2x multiplier sound:", error);
  });
}

export function play10xMultiplierSound() {
  const audio = new Audio("/sounds/multipliers/10x.wav");
  audio.volume = 0.5; // Adjust volume as needed
  audio.play().catch((error) => {
    console.log("Error playing 3x multiplier sound:", error);
  });
}

export function play100xMultiplierSound() {
  const audio = new Audio("/sounds/multipliers/100x.wav");
  audio.volume = 0.5; // Adjust volume as needed
  audio.play().catch((error) => {
    console.log("Error playing 3x multiplier sound:", error);
  });
}

export function play1000xMultiplierSound() {
  const audio = new Audio("/sounds/multipliers/1000x.wav");
  audio.volume = 0.5; // Adjust volume as needed
  audio.play().catch((error) => {
    console.log("Error playing 500x multiplier sound:", error);
  });
}
