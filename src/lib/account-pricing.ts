/**
 * Per-account catalog + pricing rules.
 *
 * Valley prices coffee differently for every wholesale account. In Square
 * that's modelled as one CATEGORY per account ("Beanchain", "Shaghf
 * Tempe", …), each holding that account's own copy of the coffee SKUs at
 * their negotiated price. Food, pastry and Lezzet categories are shared —
 * same price for everyone.
 *
 * So a buyer's catalog = (their coffee category) + (all shared categories).
 *
 * Why the mapping lives in code rather than a `profiles` column: the
 * Supabase MCP connection is read-only, so the migration in
 * `supabase/migrations/20260729_account_pricing.sql` hasn't been applied
 * yet. Once it is, swap `coffeeCategoryIdFor()` to read
 * `profiles.square_price_category_id` and delete ACCOUNT_COFFEE_CATEGORY —
 * nothing else changes.
 */

/** Square CATEGORY ids. Names are the labels shown in Square's item library. */
export const CATEGORY = {
  // Default coffee price list — used by any account without its own.
  WHOLESALE_COFFEE: "4U572J3F4FZPO43XXZNNKMDK",

  // Per-account coffee price lists.
  BEANCHAIN: "6SRAS3QSJY5ZBO2M62UQEAKO",
  MEDJOOL: "EAL7JIZEMTKFUHD6OIHB6TJ6",
  SHAGHF_TEMPE: "LPKYDOB52YFNH5O7Q3THPYAQ",
  SHAGHF_GLENDALE: "VZNQDZI4VUK56M4XDP5JLBON",
  TEN_NINETEEN: "3CE5DKFUIUEF6ENYYB5N4PCK",
  SAHARA_CAFE: "NCDI635LXMDTLLTPG7FAFXOZ",
  TOP_CUP: "WSPEZ34P37L6USY3M6KNPOCJ",

  // Shared — same price for every account.
  PASTRIES: "5MOGAVG6RVXAYYRDYNOWOXYS",
  LEZZET: "RHDCDKAQO2J2LME2RNWYNA4C",
  PANINIS: "5HP45XPXJJLNPDPNJMC2LHK6",
  BREAKFAST: "ECY3527Z7EZ57O7CC4BX6FPM",
  GRAB_AND_GO: "OPNYI4AR4DQ543WZ7TIAEGHM",
} as const;

/**
 * Categories every wholesale buyer can order from at the same price:
 * food, pastry and Lezzet Turkish coffee.
 */
export const SHARED_CATEGORY_IDS: readonly string[] = [
  CATEGORY.LEZZET,
  CATEGORY.PASTRIES,
  CATEGORY.BREAKFAST,
  CATEGORY.PANINIS,
  CATEGORY.GRAB_AND_GO,
];

/**
 * Coffee price list per account, keyed by Square customer id.
 *
 * Accounts absent from this map fall back to WHOLESALE_COFFEE — that's
 * Crepe Club, Foch Cafe, Sip & Shop, Grotti's Pizza and Aj Jazzar today.
 * Give one of them their own pricing by creating a Square category and
 * adding a line here.
 */
