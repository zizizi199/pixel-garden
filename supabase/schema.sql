-- =====================================================================================
--  Vườn Pixel – nhóm chơi chung trên Supabase.
--  Chạy 1 lần: Supabase Dashboard › SQL Editor › New query › dán toàn bộ file › Run.
--  Chạy lại an toàn (cập nhật hàm); KHÔNG xoá dữ liệu cũ.
--
--  Bảo mật:
--   - Mọi bảng bật RLS và KHÔNG có policy → không ai đọc/ghi thẳng bảng được (kể cả bằng anon key).
--   - Game chỉ gọi các hàm RPC bên dưới (security definer), mỗi hàm tự kiểm tra auth.uid() là thành viên nhóm.
--   - Mã nhóm không gửi lên server: game chỉ gửi SHA-256 của mã. Tin chat được game mã hoá bằng khoá suy ra
--     từ mã nhóm (AES-256-GCM) nên server/Supabase không đọc được nội dung chat.
--   - Tưới hộ / hái trộm được kiểm tra trên server (hoa đang nở, chủ vắng mặt, pet, đồ trang trí chống trộm),
--     nên thăm được cả khi chủ vườn tắt máy; game của chủ vườn áp kết quả vào vườn khi mở lại.
--   - Chat tự xoá sau 7 ngày, lịch sử thăm vườn tự xoá sau 7 ngày.
-- =====================================================================================

