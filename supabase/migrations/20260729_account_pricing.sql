-- Per-account pricing + delivery overrides.
--
-- APPLIED 2026-09-01 via the dashboard SQL editor. Kept here as the
-- record of schema state; running it again is a harmless no-op.
--
-- profiles.square_price_category_id: which Square CATEGORY holds this
-- account's coffee price list. Set by staff from the admin customer
-- page dropdown. NULL = no catalog assigned; the buyer's portal catalog
-- is empty by design (no default price list exists).
--
-- profiles.always_charge_delivery: flat delivery fee applies to every
-- order regardless of subtotal (distant locations).
--
-- Seeding of existing accounts was done via the admin API at apply
-- time; new accounts start NULL / false and are assigned from the
-- admin UI.

alter table public.profiles
  add column if not exists square_price_category_id text;

alter table public.profiles
  add column if not exists always_charge_delivery boolean not null default false;
