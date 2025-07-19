export type IAvailableUpgrade = {
  id: number;
  name: string;
  price: number; // Optional, some upgrades may not have a price
  catchphrase: string; // Optional, some upgrades may not have a catchphrase
};

export const availableUpgrades = [
  {
    id: 0,
    name: "Taquero",
    price: 100,
    catchphrase: "Eats, sleeps, and breathes tacos for you every block",
  },
  {
    id: 1,
    name: "Salsa Bar",
    price: 3_000,
    catchphrase: "Not the dance you were expecting",
  },
  {
    id: 2,
    name: "Tortilla Tree",
    price: 25_000,
    catchphrase:
      "They say money doesn't grow on trees, but these tortillas definitley do.",
  },
  {
    id: 3,
    name: "Tortilla Factory",
    price: 150_000,
    catchphrase: "The industrial tacolution",
  },
  {
    id: 4,
    name: "Taco Submarine",
    price: 1_150_000,
    catchphrase: "Open your market reach to the deep sea",
  },
  {
    id: 5,
    name: "Taco Pyramid",
    price: 5_000_000,
    catchphrase: "Contains ancient unspoken secrets of the tacoverse",
  },
  {
    id: 6,
    name: "Tortilla Spaceship",
    price: 20_000_000,
    catchphrase: "Expand your taco empire to the stars",
  },
  {
    id: 7,
    name: "Satoshi Tacomoto",
    price: 100_000_000,
    catchphrase: "Wrote the taco whitepaper in 2008",
  },
] as const satisfies IAvailableUpgrade[];
