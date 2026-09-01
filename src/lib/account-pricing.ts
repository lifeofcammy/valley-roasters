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
 * The customer -> category assignment lives in
 * `profiles.square_price_category_id` (migration 20260729, applied
 * 2026-09-01) and is set by staff from the admin customer page. This
 * module only holds the shared/never-visible category rules.
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

/*
 * Which customer gets which coffee price list is NO LONGER mapped in
 * code. It lives in `profiles.square_price_category_id`, assigned by
 * Valley staff from the admin customer page (a dropdown populated live
 * from Square). Charlie's whole workflow: build the category in Square,
 * pick it from the dropdown. An account with no assignment sees an
 * empty catalog — there is deliberately no default.
 */

/**
 * COGS rows — Valley's own cost basis, confirmed by the client 2026-08-05.
 * These must NEVER reach a buyer: publishing them would let customers
 * order at cost (several are ~$5 below the sell price of the same item)
 * and would expose Valley's margin on everything.
 *
 * They're uncategorized in Square today, and `isVisibleToAccount` already
 * hides anything without a category — but that's incidental, not a
 * safeguard. The moment somebody files one of these into a customer
 * category for bookkeeping, it would appear on the site at cost. This
 * list makes the exclusion explicit and survives that mistake.
 *
 * If Valley moves these into a dedicated "Internal — COGS" category,
 * add that category id to NEVER_VISIBLE_CATEGORY_IDS below and new cost
 * rows are covered automatically.
 */
const COGS_ITEM_IDS: ReadonlySet<string> = new Set([
  "MRFI5Q4EH4YXSPFZU5RMU4HK", // Bone-In Chicken Wings
  "QBRBUY4X5VGV26K6H5NJ75XT", // Boneless Chicken
  "26GMCXU52X5JUVHVTHO7MXTJ", // Cardamom (Lezzet) - 17oz
  "T6FCRCSYJMT3WNNRT26QXC5V", // Chipotle Aioli
  "A5HLJDWIQ5VXSHCLCM4MUJLR", // Cinnamon (Lezzet) - 17oz
  "UECQYXE5C4BAL34SHD47ES5O", // Decaf Cardamom - 17.6oz
  "P2WZO3FIWSGOOZKFEOTSCQ6F", // Decaf Cinnamon - 17.6oz
  "YOEDZXHCBZ46DLVNWPZVQXO2", // Decaf Traditional - 17.6oz
  "JM5HXLE2OLDD76WMWEDRDLNJ", // Dough (50lbs)
  "TKZWA3SWLHJ4S6BTZMPM46FR", // Hybrid Kitchen (1)
  "SM653LBVAHLBLO3FXZAHL55M", // Hybrid Kitchen (2)
  "4GREWSEQVIPNUBKK7JVREHZ6", // Hybrid Manager
  "DVZUM7O2C3NWZN4UBTPBWPQW", // Lezzet Traditional 17.6oz
  "OFCTBHSRUOYKYO6HADVW2FOM", // Lezzet Wholebean 17.6oz
]);

/**
 * Categories that must never be shown to a buyer, whatever else matches.
 * Empty until Valley creates an "Internal — COGS" category.
 */
const NEVER_VISIBLE_CATEGORY_IDS: readonly string[] = [];

/** True when this item is internal cost data rather than a sellable product. */
export function isInternalCostItem(
  itemId: string,
  categoryId: string | null
): boolean {
  if (COGS_ITEM_IDS.has(itemId)) return true;
  if (categoryId && NEVER_VISIBLE_CATEGORY_IDS.includes(categoryId)) return true;
  return false;
}

/**
 * Should this catalog item appear for this buyer?
 *
 * `buyerCoffeeCategoryId` comes from `profiles.square_price_category_id`
 * — assigned by Valley staff via the admin dropdown. Null means no
 * catalog has been assigned yet, and per the client's rule the buyer
 * then sees NOTHING (not even the shared food categories): a new
 * account is dark until someone deliberately picks its price list.
 *
 * For assigned buyers, keeps their own coffee category + the shared
 * food/pastry/Lezzet categories; drops every other category — other
 * accounts' price lists, Top Cup café menus, and anything uncategorized.
 */
export function isVisibleToAccount(
  categoryId: string | null,
  buyerCoffeeCategoryId: string | null | undefined,
  itemId?: string
): boolean {
  // Cost rows are never sellable, whatever category they end up in.
  if (itemId && isInternalCostItem(itemId, categoryId)) return false;
  if (!buyerCoffeeCategoryId) return false;
  if (!categoryId) return false;
  if (categoryId === buyerCoffeeCategoryId) return true;
  return SHARED_CATEGORY_IDS.includes(categoryId);
}
