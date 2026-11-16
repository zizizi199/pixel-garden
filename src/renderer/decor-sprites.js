'use strict';
/**
 * Sprite pixel cho trang trí chậu, nhà thú (4 cấp) và trang trí nhà thú. Tự vẽ bằng code.
 * Mọi hàm trả về { src, sx, sy, sw, sh } giống Sprites.* để dùng chung Sprites.paint.
 */
(function () {
  const { Pix, outline } = window.Sprites;
  const K = '#2b1d0e';

  // ---------------------------------------------------------------- trang trí chậu
  const POT_DECOR = {
    soi_trang: { rows: ['..wW...w.', '.wWWw.wWw', 'wWWwWwwWW'], pal: { w: '#f1f3f5', W: '#adb5bd' } },
    reu_xanh: { rows: ['.gG..gg.Gg..', 'gGGggGGgGGgg', 'GgGGgGgGGgGG'], pal: { g: '#74c69d', G: '#2d6a4f' } },
    nam_nho: { rows: ['.rrr....', 'rwrrr.rr', 'rrrrrrwr', '.ww..rrr', '.ww...w.', '.ww...w.'], pal: { r: '#e63946', w: '#fff1e6' } },
    chu_lun: { rows: ['..r...', '..rr..', '.rrr..', '.rrrr.', '.fkf..', 'wwwwww', '.wwww.', '.bbbb.', '.bbbb.', '.k..k.'], pal: { r: '#d62828', f: '#f4c69d', k: K, w: '#ffffff', b: '#3a86ff' } },
    no_do: { rows: ['rr...rr', 'rRr.rRr', '.rrRrr.', 'rRr.rRr', 'rr...rr'], pal: { r: '#ef476f', R: '#a4133c' } },
    the_ten: { rows: ['.bbbbbb.', 'bWWWWWWb', 'bWkkWkWb', 'bWWWWWWb', '.bbbbbb.'], pal: { b: '#8d5a2b', W: '#e9c89a', k: '#5c3a1e' } },
    day_den: { rows: ['k..kk..kk..kk..k', '.kk..kk..kk..kk.', '.r...y...b...g..', '.R...Y...B...G..'], pal: { k: '#3d3d3d', r: '#ff595e', R: '#ffb3b5', y: '#ffca3a', Y: '#fff3b0', b: '#4cc9f0', B: '#c8f2ff', g: '#8ac926', G: '#d9f99d' } },
    huy_hieu: { rows: ['..yyy..', '.yYYYy.', 'yYyYyYy', 'yYYYYYy', '.yYYYy.', '..yyy..', '.r...r.', 'rr...rr'], pal: { y: '#f4a300', Y: '#ffe066', r: '#e63946' } },
    chong_chong: { rows: ['r.....b', 'rr...bb', '.rr.bb.', '...o...', '.gg.yy.', 'gg...yy', 'g.....y', '...k...', '...k...', '...k...', '...k...', '...k...', '...k...', '..kkk..'], pal: { r: '#ef476f', b: '#118ab2', g: '#06d6a0', y: '#ffd166', o: '#fff', k: '#6b4f32' } },
    den_cam: { rows: ['.kkk.', 'kyYyk', 'kYwYk', 'kyYyk', '.kkk.', '..k..', '..k..', '..k..', '..k..', '..k..', '..k..', '..k..', '.kkk.', 'kkkkk'], pal: { k: '#343a40', y: '#ffd166', Y: '#fff3b0', w: '#ffffff' } },
    chuong_gio: { rows: ['kkkkkkk', 'k.k.k.k', 'k.k.k.k', 'k.s.s.k', 's.s.g.s', 's.g.g.s', 'g.g...g', '...k...', '...k...', '...k...', '...k...', '...k...', '...k...', '..kkk..'], pal: { k: '#6b4f32', s: '#ced4da', g: '#e9c46a' } },
    buom_que: { rows: ['pp...pp', 'pPp.pPp', 'pppkppp', '.pp.pp.', '...k...', '...g...', '...g...', '...g...', '...g...', '...g...', '...g...', '...g...', '...g...', '..ggg..'], pal: { p: '#c77dff', P: '#ffd6ff', k: K, g: '#6b4f32' } },
    bu_nhin: { rows: ['..yyy..', '.yyyyy.', '..fff..', '..kfk..', '..fff..', 'bbbbbbb', '..rrr..', '..rbr..', '..rrr..', '..rrr..', '...b...', '...b...', '...b...', '..bbb..'], pal: { y: '#e9c46a', f: '#f4d6a0', k: K, b: '#8d5a2b', r: '#457b9d' } },
    ca_chep: { rows: ['k......', 'kk.....', 'k.rrr..', 'krRwRr.', 'krrrrrr', 'k.yrry.', 'k..rr..', 'k..y.y.', 'k......', 'k......', 'k......', 'k......', 'k......', 'kk.....'], pal: { k: '#5c3a1e', r: '#ff6b35', R: '#ffd23f', w: '#ffffff', y: '#ffd23f' } },
    ngoi_sao: { rows: ['...y...', '..yYy..', 'yyYWYyy', '.yYYYy.', '.yy.yy.', 'y.....y', '...k...', '...k...', '...k...', '...k...', '...k...', '...k...', '...k...', '..kkk..'], pal: { y: '#ffd23f', Y: '#fff3b0', W: '#ffffff', k: '#6c757d' } },
    rong_vang: { rows: ['.y..y.....', 'yYyyYy....', 'yrYYYyy...', '.yyYYYyy..', '...yyYYyy.', '.yy..yYYy.', 'yYYy..yYy.', '.yYYyyYYy.', '..yyYYyy..', '.bbbbbbbb.'], pal: { y: '#d4a017', Y: '#ffd23f', r: '#e63946', b: '#6b4226' } },
    hang_rao_trang: { rows: ['.w...w...', 'www.www.w', 'www.www.w', 'wwwwwwwww', 'www.www.w', 'www.www.w', 'wwwwwwwww', 'www.www.w', 'www.www.w'], pal: { w: '#ffffff' } },
    den_hoi_an: { rows: ['k......', 'kk.....', 'k.ggg..', 'krrrrr.', 'kyyyyy.', 'kbbbbb.', 'kppppp.', 'k.ggg..', 'k..g...', 'k......', 'k......', 'k......', 'k......', 'kk.....'], pal: { k: '#5c3a1e', g: '#ffd23f', r: '#e63946', y: '#ffca3a', b: '#3a86ff', p: '#c77dff' } },
    hoa_dang: { rows: ['...y...', '..yYy..', '.p.y.p.', 'pPp.pPp', 'pPPpPPp', '.pPPPp.', 'ggggggg', '.ggggg.'], pal: { y: '#ffd23f', Y: '#fff3b0', p: '#ff8fab', P: '#ffd6e0', g: '#52b788' } },
    meo_su: { rows: ['w....w..', 'ww..ww..', 'wwwwww.w', 'wkwwkw.w', 'wwpwww.w', 'rrryrrww', 'wwwwwww.', 'wwwwwww.', '.wwwww..'], pal: { w: '#ffffff', k: K, p: '#ff8fab', r: '#e63946', y: '#ffd23f' } },
  };

  // ---------------------------------------------------------------- trang trí nhà thú
  const HOUSE_DECOR = {
    co_do: { rows: ['krr...', 'krrrr.', 'krrrrr', 'krrr..', 'k.....', 'k.....', 'k.....', 'k.....'], pal: { k: '#495057', r: '#e63946' } },
    co_sao: { rows: ['kyyyyy', 'kyyryy', 'kyrrry', 'kyyryy', 'kyyyyy', 'k.....', 'k.....', 'k.....'], pal: { k: '#495057', y: '#ffd23f', r: '#e63946' } },
    hop_hoa: { rows: ['p.y.p.r.', 'gpgygpgr', 'bbbbbbbb', 'BBBBBBBB'], pal: { p: '#ff8fab', y: '#ffd23f', r: '#e63946', g: '#52b788', b: '#a0703d', B: '#6b4226' } },
    rem_ke: { rows: ['rwrw..rwrw', 'wrwr..wrwr', 'rwr....rwr', 'wr......rw'], pal: { r: '#e63946', w: '#ffffff' } },
    den_long_nha: { rows: ['kkkkk.', 'k..k..', 'k.yyy.', 'krrrrr', 'krRrRr', 'krrrrr', 'k.yyy.', 'k..y..', 'k.....', 'k.....', 'k.....', 'k.....', 'k.....', 'kk....'], pal: { k: '#5c3a1e', y: '#ffd23f', r: '#d62828', R: '#ff6b6b' } },
    cay_bui: { rows: ['..gggg..', '.gGgggg.', 'gGgggGgg', 'ggggGggg', 'gggggggg', '.gggggg.', '..bbbb..', '..bbbb..'], pal: { g: '#52b788', G: '#b7e4c7', b: '#c8553d' } },
    bat_an: { rows: ['.oyoyo.', 'bbbbbbb', '.bbbbb.'], pal: { o: '#c08552', y: '#e9c46a', b: '#4361ee' } },
    tham_cua: { rows: ['pPpPpPpPpP', 'PpPpPpPpPp'], pal: { p: '#ff8fab', P: '#ffc8dd' } },
  };

  function fromMap(m, k = 0.45) {
    const w = Math.max(...m.rows.map((r) => r.length));
    const P = Pix(w + 2, m.rows.length + 2);
    P.map(1, 1, m.rows, m.pal);
    return outline(P.c, k);
  }

  // ---------------------------------------------------------------- nhà thú (48 x 36)
  const HW = 48; const HH = 36;
  /** Vị trí gắn đồ trang trí cho từng cấp nhà (toạ độ pixel trong ảnh nhà; y = đáy món đồ). */
  const ANCHORS = {
    1: { roof: [5, 10], window: [26, 25], side: [41, 34], front: [17, 35], door: [17, 34] },
    2: { roof: [17, 1], window: [10, 28], side: [41, 34], front: [22, 35], door: [22, 34] },
    3: { roof: [9, 7], window: [10, 31], side: [41, 34], front: [25, 35], door: [25, 34] },
    4: { roof: [17, 11], window: [18, 23], side: [42, 34], front: [18, 35], door: [18, 34] },
  };

  function tri(P, cx, top, h, col, col2) { // mái tam giác
    for (let i = 0; i < h; i++) {
      P.r(cx - i - 1, top + i, i * 2 + 2, 1, col);
      if (col2 && i % 2 === 1) P.r(cx - i, top + i, i * 2, 1, col2);
    }
  }

  function drawHouse(level) {
    const P = Pix(HW, HH);
    const grass = () => { P.r(1, 34, 36, 2, '#74c69d'); for (let x = 2; x < 36; x += 3) P.p(x, 33, '#52b788'); };
    if (level === 1) { // hộp các-tông có gối đỏ bên trong
      const c = '#d4a96a'; const d = '#a87f45'; const l = '#ecc98c';
      grass();
      P.r(3, 15, 28, 19, c); P.r(3, 15, 28, 1, l); P.r(27, 16, 4, 18, d);
      P.r(0, 10, 11, 5, l); P.r(1, 11, 9, 1, '#f5dca8'); // nắp trái
      P.r(23, 8, 11, 6, d); P.r(24, 9, 9, 1, '#bd935a'); // nắp phải
      P.r(14, 15, 6, 19, '#c9a26b'); P.r(15, 15, 4, 19, '#e9d3a8'); // băng dính
      P.r(10, 21, 14, 13, '#4a3324'); P.r(11, 20, 12, 1, '#4a3324'); P.r(12, 19, 10, 1, '#4a3324'); // cửa khoét vòm
      P.r(11, 29, 12, 5, '#e63946'); P.r(12, 29, 10, 1, '#ff7b84'); // gối đỏ
      P.r(5, 18, 4, 1, d); P.r(5, 20, 3, 1, d); P.p(26, 26, '#e63946'); P.p(25, 27, '#e63946'); P.p(26, 28, '#e63946'); // nét chữ + dấu
    }
    if (level === 2) { // nhà gỗ mái dốc, cửa sổ tròn
      const w = '#c08552'; const wd = '#8d5a2b'; const wl = '#d9a066';
      grass();
      P.r(4, 16, 27, 18, w);
      for (let y = 17; y < 34; y += 3) { P.r(4, y, 27, 1, wd); P.r(4, y + 1, 27, 1, wl); }
      P.r(28, 16, 3, 18, wd);
      for (let i = 0; i < 14; i++) { // mái ván lợp
        const y = 3 + i; P.r(17 - i - 2, y, i * 2 + 5, 1, i % 3 === 0 ? '#5a3220' : '#7a4528');
        P.p(17 - i - 2, y, '#4a2818'); P.p(17 + i + 2, y, '#4a2818');
      }
      P.r(16, 1, 3, 3, '#5a3220');
      P.r(18, 23, 9, 11, '#5c3a1e'); P.r(19, 22, 7, 1, '#5c3a1e'); P.r(20, 21, 5, 1, '#5c3a1e'); P.p(24, 28, '#ffd23f'); // cửa vòm + núm
      P.r(19, 24, 7, 1, '#7a4f2a');
      P.disc(10, 22, 3, '#3d2b1f'); P.disc(10, 22, 2.2, '#ffe8a3'); P.r(10, 20, 1, 5, wd); P.r(8, 22, 5, 1, wd); // cửa sổ tròn
      P.r(17, 34, 11, 1, '#adb5bd'); // bậc thềm
    }
    if (level === 3) { // nhà mái ngói đỏ có ống khói, khung gỗ
      grass();
      P.r(3, 17, 30, 17, '#fdf6e3'); P.r(30, 17, 3, 17, '#e9dfc8');
      P.r(3, 17, 30, 1, '#8d5a2b'); P.r(3, 33, 30, 1, '#8d5a2b'); P.r(3, 17, 1, 17, '#8d5a2b'); P.r(17, 17, 1, 17, '#8d5a2b'); P.r(32, 17, 1, 17, '#8d5a2b');
      for (let i = 0; i < 15; i++) { // mái ngói so le
        const y = 2 + i; P.r(17 - i - 2, y, i * 2 + 5, 1, '#c1121f');
        for (let x = 17 - i - 2 + (i % 2) * 2; x < 17 + i + 3; x += 4) P.p(x, y, '#e5383b');
        if (i % 2) P.r(17 - i - 2, y, i * 2 + 5, 1, '#a4161a');
      }
      P.r(25, 3, 4, 8, '#9c6644'); P.r(24, 2, 6, 2, '#6f4518'); // ống khói
      P.r(21, 23, 8, 11, '#7f4f24'); P.r(22, 24, 6, 9, '#9c6644'); P.p(27, 28, '#ffd23f'); // cửa
      P.r(6, 21, 9, 8, '#8d5a2b'); P.r(7, 22, 7, 6, '#9be1f5'); P.r(10, 22, 1, 6, '#8d5a2b'); P.r(7, 25, 7, 1, '#8d5a2b'); P.p(8, 23, '#ffffff'); // cửa sổ
      P.r(20, 34, 10, 1, '#ced4da');
    }
    if (level === 4) { // lâu đài mini
      const s = '#b8c0c8'; const sd = '#868e96'; const sl = '#dee2e6';
      grass();
      P.r(6, 14, 24, 20, s);
      for (let x = 6; x < 30; x += 4) P.r(x, 11, 2, 3, s);
      for (let y = 16; y < 34; y += 3) for (let x = 7 + (y % 2) * 2; x < 29; x += 5) P.r(x, y, 3, 1, sd);
      P.r(0, 9, 7, 25, sl); P.r(29, 9, 7, 25, '#a5adb5'); P.r(29, 9, 1, 25, sd);
      for (let i = 0; i < 8; i++) { P.r(3 - i, 1 + i, i * 2 + 1, 1, i % 2 ? '#3a86ff' : '#4895ef'); P.r(32 - i, 1 + i, i * 2 + 1, 1, i % 2 ? '#3a86ff' : '#4895ef'); }
      P.r(2, 15, 3, 4, '#ffd23f'); P.r(31, 15, 3, 4, '#ffd23f'); P.p(3, 15, '#fff3b0'); P.p(32, 15, '#fff3b0'); // cửa sổ sáng
      P.r(12, 22, 12, 12, '#3d2b1f'); P.r(13, 20, 10, 2, '#3d2b1f'); P.r(15, 19, 6, 1, '#3d2b1f');
      for (let x = 13; x < 23; x += 2) P.r(x, 22, 1, 12, '#6c584c');
      P.r(13, 26, 10, 1, '#6c584c');
      P.r(15, 15, 6, 3, '#ffe8a3'); P.r(17, 15, 2, 3, '#f4a300');
      P.r(9, 33, 2, 1, '#52b788'); P.r(25, 32, 2, 2, '#52b788'); // rêu
      P.r(4, 9, 1, 1, '#e63946');
    }
    // lật ngang: cửa và đồ bên cạnh hướng về phía vườn (bên trái)
    const out = Pix(HW, HH);
    const g = out.c.getContext('2d');
    g.translate(HW, 0); g.scale(-1, 1); g.drawImage(outline(P.c, 0.45), 0, 0);
    return out.c;
  }

  const cache = new Map();
  const cached = (k, fn) => { if (!cache.has(k)) cache.set(k, fn()); return cache.get(k); };
  const wrap = (c) => ({ src: c, sx: 0, sy: 0, sw: c.width, sh: c.height });

  window.DecorSprites = {
    potDecor: (id) => (POT_DECOR[id] ? wrap(cached(`pd:${id}`, () => fromMap(POT_DECOR[id]))) : null),
    houseDecor: (id) => (HOUSE_DECOR[id] ? wrap(cached(`hd:${id}`, () => fromMap(HOUSE_DECOR[id]))) : null),
    house: (level) => wrap(cached(`h:${level}`, () => drawHouse(level))),
    anchors: (level) => { // nhà đã lật ngang → lật toạ độ x
      const a = ANCHORS[level] || ANCHORS[1];
      return Object.fromEntries(Object.entries(a).map(([k, [x, y]]) => [k, [HW - 1 - x, y]]));
    },
    HW, HH,
  };
})();
