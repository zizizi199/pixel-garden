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
      else (select garden - 'bag' from vp_members where group_id = p_group and user_id = p_watch) end,
    'duels', vp_my_duels(p_group, uid)
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

-- =====================================================================================
--  ĐẤU TRƯỜNG THÚ: 2 thành viên có pet, chỉ đấu khi được mời và đồng ý.
--  3 vòng điền chữ còn thiếu của 1 từ tiếng Anh (vòng 1: 3 chữ, vòng 2: 4, vòng 3: 5). Hoà → hiệp phụ, từ ngắn dần
--  (4, 3, 3… chữ) tới khi có người thắng. Ai trả lời đúng trước được 1 điểm (pet tung chưởng lực).
--  Từ lấy ONLINE từ từ điển Datamuse (api.datamuse.com, miễn phí, không cần khoá) qua extension http của Supabase:
--  lấy ~300 từ thông dụng nhất theo độ dài, lưu đệm 7 ngày trong vp_words rồi chọn ngẫu nhiên.
--  Người thắng lật 1 trong 3 lá bài để lấy 1 món (hạt giống hoặc chậu) trong kho của người thua.
--  Từ đúng chỉ lộ ra khi vòng kết thúc; mọi kiểm tra nằm trên server.
-- =====================================================================================

do $$ begin
  create extension if not exists http with schema extensions;
exception when others then raise notice 'Không bật được extension http: %', sqlerrm;
end $$;

create table if not exists public.vp_words (
  word text primary key
);
alter table public.vp_words drop constraint if exists vp_words_word_check;
alter table public.vp_words add constraint vp_words_word_check check (word ~ '^[a-z]{3,12}$') not valid;
alter table public.vp_words add column if not exists len int generated always as (length(word)) stored;
alter table public.vp_words add column if not exists source text;
alter table public.vp_words add column if not exists fetched_at timestamptz not null default now();
delete from public.vp_words where source is null; -- bỏ danh sách từ cố định của bản trước
create index if not exists vp_words_len_idx on public.vp_words (len, fetched_at);

