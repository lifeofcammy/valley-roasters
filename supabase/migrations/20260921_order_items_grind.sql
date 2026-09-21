-- Record the chosen grind on each order line.
--
-- APPLIED 2026-09-21 via the dashboard SQL editor. Verified afterwards:
-- an order_items insert carrying {"id","name","price_cents"} succeeds and
-- reads back intact. Re-running is a harmless no-op.
--
-- The grind (Whole Bean / Drip / Espresso / Turkish ...) used to travel
-- only to Square as a line note and was never saved here, so the admin
-- and buyer order pages could not show it. Stored as
--   {"id": "<square modifier option id>", "name": "Cold Brew", "price_cents": 125}
-- so a reorder can restore the exact option and its upcharge.
-- unit_price_cents on the row is the bean price; the grind upcharge is
-- inside this column and already included in total_cents.

alter table public.order_items
  add column if not exists grind jsonb;
