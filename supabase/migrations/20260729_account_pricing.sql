-- Per-account pricing + delivery overrides.
--
-- NOT YET APPLIED. Until it is, `src/lib/account-pricing.ts` holds the
-- same mapping in code. Run this in the Supabase SQL editor (Dashboard →
-- SQL Editor → New query → paste → Run), then follow the note at the top
-- of account-pricing.ts to switch the lookups over to these columns.
--
-- Applying this makes the mapping admin-editable instead of requiring a
-- code change whenever Valley onboards an account or renegotiates terms.

-- Which Square CATEGORY holds this account's coffee price list.
-- NULL = fall back to the shared "Wholesale Coffee" category.
alter table public.profiles
  add column if not exists square_price_category_id text;

comment on column public.profiles.square_price_category_id is
  'Square CATEGORY object id holding this account''s coffee pricing (e.g. Beanchain, Shaghf Tempe). NULL = use the default Wholesale Coffee category.';

-- Charge the flat delivery fee on every order for this account,
-- ignoring the free-delivery subtotal threshold (distant locations).
alter table public.profiles
  add column if not exists always_charge_delivery boolean not null default false;

comment on column public.profiles.always_charge_delivery is
  'When true the flat delivery fee applies to every order for this account, ignoring the free-delivery subtotal threshold.';

-- Seed the values currently hardcoded in src/lib/account-pricing.ts.
update public.profiles set square_price_category_id = '6SRAS3QSJY5ZBO2M62UQEAKO'
  where square_customer_id = 'WQSZ308EWEQ7WV03QS9PFK1PR0'; -- Beanchain Coffee
update public.profiles set square_price_category_id = 'LPKYDOB52YFNH5O7Q3THPYAQ'
  where square_customer_id = 'E8ZG7SJYETM6YT83VZZ0E3WHCR'; -- Shaghf Cafe
update public.profiles set square_price_category_id = 'VZNQDZI4VUK56M4XDP5JLBON'
  where square_customer_id = 'D5SNV1ACZZXNAEMQ6KTKMNER4R'; -- Shaghf Cafe Glendale
update public.profiles set square_price_category_id = '3CE5DKFUIUEF6ENYYB5N4PCK'
  where square_customer_id = 'W1F0JZTDCX0G31ZMF1YY5BJWNR'; -- 10:19 Coffee

update public.profiles set always_charge_delivery = true
  where square_customer_id = 'D5SNV1ACZZXNAEMQ6KTKMNER4R'; -- Shaghf Cafe Glendale
