/*
 * The jallabiya preorder: what it costs, how many there are, and which
 * sizes it comes in. Shared by the Loom and the server, so the price the
 * page shows is the price the server charges.
 *
 * The first run is 100 sets, split between adult and children's sizes, and
 * each set is paid for in full when it is ordered. The price covers
 * everything in the Loom: any colour, any fabric on offer, any neckline
 * design and thread, and the cuffs and pendant either way.
 */

export type Tier = "adult" | "children";

/** Each size's name, full price in naira, and how many sets the run has. */
export type PreorderTerms = Record<Tier, { name: string; price: number; total: number }>;

/**
 * The terms the preorder opened on. The studio changes prices and set
 * counts in Sanity (see `src/lib/content.ts`); these stand when it has none.
 */
export const PREORDER: PreorderTerms = {
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
  /**
   * The neckline's pattern sewn round both cuffs, and the pendant: a gold
   * tassel on a cord from the foot of the neck opening. A build from before
   * either was offered has neither, which is what that customer saw and
   * paid for.
   */
  sleeves?: boolean;
  tassel?: boolean;
};

/** What the cuffs and the pendant are called, either way. */
export const FINISH_WORDS = {
  sleeves: { on: "Embroidered cuffs", off: "Plain cuffs" },
  tassel: { on: "Gold pendant", off: "No pendant" },
};

/** A build's cuffs and pendant in words, each said either way so the studio never has to guess. */
export const extrasWords = (g: Pick<PreorderGarment, "sleeves" | "tassel">) =>
  `${(g.sleeves ? FINISH_WORDS.sleeves.on : FINISH_WORDS.sleeves.off).toLowerCase()}, ${(g.tassel ? FINISH_WORDS.tassel.on : FINISH_WORDS.tassel.off).toLowerCase()}`;

export type PreorderCustomer = { name: string; email: string; phone: string };
