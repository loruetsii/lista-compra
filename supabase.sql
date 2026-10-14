-- Pega esto en Supabase > SQL Editor > Run
create table if not exists list_items (
  list_id    text not null,
  product_id text not null,
  qty        int  not null default 1,
  done       boolean not null default false,
  name       text,
  updated_at timestamptz not null default now(),
  primary key (list_id, product_id)
);
alter table list_items enable row level security;
create policy "acceso lista" on list_items for all to anon using (true) with check (true);
alter publication supabase_realtime add table list_items;
