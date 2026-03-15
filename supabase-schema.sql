-- Run this in Supabase SQL Editor to create the trades table and RLS.

create table if not exists trades (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  symbol        text not null,
  isin          text,
  trade_date    date not null,
  exchange      text,
  segment       text,
  trade_type    text not null,
  quantity      integer not null,
  price         numeric(12,2) not null,
  order_id      text,
  trade_id      text,
  executed_at   timestamptz,
  pnl           numeric(12,2),
  fees          numeric(12,2) default 0,
  net_pnl       numeric(12,2),
  is_open       boolean default true,
  strategy_tag  text,
  emotion_tag   text,
  notes         text,
  screenshot_url text,
  created_at    timestamptz default now()
);

create index if not exists idx_trades_user_date on trades (user_id, trade_date desc);

alter table trades enable row level security;

drop policy if exists "own trades only" on trades;
create policy "own trades only" on trades for all using (auth.uid() = user_id);

-- Optional: create a storage bucket for trade screenshots (run in Dashboard or SQL).
-- insert into storage.buckets (id, name, public) values ('screenshots', 'screenshots', true);
-- create policy "Users can upload own screenshots" on storage.objects for insert with check (bucket_id = 'screenshots' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Users can read own screenshots" on storage.objects for select using (bucket_id = 'screenshots' and auth.uid()::text = (storage.foldername(name))[1]);
