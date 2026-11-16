'use strict';
// Mô hình tí hon tự vẽ bằng pixel; chuyển động được áp vào từng lớp ở CSS.
(function () {
  const { Pix, outline } = window.Sprites;
  const ink = '#49324c', wood = '#8b5a38', gold = '#ffd166';
  const cache = new Map();
  function draw(id) {
    const P = Pix(48, 44);
    const r = (...x) => P.r(...x);
    const d = (...x) => P.disc(...x);
    const base = () => { r(4, 40, 40, 2, '#72b87c'); r(8, 42, 32, 1, '#427f65'); };
    const flower = (x, y, col) => { r(x, y + 2, 1, 5, '#39865f'); d(x, y, 2, col); P.p(x, y, gold); };
    const star = (x, y, col = gold) => { r(x - 2, y, 5, 1, col); r(x, y - 2, 1, 5, col); };
    if (id === 'vuon_buom') {
      base(); r(6, 36, 36, 3, '#d7b886'); r(17, 36, 14, 3, '#f6dfad');
      [9, 14, 33, 38].forEach((x, i) => flower(x, 34 - i % 2 * 2, ['#ff80aa', '#a5daff', '#e8a0ed', '#ffce70'][i]));
      d(24, 18, 8, '#a6d7a1'); d(24, 16, 6, '#d9f6af'); r(23, 23, 3, 13, wood);
      r(11, 13, 5, 4, '#f18fb8'); r(17, 13, 5, 4, '#a7b9ff'); r(16, 15, 1, 4, ink);
    } else if (id === 'ho_ca_may') {
      base(); d(24, 34, 16, '#e9f8ff'); r(8, 34, 32, 7, '#7fd3df'); r(11, 34, 26, 4, '#b8f4f0');
      d(17, 31, 3, '#ff9a65'); r(13, 30, 2, 2, '#ffbd84'); P.p(19, 30, ink);
      d(31, 35, 3, '#ffcb59'); r(34, 34, 2, 2, '#ffdf8b'); P.p(29, 34, ink);
      r(10, 24, 1, 8, '#4c9c79'); d(10, 24, 3, '#8bd783'); r(38, 25, 1, 7, '#4c9c79'); d(38, 25, 3, '#8bd783');
      [12, 23, 35].forEach((x, i) => P.p(x, 21 - i * 3, '#fff'));
    } else if (id === 'du_quay_keo') {
      base(); r(10, 35, 28, 4, '#ebaa91'); r(12, 33, 24, 2, '#fff0c2'); r(22, 9, 4, 26, wood);
      for (let i = 0; i < 8; i++) r(9 + i * 4, 18 - Math.abs(3.5 - i) * 2, 4, 3, i % 2 ? '#f78da8' : '#a5e4f0');
      r(8, 19, 32, 3, '#fff0c2'); r(12, 23, 2, 10, gold); r(22, 22, 2, 12, gold); r(34, 23, 2, 10, gold);
      r(11, 29, 5, 5, '#ff7fa9'); r(20, 30, 6, 5, '#82d6df'); r(32, 29, 5, 5, '#ffca77'); star(24, 7);
    } else if (id === 'thap_dong_ho') {
      base(); r(14, 13, 20, 28, '#e7bd86'); r(17, 17, 14, 23, '#f5dcac'); r(11, 11, 26, 4, '#bb7292');
      r(15, 8, 18, 3, '#dc92af'); r(19, 5, 10, 3, '#efafd0'); r(23, 2, 2, 4, gold);
      d(24, 22, 7, '#fff7e3'); d(24, 22, 5, '#fae6b3'); r(24, 18, 1, 5, ink); r(24, 22, 4, 1, ink);
      r(20, 32, 8, 8, wood); r(22, 33, 4, 7, '#5b3d42'); flower(10, 37, '#ff82b0'); flower(38, 37, '#9cd7e8');
    } else if (id === 'cong_cau_vong') {
      base();
      const cols = ['#ef6b8d', '#ffb46a', '#ffe17b', '#8dd6a1', '#80bdf3', '#b68de5'];
      for (let i = 0; i < 6; i++) for (let x = 8 + i; x <= 40 - i; x++) {
        const y = Math.round(32 - Math.sqrt(Math.max(0, 17 * 17 - (x - 24) ** 2)) + i);
        P.p(x, y, cols[i]);
      }
      d(8, 34, 5, '#f4fbff'); d(40, 34, 5, '#f4fbff'); star(24, 9); star(34, 14, '#fff');
    } else if (id === 'banh_xe_sao') {
      base(); r(16, 36, 16, 4, wood); r(23, 17, 2, 20, ink);
      const pts = [[24, 4], [36, 10], [42, 22], [36, 33], [24, 38], [12, 33], [6, 22], [12, 10]];
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i]; const [nx, ny] = pts[(i + 1) % pts.length];
        for (let t = 0; t <= 12; t++) P.p(Math.round(x + (nx - x) * t / 12), Math.round(y + (ny - y) * t / 12), '#c27cdb');
        star(x, y, i % 2 ? '#ffb0d1' : gold);
      }
      r(23, 7, 2, 29, '#e9c0ed'); r(9, 21, 30, 2, '#e9c0ed'); d(24, 22, 4, '#fff3a8');
    } else if (id === 'cay_uoc_nguyen') {
      base(); r(21, 22, 6, 18, '#8e5f56'); r(18, 31, 4, 3, '#8e5f56'); r(27, 30, 4, 3, '#8e5f56');
      [[24, 12, 9], [15, 20, 7], [33, 20, 7], [24, 22, 9]].forEach(([x, y, rad]) => { d(x, y, rad, '#7ebcaa'); d(x - 2, y - 2, rad - 2, '#b1e4b2'); });
      [[9, 11], [34, 7], [40, 17], [11, 31], [35, 29]].forEach(([x, y], i) => star(x, y, i % 2 ? '#fff4a9' : '#ff9dc9'));
    } else if (id === 'hanh_tinh_ti_hon') {
      base(); r(19, 36, 10, 3, '#a88ba7'); r(23, 27, 2, 10, ink);
      d(24, 18, 12, '#9ab9f0'); d(21, 15, 7, '#c9ddff'); d(28, 22, 4, '#a3dfb2');
      for (let x = 4; x < 44; x++) { const y = Math.round(20 + (x - 24) * 0.24); if (x < 13 || x > 34) r(x, y, 2, 2, '#f5d585'); }
      star(8, 8); star(39, 7, '#d6b5ff'); star(40, 30, '#fff');
    }
    return { src: outline(P.c, 0.48), sx: 0, sy: 0, sw: 48, sh: 44 };
  }
  window.SceneSprites = { object(id) { if (!cache.has(id)) cache.set(id, draw(id)); return cache.get(id); } };
})();
