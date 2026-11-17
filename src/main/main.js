'use strict';
/**
 * Tiến trình chính Electron: cửa sổ thanh ngang, khay hệ thống, phím tắt,
 * vòng lặp thời gian, lưu game, thông báo.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const {
  app, BrowserWindow, net, ipcMain, screen, Tray, Menu, nativeImage, Notification, globalShortcut, safeStorage,
} = require('electron');

const C = require('../core/catalog');
const G = require('../core/garden');
const MG = require('../core/minigames');
const store = require('../core/store');
const D = require('../core/decor');
const A = require('../core/actions');
const { LanRoom } = require('./lan');
const { publicGarden } = require('../core/snapshot');
const { GroupRoom, validSupabase } = require('./group');
const { verifyAdmin, KEY_FILE_NAME } = require('./admin-gate');

const ROOT = path.join(__dirname, '..', '..');
const BAR_H = 178;
const PANEL_H = 300;
const ARENA_H = 330; // Đấu trường thú: thanh vườn cao lên, trận đấu hiện đè lên vườn
const TAB_W = 310;
const TAB_H = 34;
const COMPACT_W = 980;
const TICK_MS = 20 * 1000;
const SERVER_TICK_MS = 60 * 1000; // nhịp đồng bộ với máy chủ trò chơi (tua vườn, nhận lượt tưới hộ / hái trộm)

let win = null;
let tray = null;
let state = null;
let saveFile = '';
let saveCipher = null;
let mode = 'bar'; // collapsed | bar | panel
let dirty = false;
let lastTodo = -1;
let lan = null;
let lanFile = '';
let lanSaveQueue = Promise.resolve();
// Chế độ máy chủ: khi bản build có cấu hình Supabase, vườn/tiền/đồ nằm trên máy chủ (server/game.js).
// `state` lúc đó chỉ là bản sao máy chủ gửi về để vẽ vườn; mọi hành động gửi lên máy chủ tính.
let remote = false;
let cacheFile = '';
let cacheDirty = false;
let serverOk = false; // đã nhận state từ máy chủ ít nhất 1 lần
let serverError = '';
let initSettings = null; // cài đặt của save cũ trên máy: gửi kèm lần đầu tạo vườn trên máy chủ
// Khoá bí mật Admin (scripts\tao-khoa-admin.cmd) – chỉ có trên máy admin, dùng ký lệnh Admin gửi máy chủ.
const ADMIN_PEM = path.join(os.homedir(), '.vuon-pixel-admin', 'admin-private.pem');
const DEV = !app.isPackaged; // bản chạy từ mã nguồn: tự tải lại khi sửa code
// Admin chỉ bật trên máy có file khoá do scripts\tao-khoa-admin.cmd tạo (ký bằng khoá bí mật của người phát triển).
const ADMIN = verifyAdmin(require('../../package.json').adminPublicKey, path.join(app.getPath('appData'), KEY_FILE_NAME));
// Bản chạy từ mã nguồn (yarn start, có thể bật Admin) dùng thư mục dữ liệu riêng, không đụng save của bản phát hành.
if (DEV) app.setPath('userData', path.join(app.getPath('appData'), 'Vuon Pixel (dev)'));

if (!app.requestSingleInstanceLock()) {
  console.log('Vườn Pixel đang chạy sẵn (xem biểu tượng ở khay hệ thống) – bản này tự thoát. Thoát bản cũ trước rồi chạy lại.');
  app.quit();
}

// ---------------------------------------------------------------- cửa sổ

function boundsFor(m) {
  const wa = screen.getPrimaryDisplay().workArea;
  const top = state.settings.position === 'top';
  if (m === 'collapsed') {
    const x = wa.x + wa.width - TAB_W - 16;
    return { x, y: top ? wa.y : wa.y + wa.height - TAB_H, width: TAB_W, height: TAB_H };
  }
  const width = state.settings.barWidth === 'compact' ? Math.min(COMPACT_W, wa.width) : wa.width;
  const x = wa.x + wa.width - width;
  const height = m === 'panel' ? BAR_H + PANEL_H : m === 'arena' ? ARENA_H : BAR_H;
  return { x, y: top ? wa.y : wa.y + wa.height - height, width, height };
}

function applyLayout(m) {
  mode = m;
  if (lan) lan.setAway(m === 'collapsed');
  if (!win) return;
  win.setBounds(boundsFor(m));
  win.webContents.send('layout', { mode: m, position: state.settings.position });
}

function createWindow() {
  win = new BrowserWindow({
    ...boundsFor(mode),
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: state.settings.alwaysOnTop,
    hasShadow: false,
    show: false,
    backgroundColor: '#00000000',
    title: 'Vườn Pixel',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });
  win.loadFile(path.join(ROOT, 'src', 'renderer', 'index.html'));
  win.once('ready-to-show', () => win.showInactive());
  win.on('closed', () => { win = null; });
  screen.on('display-metrics-changed', () => applyLayout(mode));
}

// ---------------------------------------------------------------- trạng thái

function push() {
  if (win) win.webContents.send('state', G.view(state));
}

function persist() {
  if (remote) { saveCache(); return; }
  try {
    store.save(saveFile, state, { cipher: saveCipher });
    dirty = false;
  } catch (e) {
    console.error('Không lưu được game:', e);
  }
}

// Bản sao để mở app khi mất mạng vẫn thấy vườn (không có giá trị gì: máy chủ không đọc file này).
function saveCache() {
  if (!cacheDirty || !serverOk) return;
  try {
    fs.writeFileSync(`${cacheFile}.tmp`, JSON.stringify(state));
    fs.renameSync(`${cacheFile}.tmp`, cacheFile);
    cacheDirty = false;
  } catch (e) { console.error('Không lưu được bản sao vườn:', e.message); }
}

function loadCache() {
  try { return G.migrate(JSON.parse(fs.readFileSync(cacheFile, 'utf8')), Date.now()); } catch (_) { return null; }
}

/** Nhận state mới từ máy chủ trò chơi. */
function applyServer(res) {
  if (!res || !res.state || typeof res.state !== 'object') return;
  const prevPos = state && state.settings.position;
  const prevWidth = state && state.settings.barWidth;
  state = G.migrate(res.state, Date.now());
  G.advance(state, Date.now());
  serverOk = true; serverError = ''; cacheDirty = true;
  if (win && (state.settings.position !== prevPos || state.settings.barWidth !== prevWidth)) applyLayout(mode);
  push(); updateTray();
}

