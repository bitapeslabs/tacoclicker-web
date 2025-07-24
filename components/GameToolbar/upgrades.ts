export type IAvailableUpgrade = {
  id: number;
  name: string;
  weight: number; // The weight of the upgrade, used for emissions calculations
  price: number; // Optional, some upgrades may not have a price
  catchphrase: string; // Optional, some upgrades may not have a catchphrase
};

export const availableUpgrades = [
  {
    id: 0,
    name: "Taquero",
    price: 100,
    weight: 1,
    catchphrase: "Eats, sleeps, and breathes tacos for you every block",
  },
  {
    id: 1,
    name: "Salsa Bar",
    price: 3_000,
    weight: 20,
    catchphrase: "Not the dance you were expecting",
  },
  {
    id: 2,
    name: "Tortilla Tree",
    price: 25_000,
    weight: 300,
    catchphrase:
      "They say money doesn't grow on trees, but these tortillas definitley do.",
  },
  {
    id: 3,
    name: "Tortilla Factory",
    weight: 2_400,
    price: 150_000,
    catchphrase: "The industrial tacolution",
  },
  {
    id: 4,
    name: "Taco Submarine",
    weight: 15_000,
    price: 1_150_000,
    catchphrase: "Open your market reach to the deep sea",
  },
  {
    id: 5,
    name: "Taco Pyramid",
    weight: 60_000,
    price: 5_000_000,
    catchphrase: "Contains ancient unspoken secrets of the tacoverse",
  },
  {
    id: 6,
    name: "Tortilla Spaceship",
    weight: 200_000,
    price: 20_000_000,
    catchphrase: "Expand your taco empire to the stars",
  },
  {
    id: 7,
    name: "Satoshi Tacomoto",
    weight: 1_000_000,
    price: 100_000_000,
    catchphrase: "Wrote the taco whitepaper in 2008",
  },
] as const satisfies IAvailableUpgrade[];