create table if not exists public.vp_duels (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.vp_groups (id) on delete cascade,
  a uuid not null, b uuid not null,
  a_name text not null, b_name text not null,
  a_pet text, b_pet text, a_power text, b_power text,
  status text not null default 'invited' check (status in ('invited', 'playing', 'finished', 'declined', 'expired', 'cancelled')),
  round int not null default 0,
  word text, pattern text,
  round_start timestamptz, round_end timestamptz, round_winner uuid,
  a_score int not null default 0, b_score int not null default 0,
  a_tries int not null default 0, b_tries int not null default 0,
  history jsonb not null default '[]'::jsonb,
  winner uuid, cards jsonb, pick int, prize jsonb,
  a_applied boolean not null default false, b_applied boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists vp_duels_a_idx on public.vp_duels (a, status);
create index if not exists vp_duels_b_idx on public.vp_duels (b, status);

alter table public.vp_words enable row level security;
alter table public.vp_duels enable row level security;
revoke all on public.vp_words, public.vp_duels from anon, authenticated;

create or replace function public.vp_duel_clean(p text) returns text
language sql immutable set search_path = public as $$
  select case when p ~ '^[a-z0-9_]{1,40}$' then p else null end;
$$;

-- bộ lọc từ không phù hợp nơi công sở (không phải danh sách từ của game)
create or replace function public.vp_blocked_words() returns text[]
language sql immutable set search_path = public as $$
  select array['fuck','fucks','fucked','fucker','fucking','shit','shits','shitty','bitch','bitches','cunt','cunts','whore',
    'whores','slut','sluts','nigger','niggers','nigga','faggot','fag','fags','dick','dicks','cock','cocks','pussy','penis',
    'vagina','rape','raped','rapes','rapist','porn','porno','sexy','nazi','nazis','hitler','bastard','asshole','damn','crap',
    'piss','pissed','boobs','tits','anal','semen','dildo','orgasm','nude','nudes','naked','suicide','murder','killer','kill',
    'killed','kills','drunk','drugs','cocaine','heroin','weed','bloody','sex','sexual','erotic','gay','lesbian','jesus','allah'];
$$;

-- lấy từ online (Datamuse) cho độ dài n, giữ ~300 từ thông dụng nhất; lỗi mạng → 0 (dùng tiếp từ đã lưu đệm)
create or replace function public.vp_fetch_words(n int) returns int
language plpgsql security definer set search_path = public, extensions as $$
declare res record; cnt int := 0;
begin
  perform set_config('http.timeout_msec', '6000', true);
  select * into res from extensions.http_get('https://api.datamuse.com/words?sp=' || repeat('%3F', n) || '&md=f&max=1000');
  if res.status <> 200 then return 0; end if;
  insert into vp_words (word, source, fetched_at)
  select word, 'datamuse', now() from (
    select distinct on (w ->> 'word') w ->> 'word' as word,
      coalesce((select substring(t from 3)::numeric from jsonb_array_elements_text(coalesce(w -> 'tags', '[]'::jsonb)) t
        where t like 'f:%' limit 1), 0) as freq
    from jsonb_array_elements(res.content::jsonb) w
  ) x
  where word ~ ('^[a-z]{' || n || '}$') and not (word = any (vp_blocked_words()))
  order by freq desc limit 300
  on conflict (word) do update set fetched_at = now(), source = 'datamuse';
  get diagnostics cnt = row_count;
  return cnt;
exception when others then
  raise notice 'Không lấy được từ online: %', sqlerrm;
  return 0;
end $$;

-- độ dài từ: vòng 1–3 = 3, 4, 5 chữ; hiệp phụ ngắn dần 4, 3 chữ (tối thiểu 3)
create or replace function public.vp_duel_word_len(n int) returns int
language sql immutable set search_path = public as $$
  select case when n <= 3 then 2 + n else greatest(3, 5 - (n - 3)) end;
$$;

-- bắt đầu vòng n: chọn ngẫu nhiên 1 từ (chưa dùng trong trận), che ~40% chữ cái
create or replace function public.vp_duel_start_round(p_duel uuid, n int) returns void
language plpgsql security definer set search_path = public as $$
declare w text; pat text; k int; pos int; l int := vp_duel_word_len(n);
begin
  if (select count(*) from vp_words where len = l and fetched_at > now() - interval '7 days') < 30 then
    perform vp_fetch_words(l);
  end if;
  select word into w from vp_words
  where len = l and word not in (select h ->> 'word' from vp_duels d, jsonb_array_elements(d.history) h where d.id = p_duel and h ->> 'word' is not null)
  order by random() limit 1;
  if w is null then select word into w from vp_words where len = l order by random() limit 1; end if;
  if w is null then raise exception 'Không lấy được từ tiếng Anh online (từ điển Datamuse không phản hồi). Thử lại sau.'; end if;
  pat := w;
  k := greatest(1, round(length(w) * 0.4));
  for pos in select p from generate_series(1, length(w)) p order by random() limit k loop
    pat := overlay(pat placing '_' from pos for 1);
  end loop;
  update vp_duels set round = n, word = w, pattern = pat, round_start = now(), round_end = null, round_winner = null,
    a_tries = 0, b_tries = 0 where id = p_duel;
end $$;

-- kết thúc trận: chọn 3 lá bài từ kho người thua (ảnh chụp "bag" trong vườn)
create or replace function public.vp_duel_finish(p_duel uuid, p_winner uuid) returns void
language plpgsql security definer set search_path = public as $$
declare d vp_duels; loser uuid; bag jsonb; v_cards jsonb := '[]'::jsonb; i int; item jsonb;
begin
  select * into d from vp_duels where id = p_duel;
  if p_winner is not null then
    loser := case when p_winner = d.a then d.b else d.a end;
    select coalesce(garden -> 'bag', '[]'::jsonb) into bag from vp_members where group_id = d.group_id and user_id = loser;
    for i in 1..3 loop
      if jsonb_typeof(bag) = 'array' and jsonb_array_length(bag) > 0 then
        item := bag -> floor(random() * jsonb_array_length(bag))::int;
        v_cards := v_cards || jsonb_build_array(jsonb_build_object('kind', item ->> 'kind', 'id', vp_duel_clean(item ->> 'id')));
      else
        v_cards := v_cards || jsonb_build_array(jsonb_build_object('kind', 'none'));
      end if;
    end loop;
  end if;
  update vp_duels set status = 'finished', winner = p_winner, cards = case when p_winner is null then null else v_cards end,
    round_end = coalesce(round_end, now()) where id = p_duel;
end $$;

-- tiến trạng thái theo thời gian (hết 30 giây/vòng, nghỉ 3 giây giữa các vòng); gọi trước mỗi lần đọc/ghi
create or replace function public.vp_duel_tick(p_duel uuid) returns void
language plpgsql security definer set search_path = public as $$
declare d vp_duels; guard int := 0;
begin
  loop
    guard := guard + 1; exit when guard > 5;
    select * into d from vp_duels where id = p_duel for update;
    if d.status = 'invited' and d.created_at < now() - interval '90 seconds' then
      update vp_duels set status = 'expired' where id = p_duel; exit;
    end if;
    exit when d.status <> 'playing';
    if d.round_end is null and (d.round_start < now() - interval '30 seconds' or (d.a_tries >= 3 and d.b_tries >= 3)) then
      update vp_duels set round_end = now(),
        history = history || jsonb_build_array(jsonb_build_object('round', d.round, 'word', d.word, 'winner', null))
      where id = p_duel;
      exit;
    end if;
    exit when d.round_end is null or d.round_end > now() - interval '3 seconds';
    if d.round >= 3 and d.a_score <> d.b_score then
      perform vp_duel_finish(p_duel, case when d.a_score > d.b_score then d.a else d.b end); exit;
    elsif d.round >= 20 then
      perform vp_duel_finish(p_duel, null); exit;
    else
      begin
        perform vp_duel_start_round(p_duel, d.round + 1);
      exception when others then
        perform vp_duel_finish(p_duel, null); -- không lấy được từ → dừng trận, tính hoà
      end;
      exit;
    end if;
  end loop;
end $$;

create or replace function public.vp_duel_invite(p_group uuid, p_opponent uuid, p_pet text, p_power text) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := vp_require_member(p_group); me record; opp record; did uuid;
begin
  if p_opponent = uid then raise exception 'Không thể tự thách đấu mình.'; end if;
  select * into me from vp_members where group_id = p_group and user_id = uid;
  select * into opp from vp_members where group_id = p_group and user_id = p_opponent;
  if not found then raise exception 'Người này không còn trong nhóm.'; end if;
  if vp_duel_clean(p_pet) is null or coalesce(me.garden ->> 'pet', '') = '' then raise exception 'Bạn cần có pet đang ra vườn để vào đấu trường.'; end if;
  if coalesce(opp.garden ->> 'pet', '') = '' then raise exception 'Đối thủ chưa có pet.'; end if;
  if opp.last_seen < now() - interval '30 seconds' then raise exception 'Đối thủ đang ngoại tuyến.'; end if;
  update vp_duels set status = 'expired' where status = 'invited' and created_at < now() - interval '90 seconds' and (a in (uid, p_opponent) or b in (uid, p_opponent));
  if exists (select 1 from vp_duels where status in ('invited', 'playing') and (a in (uid, p_opponent) or b in (uid, p_opponent))) then
    raise exception 'Bạn hoặc đối thủ đang có một trận/lời mời khác.';
  end if;
  if (select count(*) from vp_duels where a = uid and created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'Mời đấu quá nhiều, đợi một chút.';
  end if;
  insert into vp_duels (group_id, a, b, a_name, b_name, a_pet, a_power)
    values (p_group, uid, p_opponent, me.name, opp.name, vp_duel_clean(p_pet), coalesce(vp_duel_clean(p_power), 'cu_huc'))
    returning id into did;
  return did;
end $$;

create or replace function public.vp_duel_respond(p_duel uuid, p_accept boolean, p_pet text, p_power text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); d vp_duels;
begin
  perform vp_duel_tick(p_duel);
  select * into d from vp_duels where id = p_duel for update;
  if not found or d.b <> uid then raise exception 'Không tìm thấy lời mời.'; end if;
  perform vp_require_member(d.group_id);
  if d.status <> 'invited' then raise exception 'Lời mời đã hết hạn.'; end if;
  if not p_accept then update vp_duels set status = 'declined' where id = p_duel; return; end if;
  if vp_duel_clean(p_pet) is null then raise exception 'Bạn cần có pet đang ra vườn để vào đấu trường.'; end if;
  update vp_duels set status = 'playing', b_pet = vp_duel_clean(p_pet), b_power = coalesce(vp_duel_clean(p_power), 'cu_huc') where id = p_duel;
  perform vp_duel_start_round(p_duel, 1);
end $$;

create or replace function public.vp_duel_state(p_duel uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); d vp_duels;
begin
  perform vp_duel_tick(p_duel);
  select * into d from vp_duels where id = p_duel;
  if not found or uid not in (d.a, d.b) then raise exception 'Không tìm thấy trận đấu.'; end if;
  return jsonb_build_object(
    'id', d.id, 'status', d.status, 'me', case when uid = d.a then 'a' else 'b' end,
    'a', jsonb_build_object('id', d.a, 'name', d.a_name, 'pet', d.a_pet, 'power', d.a_power, 'score', d.a_score),
    'b', jsonb_build_object('id', d.b, 'name', d.b_name, 'pet', d.b_pet, 'power', d.b_power, 'score', d.b_score),
    'round', d.round, 'pattern', d.pattern,
    'left', case when d.round_start is null or d.round_end is not null then 0
      else greatest(0, 30 - extract(epoch from now() - d.round_start))::int end,
    'roundOver', d.round_end is not null, 'roundWinner', d.round_winner,
    'word', case when d.round_end is not null then d.word end,
    'tries', case when uid = d.a then d.a_tries else d.b_tries end,
    'history', d.history, 'winner', d.winner,
    'cards', case when d.status = 'finished' and d.winner is not null then
      case when d.pick is null then to_jsonb(jsonb_array_length(coalesce(d.cards, '[]'::jsonb))) else d.cards end end,
    'pick', d.pick, 'prize', d.prize,
    'applied', case when uid = d.a then d.a_applied else d.b_applied end
  );
end $$;

create or replace function public.vp_duel_answer(p_duel uuid, p_round int, p_guess text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); d vp_duels; side text; g text;
begin
  perform vp_duel_tick(p_duel);
  select * into d from vp_duels where id = p_duel for update;
  if not found or uid not in (d.a, d.b) then raise exception 'Không tìm thấy trận đấu.'; end if;
  if d.status <> 'playing' or d.round <> p_round or d.round_end is not null then
    return jsonb_build_object('ok', false, 'msg', 'Vòng này đã kết thúc.');
  end if;
  side := case when uid = d.a then 'a' else 'b' end;
  if (side = 'a' and d.a_tries >= 3) or (side = 'b' and d.b_tries >= 3) then
    return jsonb_build_object('ok', false, 'msg', 'Bạn đã hết 3 lượt trả lời ở vòng này.');
  end if;
  g := lower(regexp_replace(coalesce(p_guess, ''), '[^A-Za-z]', '', 'g'));
  if side = 'a' then update vp_duels set a_tries = a_tries + 1 where id = p_duel;
  else update vp_duels set b_tries = b_tries + 1 where id = p_duel; end if;
  if g <> d.word then
    return jsonb_build_object('ok', true, 'correct', false, 'msg', 'Chưa đúng!');
  end if;
  update vp_duels set round_end = now(), round_winner = uid,
    a_score = a_score + case when side = 'a' then 1 else 0 end,
    b_score = b_score + case when side = 'b' then 1 else 0 end,
    history = history || jsonb_build_array(jsonb_build_object('round', d.round, 'word', d.word, 'winner', uid))
  where id = p_duel;
  return jsonb_build_object('ok', true, 'correct', true, 'msg', 'Chính xác!');
end $$;

create or replace function public.vp_duel_forfeit(p_duel uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); d vp_duels;
begin
  select * into d from vp_duels where id = p_duel for update;
  if not found or uid not in (d.a, d.b) then raise exception 'Không tìm thấy trận đấu.'; end if;
  if d.status = 'invited' then
    update vp_duels set status = case when uid = d.a then 'cancelled' else 'declined' end where id = p_duel;
  elsif d.status = 'playing' then
    perform vp_duel_finish(p_duel, case when uid = d.a then d.b else d.a end);
  end if;
end $$;

create or replace function public.vp_duel_pick(p_duel uuid, p_idx int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); d vp_duels; v_prize jsonb;
begin
  select * into d from vp_duels where id = p_duel for update;
  if not found or d.status <> 'finished' or d.winner is distinct from uid then raise exception 'Bạn không có quyền lật bài.'; end if;
  if d.pick is not null then return d.prize; end if;
  if p_idx is null or p_idx < 0 or p_idx > 2 then raise exception 'Lá bài không hợp lệ.'; end if;
  v_prize := d.cards -> p_idx;
  update vp_duels set pick = p_idx, prize = v_prize where id = p_duel;
  return v_prize;
end $$;

create or replace function public.vp_duel_ack(p_duel uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  update vp_duels set a_applied = a_applied or (a = uid), b_applied = b_applied or (b = uid)
  where id = p_duel and uid in (a, b) and status = 'finished' and (winner is null or pick is not null);
  delete from vp_duels where created_at < now() - interval '7 days';
end $$;

-- danh sách trận/lời mời cần chú ý của mình (gọi trong vp_sync)
create or replace function public.vp_my_duels(p_group uuid, uid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'status', status, 'a', a, 'b', b, 'aName', a_name, 'bName', b_name,
      'winner', winner, 'picked', pick is not null) order by created_at), '[]'::jsonb)
  from vp_duels
  where group_id = p_group and uid in (a, b)
    and (status = 'playing' or (status = 'invited' and created_at > now() - interval '90 seconds')
      or (status = 'finished' and not (case when uid = a then a_applied else b_applied end)));
$$;

revoke all on function public.vp_duel_clean(text), public.vp_blocked_words(), public.vp_fetch_words(int), public.vp_duel_word_len(int), public.vp_duel_start_round(uuid, int), public.vp_duel_finish(uuid, uuid),
  public.vp_duel_tick(uuid), public.vp_my_duels(uuid, uuid), public.vp_duel_invite(uuid, uuid, text, text),
  public.vp_duel_respond(uuid, boolean, text, text), public.vp_duel_state(uuid), public.vp_duel_answer(uuid, int, text),
  public.vp_duel_forfeit(uuid), public.vp_duel_pick(uuid, int), public.vp_duel_ack(uuid) from public, anon;
grant execute on function public.vp_duel_invite(uuid, uuid, text, text), public.vp_duel_respond(uuid, boolean, text, text),
  public.vp_duel_state(uuid), public.vp_duel_answer(uuid, int, text), public.vp_duel_forfeit(uuid),
  public.vp_duel_pick(uuid, int), public.vp_duel_ack(uuid) to authenticated;