create table if not exists public.vp_groups (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.vp_members (
  group_id uuid not null references public.vp_groups (id) on delete cascade,
  user_id uuid not null,
  name text not null check (char_length(name) between 1 and 24),
  away boolean not null default false,
  last_seen timestamptz not null default now(),
  garden jsonb,
  garden_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists vp_members_user_idx on public.vp_members (user_id);

create table if not exists public.vp_messages (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.vp_groups (id) on delete cascade,
  user_id uuid not null,
  name text not null,
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists vp_messages_group_idx on public.vp_messages (group_id, id);

create table if not exists public.vp_visits (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.vp_groups (id) on delete cascade,
  owner_id uuid not null,
  by_id uuid not null,
  by_name text not null,
  kind text not null check (kind in ('water', 'steal')),
  slot int not null check (slot between 0 and 11),
  species text,
  result text not null check (result in ('ok', 'pet', 'guard')),
  loot jsonb,
  applied boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists vp_visits_owner_idx on public.vp_visits (owner_id, applied);
create index if not exists vp_visits_by_idx on public.vp_visits (by_id, created_at);

alter table public.vp_groups enable row level security;
alter table public.vp_members enable row level security;
alter table public.vp_messages enable row level security;
alter table public.vp_visits enable row level security;
revoke all on public.vp_groups, public.vp_members, public.vp_messages, public.vp_visits from anon, authenticated;

-- ------------------------------------------------------------------ tiện ích nội bộ

create or replace function public.vp_clean_name(p text) returns text
language sql immutable set search_path = public as $$
  select coalesce(nullif(left(btrim(regexp_replace(coalesce(p, ''), '[[:cntrl:]]', '', 'g')), 24), ''), 'Người chơi');
$$;

create or replace function public.vp_now_ms() returns bigint
language sql stable set search_path = public as $$ select (extract(epoch from clock_timestamp()) * 1000)::bigint; $$;

create or replace function public.vp_require_member(p_group uuid) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Chưa đăng nhập.'; end if;
  if not exists (select 1 from vp_members where group_id = p_group and user_id = uid) then
    raise exception 'Bạn không còn trong nhóm này.';
  end if;
  return uid;
end $$;

-- ------------------------------------------------------------------ nhóm

create or replace function public.vp_create_group(p_code_hash text, p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); gid uuid;
begin
  if uid is null then raise exception 'Chưa đăng nhập.'; end if;
  if (select count(*) from vp_groups where created_by = uid and created_at > now() - interval '1 day') >= 5 then
    raise exception 'Tạo nhóm quá nhiều lần hôm nay.';
  end if;
  insert into vp_groups (code_hash, created_by) values (lower(p_code_hash), uid) returning id into gid;
  insert into vp_members (group_id, user_id, name) values (gid, uid, vp_clean_name(p_name));
  return gid;
end $$;

create or replace function public.vp_join_group(p_code_hash text, p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); gid uuid;
begin
  if uid is null then raise exception 'Chưa đăng nhập.'; end if;
  select id into gid from vp_groups where code_hash = lower(p_code_hash);
  if gid is null then raise exception 'Mã nhóm không đúng.'; end if;
  if (select count(*) from vp_members where group_id = gid) >= 50
     and not exists (select 1 from vp_members where group_id = gid and user_id = uid) then
    raise exception 'Nhóm đã đủ 50 người.';
  end if;
  insert into vp_members (group_id, user_id, name) values (gid, uid, vp_clean_name(p_name))
  on conflict (group_id, user_id) do update set name = excluded.name, last_seen = now();
  return gid;
end $$;

create or replace function public.vp_leave_group(p_group uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := vp_require_member(p_group);
begin
  delete from vp_members where group_id = p_group and user_id = uid;
  delete from vp_groups g where g.id = p_group and not exists (select 1 from vp_members m where m.group_id = g.id);
end $$;

create or replace function public.vp_set_name(p_group uuid, p_name text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := vp_require_member(p_group);
begin
  update vp_members set name = vp_clean_name(p_name) where group_id = p_group and user_id = uid;
end $$;

-- ------------------------------------------------------------------ đồng bộ (gọi vài giây 1 lần)
-- Gửi trạng thái + ảnh chụp vườn của mình (chỉ khi đổi), nhận: danh sách thành viên, tin chat mới,
-- các lượt thăm vườn mình chưa áp, và vườn của người đang xem (p_watch).
create or replace function public.vp_sync(p_group uuid, p_away boolean, p_garden jsonb, p_since bigint, p_watch uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := vp_require_member(p_group);
  old jsonb;
  g jsonb := p_garden;
begin
  if g is not null then
    if octet_length(g::text) > 24000 or jsonb_typeof(g -> 'slots') <> 'array' then raise exception 'Dữ liệu vườn không hợp lệ.'; end if;
    -- giữ thời điểm pet ngủ do server đặt (pet vừa đuổi trộm khi chủ chưa kịp nhận sự kiện)
    select garden into old from vp_members where group_id = p_group and user_id = uid;
    if g ? 'guard' and old ? 'guard' then
      g := jsonb_set(g, '{guard,petSleepUntil}', to_jsonb(greatest(
        coalesce((old #>> '{guard,petSleepUntil}')::bigint, 0), coalesce((g #>> '{guard,petSleepUntil}')::bigint, 0))));
    end if;
  end if;
  update vp_members set away = coalesce(p_away, false), last_seen = now(),
    garden = coalesce(g, garden), garden_at = case when g is null then garden_at else now() end
  where group_id = p_group and user_id = uid;

  return jsonb_build_object(
    'now', vp_now_ms(),
    'members', (select coalesce(jsonb_agg(jsonb_build_object('id', user_id, 'name', name, 'away', away,
        'idle', extract(epoch from now() - last_seen)::int) order by joined_at), '[]'::jsonb)
      from vp_members where group_id = p_group),
    'messages', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'by', user_id, 'name', name, 'body', body,
        'at', (extract(epoch from created_at) * 1000)::bigint) order by id), '[]'::jsonb)
      from (select * from vp_messages where group_id = p_group and id > coalesce(p_since, 0) order by id desc limit 50) m),
    'events', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'kind', kind, 'slot', slot, 'species', species,
        'result', result, 'loot', loot, 'by', by_name, 'at', (extract(epoch from created_at) * 1000)::bigint) order by id), '[]'::jsonb)
      from (select * from vp_visits where group_id = p_group and owner_id = uid and not applied order by id limit 50) v),
    'garden', case when p_watch is null then null
      else (select garden from vp_members where group_id = p_group and user_id = p_watch) end
  );
end $$;

create or replace function public.vp_ack_events(p_group uuid, p_ids bigint[]) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := vp_require_member(p_group);
begin
  update vp_visits set applied = true where owner_id = uid and id = any (p_ids);
  delete from vp_visits where group_id = p_group and created_at < now() - interval '7 days';
end $$;

-- ------------------------------------------------------------------ chat (nội dung đã mã hoá ở game)

create or replace function public.vp_send_chat(p_group uuid, p_body text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := vp_require_member(p_group);
begin
  if p_body is null or char_length(p_body) = 0 or char_length(p_body) > 2000 then raise exception 'Tin nhắn không hợp lệ.'; end if;
  if (select count(*) from vp_messages where user_id = uid and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Gửi quá nhanh, đợi một chút.';
  end if;
  insert into vp_messages (group_id, user_id, name, body)
    select p_group, uid, name, p_body from vp_members where group_id = p_group and user_id = uid;
  delete from vp_messages where group_id = p_group and created_at < now() - interval '7 days';
end $$;

-- ------------------------------------------------------------------ thăm vườn: tưới hộ / hái trộm
create or replace function public.vp_visit(p_group uuid, p_owner uuid, p_kind text, p_slot int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := vp_require_member(p_group);
  me text;
  o record;
  g jsonb; s jsonb; stage text; sp text;
  present boolean;
  now_ms bigint := vp_now_ms();
  loot jsonb;
  money int; exp int;
begin
  if p_kind not in ('water', 'steal') or p_slot is null or p_slot < 0 or p_slot > 11 then
    return jsonb_build_object('ok', false, 'msg', 'Hành động không hợp lệ.');
  end if;
  if p_owner = uid then return jsonb_build_object('ok', false, 'msg', 'Không thể thăm vườn của mình.'); end if;
  if (select count(*) from vp_visits where by_id = uid and created_at > now() - interval '1 minute') >= 12 then
    return jsonb_build_object('ok', false, 'msg', 'Thăm vườn quá nhanh, đợi một chút.');
  end if;
  select name into me from vp_members where group_id = p_group and user_id = uid;
  select * into o from vp_members where group_id = p_group and user_id = p_owner for update;
  if not found or o.garden is null then return jsonb_build_object('ok', false, 'msg', 'Chưa có dữ liệu vườn của người này.'); end if;
  g := o.garden;
  s := g -> 'slots' -> p_slot;
  stage := s ->> 'stage'; sp := s ->> 'species';
  if s is null or sp is null or stage in ('empty', 'dead') then
    return jsonb_build_object('ok', false, 'msg', 'Ô này không có cây.');
  end if;

  if p_kind = 'water' then
    if exists (select 1 from vp_visits where owner_id = p_owner and slot = p_slot and kind = 'water' and result = 'ok' and not applied) then
      return jsonb_build_object('ok', false, 'msg', 'Vừa có người tưới cây này rồi.');
    end if;
    if coalesce((s ->> 'water')::numeric, 100) > 85 then return jsonb_build_object('ok', false, 'msg', 'Đất còn ẩm, chưa cần tưới.'); end if;
    g := jsonb_set(jsonb_set(g, array['slots', p_slot::text, 'water'], '100'), array['slots', p_slot::text, 'thirsty'], 'false');
    update vp_members set garden = g where group_id = p_group and user_id = p_owner;
    insert into vp_visits (group_id, owner_id, by_id, by_name, kind, slot, species, result)
      values (p_group, p_owner, uid, me, 'water', p_slot, sp, 'ok');
    return jsonb_build_object('ok', true, 'msg', 'Đã tưới hộ.', 'loot', jsonb_build_object('money', 0, 'exp', 2));
  end if;

  -- hái trộm: chỉ khi chủ vắng mặt hoặc đã tắt game (không thấy trong 30 giây)
  present := not o.away and o.last_seen > now() - interval '30 seconds';
  if present then return jsonb_build_object('ok', false, 'msg', 'Chủ vườn đang chơi – chỉ hái được khi chủ vắng mặt.'); end if;
  if stage <> 'bloom' then return jsonb_build_object('ok', false, 'msg', 'Không có hoa nở để hái.'); end if;
  if exists (select 1 from vp_visits where owner_id = p_owner and slot = p_slot and kind = 'steal' and result = 'ok' and not applied) then
    return jsonb_build_object('ok', false, 'msg', 'Hoa này vừa bị hái mất rồi.');
  end if;
  -- pet đang thức: chặn chắc chắn 1 lần rồi đi ngủ
  if coalesce((g #>> '{guard,pet}')::boolean, false) and now_ms >= coalesce((g #>> '{guard,petSleepUntil}')::bigint, 0) then
    g := jsonb_set(g, '{guard,petSleepUntil}', to_jsonb(now_ms + least(greatest(coalesce((g #>> '{guard,petSleepMs}')::bigint, 1800000), 60000), 7200000)));
    update vp_members set garden = g where group_id = p_group and user_id = p_owner;
    insert into vp_visits (group_id, owner_id, by_id, by_name, kind, slot, species, result)
      values (p_group, p_owner, uid, me, 'steal', p_slot, sp, 'pet');
    return jsonb_build_object('ok', false, 'msg', 'Bị pet canh vườn đuổi đi!');
  end if;
  if random() < least(0.6, greatest(0, coalesce((s ->> 'guard')::numeric, 0))) then
    insert into vp_visits (group_id, owner_id, by_id, by_name, kind, slot, species, result)
      values (p_group, p_owner, uid, me, 'steal', p_slot, sp, 'guard');
    return jsonb_build_object('ok', false, 'msg', 'Bị đồ trang trí canh vườn đuổi đi!');
  end if;
  money := least(greatest(coalesce((s #>> '{loot,money}')::int, 0), 0), 10000);
  exp := least(greatest(coalesce((s #>> '{loot,exp}')::int, 0), 0), 10000);
  loot := jsonb_build_object('money', money, 'exp', exp);
  g := jsonb_set(g, array['slots', p_slot::text], (s - 'loot' - 'guard') || jsonb_build_object('stage', 'empty', 'species', null, 'stolen', true));
  update vp_members set garden = g where group_id = p_group and user_id = p_owner;
  insert into vp_visits (group_id, owner_id, by_id, by_name, kind, slot, species, result, loot)
    values (p_group, p_owner, uid, me, 'steal', p_slot, sp, 'ok', loot);
  return jsonb_build_object('ok', true, 'msg', format('Hái trộm thành công: +%s xu', money), 'loot', loot);
end $$;

-- ------------------------------------------------------------------ quyền gọi hàm
revoke all on function public.vp_clean_name(text), public.vp_now_ms(), public.vp_require_member(uuid),
  public.vp_create_group(text, text), public.vp_join_group(text, text), public.vp_leave_group(uuid),
  public.vp_set_name(uuid, text), public.vp_sync(uuid, boolean, jsonb, bigint, uuid), public.vp_ack_events(uuid, bigint[]),
  public.vp_send_chat(uuid, text), public.vp_visit(uuid, uuid, text, int) from public, anon;
grant execute on function public.vp_create_group(text, text), public.vp_join_group(text, text), public.vp_leave_group(uuid),
  public.vp_set_name(uuid, text), public.vp_sync(uuid, boolean, jsonb, bigint, uuid), public.vp_ack_events(uuid, bigint[]),
  public.vp_send_chat(uuid, text), public.vp_visit(uuid, uuid, text, int) to authenticated;