async function serverCall(body) {
  try {
    const res = await lan.game(serverOk || !initSettings ? body : { ...body, init: { settings: initSettings } });
    if (res.state) initSettings = null;
    return res;
  } catch (e) {
    serverError = e.message;
    throw e;
  }
}

let serverTicking = null;
function serverTick() {
  if (!remote || serverTicking) return serverTicking;
  serverTicking = serverCall({ a: { type: 'tick' } })
    .catch((e) => { console.error('Đồng bộ máy chủ lỗi:', e.message); })
    .finally(() => { serverTicking = null; });
  return serverTicking;
}

function adminEnvelope(a) {
  let pem;
  try { pem = fs.readFileSync(ADMIN_PEM, 'utf8'); } catch (_) { throw new Error('Thiếu khoá bí mật Admin trên máy này (chạy scripts\\tao-khoa-admin.cmd).'); }
  const payload = JSON.stringify({ uid: lan.config.auth && lan.config.auth.uid, ts: Date.now(), a });
  return { payload, sig: crypto.sign(null, Buffer.from(payload), crypto.createPrivateKey(pem)).toString('base64') };
}

/** Hành động từ giao diện / khay: máy chủ tính (chế độ Supabase) hoặc tính tại máy (bản chưa cấu hình Supabase). */
async function doAction(a) {
  if (!a || typeof a.type !== 'string') return { ok: false, msg: 'Hành động không hợp lệ.' };
  let r;
  if (!remote && (a.type === 'adminList' || a.type === 'adminUser')) return { ok: false, msg: 'Bảng tài khoản chỉ có khi game lưu trên máy chủ.' };
  if (remote) {
    try {
      if (A.ADMIN_TYPES.has(a.type)) {
        if (!ADMIN) return { ok: false, msg: 'Admin đã tắt.' };
        await lan.accessToken();
        r = (await serverCall({ admin: adminEnvelope(a) })).r;
      } else {
        r = (await serverCall({ a })).r;
      }
    } catch (e) {
      return { ok: false, msg: e.status ? e.message : `Không kết nối được máy chủ trò chơi – kiểm tra Internet rồi thử lại. (${e.message})` };
    }
    r = r && typeof r === 'object' ? r : { ok: false, msg: 'Không thực hiện được.' };
  } else {
    const out = A.run(state, a, { now: Date.now(), rng: Math.random, admin: ADMIN });
    state = out.state; r = out.r;
    if (r.ok) { dirty = true; persist(); }
    push(); updateTray();
  }
  if (r.ok && a.type === 'settings') applyWindowSettings(a.patch || {});
  return r;
}

