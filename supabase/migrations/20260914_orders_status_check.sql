-- Let the 4-status admin workflow write to orders.status.
--
-- APPLIED 2026-09-14 via the dashboard SQL editor. Verified afterwards
-- against production: an INSERT with status 'received' (HTTP 400 before)
-- now succeeds, and UPDATEs to in_process / shipped / rejected all pass.
-- Re-running is a harmless no-op.
--
-- Why: the app moved to received / in_process / shipped / rejected on
-- 2026-04-23 (commit 540a462), but the table's check constraint was never
-- updated, so it still only accepts the original vocabulary. Every portal
-- order since then has died at the INSERT with
--   new row for relation "orders" violates check constraint "orders_status_check"
-- which the buyer sees as "Failed to create order". Admin status changes
-- to in_process / rejected would fail the same way.
--
-- The legacy values stay allowed: nine existing rows are 'delivered', and
-- ORDER_STATUSES in src/lib/constants.ts deliberately keeps them for
-- history (the admin selector only ever offers the four current ones).

begin;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in (
    -- current workflow
    'received', 'in_process', 'shipped', 'rejected',
    -- legacy rows
    'pending', 'confirmed', 'roasting', 'delivered', 'cancelled'
  ));

commit;