const ACCOUNT_COFFEE_CATEGORY: Record<string, string> = {
  WQSZ308EWEQ7WV03QS9PFK1PR0: CATEGORY.BEANCHAIN, // Beanchain Coffee
  E8ZG7SJYETM6YT83VZZ0E3WHCR: CATEGORY.SHAGHF_TEMPE, // Shaghf Cafe
  D5SNV1ACZZXNAEMQ6KTKMNER4R: CATEGORY.SHAGHF_GLENDALE, // Shaghf Cafe Glendale
  W1F0JZTDCX0G31ZMF1YY5BJWNR: CATEGORY.TEN_NINETEEN, // 10:19 Coffee
  // Top Cup's café locations buy from Valley at the "TC ___" tier.
  // Added 2026-08-05 at Charlie/Jackie's request.
  //
  // Each location is listed twice on purpose. Valley has invoiced these
  // three for months under one set of customer records, and on 2026-08-04
  // two NEW records were created for Gilbert and Tempe with slightly
  // different names ("Top Cup Coffee - Gilbert" vs "Top Cup Coffee
  // Gilbert"). Both are mapped so pricing is correct whichever record a
  // portal login ends up attached to.
  //
  // The originals are the ones to keep: they carry the order history the
  // portal reads. The 2026-08-04 duplicates should be merged into them in
  // Square, and these two lines deleted once that's done.
  DQG95BVDT6XD35KDMXPKFQW7FG: CATEGORY.TOP_CUP, // Top Cup Coffee Gilbert (26 invoices)
  FYW476XAKRWK4ETH5EQP1EA4P0: CATEGORY.TOP_CUP, // Top Cup Tempe (11 invoices)
  "8TG7TEER56SX77RY97KZ58C3SW": CATEGORY.TOP_CUP, // TC Downtown Phoenix (14 invoices)
  "3NBPNSM2EPJGHBYB5W0BPVPHQM": CATEGORY.TOP_CUP, // dup created 2026-08-04 — merge into Gilbert
  "9NQ3M7JAJGZF811AZJGXHST5F0": CATEGORY.TOP_CUP, // dup created 2026-08-04 — merge into Tempe
};

/** Every per-account coffee category, so we can exclude other accounts'. */
const ALL_ACCOUNT_COFFEE_CATEGORIES: readonly string[] = [
  CATEGORY.WHOLESALE_COFFEE,
  CATEGORY.BEANCHAIN,
  CATEGORY.MEDJOOL,
  CATEGORY.SHAGHF_TEMPE,
  CATEGORY.SHAGHF_GLENDALE,
  CATEGORY.TEN_NINETEEN,
  CATEGORY.SAHARA_CAFE,
  CATEGORY.TOP_CUP,
];

/** Which coffee category this buyer sees. Falls back to the default list. */
export function coffeeCategoryIdFor(
  squareCustomerId: string | null | undefined
): string {
  if (!squareCustomerId) return CATEGORY.WHOLESALE_COFFEE;
  return ACCOUNT_COFFEE_CATEGORY[squareCustomerId] ?? CATEGORY.WHOLESALE_COFFEE;
}

/**
 * Should this catalog item appear for this buyer?
 *
 * Keeps: their own coffee category + the shared categories.
 * Drops:  every other account's coffee category (so nobody sees another
 *         business's negotiated pricing) and anything uncategorized —
 *         Valley's uncategorized items are internal ops rows like
 *         "Hybrid Manager" and "Dough (50lbs)".
 */
export function isVisibleToAccount(
  categoryId: string | null,
  buyerCoffeeCategoryId: string
): boolean {
  if (!categoryId) return false;
  if (categoryId === buyerCoffeeCategoryId) return true;
  if (SHARED_CATEGORY_IDS.includes(categoryId)) return true;
  // Another account's coffee list — never show it.
  if (ALL_ACCOUNT_COFFEE_CATEGORIES.includes(categoryId)) return false;
  return false;
}

/**
 * Accounts that pay the flat delivery fee on every order regardless of
 * subtotal, because they're far enough out that Valley eats the drive.
 * Keyed by Square customer id.
 *
 * Sahara Cafe has a Square category but no portal login yet — add their
 * customer id here when the account is created.
 */
const ALWAYS_CHARGE_DELIVERY: readonly string[] = [
  "D5SNV1ACZZXNAEMQ6KTKMNER4R", // Shaghf Cafe Glendale
];

/** True when the free-delivery threshold does not apply to this buyer. */
export function alwaysChargesDelivery(
  squareCustomerId: string | null | undefined
): boolean {
  if (!squareCustomerId) return false;
  return ALWAYS_CHARGE_DELIVERY.includes(squareCustomerId);
}
