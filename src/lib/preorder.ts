/*
 * The jallabiya preorder: what it costs, how many there are, and which
 * sizes it comes in. Shared by the Loom and the server, so the price the
 * page shows is the price the server charges.
 *
 * The first run is 100 sets, split between adult and children's sizes, and
 * each set is paid for in full when it is ordered. The price covers
 * everything in the Loom: any colour, cotton or silk, any neckline design
 * and thread.
 */

export type Tier = "adult" | "children";

export const PREORDER: Record<Tier, { name: string; price: number; total: number }> = {
  // the split of the 100 is the studio's call; change the two totals here
  adult: { name: "Adult", price: 15000, total: 70 },
  children: { name: "Children", price: 12000, total: 30 },
};

/**
 * Children's lengths, shoulder to hem, by age. They climb in four inch steps
 * to where the adult lengths begin; between two sizes, take the longer, as a
 * jallabiya can be taken up but not let down.
 */
export const CHILD_SIZES: Array<{ length: number; age: string }> = [
  { length: 26, age: "2-3 yrs" },
  { length: 30, age: "4-5 yrs" },
  { length: 34, age: "6-7 yrs" },
  { length: 38, age: "8-9 yrs" },
  { length: 42, age: "10-11 yrs" },
  { length: 46, age: "12-13 yrs" },
  { length: 50, age: "14-15 yrs" },
];

/** Adult lengths, shoulder to hem, every inch from 54 to 62. */
export const ADULT_LENGTHS = Array.from({ length: 9 }, (_, i) => 54 + i);

/** Which tier a length is priced and counted in. */
export const tierFor = (length: number): Tier => (length < ADULT_LENGTHS[0] ? "children" : "adult");

export const isOfferedLength = (length: number) =>
  ADULT_LENGTHS.includes(length) || CHILD_SIZES.some((s) => s.length === length);

/** How many of each tier are still to be had. */
export type Stock = Record<Tier, { total: number; left: number }>;

/** What the customer built, as it travels to the payment and the studio. */
export type PreorderGarment = {
  fabric: string;
  colour: string;
  design: string;
  thread: string;
  length: number;
};

export type PreorderCustomer = { name: string; email: string; phone: string };