function applyWindowSettings(patch) {
  const s = state.settings;
  if ('alwaysOnTop' in patch && win) win.setAlwaysOnTop(s.alwaysOnTop);
  if ('autoStart' in patch && app.isPackaged) app.setLoginItemSettings({ openAtLogin: s.autoStart });
  applyLayout(mode);
}

async function loadLanConfig() {
  if (!(await safeStorage.isAsyncEncryptionAvailable())) throw new Error('Máy chưa có khoá bảo vệ dữ liệu LAN.');
  try {
    const encrypted = fs.readFileSync(lanFile);
    const { result } = await safeStorage.decryptStringAsync(encrypted);
    return JSON.parse(result);
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw new Error('Không đọc được dữ liệu ghép cặp LAN; file cũ được giữ nguyên.');
  }
}

function saveLanConfig(config) {
  const snapshot = JSON.stringify(config);
  lanSaveQueue = lanSaveQueue.then(async () => {
    const encrypted = await safeStorage.encryptStringAsync(snapshot);
    const tmp = `${lanFile}.tmp`;
    fs.mkdirSync(path.dirname(lanFile), { recursive: true });
    fs.writeFileSync(tmp, encrypted);
    fs.renameSync(tmp, lanFile);
  });
  return lanSaveQueue;
}

function handleLanVisit({ kind, slot, by, away }) {
  G.advance(state, Date.now());
  if (kind === 'steal' && !away) return { ok: false, msg: 'Chỉ hái hoa khi chủ vườn Vắng mặt.' };
  const result = kind === 'water' ? G.visitWater(state, slot, by) : G.visitSteal(state, slot, by);
  persist(); // Pet có thể chặn trộm và ngủ dù kết quả là thất bại.
  push(); updateTray();
  return result;
}

function applyLanReward(loot) {
  if (!loot || !Number.isInteger(loot.money) || !Number.isInteger(loot.exp)
    || loot.money < 0 || loot.money > 10000 || loot.exp < 0 || loot.exp > 10000) throw new Error('Phần thưởng LAN không hợp lệ.');
  state.money += loot.money;
  G.gainExp(state, loot.exp);
  persist(); push(); updateTray();
}

function notify(events) {
  if (!state.settings.notify || !Notification.isSupported() || !events.length) return;
  const name = (ev) => `${C.SPECIES_BY_ID[ev.species].name} (ô ${ev.slot + 1})`;
  const bloom = events.filter((e) => e.type === 'bloom');
  const thirsty = events.filter((e) => e.type === 'thirsty');
  const dead = events.filter((e) => e.type === 'dead');
  const lines = [];
  if (bloom.length) lines.push(`🌸 Đã nở: ${bloom.map(name).join(', ')}`);
  if (thirsty.length) lines.push(`💧 Đang khát: ${thirsty.map(name).join(', ')}`);
  if (dead.length) lines.push(`🥀 Đã chết: ${dead.map(name).join(', ')}`);
  if (!lines.length) return;
  const n = new Notification({ title: 'Vườn Pixel', body: lines.join('\n'), silent: false });
  n.on('click', () => applyLayout('bar'));
  n.show();
}

let giftNoticeDay = null;
let lastServerTick = 0;
function tick() {
  if (remote && Date.now() - lastServerTick >= SERVER_TICK_MS - 1000) { lastServerTick = Date.now(); serverTick(); }
  const events = G.advance(state, Date.now());
  const today = G.dayKey(Date.now());
  if (state.settings.notify && G.dailyAvailable(state) && giftNoticeDay !== today && Notification.isSupported()) {
    giftNoticeDay = today;
    new Notification({ title: 'Vườn Pixel', body: '🎁 Quà hằng ngày đã sẵn sàng!' }).show();
  }
  // Khi mở app sau thời gian dài, chỉ báo các sự kiện gần đây (tránh spam).
  const recent = events.filter((e) => Date.now() - e.at < 10 * 60 * 1000);
  notify(recent);
  if (events.length) { dirty = true; cacheDirty = true; }
  push();
  updateTray();
}

// ---------------------------------------------------------------- hành động từ giao diện
// Bảng hành động: src/core/actions.js (dùng chung với máy chủ). Xem doAction() ở trên.

function updateSettings(patch) {
  doAction({ type: 'settings', patch }).catch(() => {});
}

// ---------------------------------------------------------------- asset pack

/** Quét assets/packs và <userData>/packs, đọc manifest.json, đổi đường dẫn ảnh thành URL file://. */
function scanPacks() {
  const dirs = [path.join(ROOT, 'assets', 'packs'), path.join(app.getPath('userData'), 'packs')];
  const packs = [];
  for (const dir of dirs) {
    let names = [];
    try { names = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort(); } catch (_) { continue; }
    for (const name of names) {
      const base = path.join(dir, name);
      const mf = path.join(base, 'manifest.json');
      if (!fs.existsSync(mf)) continue;
      try {
        const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
        const resolve = (ref) => {
          if (!ref) return null;
          const r = typeof ref === 'string' ? { file: ref } : { ...ref };
          const abs = path.resolve(base, r.file);
          if (!abs.startsWith(base) || !fs.existsSync(abs)) return null;
          r.url = pathToFileURL(abs).href;
          return r;
        };
        const mapGroup = (g, nested) => Object.fromEntries(Object.entries(g || {}).map(([k, v]) => [
          k, nested ? Object.fromEntries(Object.entries(v || {}).map(([st, ref]) => [st, resolve(ref)])) : resolve(v),
        ]));
        packs.push({
          id: name, name: m.name || name, author: m.author || '', license: m.license || '', url: m.url || '',
          scale: m.scale || null,
          plants: mapGroup(m.plants, true), pots: mapGroup(m.pots), decor: mapGroup(m.decor), pets: Object.fromEntries(Object.entries(m.pets || {}).map(([k, v]) => [k, v && (typeof v === 'string' || v.file
            ? resolve(v)
            : { ...v, walk: resolve(v.walk), idle: resolve(v.idle), sleep: resolve(v.sleep) })])),
        });
      } catch (e) {
        console.error(`Manifest lỗi: ${mf}`, e.message);
      }
    }
  }
  return packs;
}

// ---------------------------------------------------------------- khay & phím tắt

function trayIcon(alert = false) {
  const img = nativeImage.createFromPath(path.join(ROOT, 'assets', alert ? 'icon-alert.png' : 'icon.png'));
  return img.isEmpty() ? img : img.resize({ width: 16, height: 16, quality: 'best' });
}

function updateTray() {
  if (!tray) return;
  const v = G.view(state);
  const bloom = v.slots.filter((s) => s.stage === 'bloom').length;
  const thirsty = v.slots.filter((s) => s.thirsty).length;
  const todo = v.slots.filter((s) => s.thirsty || ['bloom', 'faded', 'dead'].includes(s.stage) || s.theftMark).length + (v.daily.available ? 1 : 0) + (v.wheel.free ? 1 : 0);
  if (todo !== lastTodo) { lastTodo = todo; tray.setImage(trayIcon(todo > 0)); }
  tray.setToolTip(`Vườn Pixel — Cấp ${v.level} · ${v.money} xu\n${bloom} hoa nở · ${thirsty} cây khát`);
}

function buildTray() {
  tray = new Tray(trayIcon());
  const menu = Menu.buildFromTemplate([
    { label: 'Mở vườn', click: () => { win.showInactive(); applyLayout('bar'); } },
    { label: 'Thu gọn', click: () => applyLayout('collapsed') },
    { label: 'Ẩn hẳn', click: () => win.hide() },
    { type: 'separator' },
    { label: 'Đặt ở cạnh dưới', click: () => updateSettings({ position: 'bottom' }) },
    { label: 'Đặt ở cạnh trên', click: () => updateSettings({ position: 'top' }) },
    { type: 'separator' },
    { label: 'Mở thư mục dữ liệu', click: () => require('electron').shell.openPath(app.getPath('userData')) },
    { label: 'Thoát', click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
  tray.on('click', () => {
    if (!win.isVisible()) win.showInactive();
    applyLayout(mode === 'collapsed' ? 'bar' : 'collapsed');
  });
  updateTray();
}

// ---------------------------------------------------------------- tự tải lại khi sửa code (bản dev)

/**
 * Sửa file trong src/renderer → tải lại giao diện; sửa src/core hoặc src/main → lưu game rồi khởi động lại app.
 * Không cần chạy lại yarn start.
 */
function watchSource() {
  const timers = {};
  const on = (dir, fn) => {
    try {
      fs.watch(path.join(ROOT, 'src', dir), { recursive: true }, () => {
        clearTimeout(timers[dir]);
        timers[dir] = setTimeout(fn, 400);
      });
    } catch (e) { console.error('Không theo dõi được', dir, e.message); }
  };
  on('renderer', () => { if (win) win.webContents.reloadIgnoringCache(); });
  const restart = () => { cacheDirty = true; persist(); app.relaunch(); app.exit(0); };
  on('core', restart);
  on('main', restart);
}

// ---------------------------------------------------------------- khởi động

app.whenReady().then(async () => {
  app.setAppUserModelId('vn.pixelgarden.app');
  // Bản này dùng save mã hoá (save.dat): bản cũ lưu save.json dạng chữ, người chơi đã sửa tay được chỉ số
  // → mọi người bắt đầu lại, chỉ giữ Cài đặt. Khoá do Windows (DPAPI) giữ cho đúng tài khoản + app.
  const userData = app.getPath('userData');
  saveCipher = safeStorage.isEncryptionAvailable()
    ? { encrypt: (t) => safeStorage.encryptString(t), decrypt: (b) => safeStorage.decryptString(b) }
    : null;
  saveFile = path.join(userData, saveCipher ? 'save.dat' : 'save.json');
  state = store.load(saveFile, Date.now(), { cipher: saveCipher, legacy: saveCipher ? path.join(userData, 'save.json') : null });
  G.advance(state, Date.now());
  cacheFile = path.join(userData, 'server-copy.json');
  lanFile = path.join(app.getPath('userData'), 'lan.sec');
  let lanConfig = {};
  let lanError = '';
  try { lanConfig = await loadLanConfig(); } catch (e) { lanError = e.message; }
  // Máy trung chuyển phòng Internet: "relayUrl" trong package.json (đặt sau khi deploy relay/),
  // có thể ghi đè khi phát triển bằng biến môi trường PIXEL_GARDEN_RELAY.
  const relayUrl = process.env.PIXEL_GARDEN_RELAY || require('../../package.json').relayUrl || '';
  // Nhóm chơi chung Supabase: "supabase": { "url", "anonKey" } trong package.json (xem supabase/README.md),
  // hoặc biến môi trường PIXEL_GARDEN_SUPABASE_URL / PIXEL_GARDEN_SUPABASE_KEY khi chạy thử.
  const pkgSb = require('../../package.json').supabase || {};
  const supabase = { url: process.env.PIXEL_GARDEN_SUPABASE_URL || pkgSb.url || '', anonKey: process.env.PIXEL_GARDEN_SUPABASE_KEY || pkgSb.anonKey || '' };
  const changed = (v) => { if (win) win.webContents.send('lan-state', v); };
  if (validSupabase(supabase)) {
    // net.fetch dùng mạng của Chromium → tự đi qua proxy của Windows giống trình duyệt.
    lan = new GroupRoom({ config: lanConfig, saveConfig: saveLanConfig, supabase, fetch: (u, o) => net.fetch(u, o), changed, applyServer });
    lan.error = lanError;
    if (!lanError) lan.start();
    // Vườn lưu trên máy chủ: lúc mở app hiện bản sao gần nhất, rồi lấy bản thật từ máy chủ.
    remote = !lanError;
    if (remote) {
      initSettings = state.settings; // chỉ dùng nếu máy chủ chưa có vườn của mình (lần đầu chơi bản này)
      const fresh = G.createState(Date.now()); fresh.settings = state.settings; // save cũ trên máy không còn dùng
      state = loadCache() || fresh;
      G.advance(state, Date.now());
    }
  } else {
    lan = new LanRoom({ config: lanConfig, saveConfig: saveLanConfig, relayUrl,
      getGarden: () => publicGarden(G.view(state)), handleVisit: handleLanVisit, applyReward: applyLanReward, changed });
    lan.error = lanError;
  }

  ipcMain.handle('init', () => ({
    catalog: { species: C.SPECIES, pots: C.POTS, potDecor: D.POT_DECOR, potSlots: D.POT_SLOTS, slotNames: D.SLOT_NAMES, houseLevels: D.HOUSE_LEVELS, houseDecor: D.HOUSE_DECOR, houseSlots: D.HOUSE_SLOTS, houseSlotNames: D.HOUSE_SLOT_NAMES, sceneObjects: D.SCENE_OBJECTS, backgrounds: D.BACKGROUNDS, items: C.ITEMS, powers: C.POWERS, fish: MG.FISH, games: { limits: MG.LIMITS, names: MG.NAMES, bet: MG.BET, baucua: MG.BAUCUA }, pets: C.PETS, petTiers: C.PET_TIERS, tiers: C.TIERS, wheel: { ...C.RULES.wheel, pool: G.wheelPool() }, rules: { thirstyAt: C.RULES.thirstyAt, waterBlockAbove: C.RULES.waterBlockAbove, maxSlots: C.RULES.maxSlots } },
    view: G.view(state),
    packs: scanPacks(),
    lan: lan.status(),
    server: remote ? { ok: serverOk, error: serverError } : null,
    mode: mode === 'panel' ? (applyLayout('bar'), 'bar') : mode,
    dev: ADMIN,
  }));
  ipcMain.handle('action', (_e, a) => doAction(a));
  ipcMain.on('layout', (_e, m) => { if (['collapsed', 'bar', 'panel', 'arena'].includes(m)) applyLayout(m); });
  ipcMain.handle('rescanPacks', () => scanPacks());
  ipcMain.handle('lan', async (e, a) => {
    if (!win || e.sender !== win.webContents || !a || typeof a !== 'object') return { ok: false, msg: 'Yêu cầu LAN không hợp lệ.' };
    if (lanError) return { ok: false, msg: lanError };
    try {
      if (lan instanceof GroupRoom) {
        if (a.type === 'createGroup') return await lan.createGroup();
        if (a.type === 'joinGroup') return await lan.joinGroup(a.code);
        if (a.type === 'leave') return await lan.leave();
        if (a.type === 'alias') return await lan.setAlias(a.name);
        if (a.type === 'friend') return await lan.friend(a.id);
        if (a.type === 'chat') return await lan.chat(a.text);
        if (a.type === 'watch') return lan.watch(a.id);
        if (a.type === 'visit') return await lan.visit(a.target, a.kind, a.slot);
        if (a.type === 'duelInvite') return await lan.duelInvite(a.target);
        if (a.type === 'duelRespond') return await lan.duelRespond(a.id, a.accept === true);
        if (a.type === 'duelAnswer') return await lan.duelAnswer(a.guess);
        if (a.type === 'duelPick') return await lan.duelPick(a.idx);
        if (a.type === 'duelForfeit') return await lan.duelForfeit();
        if (a.type === 'duelClose') return lan.closeDuel();
        if (a.type === 'treeState') return await lan.treeState();
        if (/^card[A-Z]/.test(String(a.type))) {
          if (a.type === 'cardClose') return lan.closeTable();
          return await lan.cardAction({ type: a.type, room: a.room, game: a.game, stake: Number(a.stake), invite: Array.isArray(a.invite) ? a.invite.slice(0, 10) : undefined,
            ids: Array.isArray(a.ids) ? a.ids.slice(0, 10) : undefined, move: a.move && typeof a.move === 'object' ? a.move : undefined });
        }
        if (a.type === 'treeWater') return await lan.treeAction({ type: 'treeWater' });
        if (a.type === 'treeFert') return await lan.treeAction({ type: 'treeFert', item: String(a.item || '') });
        if (a.type === 'treeClaim') return await lan.treeAction({ type: 'treeClaim', milestone: Number(a.milestone) });
        if (a.type === 'treeClaimTop') return await lan.treeAction({ type: 'treeClaimTop' });
        return { ok: false, msg: 'Hành động nhóm không hợp lệ.' };
      }
      if (a.type === 'host') return { ok: false, msg: 'Phòng LAN đã tắt, hãy dùng phòng Internet.' };
      if (a.type === 'hostOnline') return await lan.hostOnline();
      if (a.type === 'invite') return await lan.invite();
      if (a.type === 'join') {
        if (!/^\s*PG2\|/.test(String(a.code || ''))) return { ok: false, msg: 'Chỉ nhận mã mời phòng Internet (bắt đầu bằng PG2|).' };
        return await lan.join(a.code);
      }
      if (a.type === 'reconnect') {
        if (!lan.config.joined || lan.config.joined.mode !== 'online') return { ok: false, msg: 'Phòng LAN đã tắt. Hãy xin mã mời phòng Internet (PG2|…).' };
        return await lan.reconnect();
      }
      if (a.type === 'leave') return await lan.leave();
      if (a.type === 'alias') return await lan.setAlias(a.name);
      if (a.type === 'friend') return await lan.friend(a.id);
      if (a.type === 'revoke') return await lan.revoke(a.id);
      if (a.type === 'chat') return await lan.chat(a.text);
      if (a.type === 'visit') return await lan.visit(a.target, a.kind, a.slot);
      return { ok: false, msg: 'Hành động LAN không hợp lệ.' };
    } catch (error) { return { ok: false, msg: error.message }; }
  });
  ipcMain.on('quit', () => app.quit());

  createWindow();
  buildTray();
  globalShortcut.register('Control+Alt+G', () => {
    if (!win.isVisible()) win.showInactive();
    applyLayout(mode === 'collapsed' ? 'bar' : 'collapsed');
  });

  setInterval(tick, TICK_MS);
  if (remote) { lastServerTick = Date.now(); serverTick(); }
  if (DEV) watchSource();
  setInterval(() => { if (dirty || cacheDirty) persist(); }, 60 * 1000);
});

app.on('second-instance', () => { if (win) { win.showInactive(); applyLayout('bar'); } });
app.on('will-quit', () => { globalShortcut.unregisterAll(); if (state && !remote) persist(); else saveCache(); });
app.on('window-all-closed', () => app.quit());
