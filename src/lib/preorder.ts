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
 * The lengths it is cut in, shoulder to hem, in inches: a few of each, six
 * inches apart for children and two apart for adults. Between two sizes,
 * take the longer: a jallabiya can be taken up but not let down.
 */
export const CHILD_LENGTHS = [30, 36, 42, 48];
export const ADULT_LENGTHS = [54, 56, 58, 60, 62];

/** Which tier a length is priced and counted in. */
export const tierFor = (length: number): Tier => (length < ADULT_LENGTHS[0] ? "children" : "adult");

export const isOfferedLength = (length: number) =>
  ADULT_LENGTHS.includes(length) || CHILD_LENGTHS.includes(length);

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
