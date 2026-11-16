'use strict';
/**
 * Âm thanh tự tạo bằng Web Audio (không dùng file nhạc → không vướng bản quyền).
 *  - Nhạc nền: vòng lặp chiptune nhẹ nhàng (ngũ cung, nhịp chậm) tạo ngẫu nhiên theo hợp âm.
 *  - Hiệu ứng: tưới, thu hoạch, gieo hạt, mua đồ, lên cấp, pet, lỗi, bấm nút...
 */
(function () {
  let ctx = null;
  let master = null; let musicBus = null; let sfxBus = null;
  let musicOn = false; let sfxOn = true; let volume = 0.5;
  let timer = null; let nextTime = 0; let step = 0;

  function ensure() {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.35; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.6; sfxBus.connect(master);
    master.gain.value = volume;
    return ctx;
  }

  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  /** Một nốt: dạng sóng, tần số, thời điểm, độ dài, âm lượng, bus. */
  function tone(type, freq, t, dur, vol, bus, glideTo) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(t, dur, vol, bus, fFrom, fTo) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(fFrom, t); f.frequency.exponentialRampToValueAtTime(fTo || fFrom, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t); src.stop(t + dur + 0.02);
  }

  // ---------------------------------------------------------------- nhạc nền
  // Vòng hợp âm C – Am – F – G (mỗi hợp âm 8 nhịp móc đơn), giai điệu ngũ cung C D E G A.
  const CHORDS = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]];
  const SCALE = [60, 62, 64, 67, 69, 72, 74, 76];
  const BPM = 78; const EIGHTH = 60 / BPM / 2;
  let melodyIdx = 3;

  function scheduleStep(t) {
    const bar = Math.floor(step / 8) % CHORDS.length; const pos = step % 8;
    const chord = CHORDS[bar];
    if (pos === 0) { // nền: hợp âm rải chậm + bass
      tone('sine', hz(chord[0] - 12), t, EIGHTH * 7.5, 0.18, musicBus);
      chord.forEach((n, i) => tone('triangle', hz(n), t + i * 0.03, EIGHTH * 7, 0.035, musicBus));
    }
    if (pos === 4) tone('sine', hz(chord[0] - 12 + 7), t, EIGHTH * 3.5, 0.1, musicBus);
    // giai điệu: bước ngẫu nhiên nhỏ trong thang ngũ cung, thỉnh thoảng nghỉ
    if (pos % 2 === 0 && Math.random() < 0.72) {
      melodyIdx = Math.max(0, Math.min(SCALE.length - 1, melodyIdx + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
      const len = Math.random() < 0.3 ? EIGHTH * 3.6 : EIGHTH * 1.8;
      tone('square', hz(SCALE[melodyIdx]), t, len, 0.022, musicBus);
      tone('sine', hz(SCALE[melodyIdx] + 12), t, len * 0.6, 0.012, musicBus);
    }
    if (pos % 2 === 1) noise(t, 0.03, 0.012, musicBus, 7000);
  }

  function tick() {
    while (nextTime < ctx.currentTime + 0.25) {
      scheduleStep(nextTime);
      nextTime += EIGHTH; step++;
    }
  }

  function startMusic() {
    ensure();
    if (ctx.state === 'suspended') ctx.resume();
    if (timer) return;
    nextTime = ctx.currentTime + 0.1; step = 0;
    timer = setInterval(tick, 60);
  }
  function stopMusic() { if (timer) { clearInterval(timer); timer = null; } }

  // ---------------------------------------------------------------- hiệu ứng
  const SFX = {
    click(t) { tone('square', 880, t, 0.04, 0.05, sfxBus); },
    open(t) { tone('triangle', 520, t, 0.08, 0.08, sfxBus, 780); },
    close(t) { tone('triangle', 700, t, 0.08, 0.07, sfxBus, 460); },
    water(t) { noise(t, 0.35, 0.22, sfxBus, 900, 2600); [0.05, 0.14, 0.22].forEach((d, i) => tone('sine', 900 + i * 260, t + d, 0.09, 0.08, sfxBus, 1400 + i * 300)); },
    plant(t) { tone('sine', 220, t, 0.12, 0.25, sfxBus, 120); noise(t, 0.08, 0.1, sfxBus, 400); tone('triangle', 660, t + 0.08, 0.1, 0.08, sfxBus); },
    harvest(t) { [72, 76, 79, 84].forEach((n, i) => tone('square', hz(n), t + i * 0.06, 0.12, 0.06, sfxBus)); tone('sine', hz(96), t + 0.25, 0.3, 0.05, sfxBus); },
    coin(t) { tone('square', hz(83), t, 0.07, 0.07, sfxBus); tone('square', hz(88), t + 0.07, 0.2, 0.07, sfxBus); },
    fert(t) { [0, 1, 2, 3, 4].forEach((i) => tone('sine', 1200 + Math.random() * 1200, t + i * 0.04, 0.08, 0.04, sfxBus)); },
    remove(t) { tone('sine', 160, t, 0.18, 0.3, sfxBus, 60); noise(t, 0.15, 0.12, sfxBus, 300, 120); },
    levelup(t) { [60, 64, 67, 72, 67, 72, 76].forEach((n, i) => tone('square', hz(n + 12), t + i * 0.09, i === 6 ? 0.45 : 0.1, 0.07, sfxBus)); },
    bloom(t) { [79, 84, 88].forEach((n, i) => tone('triangle', hz(n), t + i * 0.08, 0.35, 0.05, sfxBus)); },
    thirsty(t) { tone('sine', 1400, t, 0.06, 0.06, sfxBus, 700); tone('sine', 1100, t + 0.12, 0.06, 0.05, sfxBus, 600); },
    pet(t) { tone('triangle', 700, t, 0.08, 0.08, sfxBus, 1000); tone('triangle', 1000, t + 0.09, 0.1, 0.07, sfxBus, 820); },
    guard(t) { tone('square', 300, t, 0.08, 0.1, sfxBus, 200); tone('square', 300, t + 0.12, 0.1, 0.1, sfxBus, 180); },
    error(t) { tone('square', 220, t, 0.09, 0.06, sfxBus); tone('square', 165, t + 0.1, 0.14, 0.06, sfxBus); },
  };

  function play(name) {
    if (!sfxOn || !SFX[name]) return;
    ensure();
    if (ctx.state === 'suspended') ctx.resume();
    SFX[name](ctx.currentTime + 0.01);
  }

  function configure({ music, sfx, vol }) {
    if (typeof vol === 'number') { volume = Math.max(0, Math.min(1, vol)); if (master) master.gain.value = volume; }
    if (typeof sfx === 'boolean') sfxOn = sfx;
    if (typeof music === 'boolean') {
      musicOn = music;
      if (musicOn) startMusic(); else stopMusic();
    }
  }

  window.Sound = { play, configure, isMusicOn: () => musicOn };
})();
