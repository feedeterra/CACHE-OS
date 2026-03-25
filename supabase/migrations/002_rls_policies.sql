-- ── profiles ──────────────────────────────────────────────────────────────
create policy "Users read own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "Admins read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "Users update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- ── clients ───────────────────────────────────────────────────────────────
create policy "Admins manage clients"
  on public.clients for all
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "Client members read their client"
  on public.clients for select
  using (
    exists (
      select 1 from public.client_members
      where client_id = clients.id and user_id = (select auth.uid())
    )
  );

create policy "Public portal read via token"
  on public.clients for select
  to anon
  using (magic_link_token is not null);

-- ── client_members ────────────────────────────────────────────────────────
create policy "Admins manage members"
  on public.client_members for all
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- ── sales ─────────────────────────────────────────────────────────────────
create policy "Admins read all sales"
  on public.sales for select
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "Client members read own sales"
  on public.sales for select
  using (
    exists (
      select 1 from public.client_members
      where client_id = sales.client_id and user_id = (select auth.uid())
    )
  );

create policy "Anon insert sales via portal"
  on public.sales for insert
  to anon
  with check (true);

-- ── meta_snapshots ────────────────────────────────────────────────────────
create policy "Admins manage snapshots"
  on public.meta_snapshots for all
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- ── system_logs ───────────────────────────────────────────────────────────
create policy "Admins read logs"
  on public.system_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );
