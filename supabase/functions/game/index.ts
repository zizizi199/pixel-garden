// @ts-nocheck
// TỰ SINH bởi scripts/build-edge.js từ server/game.js + src/core – đừng sửa tay.
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/core/pets.js
var require_pets = __commonJS({
  "src/core/pets.js"(exports, module) {
    "use strict";
    var PETS = [
      {
        id: "oc_sen",
        name: "\u1ED0c s\xEAn",
        tier: 0,
        price: 300,
        level: 2,
        faces: "left",
        move: "crawl",
        pal: { "k": "#2b1d0e", "t": "#e9c89a", "b": "#b5651d", "B": "#7a3e12", "s": "#bfe9ff" },
        rows: [
          "................",
          "..k...k.........",
          "..t...t.........",
          "..t...t..kkkk...",
          "..tt.tt.kbbbbk..",
          "...tttt.kbBBbbk.",
          "...tttkkbBkkBbk.",
          "...ttkbbBkbbBbk.",
          "...ttkbbBBBBbbk.",
          "..ttttkbbbbbbk..",
          ".tttttttkkkkkt..",
          "tttttttttttttt..",
          ".kkkkkkkkkkkkk..",
          "..s.s..s..s....."
        ]
      },
      {
        id: "ga_con",
        name: "G\xE0 con",
        tier: 0,
        price: 350,
        level: 2,
        faces: "right",
        move: "walk",
        pal: { "k": "#2b1d0e", "y": "#ffd23f", "Y": "#f4a300", "o": "#ff8c1a" },
        rows: [
          "................",
          ".......kkk......",
          "......kyyyk.....",
          ".....kyyyyyk....",
          ".....kyykyyok...",
          ".....kyyyyyook..",
          "....kkyyyyykk...",
          "..kkyyyyyyyyk...",
          ".kyyyyyyyyyyyk..",
          ".kyyYYyyyyyyyk..",
          ".kyYYYYyyyyyyk..",
          "..kyyyyyyyyyk...",
          "...kkyyyyykk....",
          ".....kkkkk......",
          ".....o...o......",
          "....oo..oo......"
        ]
      },
      {
        id: "ech_xanh",
        name: "\u1EBEch xanh",
        tier: 0,
        price: 400,
        level: 2,
        faces: "front",
        move: "hop",
        pal: { "k": "#2b1d0e", "g": "#52b788", "G": "#b7e4c7", "w": "#ffffff", "r": "#e76f51" },
        rows: [
          "................",
          "................",
          "...kkk....kkk...",
          "..kwwwk..kwwwk..",
          "..kwkwk..kwkwk..",
          "..kkgggkkgggkk..",
          ".kgggggggggggk..",
          ".kgggggggggggk..",
          ".kgrrrrrrrrrgk..",
          ".kgggggggggggk..",
          "..kgGGGGGGGgk...",
          ".kgkGGGGGGGkgk..",
          "kggkkGGGGGkkggk.",
          "kkk..kkkkk...kkk"
        ]
      },
      {
        id: "vit_con",
        name: "V\u1ECBt con",
        tier: 0,
        price: 450,
        level: 3,
        faces: "left",
        move: "walk",
        pal: { "k": "#2b1d0e", "w": "#fff3b0", "W": "#f1d77a", "o": "#ff9f1c" },
        rows: [
          "................",
          ".....kkkk.......",
          "....kwwwwk......",
          "...kwwwwwwk.....",
          "...kwwkwwwk.....",
          ".kkkwwwwwwk.....",
          "koooowwwwk......",
          ".kkkwwwwwk......",
          "....kwwwwwkkkkk.",
          "...kwwwwwwwwwwk.",
          "..kwwwWWWwwwwwk.",
          "..kwwWWWWwwwwk..",
          "..kwwwwwwwwwk...",
          "...kkkkkkkkk....",
          ".....o...o......",
          "....oo..oo......"
        ]
      },
      {
        id: "chuot_dong",
        name: "Chu\u1ED9t \u0111\u1ED3ng",
        tier: 1,
        price: 500,
        level: 3,
        faces: "front",
        move: "walk",
        pal: { "k": "#2b1d0e", "b": "#a98467", "p": "#a98467", "P": "#f4acb7", "n": "#f4acb7", "c": "#e6ccb2", "t": "#f4acb7" },
        rows: [
          "................",
          "..kkk.....kkk...",
          ".kpppk...kpppk..",
          ".kpPpk...kpPpk..",
          "..kkbbbbbbbkk...",
          "...kbbbbbbbk....",
          "...kbkbbbkbk....",
          "..kbbbbbbbbbk...",
          "..kbbbbnbbbbk...",
          "...kbbbbbbbk....",
          "...kbbcccbbbk...",
          "..kbbcccccbbk...",
          "..kbbbcccbbbk.t.",
          "...kbbbbbbbk.t..",
          "....kkkkkkkttt..",
          "....k.k.k.k....."
        ]
      },
      {
        id: "meo_muop",
        name: "M\xE8o m\u01B0\u1EDBp",
        tier: 1,
        price: 600,
        level: 4,
        faces: "left",
        move: "walk",
        pal: { "k": "#2b1d0e", "o": "#f4a261", "O": "#c8742b", "w": "#fff1e0", "G": "#7bc043", "n": "#e76f51" },
        rows: [
          "................",
          "................",
          "..k.....k.......",
          ".kok...kok......",
          ".koOkkkOok......",
          ".kooooooook.....",
          ".koGkoooGkok....",
          ".koooonoooook...",
          "..koowwwook.....",
          "...kkoooookkkkk.",
          "...kooOoOooooook",
          "..koOoooOoOooook",
          "..koooooooooookk",
          "..kwkkwkkkwkkwk.",
          "...k..k...k..k..",
          "................"
        ]
      },
      {
        id: "cho_co",
        name: "Ch\xF3 c\u1ECF",
        tier: 1,
        price: 1200,
        level: 5,
        faces: "left",
        move: "walk",
        pal: { "k": "#2b1d0e", "b": "#d4a373", "B": "#8d5a2b", "w": "#fefae0", "n": "#2b1d0e", "r": "#ff8fab" },
        rows: [
          "................",
          "..kk.....kk.....",
          ".kBBk...kBBk....",
          ".kBbbkkkbbBk....",
          "..kbbbbbbbk.....",
          "..kbkbbbkbk.....",
          "..kbbbwwbbk.....",
          "..kbbwwnwwk..k..",
          "...kbwrrwk..kbk.",
          "....kkkkkkkkkbk.",
          "...kbbbbbbbbbbk.",
          "..kbwwbbbbbbbbk.",
          "..kbwwbbbbbbbk..",
          "..kbbbbbbbbbbk..",
          "..kbk.kbbk.kbk..",
          "..kk...kk...kk.."
        ]
      },
      {
        id: "tho_trang",
        name: "Th\u1ECF tr\u1EAFng",
        tier: 1,
        price: 1400,
        level: 5,
        faces: "front",
        move: "hop",
        pal: { "k": "#2b1d0e", "w": "#ffffff", "p": "#ffc8dd", "n": "#ff8fab", "g": "#d9d9d9" },
        rows: [
          "....kk..kk......",
          "...kwpk.kwpk....",
          "...kwpk.kwpk....",
          "...kwpk.kwpk....",
          "...kwwkkkwwk....",
          "..kwwwwwwwwwk...",
          "..kwkwwwwwkwk...",
          "..kwwwwnwwwwk...",
          "..kpwwwwwwwpk...",
          "...kwwwwwwwk....",
          "..kwwwwwwwwwkk..",
          ".kwwwwwwwwwwwwk.",
          ".kwwwwwwwwwwwwk.",
          ".kwwwwgwwwwwwk..",
          "..kkkkkkkkkkk...",
          "................"
        ]
      },
      {
        id: "nhim",
        name: "Nh\xEDm",
        tier: 2,
        price: 1600,
        level: 6,
        faces: "right",
        move: "crawl",
        pal: { "k": "#2b1d0e", "S": "#6f4e37", "s": "#c0a080", "c": "#e9c89a", "n": "#2b1d0e" },
        rows: [
          "................",
          "................",
          ".....k.k.k......",
          "...k.kSkSk.k....",
          "..kSkSSSSSkSk...",
          ".kSSSSsSSsSSSk..",
          "kSSsSSSSSSSsSSk.",
          "kSSSSsSSSsSSSccc",
          "kSsSSSSSSSSSccck",
          "kSSSSSSSsSSccncc",
          ".kSSsSSSSSSccccc",
          ".kkSSSSSSSScccck",
          "..kccccccccccck.",
          "...kkk....kkk..."
        ]
      },
      {
        id: "soc_nau",
        name: "S\xF3c n\xE2u",
        tier: 2,
        price: 1800,
        level: 6,
        faces: "left",
        move: "hop",
        pal: { "k": "#2b1d0e", "b": "#c1693c", "T": "#d98b4e", "t": "#f2c094", "w": "#fbe3c5", "n": "#2b1d0e", "h": "#7a4a1e" },
        rows: [
          ".........kkkk...",
          "........kTTTTk..",
          ".......kTTtTTTk.",
          "..k.k..kTtTTTTk.",
          ".kbkbk.kTTTTTk..",
          ".kbbbbk.kTTTTk..",
          ".kbkbbbk.kTTk...",
          "knbbbbbk.kTTk...",
          ".kbbbbwk.kTk....",
          "..kbbwwbkkTk....",
          "..kbwwbbbbk.....",
          "..kbwhhbbbk.....",
          "...kwhhbbbk.....",
          "...kbbbbbk......",
          "...kbk.kbk......",
          "...kk...kk......"
        ]
      },
      {
        id: "rua_go",
        name: "R\xF9a g\u1ED7",
        tier: 2,
        price: 2e3,
        level: 7,
        faces: "right",
        move: "crawl",
        pal: { "k": "#2b1d0e", "g": "#6a994e", "G": "#386641", "h": "#a7c957" },
        rows: [
          "................",
          "................",
          "................",
          ".....kkkkkk.....",
          "....kgGgGgGk....",
          "...kGgGGgGGgk...",
          "..kgGGgGGgGGgk..",
          "..kGgGgGgGgGgkkk",
          ".kkkkkkkkkkkkhhk",
          "khhkhhhhhhhhkhkhk",
          ".kk.kk....kk.kk."
        ]
      },
      {
        id: "chim_se",
        name: "Chim s\u1EBB",
        tier: 2,
        price: 2500,
        level: 7,
        faces: "left",
        move: "fly",
        pal: { "k": "#2b1d0e", "b": "#9c6644", "B": "#583101", "w": "#ede0d4", "o": "#e9a03b", "s": "#00000033" },
        rows: [
          "................",
          "................",
          ".....kkkk.......",
          "....kbbbbk......",
          "...kbkbbbbk.....",
          "..okbbbbbbk.....",
          "..kkwwbbbbbk....",
          "...kwwwbBBbbk...",
          "...kwwwbbBBbbk..",
          "....kwwwbbBbbbk.",
          ".....kwwwbbbBBbk",
          "......kkkkkkkkkk",
          ".......o..o.....",
          "......oo.oo.....",
          "................",
          "....ss....ss...."
        ]
      },
      {
        id: "ca_koi",
        name: "C\xE1 koi",
        tier: 3,
        price: 4e3,
        level: 8,
        faces: "left",
        move: "swim",
        pal: { "k": "#2b1d0e", "w": "#ffffff", "r": "#f3722c", "~": "#90e0ef" },
        rows: [
          "................",
          "................",
          "..~~......~~....",
          "........kk......",
          "...kkkkkrrk.....",
          "..kwwrrwwwrk..kk",
          ".kwkwwwrrwwwkkrk",
          ".kwwwwwwwrrwwrk.",
          ".kwwrrwwwwwwwkrk",
          "..kwwwrrwwwrk.kk",
          "...kkkkkkrrk....",
          "........kk......",
          "..~~~.....~~~...",
          "................"
        ]
      },
      {
        id: "cao_lua",
        name: "C\xE1o l\u1EEDa nh\u1ECF",
        tier: 3,
        price: 5e3,
        level: 8,
        faces: "left",
        move: "walk",
        fx: ["flame"],
        pal: { "k": "#2b1d0e", "o": "#f3722c", "O": "#f8961e", "w": "#fff3e0", "W": "#fffbe0", "n": "#2b1d0e", "y": "#ffd23f" },
        rows: [
          "..k....k........",
          ".kok..kok.......",
          ".kooookook......",
          ".kowkoookwk.....",
          ".kooooooooo.....",
          "..kwwwnwwwk.....",
          "...kwwwwwk......",
          "...koooook..y.y.",
          "..koooooook.yky.",
          "..kowwwoooookOOk",
          "..kowwwooooooOOk",
          "..koooooooooOOWk",
          "..kokkokkokkOWWk",
          "...k..k..k..kkk.",
          "..............y."
        ]
      },
      {
        id: "gau_truc_do",
        name: "G\u1EA5u tr\xFAc \u0111\u1ECF",
        tier: 3,
        price: 5500,
        level: 9,
        faces: "left",
        move: "walk",
        pal: { "k": "#2b1d0e", "r": "#c1440e", "R": "#7a2a06", "w": "#fff1e6", "b": "#3a1a0a", "n": "#2b1d0e" },
        rows: [
          "................",
          "..kk.....kk.....",
          ".kwrk...krwk....",
          ".krrrkkkrrrk....",
          ".krwwrrrwwrk....",
          ".krbkwrwbkrk....",
          "..krwwnwwrk.....",
          "...kwwwwwk......",
          "..krrrrrrrk.....",
          ".kbrrrrrrrbk....",
          ".kbbrrrrrbbkkkk.",
          "..kbbrrrbbkrRrRk",
          "..kbbkkkbbkRrRrk",
          "..kkk...kkk.kkk."
        ]
      },
      {
        id: "buom_phuong",
        name: "B\u01B0\u1EDBm ph\u01B0\u1EE3ng",
        tier: 3,
        wheel: true,
        price: 6e3,
        level: 10,
        faces: "front",
        move: "fly",
        pal: { "k": "#2b1d0e", "b": "#1d3557", "y": "#48cae4", "Y": "#ffd23f", "*": "#fff3b0" },
        rows: [
          "..*.............",
          ".......k..k.....",
          "........kk......",
          ".kkkk...kk...kkkk",
          "kbybbk..kk..kbbybk",
          "kbbyYbk.kk.kbYybbk",
          "kbybbbkkkkkkbbbybk",
          ".kbbYbbkkkkbbYbbk.",
          "..kkkbbkkkkbbkkk..",
          "...kbybkkkkbybk...",
          "...kbbbk..kbbbk...",
          "....kkk....kkk....",
          ".......*......*..."
        ]
      },
      {
        id: "cu_meo",
        name: "C\xFA m\xE8o",
        tier: 4,
        price: 7e3,
        level: 10,
        faces: "front",
        move: "hop",
        pal: { "k": "#2b1d0e", "b": "#8d6e63", "B": "#5d4037", "w": "#fff8e1", "y": "#ffca28", "c": "#d7ccc8", "o": "#ffa000", "h": "#6d4c41" },
        rows: [
          "................",
          "..kk.......kk...",
          "..kbk.....kbk...",
          "..kbbkkkkkbbk...",
          "..kbwwbbbwwbk...",
          ".kbwyykbyykwbk..",
          ".kbwyykbyykwbk..",
          ".kbbwwboobwwbbk.",
          ".kbbbbbobbbbbbk.",
          ".kbBcccccccBbk..",
          ".kbBcBcBcBcBbk..",
          ".kbBccccccccbk..",
          "..kbBcBcBcBbk...",
          "...kbbbbbbbk....",
          "....oo...oo.....",
          "..hhhhhhhhhhhh.."
        ]
      },
      {
        id: "chim_cong",
        name: "Chim c\xF4ng",
        tier: 4,
        wheel: true,
        price: 8e3,
        level: 11,
        faces: "front",
        move: "walk",
        pal: { "k": "#2b1d0e", "b": "#1565c0", "B": "#0d47a1", "g": "#2e7d32", "e": "#26c6da", "E": "#1a237e", "t": "#ffd600", "o": "#e0a040" },
        rows: [
          "..e..e...e..e...",
          ".eEe.eEe.eEe.eEe",
          "..e.gge.ge.ggee.",
          ".eEegggggggggeEe",
          "..ggtgggtgggtgg.",
          ".eggg.k.bbk.ggge",
          "eEegg.kbbbk.ggEe",
          ".egg..kbkbk..gge",
          "..gg..kbbbbo.gg.",
          ".......kbbk.....",
          "......kbbbbk....",
          "......kbbbbbk...",
          "......kbBbbbk...",
          ".......kkkkk....",
          "........o.o....."
        ]
      },
      {
        id: "ky_lan",
        name: "Th\u1ECF k\u1EF3 l\xE2n",
        tier: 5,
        wheel: true,
        price: 15e3,
        level: 12,
        faces: "left",
        move: "walk",
        base: "tho_trang",
        filter: "brightness(1.05)",
        fx: ["horn", "sparkle:#ffc8dd", "glow:#ff9be0"],
        pal: { "k": "#2b1d0e", "w": "#ffffff", "y": "#ffd23f", "Y": "#f4a300", "r": "#ff6b6b", "o": "#ffb347", "g": "#8bd17c", "b": "#74c0fc", "p": "#ffc8dd", "G": "#c9b6e4", "f": "#ff8fab", "F": "#ffd23f" },
        rows: [
          ".......y..........",
          "......yY..........",
          ".....yYk..........",
          "...kkYkwk.........",
          "..kwwwwwwk........",
          "..kwkwwwwrk.......",
          ".kwwwwwwwrok......",
          ".kpwwwwwkogk......",
          "..kkwwwwkgbk......",
          "....kwwwwkbpk.....",
          "....kwwwwwwwwkkk..",
          "...kwwwwwwwwwwwwk.",
          "...kwwwwwwwwwwwk.r",
          "...kwwwwwwwwwwk.ro",
          "...kwk.kwk.kwk..og",
          "...kGk.kGk.kGk..gb",
          ".f.....f......f...",
          "fFf...fFf....fFf.."
        ]
      },
      {
        id: "cuu_vi_ho",
        name: "H\u1ED3 ly b\u0103ng",
        tier: 5,
        wheel: true,
        price: 2e4,
        level: 13,
        faces: "left",
        move: "walk",
        base: "cao_lua",
        filter: "hue-rotate(170deg) saturate(0.7) brightness(1.35)",
        fx: ["halo", "sparkle:#bde0fe", "glow:#7bdff2"],
        pal: { "k": "#4a4e69", "w": "#f8f9fa", "b": "#4cc9f0", "n": "#2b1d0e", "r": "#ff8fab" },
        rows: [
          "..b...........b.....",
          "..k.....k.....kwk...",
          ".kwk...kwk...kwwwk..",
          ".kwwkkkwwk..kwwwwk..",
          ".kwwwwwwwk.kwwwwwk.b",
          ".kwbkwwbkwkwwwwwk.kw",
          ".kwwwwnwwwkwwwwk.kwwk",
          "..kwwrwwwk.kwwkkwwwk",
          "...kwwwwkkkkwkwwwwk.",
          "...kwwwwwwwwwkwwwk..",
          "..kwwwwwwwwwwwkwk.kk",
          "..kwwwwwwwwwwwwkkwwk",
          "..kwkwwkwwwkwwkwwwk.",
          "..kk.kk.kk.kk.kwwk..",
          "...b.......b...kk.b."
        ]
      },
      {
        id: "rong_may",
        name: "M\xE8o r\u1ED3ng",
        tier: 6,
        wheel: true,
        price: 25e3,
        level: 14,
        faces: "right",
        move: "walk",
        base: "meo_muop",
        filter: "hue-rotate(95deg) saturate(1.4)",
        fx: ["wings", "horn", "glow:#52b788"],
        pal: { "k": "#2b1d0e", "g": "#2a9d8f", "Y": "#e9c46a", "y": "#ffd23f", "w": "#ffffff", "r": "#e76f51", "c": "#ffffff", "C": "#dee2e6" },
        rows: [
          "...........kk.k.....",
          "..........kgggkgk...",
          ".........kgykgggk...",
          "..cc.....kggggggrk..",
          ".cCCc....kgwkgggk...",
          "cCCCCc...kgggggk.cc.",
          ".cccc.....kgggk.cCCc",
          "......kkk.kgggk..cc.",
          ".....kgggkkgggk.....",
          "....kgYYgggYYgk.....",
          "...kgYgkkgggkk......",
          "..kgYgk..kkk........",
          ".kgggk..............",
          "kgkgk...cc..........",
          "kk.k...cCCc.........",
          ".......cccc........."
        ]
      },
      {
        id: "phuong_hoang",
        name: "Chim ph\u01B0\u1EE3ng l\u1EEDa",
        tier: 6,
        wheel: true,
        price: 3e4,
        level: 15,
        faces: "front",
        move: "fly",
        base: "chim_se",
        filter: "hue-rotate(-25deg) saturate(2.6) brightness(1.25)",
        fx: ["crown", "flame", "sparkle:#ffd23f", "glow:#ff7b00"],
        pal: { "k": "#2b1d0e", "r": "#e63946", "O": "#f77f00", "y": "#fcbf49", "o": "#ffd23f" },
        rows: [
          ".......y..y.........",
          "......yOyyOy........",
          ".......kkkk.........",
          "......krrrrk........",
          ".....krkrrrko.......",
          ".....krrrrrkoo......",
          "yy...krrrrk.........",
          "yOy.krrrrrrk...yy...",
          ".yOOrrOrrrrrkkyOOy..",
          "..yOOrrOOrrrrOOOy...",
          "...yyOOrrrrrrOOyy...",
          ".....kOOrrrrOOk.....",
          "......kOrrrOk.......",
          ".......kOOOk........",
          "......yOyOyOy.......",
          ".....y.y.y.y.y......",
          "......y...y........."
        ]
      },
      // pet vòng quay dựng từ pet có sẵn (đổi màu + phụ kiện)
      { id: "meo_tam_the", name: "M\xE8o tam th\u1EC3", tier: 2, wheel: true, price: 2200, level: 1, faces: "left", move: "walk", base: "meo_muop", filter: "saturate(0.55) brightness(1.18)", fx: ["bow"], rows: [], pal: {} },
      { id: "rua_vang", name: "R\xF9a v\xE0ng", tier: 4, wheel: true, price: 9e3, level: 1, faces: "right", move: "crawl", base: "rua_go", filter: "sepia(1) saturate(3) hue-rotate(5deg) brightness(1.15)", fx: ["halo", "glow:#ffd23f"], rows: [], pal: {} },
      { id: "ca_hoa_rong", name: "C\xE1 ch\xE9p ho\xE1 r\u1ED3ng", tier: 6, wheel: true, price: 32e3, level: 1, faces: "left", move: "swim", base: "ca_koi", filter: "sepia(1) saturate(4) hue-rotate(-10deg) brightness(1.1)", fx: ["horn", "wings", "sparkle:#ffd23f", "glow:#ffb703"], rows: [], pal: {} }
    ];
    module.exports = { PETS };
  }
});

// src/core/catalog.js
var require_catalog = __commonJS({
  "src/core/catalog.js"(exports, module) {
    "use strict";
    var { PETS } = require_pets();
    var TIERS = [
      { id: "common", name: "Common", vi: "Th\u01B0\u1EDDng", color: "#9aa5b1" },
      { id: "uncommon", name: "Uncommon", vi: "Kh\xE1", color: "#52b788" },
      { id: "rare", name: "Rare", vi: "Hi\u1EBFm", color: "#3a86ff" },
      { id: "epic", name: "Epic", vi: "S\u1EED thi", color: "#9d4edd" },
      { id: "legendary", name: "Legendary", vi: "Huy\u1EC1n tho\u1EA1i", color: "#f4a300" },
      { id: "mythic", name: "Mythic", vi: "Th\u1EA7n tho\u1EA1i", color: "#e5383b" },
      { id: "secret", name: "Secret", vi: "B\xED \u1EA9n", color: "#ff4fd8" }
    ];
    var PET_TIERS = TIERS.map((t) => t.name);
    var SPECIES = [
      {
        id: "muoi_gio",
        name: "Hoa m\u01B0\u1EDDi gi\u1EDD",
        sci: "Portulaca grandiflora",
        info: "C\xE2y m\u1ECDng n\u01B0\u1EDBc, ch\u1ECBu n\xF3ng v\xE0 h\u1EA1n r\u1EA5t t\u1ED1t. Hoa ch\u1EC9 m\u1EDF khi c\xF3 n\u1EAFng, kh\xE9p l\u1EA1i khi tr\u1EDDi t\u1ED1i ho\u1EB7c \xE2m u. Ngo\xE0i \u0111\u1EDDi ra hoa sau kho\u1EA3ng 6\u20138 tu\u1EA7n.",
        realDays: "42\u201356 ng\xE0y",
        bloomMinutes: 5,
        waterMinutes: 11,
        window: ["10:00", "15:00"],
        fadeMinutes: 240,
        unlock: 0,
        seed: 10,
        sell: 13,
        exp: 3,
        level: 1,
        shape: "star",
        colors: ["#ff4fa3", "#ffd23f"],
        tier: 0
      },
      {
        id: "van_tho",
        name: "C\xFAc v\u1EA1n th\u1ECD",
        sci: "Tagetes erecta",
        info: "Lo\xE0i hoa quen thu\u1ED9c ng\xE0y T\u1EBFt, d\u1EC5 tr\u1ED3ng, \u01B0a n\u1EAFng. M\xF9i l\xE1 h\u0103ng gi\xFAp xua c\xF4n tr\xF9ng. T\u1EEB h\u1EA1t \u0111\u1EBFn ra hoa kho\u1EA3ng 50\u201360 ng\xE0y.",
        realDays: "50\u201360 ng\xE0y",
        bloomMinutes: 8,
        waterMinutes: 10,
        fadeMinutes: 240,
        unlock: 0,
        seed: 12,
        sell: 17,
        exp: 6,
        level: 1,
        shape: "pompom",
        colors: ["#ff9f1c", "#ffbf47"],
        tier: 0
      },
      {
        id: "dua_can",
        name: "Hoa d\u1EEBa c\u1EA1n",
        sci: "Catharanthus roseus",
        info: "C\xE2y b\u1EE5i nh\u1ECF r\u1EA5t d\u1EC5 tr\u1ED3ng, ch\u1ECBu n\u1EAFng n\xF3ng v\xE0 kh\xF4 h\u1EA1n, ra hoa quanh n\u0103m. Hoa 5 c\xE1nh c\xF3 m\u1EAFt h\u1ED3ng \u0111\u1EADm \u1EDF gi\u1EEFa. T\u1EEB h\u1EA1t ra hoa kho\u1EA3ng 2\u20133 th\xE1ng.",
        realDays: "60\u201390 ng\xE0y",
        bloomMinutes: 5,
        waterMinutes: 10,
        fadeMinutes: 240,
        unlock: 0,
        seed: 9,
        sell: 12,
        exp: 3,
        level: 1,
        shape: "daisy",
        colors: ["#ff5fa2", "#c9184a"],
        tier: 1,
        wheel: true
      },
      {
        id: "cuc_zinnia",
        name: "C\xFAc ng\u0169 s\u1EAFc (Zinnia)",
        sci: "Zinnia elegans",
        info: "Hoa nhi\u1EC1u m\xE0u, ch\u1ECBu n\xF3ng, c\xE0ng c\u1EAFt hoa c\xE0ng ra nhi\u1EC1u. Kh\xF4ng \u01B0a t\u01B0\u1EDBi l\xEAn l\xE1. Ra hoa sau kho\u1EA3ng 60\u201370 ng\xE0y.",
        realDays: "60\u201370 ng\xE0y",
        bloomMinutes: 10,
        waterMinutes: 10,
        fadeMinutes: 240,
        unlock: 120,
        seed: 15,
        sell: 23,
        exp: 12,
        level: 2,
        shape: "pompom",
        colors: ["#e63946", "#ff7b8a"],
        tier: 0
      },
      {
        id: "sao_nhai",
        name: "Sao nh\xE1i (Cosmos)",
        sci: "Cosmos bipinnatus",
        info: "Hoa c\xE1nh m\u1ECFng \u0111ung \u0111\u01B0a, ch\u1ECBu \u0111\u1EA5t ngh\xE8o v\xE0 h\u1EA1n, r\u1EA5t h\u1EE3p ng\u01B0\u1EDDi m\u1EDBi tr\u1ED3ng. Ra hoa sau kho\u1EA3ng 50\u201390 ng\xE0y.",
        realDays: "50\u201390 ng\xE0y",
        bloomMinutes: 10,
        waterMinutes: 13,
        fadeMinutes: 240,
        unlock: 150,
        seed: 16,
        sell: 24,
        exp: 12,
        level: 2,
        shape: "daisy",
        colors: ["#f78fb3", "#ffd23f"],
        tier: 0
      },
      {
        id: "cuc_hoa_mi",
        name: "C\xFAc h\u1ECDa mi",
        sci: "Chrysanthemum indicum (d\u1EA1ng hoa tr\u1EAFng)",
        info: "Lo\xE0i c\xFAc nh\u1ECF c\xE1nh tr\u1EAFng nh\u1EE5y v\xE0ng, n\u1EDF r\u1ED9 \u1EDF H\xE0 N\u1ED9i v\xE0o \u0111\u1EA7u m\xF9a \u0111\xF4ng (kho\u1EA3ng th\xE1ng 11) v\xE0 ch\u1EC9 k\xE9o d\xE0i v\xE0i tu\u1EA7n.",
        realDays: "~3 th\xE1ng",
        bloomMinutes: 12,
        waterMinutes: 12,
        fadeMinutes: 240,
        unlock: 0,
        seed: 18,
        sell: 28,
        exp: 12,
        level: 1,
        shape: "daisy",
        colors: ["#ffffff", "#ffd23f"],
        tier: 1,
        wheel: true
      },
      {
        id: "pang_xe",
        name: "Hoa p\u0103ng-x\xEA (Pansy)",
        sci: "Viola \xD7 wittrockiana",
        info: '\u01AFa m\xE1t v\xE0 \u1EA9m, c\xE1nh hoa c\xF3 "m\u1EB7t" \u0111\u1EB7c tr\u01B0ng. \u1EDE Vi\u1EC7t Nam tr\u1ED3ng \u0111\u1EB9p nh\u1EA5t \u1EDF \u0110\xE0 L\u1EA1t, Sa Pa. Ra hoa sau 60\u201390 ng\xE0y.',
        realDays: "60\u201390 ng\xE0y",
        bloomMinutes: 12,
        waterMinutes: 10,
        fadeMinutes: 240,
        unlock: 250,
        seed: 20,
        sell: 32,
        exp: 15,
        level: 3,
        shape: "pansy",
        colors: ["#6a4c93", "#ffd23f"],
        tier: 1
      },
      {
        id: "bim_bim",
        name: "Hoa b\xECm b\xECm",
        sci: "Ipomoea purpurea",
        info: 'D\xE2y leo hoa h\xECnh ph\u1EC5u. Hoa n\u1EDF v\xE0o s\xE1ng s\u1EDBm v\xE0 h\xE9o trong ng\xE0y n\xEAn c\xF2n g\u1ECDi l\xE0 "morning glory". Trong game ch\u1EC9 n\u1EDF 08:00\u201310:00.',
        realDays: "~2 th\xE1ng",
        bloomMinutes: 10,
        waterMinutes: 10,
        window: ["08:00", "10:00"],
        fadeMinutes: 240,
        unlock: 0,
        seed: 18,
        sell: 28,
        exp: 12,
        level: 1,
        shape: "trumpet",
        colors: ["#7b5cff", "#ffffff"],
        tier: 2,
        wheel: true
      },
      {
        id: "huong_duong",
        name: "H\u01B0\u1EDBng d\u01B0\u01A1ng",
        sci: "Helianthus annuus",
        info: "C\xE2y non xoay theo h\u01B0\u1EDBng m\u1EB7t tr\u1EDDi; khi tr\u01B0\u1EDFng th\xE0nh b\xF4ng hoa th\u01B0\u1EDDng quay v\u1EC1 h\u01B0\u1EDBng \u0111\xF4ng. C\u1EA7n nhi\u1EC1u n\u01B0\u1EDBc v\xE0 n\u1EAFng. Ra hoa sau 70\u2013120 ng\xE0y.",
        realDays: "70\u2013120 ng\xE0y",
        bloomMinutes: 15,
        waterMinutes: 10,
        fadeMinutes: 300,
        unlock: 320,
        seed: 25,
        sell: 40,
        exp: 18,
        level: 3,
        shape: "sunflower",
        colors: ["#ffc300", "#6b3e26"],
        tier: 1
      },
      {
        id: "moi_soi",
        name: "M\xF5m s\xF3i",
        sci: "Antirrhinum majus",
        info: 'Hoa m\u1ECDc th\xE0nh ch\xF9m d\u1ECDc th\xE2n; b\xF3p nh\u1EB9 hai b\xEAn b\xF4ng hoa s\u1EBD "h\xE1 mi\u1EC7ng" nh\u01B0 m\xF5m s\xF3i. Ra hoa sau 85\u2013120 ng\xE0y.',
        realDays: "85\u2013120 ng\xE0y",
        bloomMinutes: 20,
        waterMinutes: 13,
        fadeMinutes: 300,
        unlock: 420,
        seed: 30,
        sell: 54,
        exp: 30,
        level: 4,
        shape: "spike",
        colors: ["#ff6b6b", "#ffe066"],
        tier: 1
      },
      {
        id: "dong_tien",
        name: "Hoa \u0111\u1ED3ng ti\u1EC1n",
        sci: "Gerbera jamesonii",
        info: "Hoa to tr\xF2n nh\u01B0 \u0111\u1ED3ng xu, nhi\u1EC1u m\xE0u, hay d\xF9ng c\u1EAFm l\u1ECD ng\xE0y T\u1EBFt v\u1EDBi \xFD ngh\u0129a t\xE0i l\u1ED9c. \u01AFa s\xE1ng, kh\xF4ng \u01B0a \xFAng. T\u1EEB h\u1EA1t ra hoa kho\u1EA3ng 4 th\xE1ng.",
        realDays: "100\u2013130 ng\xE0y",
        bloomMinutes: 20,
        waterMinutes: 16,
        fadeMinutes: 240,
        unlock: 0,
        seed: 32,
        sell: 56,
        exp: 30,
        level: 1,
        shape: "sunflower",
        colors: ["#ff6b35", "#7a3b12"],
        tier: 2,
        wheel: true
      },
      {
        id: "cam_chuong",
        name: "Hoa c\u1EA9m ch\u01B0\u1EDBng",
        sci: "Dianthus caryophyllus",
        info: "C\xE1nh hoa m\xE9p r\u0103ng c\u01B0a x\u1EBFp nhi\u1EC1u l\u1EDBp, th\u01A1m nh\u1EB9. \u01AFa kh\xED h\u1EADu m\xE1t, tr\u1ED3ng nhi\u1EC1u \u1EDF \u0110\xE0 L\u1EA1t. T\u1EEB h\u1EA1t ra hoa kho\u1EA3ng 5 th\xE1ng.",
        realDays: "~150 ng\xE0y",
        bloomMinutes: 25,
        waterMinutes: 15,
        fadeMinutes: 240,
        unlock: 0,
        seed: 34,
        sell: 64,
        exp: 36,
        level: 1,
        shape: "pompom",
        colors: ["#ff4d6d", "#ffccd5"],
        tier: 2,
        wheel: true
      },
      {
        id: "hoa_sen",
        name: "Hoa sen",
        sci: "Nelumbo nucifera",
        info: "Qu\u1ED1c hoa kh\xF4ng ch\xEDnh th\u1EE9c c\u1EE7a Vi\u1EC7t Nam. S\u1ED1ng trong n\u01B0\u1EDBc n\xEAn r\u1EA5t nhanh kh\xE1t. Hoa n\u1EDF t\u1EEB s\xE1ng s\u1EDBm v\xE0 kh\xE9p l\u1EA1i v\xE0o bu\u1ED5i tr\u01B0a \u2013 chi\u1EC1u.",
        realDays: "~60\u201390 ng\xE0y",
        bloomMinutes: 25,
        waterMinutes: 10,
        window: ["08:00", "11:00"],
        fadeMinutes: 180,
        regrow: { minutes: 15, harvests: 4 },
        unlock: 700,
        seed: 60,
        sell: 95,
        exp: 42,
        level: 5,
        shape: "lotus",
        colors: ["#ff8fab", "#ffd6e0"],
        tier: 2
      },
      {
        id: "hoa_hong",
        name: "Hoa h\u1ED3ng",
        sci: "Rosa spp.",
        info: "Th\u01B0\u1EDDng tr\u1ED3ng t\u1EEB c\xE0nh gi\xE2m, \u01B0a n\u1EAFng \xEDt nh\u1EA5t 6 gi\u1EDD/ng\xE0y, t\u01B0\u1EDBi v\xE0o g\u1ED1c. C\xE0nh gi\xE2m ra hoa sau kho\u1EA3ng 2\u20133 th\xE1ng, sau \u0111\xF3 ra hoa nhi\u1EC1u \u0111\u1EE3t.",
        realDays: "60\u201390 ng\xE0y (c\xE0nh gi\xE2m)",
        bloomMinutes: 30,
        waterMinutes: 16,
        fadeMinutes: 300,
        regrow: { minutes: 15, harvests: 5 },
        unlock: 900,
        seed: 80,
        sell: 122,
        exp: 51,
        level: 5,
        shape: "rose",
        colors: ["#d00000", "#ff4d6d"],
        tier: 2
      },
      {
        id: "thuoc_duoc",
        name: "Hoa th\u01B0\u1EE3c d\u01B0\u1EE3c",
        sci: "Dahlia pinnata",
        info: "Hoa to nhi\u1EC1u l\u1EDBp c\xE1nh nh\u1ECDn, hay tr\u1ED3ng ch\u01A1i T\u1EBFt \u1EDF mi\u1EC1n B\u1EAFc. Tr\u1ED3ng t\u1EEB c\u1EE7 nhanh h\u01A1n t\u1EEB h\u1EA1t; t\u1EEB h\u1EA1t ra hoa kho\u1EA3ng 3\u20134 th\xE1ng.",
        realDays: "90\u2013120 ng\xE0y",
        bloomMinutes: 30,
        waterMinutes: 16,
        fadeMinutes: 240,
        unlock: 0,
        seed: 45,
        sell: 87,
        exp: 51,
        level: 1,
        shape: "dahlia",
        colors: ["#d00060", "#ff8fc8"],
        tier: 3,
        wheel: true
      },
      {
        id: "tulip",
        name: "Tulip",
        sci: "Tulipa gesneriana",
        info: "Tr\u1ED3ng t\u1EEB c\u1EE7, c\u1EA7n m\u1ED9t m\xF9a l\u1EA1nh \u0111\u1EC3 ra hoa n\xEAn \u1EDF x\u1EE9 n\xF3ng ph\u1EA3i x\u1EED l\xFD l\u1EA1nh c\u1EE7 tr\u01B0\u1EDBc khi tr\u1ED3ng. Th\u1EDDi gian t\u1EEB tr\u1ED3ng c\u1EE7 \u0111\u1EBFn ra hoa kho\u1EA3ng 3\u20134 th\xE1ng.",
        realDays: "90\u2013120 ng\xE0y",
        bloomMinutes: 40,
        waterMinutes: 20,
        fadeMinutes: 300,
        unlock: 1100,
        seed: 50,
        sell: 114,
        exp: 78,
        level: 6,
        shape: "cup",
        colors: ["#ff5d8f", "#ffb3c6"],
        tier: 2
      },
      {
        id: "hoa_nhai",
        name: "Hoa nh\xE0i",
        sci: "Jasminum sambac",
        info: "C\xE2y b\u1EE5i hoa tr\u1EAFng nh\u1ECF, r\u1EA5t th\u01A1m, th\u01B0\u1EDDng n\u1EDF v\u1EC1 chi\u1EC1u t\u1ED1i; hay d\xF9ng \u01B0\u1EDBp tr\xE0. Trong game nh\xE0i n\u1EDF 15:00\u201317:00. Ra hoa nhi\u1EC1u \u0111\u1EE3t.",
        realDays: "v\xE0i th\xE1ng (c\xE0nh gi\xE2m)",
        bloomMinutes: 25,
        waterMinutes: 20,
        window: ["15:00", "17:00"],
        fadeMinutes: 240,
        regrow: { minutes: 15, harvests: 5 },
        unlock: 0,
        seed: 90,
        sell: 130,
        exp: 48,
        level: 1,
        shape: "bract",
        colors: ["#ffffff", "#fff7c2"],
        tier: 3,
        wheel: true
      },
      {
        id: "hoa_giay",
        name: "Hoa gi\u1EA5y",
        sci: "Bougainvillea spectabilis",
        info: 'Ph\u1EA7n "c\xE1nh hoa" s\u1EB7c s\u1EE1 th\u1EF1c ra l\xE0 l\xE1 b\u1EAFc, hoa th\u1EADt r\u1EA5t nh\u1ECF m\xE0u tr\u1EAFng \u1EDF gi\u1EEFa. R\u1EA5t ch\u1ECBu h\u1EA1n \u2013 c\xE0ng h\u01A1i kh\xF4 c\xE0ng ra nhi\u1EC1u hoa.',
        realDays: "~6 th\xE1ng (c\xE0nh gi\xE2m)",
        bloomMinutes: 40,
        waterMinutes: 33,
        fadeMinutes: 300,
        regrow: { minutes: 25, harvests: 6 },
        unlock: 1400,
        seed: 120,
        sell: 192,
        exp: 87,
        level: 7,
        shape: "bract",
        colors: ["#c9184a", "#ff4d9d"],
        tier: 3
      },
      {
        id: "cam_tu_cau",
        name: "C\u1EA9m t\xFA c\u1EA7u",
        sci: "Hydrangea macrophylla",
        info: "Hoa m\u1ECDc th\xE0nh ch\xF9m tr\xF2n nh\u01B0 qu\u1EA3 c\u1EA7u. M\xE0u hoa \u0111\u1ED5i theo \u0111\u1ED9 chua c\u1EE7a \u0111\u1EA5t: \u0111\u1EA5t chua cho hoa xanh, \u0111\u1EA5t ki\u1EC1m cho hoa h\u1ED3ng. \u01AFa m\xE1t, nhi\u1EC1u n\u01B0\u1EDBc.",
        realDays: "1\u20132 n\u0103m (c\xE0nh gi\xE2m)",
        bloomMinutes: 45,
        waterMinutes: 17,
        fadeMinutes: 240,
        regrow: { minutes: 30, harvests: 5 },
        unlock: 0,
        seed: 130,
        sell: 211,
        exp: 99,
        level: 1,
        shape: "cluster",
        colors: ["#5aa9e6", "#c8e7ff"],
        tier: 4,
        wheel: true
      },
      {
        id: "oai_huong",
        name: "O\u1EA3i h\u01B0\u01A1ng",
        sci: "Lavandula angustifolia",
        info: "\u01AFa n\u1EAFng, \u0111\u1EA5t tho\xE1t n\u01B0\u1EDBc t\u1ED1t v\xE0 kh\xE1 kh\xF4, s\u1EE3 \xFAng. Tr\u1ED3ng t\u1EEB h\u1EA1t th\u01B0\u1EDDng m\u1EA5t g\u1EA7n m\u1ED9t n\u0103m m\u1EDBi ra hoa. H\u01B0\u01A1ng th\u01A1m gi\xFAp th\u01B0 gi\xE3n.",
        realDays: "~1 n\u0103m",
        bloomMinutes: 55,
        waterMinutes: 47,
        fadeMinutes: 300,
        unlock: 1800,
        seed: 110,
        sell: 220,
        exp: 132,
        level: 8,
        shape: "spike",
        colors: ["#7b2cbf", "#c77dff"],
        tier: 3
      },
      {
        id: "xuong_rong",
        name: "X\u01B0\u01A1ng r\u1ED3ng ra hoa",
        sci: "Echinopsis spp.",
        info: "C\u1EA7n r\u1EA5t \xEDt n\u01B0\u1EDBc. Nhi\u1EC1u lo\xE0i x\u01B0\u01A1ng r\u1ED3ng n\u1EDF hoa to r\u1EF1c r\u1EE1 nh\u01B0ng m\u1ED7i b\xF4ng ch\u1EC9 gi\u1EEF \u0111\u01B0\u1EE3c kho\u1EA3ng m\u1ED9t ng\xE0y.",
        realDays: "2\u20133 n\u0103m",
        bloomMinutes: 55,
        waterMinutes: 71,
        fadeMinutes: 300,
        unlock: 2400,
        seed: 150,
        sell: 271,
        exp: 144,
        level: 9,
        shape: "cactus",
        colors: ["#ff70a6", "#2d6a4f"],
        tier: 3
      },
      {
        id: "hoa_quynh",
        name: "Hoa qu\u1EF3nh",
        sci: "Epiphyllum oxypetalum",
        info: '"N\u1EEF ho\xE0ng b\xF3ng \u0111\xEAm": n\u1EDF v\u1EC1 \u0111\xEAm, h\u01B0\u01A1ng r\u1EA5t th\u01A1m v\xE0 t\xE0n tr\u01B0\u1EDBc khi tr\u1EDDi s\xE1ng. Trong game, qu\u1EF3nh ch\u1EC9 n\u1EDF v\xE0o gi\u1EDD cu\u1ED1i ca (16:00\u201317:00) \u2013 h\u1EBFt gi\u1EDD l\xE0 t\xE0n!',
        realDays: "2\u20133 n\u0103m (c\xE0nh gi\xE2m)",
        bloomMinutes: 90,
        waterMinutes: 68,
        window: ["16:00", "17:00"],
        fadeMinutes: 60,
        regrow: { minutes: 55, harvests: 3 },
        unlock: 3500,
        seed: 260,
        sell: 476,
        exp: 258,
        level: 10,
        shape: "night",
        colors: ["#ffffff", "#fff3b0"],
        tier: 4
      },
      {
        id: "mai_vang",
        name: "Mai v\xE0ng",
        sci: "Ochna integerrima",
        info: "Bi\u1EC3u t\u01B0\u1EE3ng T\u1EBFt mi\u1EC1n Nam. Nh\xE0 v\u01B0\u1EDDn tu\u1ED1t l\xE1 kho\u1EA3ng m\u1ED9t th\xE1ng tr\u01B0\u1EDBc T\u1EBFt \u0111\u1EC3 mai n\u1EDF \u0111\xFAng d\u1ECBp. Hoa 5 c\xE1nh v\xE0ng r\u1EF1c.",
        realDays: "nhi\u1EC1u n\u0103m (c\xE2y c\u1EA3nh)",
        bloomMinutes: 70,
        waterMinutes: 37,
        fadeMinutes: 240,
        regrow: { minutes: 35, harvests: 4 },
        unlock: 0,
        seed: 300,
        sell: 482,
        exp: 216,
        level: 1,
        shape: "branch",
        colors: ["#ffd23f", "#ff9f1c"],
        tier: 5,
        wheel: true
      },
      {
        id: "hoa_dao",
        name: "Hoa \u0111\xE0o",
        sci: "Prunus persica",
        info: "Bi\u1EC3u t\u01B0\u1EE3ng T\u1EBFt mi\u1EC1n B\u1EAFc, n\u1ED5i ti\u1EBFng \u0111\xE0o Nh\u1EADt T\xE2n. Hoa n\u1EDF tr\xEAn c\xE0nh kh\u1EB3ng khiu khi c\xE2y r\u1EE5ng l\xE1 v\xE0o cu\u1ED1i \u0111\xF4ng.",
        realDays: "nhi\u1EC1u n\u0103m (c\xE2y c\u1EA3nh)",
        bloomMinutes: 70,
        waterMinutes: 37,
        fadeMinutes: 240,
        regrow: { minutes: 35, harvests: 4 },
        unlock: 0,
        seed: 300,
        sell: 482,
        exp: 216,
        level: 1,
        shape: "branch",
        colors: ["#ff8fab", "#ffe5ec"],
        tier: 6,
        wheel: true
      },
      {
        id: "lan_ho_diep",
        name: "Lan h\u1ED3 \u0111i\u1EC7p",
        sci: "Phalaenopsis spp.",
        info: "Lo\xE0i lan ph\u1ED5 bi\u1EBFn nh\u1EA5t ng\xE0y T\u1EBFt. R\u1EC5 kh\xED sinh, s\u1EE3 \xFAng \u2013 ch\u1EC9 t\u01B0\u1EDBi khi gi\xE1 th\u1EC3 g\u1EA7n kh\xF4. M\u1ED9t c\xE0nh hoa c\xF3 th\u1EC3 b\u1EC1n 2\u20133 th\xE1ng.",
        realDays: "2\u20133 n\u0103m",
        bloomMinutes: 90,
        waterMinutes: 79,
        fadeMinutes: 600,
        regrow: { minutes: 55, harvests: 4 },
        unlock: 5e3,
        seed: 400,
        sell: 652,
        exp: 297,
        level: 12,
        shape: "orchid",
        colors: ["#f72585", "#ffffff"],
        tier: 4
      },
      {
        id: "cuc_dai",
        name: "Hoa c\xFAc d\u1EA1i",
        sci: "Bellis perennis",
        info: "B\xF4ng c\xFAc nh\u1ECF m\u1ECDc hoang ven \u0111\u01B0\u1EDDng, c\xE1nh tr\u1EAFng vi\u1EC1n h\u1ED3ng, nhu\u1EF5 v\xE0ng. B\xE9 x\xEDu nh\u01B0ng r\u1EA5t b\u1EC1n b\u1EC9.",
        realDays: "~8\u201310 tu\u1EA7n",
        bloomMinutes: 5,
        waterMinutes: 10,
        fadeMinutes: 240,
        unlock: 0,
        seed: 8,
        sell: 11,
        exp: 3,
        level: 1,
        shape: "daisy",
        colors: ["#fff0f6", "#ffd23f"],
        tier: 0,
        wheel: true
      },
      {
        id: "su_quan_tu",
        name: "Hoa s\u1EED qu\xE2n t\u1EED",
        sci: "Combretum indicum",
        info: "D\xE2y leo hoa ch\xF9m, th\u01A1m v\u1EC1 chi\u1EC1u. Hoa \u0111\u1ED5i m\xE0u t\u1EEB tr\u1EAFng sang h\u1ED3ng r\u1ED3i \u0111\u1ECF sau v\xE0i ng\xE0y n\xEAn m\u1ED9t ch\xF9m c\xF3 nhi\u1EC1u m\xE0u.",
        realDays: "v\xE0i th\xE1ng (c\xE0nh gi\xE2m)",
        bloomMinutes: 10,
        waterMinutes: 10,
        fadeMinutes: 240,
        unlock: 0,
        seed: 20,
        sell: 30,
        exp: 12,
        level: 1,
        shape: "cluster",
        colors: ["#ff4d6d", "#ffffff"],
        tier: 1,
        wheel: true
      },
      {
        id: "anh_dao",
        name: "Hoa anh \u0111\xE0o",
        sci: "Prunus serrulata",
        info: "Bi\u1EC3u t\u01B0\u1EE3ng m\xF9a xu\xE2n Nh\u1EADt B\u1EA3n. \u1EDE Vi\u1EC7t Nam c\xF3 mai anh \u0111\xE0o \u0110\xE0 L\u1EA1t n\u1EDF h\u1ED3ng r\u1EF1c v\xE0o kho\u1EA3ng th\xE1ng 1\u20132.",
        realDays: "nhi\u1EC1u n\u0103m (c\xE2y c\u1EA3nh)",
        bloomMinutes: 40,
        waterMinutes: 27,
        fadeMinutes: 240,
        regrow: { minutes: 25, harvests: 5 },
        unlock: 0,
        seed: 140,
        sell: 212,
        exp: 87,
        level: 1,
        shape: "branch",
        colors: ["#ffc8dd", "#ffe5ec"],
        tier: 3,
        wheel: true
      },
      {
        id: "sen_vang",
        name: "Sen v\xE0ng",
        sci: "Nelumbo lutea",
        info: "Lo\xE0i sen hoa v\xE0ng nh\u1EA1t c\xF3 ngu\u1ED3n g\u1ED1c ch\xE2u M\u1EF9, hi\u1EBFm g\u1EB7p \u1EDF Vi\u1EC7t Nam. Gi\u1ED1ng sen h\u1ED3ng, hoa n\u1EDF bu\u1ED5i s\xE1ng.",
        realDays: "~3 th\xE1ng",
        bloomMinutes: 45,
        waterMinutes: 14,
        window: ["08:00", "11:00"],
        fadeMinutes: 180,
        regrow: { minutes: 20, harvests: 5 },
        unlock: 0,
        seed: 220,
        sell: 319,
        exp: 117,
        level: 1,
        shape: "lotus",
        colors: ["#ffd23f", "#fff3b0"],
        tier: 4,
        wheel: true
      },
      {
        id: "uu_dam",
        name: "Hoa \u01B0u \u0111\xE0m",
        sci: "Udumbara (truy\u1EC1n thuy\u1EBFt)",
        info: 'Theo truy\u1EC1n thuy\u1EBFt Ph\u1EADt gi\xE1o, \u01B0u \u0111\xE0m 3000 n\u0103m m\u1EDBi n\u1EDF m\u1ED9t l\u1EA7n. Ngo\xE0i \u0111\u1EDDi, th\u1EE9 hay b\u1ECB g\u1ECDi nh\u1EA7m l\xE0 "hoa \u01B0u \u0111\xE0m" th\u1EF1c ra l\xE0 tr\u1EE9ng c\u1EE7a lo\xE0i c\xF4n tr\xF9ng c\xE1nh g\xE2n.',
        realDays: "3000 n\u0103m (truy\u1EC1n thuy\u1EBFt)",
        bloomMinutes: 90,
        waterMinutes: 68,
        fadeMinutes: 120,
        unlock: 0,
        seed: 500,
        sell: 752,
        exp: 297,
        level: 1,
        shape: "star",
        colors: ["#ffffff", "#c8e7ff"],
        tier: 6,
        wheel: true
      }
    ];
    var POTS = [
      { id: "nhua", name: "Ch\u1EADu nh\u1EF1a", tier: 0, price: 0, unlock: 0, level: 1, color: "#5c7a99", water: 1, sell: 0, exp: 0, growth: 0, desc: "Ch\u1EADu m\u1EB7c \u0111\u1ECBnh." },
      { id: "dat_nung", name: "Ch\u1EADu \u0111\u1EA5t nung", tier: 0, price: 40, unlock: 100, level: 1, color: "#c8553d", water: 1.2, sell: 0, exp: 0, growth: 0, desc: "Gi\u1EEF \u1EA9m t\u1ED1t: c\xE2y kh\xE1t ch\u1EADm h\u01A1n 20%." },
      { id: "su_trang", name: "Ch\u1EADu s\u1EE9 tr\u1EAFng", tier: 1, price: 90, unlock: 250, level: 3, color: "#e9ecef", water: 1, sell: 0.1, exp: 0, growth: 0, desc: "+10% ti\u1EC1n khi thu ho\u1EA1ch." },
      { id: "go", name: "Ch\u1EADu g\u1ED7", tier: 1, price: 130, unlock: 350, level: 4, color: "#8d5a2b", water: 1.1, sell: 0, exp: 0, growth: 0.1, desc: "C\xE2y l\u1EDBn nhanh h\u01A1n 10%, gi\u1EEF \u1EA9m +10%." },
      { id: "men_lam", name: "Ch\u1EADu g\u1ED1m men lam", tier: 2, price: 200, unlock: 550, level: 5, color: "#3a6ea5", pattern: "stripe", water: 1.3, sell: 0.15, exp: 0, growth: 0, desc: "G\u1ED1m men lam: gi\u1EEF \u1EA9m +30%, +15% ti\u1EC1n." },
      { id: "ngoc", name: "Ch\u1EADu ng\u1ECDc b\xEDch", tier: 3, price: 380, unlock: 1e3, level: 8, color: "#2a9d8f", pattern: "shine", water: 1.2, sell: 0.1, exp: 0.15, growth: 0.1, desc: "+15% EXP, +10% ti\u1EC1n, l\u1EDBn nhanh +10%." },
      { id: "vang", name: "Ch\u1EADu v\xE0ng", tier: 4, price: 700, unlock: 2e3, level: 10, color: "#e9c46a", pattern: "shine", water: 1.2, sell: 0.3, exp: 0.2, growth: 0, desc: "+30% ti\u1EC1n, +20% EXP. Sang ch\u1EA3nh!" },
      { id: "hoa_van", name: "Ch\u1EADu g\u1ED1m hoa v\u0103n", tier: 2, wheel: true, price: 220, unlock: 0, level: 1, color: "#f8f9fa", pattern: "floral", water: 1.2, sell: 0.12, exp: 0.05, growth: 0, desc: "G\u1ED1m tr\u1EAFng v\u1EBD hoa lam: gi\u1EEF \u1EA9m +20%, +12% ti\u1EC1n, +5% EXP." },
      { id: "pha_le", name: "Ch\u1EADu pha l\xEA", tier: 3, wheel: true, price: 500, unlock: 0, level: 1, color: "#a5e4ff", pattern: "crystal", water: 1.3, sell: 0.15, exp: 0.15, growth: 0.1, desc: "Trong su\u1ED1t l\u1EA5p l\xE1nh: gi\u1EEF \u1EA9m +30%, +15% ti\u1EC1n, +15% EXP, l\u1EDBn nhanh +10%." },
      { id: "cau_vong", name: "Ch\u1EADu c\u1EA7u v\u1ED3ng", tier: 5, wheel: true, price: 1500, unlock: 0, level: 1, color: "#ff595e", pattern: "rainbow", water: 1.4, sell: 0.35, exp: 0.25, growth: 0.15, desc: "+35% ti\u1EC1n, +25% EXP, l\u1EDBn nhanh +15%, gi\u1EEF \u1EA9m +40%." },
      { id: "ngan_ha", name: "Ch\u1EADu ng\xE2n h\xE0", tier: 6, wheel: true, price: 3e3, unlock: 0, level: 1, color: "#3c096c", pattern: "galaxy", water: 1.5, sell: 0.5, exp: 0.35, growth: 0.2, desc: "B\xED \u1EA9n: +50% ti\u1EC1n, +35% EXP, l\u1EDBn nhanh +20%, gi\u1EEF \u1EA9m +50%." },
      { id: "sanh", name: "Ch\u1EADu s\xE0nh", tier: 0, wheel: true, price: 25, unlock: 0, level: 1, color: "#7f5539", pattern: "drip", water: 1.15, sell: 0.03, exp: 0, growth: 0, desc: "S\xE0nh men ch\u1EA3y: gi\u1EEF \u1EA9m +15%, +3% ti\u1EC1n." },
      { id: "tre_dan", name: "Ch\u1EADu tre \u0111an", tier: 2, wheel: true, price: 160, unlock: 0, level: 1, color: "#d4a96a", pattern: "weave", water: 1.1, sell: 0.08, exp: 0, growth: 0.08, desc: "Tre \u0111an th\u1EE7 c\xF4ng: l\u1EDBn nhanh +8%, +8% ti\u1EC1n, gi\u1EEF \u1EA9m +10%." },
      { id: "cam_thach", name: "Ch\u1EADu c\u1EA9m th\u1EA1ch", tier: 5, wheel: true, price: 1800, unlock: 0, level: 1, color: "#f1f3f5", pattern: "marble", water: 1.4, sell: 0.4, exp: 0.25, growth: 0.12, desc: "V\xE2n \u0111\xE1 qu\xFD: +40% ti\u1EC1n, +25% EXP, l\u1EDBn nhanh +12%, gi\u1EEF \u1EA9m +40%." }
    ];
    var DECOR = [
      { id: "hang_rao", name: "H\xE0ng r\xE0o g\u1ED7", price: 60, level: 1, desc: "Cho v\u01B0\u1EDDn g\u1ECDn g\xE0ng.", fx: {} },
      { id: "den_long", name: "\u0110\xE8n l\u1ED3ng", price: 150, level: 2, desc: "+5% EXP.", fx: { exp: 0.05 } },
      { id: "chuong_gio", name: "Chu\xF4ng gi\xF3", price: 140, level: 2, desc: "C\xE2y kh\xE1t ch\u1EADm h\u01A1n 5%.", fx: { water: 0.05 } },
      { id: "ech_gom", name: "T\u01B0\u1EE3ng \u1EBFch g\u1ED1m", price: 260, level: 3, desc: "+5% ti\u1EC1n khi thu ho\u1EA1ch.", fx: { sell: 0.05 } },
      { id: "ghe_da", name: "Gh\u1EBF \u0111\xE1", price: 200, level: 3, desc: "Ch\u1ED7 ng\u1ED3i ngh\u1EC9 tr\u01B0a.", fx: {} },
      { id: "meo_ngu", name: "M\xE8o ng\u1EE7", price: 320, level: 4, desc: "Canh v\u01B0\u1EDDn: ch\u1EB7n 20% l\u1EA7n h\xE1i tr\u1ED9m.", fx: { guard: 0.2 } },
      { id: "bu_nhin", name: "B\xF9 nh\xECn", price: 420, level: 6, desc: "Ch\u1EB7n 30% l\u1EA7n h\xE1i tr\u1ED9m.", fx: { guard: 0.3 } },
      { id: "dai_phun", name: "\u0110\xE0i phun n\u01B0\u1EDBc mini", price: 850, level: 7, desc: "C\xE2y kh\xE1t ch\u1EADm h\u01A1n 10%, +5% EXP.", fx: { water: 0.1, exp: 0.05 } }
    ];
    var ITEMS = [
      { id: "phan_bon", name: "Ph\xE2n b\xF3n th\u01B0\u1EDDng", tier: 0, fert: 3, price: 20, level: 1, desc: "R\xFAt ng\u1EAFn 3 ph\xFAt th\u1EDDi gian n\u1EDF." },
      { id: "phan_npk", name: "Ph\xE2n NPK", tier: 1, fert: 8, price: 45, level: 3, desc: "R\xFAt ng\u1EAFn 8 ph\xFAt th\u1EDDi gian n\u1EDF." },
      { id: "phan_sieu_toc", name: "Ph\xE2n si\xEAu t\u1ED1c", tier: 2, fert: 20, price: 110, level: 6, desc: "R\xFAt ng\u1EAFn 20 ph\xFAt th\u1EDDi gian n\u1EDF." },
      { id: "phan_than_ky", name: "Ph\xE2n th\u1EA7n k\u1EF3", tier: 3, fert: 45, price: 240, level: 10, desc: "R\xFAt ng\u1EAFn 45 ph\xFAt th\u1EDDi gian n\u1EDF." },
      { id: "tien_duoc", name: "Ti\xEAn d\u01B0\u1EE3c", tier: 4, fert: 90, price: 0, level: 1, wheel: true, desc: "Ch\u1EC9 c\xF3 t\u1EEB V\xF2ng quay: r\xFAt ng\u1EAFn 90 ph\xFAt \u2013 g\u1EA7n nh\u01B0 n\u1EDF ngay." },
      { id: "binh_lon", name: "B\xECnh t\u01B0\u1EDBi l\u1EDBn", price: 500, level: 5, once: true, desc: 'M\u1EDF kho\xE1 n\xFAt "T\u01B0\u1EDBi t\u1EA5t c\u1EA3".' }
    ];
    var RULES = {
      startMoney: 60,
      startSlots: 4,
      maxSlots: 12,
      slotPrice: (owned) => 150 * Math.pow(2, owned - 4),
      // 150, 300, 600...
      slotLevel: (owned) => [2, 3, 4, 5, 6, 8, 10, 12][owned - 4] || 99,
      // cấp cần để mở ô thứ owned+1
      starterSeeds: { muoi_gio: 2, van_tho: 2 },
      /**
       * Quà hằng ngày (1 lần/ngày). Chỉ ra vật phẩm ĐÃ mở khoá. Tỉ lệ:
       *  - 1%  : 1 pet loại Thường mà tài khoản chưa có (hiếm nhất; nếu đã có hết → đổi thành hạt giống)
       *  - 27% : 1 chậu (loại đã mở khoá, trừ chậu nhựa; chậu rẻ ra nhiều hơn)
       *  - 72% : 1–3 hạt giống (giống đã mở khoá; hạt rẻ ra nhiều hơn; 1 hạt 60%, 2 hạt 30%, 3 hạt 10%)
       */
      /**
       * Vòng quay may mắn (tham khảo cơ chế gacha phổ biến: tỉ lệ công khai + bảo hiểm "pity").
       * rates: xác suất mỗi bậc (%) – KHÔNG hiển thị cho người chơi. Common: 35% ra vật phẩm độc quyền Common, còn lại quà an ủi.
       * Trúng vật phẩm = mở khoá để MUA (không mất phí mở khoá) + tặng kèm 1 cái (pet thì chỉ mở khoá).
       * pityEpic: 10 lượt chưa ra Rare trở lên → lượt thứ 10 chắc chắn Rare+; pityLegendary: 60 lượt → chắc Legendary+.
       */
      wheel: { cost: 200, cost10: 1800, freePerDay: 1, rates: [55, 30, 12.5, 2, 0.45, 0.045, 5e-3], pityEpic: 10, pityLegendary: 60, newItemChance: 0.75, commonItemChance: 0.35 },
      daily: { pet: 0.01, pot: 0.27, seedQty: [[1, 0.6], [2, 0.3], [3, 0.1]] },
      decorSlots: 4,
      thirstyAt: 25,
      // % nước: dưới mức này cây "khát" → lớn chậm 50%
      waterBlockAbove: 85,
      // % nước: trên mức này đất còn ẩm, chưa cần tưới
      dryHealthLossPerMin: 1 / 3,
      // khi cạn nước: mất 1 máu mỗi 3 phút làm việc (~5 giờ là chết)
      offlineGapMs: 10 * 60 * 1e3,
      // app không chạy quá 10 phút → coi là vắng mặt
      offlineMinHealth: 30,
      fadedValue: 0.4,
      stealShare: 0.5,
      petSleepMs: 30 * 60 * 1e3,
      // pet chặn trộm xong ngủ 30 phút (thời gian thực)
      waterExp: 3,
      // EXP mỗi lần tự tưới khi đất đã khô dưới waterExpBelow% (tránh tưới liên tục để cày)
      waterExpBelow: 50,
      plantExp: 2,
      // EXP mỗi lần gieo hạt
      fertExpPerMin: 1 / 3
      // EXP khi bón phân = số phút rút ngắn / 3 (phân đắt cho nhiều EXP hơn)
    };
    function expToNext(level) {
      return Math.round(60 * Math.pow(level, 1.5));
    }
    var POWERS = [
      { id: "cu_huc", name: "C\xFA h\xFAc \u0111\u1EA7u", tier: 0, price: 0, fx: "bump", color: "#c9c9c9", desc: "Ch\u01B0\u1EDFng m\u1EB7c \u0111\u1ECBnh c\u1EE7a m\u1ECDi pet." },
      { id: "phi_diep", name: "Phi di\u1EC7p ch\u01B0\u1EDFng", tier: 0, price: 150, fx: "leaf", color: "#52b788", desc: "L\xE1 c\xE2y xo\xE1y t\xEDt bay v\u1EC1 ph\xEDa \u0111\u1ED1i th\u1EE7." },
      { id: "thuy_cau", name: "Thu\u1EF7 c\u1EA7u ch\u01B0\u1EDFng", tier: 1, price: 400, fx: "water", color: "#4cc9f0", desc: "Qu\u1EA3 c\u1EA7u n\u01B0\u1EDBc to t\u01B0\u1EDBng." },
      { id: "hoa_vu", name: "Hoa v\u0169 phi ti\xEAu", tier: 1, price: 0, wheel: true, fx: "petal", color: "#ff8fab", desc: "M\u01B0a c\xE1nh hoa s\u1EAFc l\u1EBBm." },
      { id: "hoa_diem", name: "Ho\u1EA3 di\u1EC7m ch\u01B0\u1EDFng", tier: 2, price: 900, fx: "fire", color: "#ff6b35", desc: "Qu\u1EA3 c\u1EA7u l\u1EEDa r\u1EF1c ch\xE1y." },
      { id: "bang_phong", name: "B\u0103ng phong ch\u01B0\u1EDFng", tier: 2, price: 0, wheel: true, fx: "ice", color: "#a5e4ff", desc: "M\u0169i b\u0103ng \u0111\xF3ng c\u1EE9ng \u0111\u1ED1i th\u1EE7." },
      { id: "loi_dien", name: "L\xF4i \u0111i\u1EC7n quy\u1EC1n", tier: 3, price: 2200, fx: "bolt", color: "#ffd23f", desc: "Tia s\xE9t gi\xE1ng th\u1EB3ng xu\u1ED1ng." },
      { id: "phong_than", name: "Phong th\u1EA7n c\u01B0\u1EDBc", tier: 3, price: 0, wheel: true, fx: "wind", color: "#caffbf", desc: "L\u1ED1c xo\xE1y cu\u1ED1n bay \u0111\u1ED1i th\u1EE7." },
      { id: "than_long", name: "Th\u1EA7n long b\xE1 kh\xED", tier: 4, price: 6e3, fx: "dragon", color: "#f4a300", desc: "R\u1ED3ng v\xE0ng g\u1EA7m vang \u0111\u1EA5u tr\u01B0\u1EDDng." },
      { id: "cau_vong", name: "C\u1EA7u v\u1ED3ng di\u1EC7t th\u1EBF", tier: 5, price: 0, wheel: true, fx: "rainbow", color: "#ff595e", desc: "D\u1EA3i c\u1EA7u v\u1ED3ng qu\xE9t ngang m\xE0n h\xECnh." },
      { id: "ngan_ha", name: "Ng\xE2n h\xE0 ch\u01B0\u1EDFng", tier: 6, price: 0, wheel: true, fx: "galaxy", color: "#9d4edd", desc: "C\u1EA3 d\u1EA3i ng\xE2n h\xE0 \u0111\u1ED5 \u1EADp xu\u1ED1ng." }
    ];
    var byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
    module.exports = {
      SPECIES,
      POTS,
      DECOR,
      ITEMS,
      POWERS,
      POWERS_BY_ID: byId(POWERS),
      PETS,
      PET_TIERS,
      TIERS,
      RULES,
      expToNext,
      PETS_BY_ID: byId(PETS),
      SPECIES_BY_ID: byId(SPECIES),
      POTS_BY_ID: byId(POTS),
      DECOR_BY_ID: byId(DECOR),
      ITEMS_BY_ID: byId(ITEMS)
    };
  }
});

// src/core/clock.js
var require_clock = __commonJS({
  "src/core/clock.js"(exports, module) {
    "use strict";
    var DAY = 864e5;
    var offsetMin = null;
    function setOffset(min) {
      offsetMin = Number.isFinite(min) && min >= -720 && min <= 840 ? Math.round(min) : null;
    }
    function getOffset() {
      return offsetMin;
    }
    function parts(ms) {
      if (offsetMin === null) {
        const d2 = new Date(ms);
        return { y: d2.getFullYear(), mo: d2.getMonth(), d: d2.getDate(), h: d2.getHours(), mi: d2.getMinutes(), s: d2.getSeconds(), dow: d2.getDay() };
      }
      const d = new Date(ms + offsetMin * 6e4);
      return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds(), dow: d.getUTCDay() };
    }
    function dayStart(ms) {
      const p = parts(ms);
      if (offsetMin === null) return new Date(p.y, p.mo, p.d).getTime();
      return Date.UTC(p.y, p.mo, p.d) - offsetMin * 6e4;
    }
    function nextDay(dayStartMs) {
      return dayStart(dayStartMs + DAY + DAY / 2);
    }
    module.exports = { DAY, setOffset, getOffset, parts, dayStart, nextDay };
  }
});

// src/core/minigames.js
var require_minigames = __commonJS({
  "src/core/minigames.js"(exports, module) {
    "use strict";
    var C = require_catalog();
    var CL = require_clock();
    var LIMITS = { bugs: 3, memory: 3, fish: 5, blackjack: 5, baucua: 5 };
    var NAMES = { bugs: "B\u1EAFt s\xE2u", memory: "Gh\xE9p c\u1EB7p hoa", fish: "C\xE2u c\xE1 ao v\u01B0\u1EDDn", blackjack: "Hoa 21", baucua: "B\u1EA7u cua t\xF4m c\xE1" };
    var BET = { min: 10, max: 500 };
    var BAUCUA = ["ga_con", "vit_con", "ca_koi", "tho_trang", "meo_muop", "cho_co"];
    var FISH = [
      { id: "ca_ro", name: "C\xE1 r\xF4", tier: 0, price: 15, icon: "\u{1F41F}", diff: 0.15 },
      { id: "ca_diec", name: "C\xE1 di\u1EBFc", tier: 0, price: 18, icon: "\u{1F41F}", diff: 0.2 },
      { id: "ca_bong", name: "C\xE1 b\u1ED1ng", tier: 0, price: 20, icon: "\u{1F41F}", diff: 0.2 },
      { id: "ca_chep", name: "C\xE1 ch\xE9p", tier: 1, price: 45, icon: "\u{1F420}", diff: 0.3 },
      { id: "ca_loc", name: "C\xE1 l\xF3c", tier: 1, price: 55, icon: "\u{1F41F}", diff: 0.35 },
      { id: "tom_cang", name: "T\xF4m c\xE0ng", tier: 1, price: 60, icon: "\u{1F990}", diff: 0.35 },
      { id: "ca_vang", name: "C\xE1 v\xE0ng", tier: 2, price: 120, icon: "\u{1F420}", diff: 0.45 },
      { id: "cua_dong", name: "Cua \u0111\u1ED3ng", tier: 2, price: 140, icon: "\u{1F980}", diff: 0.5 },
      { id: "ca_koi", name: "C\xE1 koi", tier: 3, price: 320, icon: "\u{1F38F}", diff: 0.6 },
      { id: "luon_vang", name: "L\u01B0\u01A1n v\xE0ng", tier: 3, price: 360, icon: "\u{1F40D}", diff: 0.65 },
      { id: "ca_rong", name: "C\xE1 r\u1ED3ng", tier: 4, price: 900, icon: "\u{1F409}", diff: 0.75 },
      { id: "rua_ngoc", name: "R\xF9a ng\u1ECDc", tier: 5, price: 2200, icon: "\u{1F422}", diff: 0.85 },
      { id: "ca_than", name: "C\xE1 th\u1EA7n ao v\u01B0\u1EDDn", tier: 6, price: 6e3, icon: "\u{1F40B}", diff: 0.95 }
    ];
    var FISH_BY_ID = Object.fromEntries(FISH.map((f) => [f.id, f]));
    var FISH_RATES = [52, 28, 13, 5, 1.6, 0.35, 0.05];
    var CHEST_CHANCE = 0.06;
    var dayKey = (ms) => {
      const d = CL.parts(ms);
      return `${d.y}-${d.mo + 1}-${d.d}`;
    };
    var pick = (list, rng) => list[Math.floor(rng() * list.length)];
    var ok = (msg, extra = {}) => ({ ok: true, msg, ...extra });
    var fail = (msg) => ({ ok: false, msg });
    function ensure(state, now) {
      if (!state.minigames || typeof state.minigames !== "object") state.minigames = { day: null, plays: {}, pending: null, best: {} };
      const mg = state.minigames;
      mg.plays = mg.plays || {};
      mg.best = mg.best || {};
      if (mg.day !== dayKey(now)) {
        mg.day = dayKey(now);
        mg.plays = {};
      }
      if (!state.inventory.fish) state.inventory.fish = {};
      return mg;
    }
    function info(state, now = Date.now()) {
      const mg = ensure(state, now);
      return Object.fromEntries(Object.keys(LIMITS).map((g) => [g, { left: Math.max(0, LIMITS[g] - (mg.plays[g] || 0)), limit: LIMITS[g], best: mg.best[g] || 0 }]));
    }
    function petBonus(state) {
      const pet = state.pets.active && C.PETS_BY_ID[state.pets.active];
      if (!pet) return { rare: 0, easy: 0, name: null };
      const cat = /meo/.test(pet.id);
      return { rare: Math.min(0.3, pet.tier * 0.05), easy: cat ? 0.25 : 0.05 * Math.min(pet.tier, 3), name: pet.name, cat };
    }
    function rollFish(state, rng) {
      if (rng() < CHEST_CHANCE) return { kind: "chest", tier: 3, diff: 0.55 };
      const bonus = petBonus(state).rare;
      const rates = FISH_RATES.map((r, i) => i >= 2 ? r * (1 + bonus * 4) : r);
      let x = rng() * rates.reduce((a, b) => a + b, 0);
      let tier = 0;
      for (; tier < rates.length - 1; tier++) {
        x -= rates[tier];
        if (x < 0) break;
      }
      const f = pick(FISH.filter((y) => y.tier === tier), rng);
      return { kind: "fish", id: f.id, tier: f.tier, diff: f.diff };
    }
    function start(state, game, now = Date.now(), rng = Math.random, opts = {}) {
      if (!LIMITS[game]) return fail("Tr\xF2 ch\u01A1i kh\xF4ng h\u1EE3p l\u1EC7.");
      const mg = ensure(state, now);
      if ((mg.plays[game] || 0) >= LIMITS[game]) return fail(`H\xF4m nay \u0111\xE3 h\u1EBFt l\u01B0\u1EE3t ${NAMES[game]} \u2013 mai quay l\u1EA1i nh\xE9!`);
      let bet = 0;
      let bets = null;
      if (game === "blackjack") {
        bet = Math.round(Number(opts.bet) || 0);
        if (bet < BET.min || bet > BET.max) return fail(`M\u1EE9c c\u01B0\u1EE3c t\u1EEB ${BET.min} \u0111\u1EBFn ${BET.max} xu.`);
      } else if (game === "baucua") {
        bets = (Array.isArray(opts.bets) ? opts.bets : []).slice(0, 4).map((b) => ({ face: b && b.face, amount: Math.round(Number(b && b.amount) || 0) }));
        if (!bets.length || bets.length > 3) return fail("\u0110\u1EB7t t\u1EEB 1 \u0111\u1EBFn 3 \u0111\u1ED3ng xu l\xEAn b\xE0n.");
        if (bets.some((b) => !BAUCUA.includes(b.face) || b.amount < BET.min || b.amount > BET.max)) return fail(`M\u1ED7i \u0111\u1ED3ng xu t\u1EEB ${BET.min} \u0111\u1EBFn ${BET.max} xu.`);
        bet = bets.reduce((a, b) => a + b.amount, 0);
      }
      if (bet) {
        if (state.money < bet) return fail(`Kh\xF4ng \u0111\u1EE7 xu \u0111\u1EC3 c\u01B0\u1EE3c ${bet}.`);
        state.money -= bet;
      }
      mg.plays[game] = (mg.plays[game] || 0) + 1;
      const token = `${game}-${now}-${Math.floor(rng() * 1e9)}`;
      const p = { game, token, at: now, bet, bets };
      const out = { token, left: LIMITS[game] - mg.plays[game] };
      if (game === "bugs") {
        p.goldenAt = 6 + Math.floor(rng() * 18);
        p.golden = rng() < 0.6;
        Object.assign(out, { seconds: 30, goldenAt: p.golden ? p.goldenAt : null });
      } else if (game === "blackjack") {
        const deck = [];
        for (let su = 0; su < 4; su++) for (let r = 1; r <= 13; r++) deck.push({ r, s: su });
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        p.deck = deck;
        p.player = [deck.pop(), deck.pop()];
        p.dealer = [deck.pop(), deck.pop()];
        if (bjScore(p.player) === 21 || bjScore(p.dealer) === 21) {
          mg.pending = p;
          return finishBJ(state, p, now, rng, out);
        }
        Object.assign(out, bjView(p, false), { bet });
      } else if (game === "baucua") {
        Object.assign(out, { faces: BAUCUA, bet });
      } else if (game === "memory") {
        const unlocked = state.unlocked.species.filter((id) => C.SPECIES_BY_ID[id]);
        const extra = C.SPECIES.filter((s) => !s.wheel && !unlocked.includes(s.id)).sort((a, b) => a.level - b.level).map((s) => s.id);
        const pool = [...unlocked].sort(() => rng() - 0.5).slice(0, 6);
        while (pool.length < 6 && extra.length) pool.push(extra.shift());
        const deck = [...pool, ...pool].map((id) => ({ id })).sort(() => rng() - 0.5);
        p.board = pool;
        Object.assign(out, { deck: deck.map((c) => c.id), maxTries: 14 });
      } else {
        const c = rollFish(state, rng);
        const b = petBonus(state);
        p.catch = c;
        Object.assign(out, { tier: c.tier, diff: Math.max(0.05, c.diff - b.easy), wait: 2 + rng() * 4, pet: b.name, petCat: !!b.cat });
      }
      mg.pending = p;
      return ok("B\u1EAFt \u0111\u1EA7u!", out);
    }
    function seedReward(state, id, n) {
      state.inventory.seeds[id] = (state.inventory.seeds[id] || 0) + n;
      return `${n} h\u1EA1t ${C.SPECIES_BY_ID[id].name}`;
    }
    function itemReward(state, id, n) {
      state.inventory.items[id] = (state.inventory.items[id] || 0) + n;
      return `${n} ${C.ITEMS_BY_ID[id].name}`;
    }
    function rewardBugs(state, p, result, rng) {
      const score = Math.max(0, Math.min(90, Math.round(Number(result.score) || 0)));
      const gifts = [];
      if (score >= 45) gifts.push(itemReward(state, "phan_sieu_toc", 1), itemReward(state, "phan_npk", 1));
      else if (score >= 30) gifts.push(itemReward(state, "phan_npk", 2));
      else if (score >= 18) gifts.push(itemReward(state, "phan_npk", 1), itemReward(state, "phan_bon", 1));
      else if (score >= 8) gifts.push(itemReward(state, "phan_bon", 2));
      else if (score >= 1) gifts.push(itemReward(state, "phan_bon", 1));
      if (p.golden && result.golden === true) {
        const rare = C.SPECIES.filter((s) => s.tier >= 2 && s.tier <= 4);
        gifts.push(seedReward(state, pick(rare, rng).id, 1));
      }
      return { score, gifts };
    }
    function rewardMemory(state, p, result, rng) {
      const pairs = [...new Set(Array.isArray(result.pairs) ? result.pairs : [])].filter((id) => p.board.includes(id));
      const tries = Math.max(pairs.length, Math.min(14, Math.round(Number(result.tries) || 0)));
      const stars = pairs.length < p.board.length ? 0 : tries <= 9 ? 3 : tries <= 11 ? 2 : 1;
      const gifts = pairs.map((id) => seedReward(state, id, 1));
      if (stars === 3) gifts.push(seedReward(state, pick(pairs, rng), 1));
      return { score: pairs.length * 10 + stars * 5, stars, gifts };
    }
    function openChest(state, rng) {
      if (rng() < 0.5) {
        const powers = C.POWERS.filter((x) => !x.wheel && x.price && !state.inventory.powers[x.id] && x.tier <= 3);
        if (powers.length) {
          const pw = pick(powers, rng);
          state.inventory.powers[pw.id] = 1;
          return `ch\u01B0\u1EDFng l\u1EF1c ${pw.name}`;
        }
      }
      const pots = C.POTS.filter((x) => x.id !== "nhua" && x.tier <= 3);
      const pot = pick(pots, rng);
      state.inventory.pots[pot.id] = (state.inventory.pots[pot.id] || 0) + 1;
      return `1 ${pot.name}`;
    }
    function rewardFish(state, p, result, rng) {
      if (result.caught !== true) return { score: 0, gifts: [], escaped: true };
      const c = p.catch;
      if (c.kind === "chest") return { score: 1, gifts: [`R\u01B0\u01A1ng b\xE1u: ${openChest(state, rng)}`], chest: true };
      const f = FISH_BY_ID[c.id];
      state.inventory.fish[f.id] = (state.inventory.fish[f.id] || 0) + 1;
      return { score: 1, gifts: [`${f.icon} ${f.name}`], fish: f.id, tier: f.tier };
    }
    function bjScore(cards) {
      let total = 0;
      let aces = 0;
      for (const c of cards) {
        if (c.r === 1) {
          aces += 1;
          total += 11;
        } else total += Math.min(10, c.r);
      }
      while (total > 21 && aces) {
        total -= 10;
        aces -= 1;
      }
      return total;
    }
    function bjView(p, reveal) {
      return { player: p.player, playerScore: bjScore(p.player), dealer: reveal ? p.dealer : [p.dealer[0]], dealerScore: reveal ? bjScore(p.dealer) : null };
    }
    function finishBJ(state, p, now, rng, out = {}) {
      const ps = bjScore(p.player);
      const natural = p.player.length === 2 && ps === 21;
      if (ps <= 21 && !natural) while (bjScore(p.dealer) < 17) p.dealer.push(p.deck.pop());
      const ds = bjScore(p.dealer);
      const dNatural = p.dealer.length === 2 && ds === 21;
      let outcome;
      if (ps > 21) outcome = "bust";
      else if (natural && !dNatural) outcome = "blackjack";
      else if (dNatural && !natural) outcome = "lose";
      else if (ds > 21 || ps > ds) outcome = "win";
      else if (ps === ds) outcome = "push";
      else outcome = "lose";
      p.resolved = outcome;
      const r = finish(state, "blackjack", p.token, {}, now, rng);
      return { ...r, ...out, ...bjView(p, true), outcome, done: true };
    }
    function move(state, game, token, action, now = Date.now(), rng = Math.random) {
      const mg = ensure(state, now);
      const p = mg.pending;
      if (game !== "blackjack" || !p || p.game !== game || p.token !== token) return fail("V\xE1n b\xE0i kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c \u0111\xE3 k\u1EBFt th\xFAc.");
      if (action === "hit") {
        p.player.push(p.deck.pop());
        if (bjScore(p.player) >= 21) return finishBJ(state, p, now, rng);
        return ok("R\xFAt th\xEAm 1 l\xE1.", bjView(p, false));
      }
      if (action === "stand") return finishBJ(state, p, now, rng);
      return fail("H\xE0nh \u0111\u1ED9ng kh\xF4ng h\u1EE3p l\u1EC7.");
    }
    var BJ_TEXT = { blackjack: "\u{1F31F} Blackjack!", win: "\u{1F389} Th\u1EAFng!", push: "\u{1F91D} Ho\xE0", lose: "\u{1F63F} Thua", bust: "\u{1F4A5} Qu\xE1 21 \u2013 qu\u1EAFc!" };
    var BJ_PAY = { blackjack: 2.5, win: 2, push: 1, lose: 0, bust: 0 };
    function rewardBJ(state, p) {
      const o = BJ_TEXT[p.resolved] ? p.resolved : "lose";
      const back = Math.floor(p.bet * BJ_PAY[o]);
      state.money += back;
      const net = back - p.bet;
      return { score: 0, gifts: back ? [`+${back} xu`] : [], outcome: o, title: BJ_TEXT[o], bet: p.bet, back, net };
    }
    function rewardBauCua(state, p, result, rng) {
      const dice = [0, 1, 2].map(() => pick(BAUCUA, rng));
      const lines = p.bets.map((b) => {
        const hits = dice.filter((d) => d === b.face).length;
        return { face: b.face, amount: b.amount, hits, back: hits ? b.amount * (1 + hits) : 0 };
      });
      const back = lines.reduce((a, x) => a + x.back, 0);
      state.money += back;
      return { score: 0, gifts: back ? [`+${back} xu`] : [], dice, lines, hits: lines.reduce((a, x) => a + x.hits, 0), bet: p.bet, back, net: back - p.bet };
    }
    function finish(state, game, token, result = {}, now = Date.now(), rng = Math.random) {
      const mg = ensure(state, now);
      const p = mg.pending;
      if (!p || p.game !== game || p.token !== token) return fail("L\u01B0\u1EE3t ch\u01A1i kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c \u0111\xE3 k\u1EBFt th\xFAc.");
      mg.pending = null;
      const r = game === "bugs" ? rewardBugs(state, p, result || {}, rng) : game === "memory" ? rewardMemory(state, p, result || {}, rng) : game === "blackjack" ? rewardBJ(state, p) : game === "baucua" ? rewardBauCua(state, p, result || {}, rng) : rewardFish(state, p, result || {}, rng);
      if (r.score > (mg.best[game] || 0) && !["fish", "blackjack", "baucua"].includes(game)) mg.best[game] = r.score;
      const text = r.bet ? r.net > 0 ? `Th\u1EAFng ${r.net} xu (nh\u1EADn l\u1EA1i ${r.back})` : r.net === 0 ? `Ho\xE0 \u2013 nh\u1EADn l\u1EA1i ${r.back} xu` : `Thua ${-r.net} xu` : r.gifts.length ? `Nh\u1EADn: ${r.gifts.join(", ")}` : "Kh\xF4ng nh\u1EADn \u0111\u01B0\u1EE3c g\xEC l\u1EA7n n\xE0y.";
      state.log.unshift({ at: now, type: "minigame", text: `${NAMES[game]}: ${text}` });
      if (state.log.length > 200) state.log.length = 200;
      return ok(text, { result: r });
    }
    function sellFish(state, id, all = false) {
      const f = FISH_BY_ID[id];
      const have = f ? state.inventory.fish[id] || 0 : 0;
      if (!have) return fail("Kh\xF4ng c\xF3 con c\xE1 n\xE0y.");
      const n = all ? have : 1;
      state.inventory.fish[id] = have - n;
      state.money += f.price * n;
      return ok(`B\xE1n ${n} ${f.name}: +${f.price * n} xu`, { money: f.price * n });
    }
    module.exports = { LIMITS, NAMES, FISH, FISH_BY_ID, BAUCUA, BET, info, start, finish, move, sellFish, petBonus, bjScore };
  }
});

// src/core/schedule.js
var require_schedule = __commonJS({
  "src/core/schedule.js"(exports, module) {
    "use strict";
    var CL = require_clock();
    var DEFAULT_SCHEDULE = {
      start: "08:00",
      end: "17:00",
      lunch: { enabled: true, start: "12:00", end: "13:00" },
      workdays: [1, 2, 3, 4, 5]
      // 0 = Chủ nhật ... 6 = Thứ bảy
    };
    var MIN = 60 * 1e3;
    function toMin(hhmm) {
      const [h, m] = String(hhmm).split(":").map(Number);
      return h * 60 + (m || 0);
    }
    function fmtMin(total) {
      const h = Math.floor(total / 60);
      const m = Math.round(total % 60);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    function dayIntervals(schedule) {
      const s = toMin(schedule.start);
      const e = toMin(schedule.end);
      if (e <= s) return [];
      const l = schedule.lunch;
      if (l && l.enabled) {
        const ls = Math.max(s, toMin(l.start));
        const le = Math.min(e, toMin(l.end));
        if (le > ls) return [[s, ls], [le, e]].filter(([a, b]) => b > a);
      }
      return [[s, e]];
    }
    function minuteOfDay(ms) {
      const p = CL.parts(ms);
      return p.h * 60 + p.mi + p.s / 60;
    }
    function isWorkTime(ms, schedule = DEFAULT_SCHEDULE) {
      if (!schedule.workdays.includes(CL.parts(ms).dow)) return false;
      const m = minuteOfDay(ms);
      return dayIntervals(schedule).some(([a, b]) => m >= a && m < b);
    }
    function workSpans(t0, t1, schedule = DEFAULT_SCHEDULE) {
      const spans = [];
      if (t1 <= t0) return spans;
      const intervals = dayIntervals(schedule);
      let day = CL.dayStart(t0);
      for (let guard = 0; day <= t1 && guard < 4e3; guard++) {
        if (schedule.workdays.includes(CL.parts(day + CL.DAY / 2).dow)) {
          for (const [a, b] of intervals) {
            const s = Math.max(day + a * MIN, t0);
            const e = Math.min(day + b * MIN, t1);
            if (e > s) spans.push([s, e]);
          }
        }
        day = CL.nextDay(day);
      }
      return spans;
    }
    function workMinutesBetween(t0, t1, schedule = DEFAULT_SCHEDULE) {
      return workSpans(t0, t1, schedule).reduce((sum, [s, e]) => sum + (e - s) / MIN, 0);
    }
    function workMinutesPerDay(schedule = DEFAULT_SCHEDULE) {
      return dayIntervals(schedule).reduce((s, [a, b]) => s + (b - a), 0);
    }
    function windowUsable(window, schedule = DEFAULT_SCHEDULE) {
      if (!window) return false;
      const a = toMin(window[0]);
      const b = toMin(window[1]);
      return dayIntervals(schedule).some(([s, e]) => Math.min(b, e) - Math.max(a, s) >= 15);
    }
    function inWindow(ms, window) {
      const m = minuteOfDay(ms);
      return m >= toMin(window[0]) && m < toMin(window[1]);
    }
    function describeNow(ms, schedule = DEFAULT_SCHEDULE) {
      const working = isWorkTime(ms, schedule);
      const isWorkday = schedule.workdays.includes(CL.parts(ms).dow);
      const m = minuteOfDay(ms);
      const ints = dayIntervals(schedule);
      if (working) {
        const cur = ints.find(([a, b]) => m >= a && m < b);
        return { working, label: "Gi\u1EDD l\xE0m", detail: `c\xF2n ${fmtDuration(cur[1] - m)}` };
      }
      if (isWorkday && ints.length && m >= ints[0][0] && m < ints[ints.length - 1][1]) {
        return { working, label: "Ngh\u1EC9 tr\u01B0a", detail: "v\u01B0\u1EDDn t\u1EA1m ngh\u1EC9" };
      }
      return { working, label: "Ngo\xE0i gi\u1EDD", detail: "v\u01B0\u1EDDn \u0111ang ng\u1EE7" };
    }
    function fmtDuration(min) {
      min = Math.max(0, Math.round(min));
      const h = Math.floor(min / 60);
      const m = min % 60;
      if (h && m) return `${h}g${String(m).padStart(2, "0")}`;
      if (h) return `${h} gi\u1EDD`;
      return `${m} ph\xFAt`;
    }
    module.exports = {
      DEFAULT_SCHEDULE,
      MIN,
      toMin,
      fmtMin,
      fmtDuration,
      dayIntervals,
      isWorkTime,
      workSpans,
      workMinutesBetween,
      workMinutesPerDay,
      windowUsable,
      inWindow,
      describeNow
    };
  }
});

// src/core/decor.js
var require_decor = __commonJS({
  "src/core/decor.js"(exports, module) {
    "use strict";
    var POT_SLOTS = ["soil", "front", "left", "right"];
    var SLOT_NAMES = { soil: "M\u1EB7t \u0111\u1EA5t", front: "M\u1EB7t ch\u1EADu", left: "C\u1EA1nh tr\xE1i", right: "C\u1EA1nh ph\u1EA3i" };
    var POT_DECOR = [
      // trên mặt đất
      { id: "soi_trang", name: "S\u1ECFi tr\u1EAFng", place: "soil", tier: 0, price: 40, level: 1, fx: { water: 0.05 }, desc: "+5% gi\u1EEF \u1EA9m." },
      { id: "reu_xanh", name: "Th\u1EA3m r\xEAu", place: "soil", tier: 0, price: 70, level: 2, fx: { water: 0.08 }, desc: "+8% gi\u1EEF \u1EA9m." },
      { id: "nam_nho", name: "N\u1EA5m t\xED hon", place: "soil", tier: 1, price: 90, level: 3, fx: { growth: 0.05 }, desc: "+5% l\u1EDBn nhanh." },
      { id: "chu_lun", name: "Ch\xFA l\xF9n g\u1ED1m", place: "soil", tier: 2, price: 260, level: 5, fx: { sell: 0.08 }, desc: "+8% ti\u1EC1n." },
      // mặt chậu
      { id: "no_do", name: "N\u01A1 \u0111\u1ECF", place: "front", tier: 0, price: 50, level: 1, fx: { exp: 0.03 }, desc: "+3% EXP." },
      { id: "the_ten", name: "Th\u1EBB t\xEAn g\u1ED7", place: "front", tier: 0, price: 80, level: 2, fx: { exp: 0.05 }, desc: "+5% EXP." },
      { id: "day_den", name: "D\xE2y \u0111\xE8n mini", place: "front", tier: 1, price: 180, level: 4, fx: { exp: 0.05, sell: 0.03 }, desc: "+5% EXP, +3% ti\u1EC1n." },
      { id: "huy_hieu", name: "Huy hi\u1EC7u v\xE0ng", place: "front", tier: 2, price: 420, level: 7, fx: { sell: 0.1 }, desc: "+10% ti\u1EC1n." },
      // cắm cạnh chậu (trái hoặc phải)
      { id: "chong_chong", name: "Chong ch\xF3ng", place: "side", tier: 0, price: 90, level: 2, fx: { water: 0.05 }, desc: "+5% gi\u1EEF \u1EA9m." },
      { id: "den_cam", name: "\u0110\xE8n c\u1EAFm v\u01B0\u1EDDn", place: "side", tier: 1, price: 130, level: 3, fx: { growth: 0.05 }, desc: "+5% l\u1EDBn nhanh." },
      { id: "chuong_gio", name: "Chu\xF4ng gi\xF3", place: "side", tier: 1, price: 150, level: 3, fx: { water: 0.08 }, desc: "+8% gi\u1EEF \u1EA9m." },
      { id: "buom_que", name: "B\u01B0\u1EDBm c\u1EAFm que", place: "side", tier: 1, price: 160, level: 4, fx: { exp: 0.06 }, desc: "+6% EXP." },
      { id: "bu_nhin", name: "B\xF9 nh\xECn mini", place: "side", tier: 2, price: 260, level: 5, fx: { guard: 0.2 }, desc: "Ch\u1EB7n 20% h\xE1i tr\u1ED9m \xF4 n\xE0y." },
      { id: "ca_chep", name: "\u0110\xE8n c\xE1 ch\xE9p", place: "side", tier: 4, wheel: true, price: 500, level: 1, fx: { sell: 0.1, water: 0.1 }, desc: "+10% ti\u1EC1n, +10% gi\u1EEF \u1EA9m." },
      { id: "ngoi_sao", name: "Que sao b\u0103ng", place: "side", tier: 5, wheel: true, price: 900, level: 1, fx: { exp: 0.15, growth: 0.1, guard: 0.1 }, desc: "+15% EXP, l\u1EDBn nhanh +10%, ch\u1EB7n 10% tr\u1ED9m." },
      { id: "tuong_than_moc", name: "T\u01B0\u1EE3ng Th\u1EA7n m\u1ED9c", place: "soil", tier: 5, trophy: true, price: 0, level: 1, fx: { growth: 0.12, exp: 0.12, water: 0.1 }, desc: "\u{1F3C6} Ch\u1EC9 d\xE0nh cho ng\u01B0\u1EDDi \u0111\xF3ng g\xF3p nhi\u1EC1u nh\u1EA5t khi Th\u1EA7n m\u1ED9c k\u1EBFt tr\xE1i: l\u1EDBn nhanh +12%, +12% EXP, gi\u1EEF \u1EA9m +10%." },
      { id: "rong_vang", name: "T\u01B0\u1EE3ng r\u1ED3ng v\xE0ng", place: "soil", tier: 6, wheel: true, price: 1600, level: 1, fx: { sell: 0.2, exp: 0.15, guard: 0.2 }, desc: "B\xED \u1EA9n: +20% ti\u1EC1n, +15% EXP, ch\u1EB7n 20% tr\u1ED9m." },
      { id: "hang_rao_trang", name: "H\xE0ng r\xE0o tr\u1EAFng mini", place: "side", tier: 1, wheel: true, price: 70, level: 1, fx: { guard: 0.05, water: 0.03 }, desc: "Ch\u1EB7n 5% tr\u1ED9m, +3% gi\u1EEF \u1EA9m." },
      { id: "den_hoi_an", name: "\u0110\xE8n l\u1ED3ng H\u1ED9i An", place: "side", tier: 3, wheel: true, price: 300, level: 1, fx: { exp: 0.08, sell: 0.05 }, desc: "+8% EXP, +5% ti\u1EC1n." },
      { id: "hoa_dang", name: "Hoa \u0111\u0103ng", place: "soil", tier: 5, wheel: true, price: 950, level: 1, fx: { exp: 0.12, growth: 0.12, water: 0.1 }, desc: "+12% EXP, l\u1EDBn nhanh +12%, gi\u1EEF \u1EA9m +10%." },
      { id: "meo_su", name: "M\xE8o s\u1EE9 v\u1EABy tay", place: "side", tier: 3, wheel: true, price: 380, level: 1, fx: { guard: 0.15, sell: 0.05 }, desc: "Ch\u1EB7n 15% h\xE1i tr\u1ED9m, +5% ti\u1EC1n." }
    ];
    var HOUSE_LEVELS = [
      { level: 1, name: "H\u1ED9p c\xE1c-t\xF4ng", price: 0, sleepMin: 30, desc: "Nh\xE0 \u0111\u1EA7u ti\xEAn c\u1EE7a pet." },
      { level: 2, name: "Nh\xE0 g\u1ED7", price: 800, sleepMin: 25, desc: "Pet ng\u1EE7 25 ph\xFAt sau khi ch\u1EB7n tr\u1ED9m." },
      { level: 3, name: "Nh\xE0 m\xE1i ng\xF3i \u0111\u1ECF", price: 3e3, sleepMin: 20, desc: "Pet ng\u1EE7 20 ph\xFAt sau khi ch\u1EB7n tr\u1ED9m." },
      { level: 4, name: "L\xE2u \u0111\xE0i mini", price: 1e4, sleepMin: 15, desc: "Pet ch\u1EC9 ng\u1EE7 15 ph\xFAt sau khi ch\u1EB7n tr\u1ED9m." }
    ];
    var HOUSE_SLOTS = ["roof", "window", "side", "front"];
    var HOUSE_SLOT_NAMES = { roof: "M\xE1i", window: "C\u1EEDa s\u1ED5", side: "B\xEAn c\u1EA1nh", front: "Tr\u01B0\u1EDBc c\u1EEDa" };
    var HOUSE_DECOR = [
      { id: "co_do", name: "C\u1EDD \u0111u\xF4i nheo \u0111\u1ECF", place: "roof", tier: 0, price: 100, desc: "Ph\u1EA5p ph\u1EDBi tr\xEAn m\xE1i." },
      { id: "co_sao", name: "C\u1EDD sao v\xE0ng", place: "roof", tier: 1, price: 180, desc: "C\u1EDD v\xE0ng c\xF3 ng\xF4i sao." },
      { id: "hop_hoa", name: "H\u1ED9p hoa c\u1EEDa s\u1ED5", place: "window", tier: 1, price: 150, desc: "Hoa nh\u1ECF b\xEAn c\u1EEDa s\u1ED5." },
      { id: "rem_ke", name: "R\xE8m k\u1EBB caro", place: "window", tier: 0, price: 120, desc: "R\xE8m c\u1EEDa xinh x\u1EAFn." },
      { id: "den_long_nha", name: "\u0110\xE8n l\u1ED3ng", place: "side", tier: 2, price: 160, desc: "\u0110\xE8n l\u1ED3ng \u0111\u1ECF \u0111ung \u0111\u01B0a." },
      { id: "cay_bui", name: "B\u1EE5i c\xE2y tr\xF2n", place: "side", tier: 0, price: 110, desc: "B\u1EE5i c\xE2y c\u1EAFt t\u1EC9a tr\xF2n." },
      { id: "bat_an", name: "B\xE1t \u0103n", place: "front", tier: 0, price: 60, desc: "B\xE1t \u0111\u1ED3 \u0103n cho pet." },
      { id: "tham_cua", name: "Th\u1EA3m ch\xF9i ch\xE2n", place: "front", tier: 1, price: 90, desc: "Th\u1EA3m h\u1ED3ng tr\u01B0\u1EDBc c\u1EEDa." }
    ];
    var SCENE_OBJECTS = [
      { id: "vuon_buom", name: "C\xF4ng vi\xEAn b\u01B0\u1EDBm", tier: 0, price: 420, level: 1, desc: "B\u01B0\u1EDBm bay quanh l\u1ED1i d\u1EA1o hoa." },
      { id: "ho_ca_may", name: "H\u1ED3 c\xE1 tr\xEAn m\xE2y", tier: 1, price: 760, level: 3, desc: "C\xE1 nh\u1ECF b\u01A1i gi\u1EEFa c\xE1c \u0111\xE1m m\xE2y." },
      { id: "du_quay_keo", name: "\u0110u quay k\u1EB9o ng\u1ECDt", tier: 2, price: 1350, level: 6, desc: "\u0110u quay t\xED hon xoay b\xEAn nh\xE0 th\xFA." },
      { id: "thap_dong_ho", name: "Th\xE1p \u0111\u1ED3ng h\u1ED3 hoa", tier: 2, price: 1850, level: 8, desc: "Kim \u0111\u1ED3ng h\u1ED3 quay tr\xEAn th\xE1p hoa." },
      { id: "cong_cau_vong", name: "C\u1ED5ng c\u1EA7u v\u1ED3ng", tier: 3, price: 2400, level: 10, desc: "C\u1EA7u v\u1ED3ng v\xE0 sao l\u1EA5p l\xE1nh." },
      { id: "banh_xe_sao", name: "V\xF2ng quay ng\xF4i sao", tier: 3, wheel: true, price: 3e3, level: 1, desc: "V\xF2ng quay r\u1EF1c s\xE1ng ch\u1EC9 c\xF3 t\u1EEB v\xF2ng quay may m\u1EAFn." },
      { id: "cay_uoc_nguyen", name: "C\xE2y \u01B0\u1EDBc nguy\u1EC7n", tier: 4, wheel: true, price: 5200, level: 1, desc: "Nh\u1EEFng \u0111i\u1EC1u \u01B0\u1EDBc bay l\xEAn nh\u01B0 \u0111om \u0111\xF3m." },
      { id: "hanh_tinh_ti_hon", name: "H\xE0nh tinh t\xED hon", tier: 5, wheel: true, price: 8500, level: 1, desc: "M\u1ED9t th\u1EBF gi\u1EDBi nh\u1ECF \u0111ang xoay trong v\u01B0\u1EDDn." }
    ];
    var BACKGROUNDS = [
      { id: "chieu_hoa_anh_dao", name: "Chi\u1EC1u hoa anh \u0111\xE0o", tier: 0, price: 360, level: 1, desc: "C\xE1nh hoa bay qua b\u1EA7u tr\u1EDDi h\u1ED3ng." },
      { id: "le_hoi_den_long", name: "L\u1EC5 h\u1ED9i \u0111\xE8n l\u1ED3ng", tier: 1, price: 720, level: 3, desc: "\u0110\xE8n \u1EA5m \xE1p tr\xF4i l\xEAn trong \u0111\xEAm." },
      { id: "bien_may", name: "Bi\u1EC3n m\xE2y xanh", tier: 2, price: 1200, level: 5, desc: "Nh\u1EEFng l\u1EDBp m\xE2y tr\xF4i ch\u1EA7m ch\u1EADm." },
      { id: "vuon_keo_ngot", name: "V\u01B0\u1EDDn k\u1EB9o ng\u1ECDt", tier: 2, price: 1650, level: 7, desc: "M\xE2y b\xF4ng m\xE0u k\u1EB9o v\xE0 n\u1EAFng m\u1EADt ong." },
      { id: "cuc_quang", name: "\u0110\xEAm c\u1EF1c quang", tier: 3, wheel: true, price: 2800, level: 1, desc: "D\u1EA3i s\xE1ng \u0111\u1ED5i m\xE0u gi\u1EEFa tr\u1EDDi sao." },
      { id: "ngan_ha_hoa", name: "Ng\xE2n h\xE0 hoa", tier: 4, wheel: true, price: 4900, level: 1, desc: "Tinh v\xE2n t\xEDm v\xE0 sao r\u01A1i." },
      { id: "lau_dai_tren_may", name: "L\xE2u \u0111\xE0i tr\xEAn m\xE2y", tier: 5, wheel: true, price: 7600, level: 1, desc: "Th\xE1p m\xE2y xa xa hi\u1EC7n ra trong \xE1nh b\xECnh minh." }
    ];
    var byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
    module.exports = {
      POT_SLOTS,
      SLOT_NAMES,
      POT_DECOR,
      POT_DECOR_BY_ID: byId(POT_DECOR),
      HOUSE_LEVELS,
      HOUSE_SLOTS,
      HOUSE_SLOT_NAMES,
      HOUSE_DECOR,
      HOUSE_DECOR_BY_ID: byId(HOUSE_DECOR),
      SCENE_OBJECTS,
      SCENE_OBJECTS_BY_ID: byId(SCENE_OBJECTS),
      BACKGROUNDS,
      BACKGROUNDS_BY_ID: byId(BACKGROUNDS)
    };
  }
});

// src/core/garden.js
var require_garden = __commonJS({
  "src/core/garden.js"(exports, module) {
    "use strict";
    var MG = require_minigames();
    var C = require_catalog();
    var S = require_schedule();
    var D = require_decor();
    var CL = require_clock();
    var STATE_VERSION = 1;
    var LOG_MAX = 120;
    function createState(now = Date.now()) {
      return {
        version: STATE_VERSION,
        simTime: now,
        money: C.RULES.startMoney,
        exp: 0,
        level: 1,
        slots: Array.from({ length: C.RULES.startSlots }, () => ({ pot: "nhua", plant: null, decor: [null, null, null, null] })),
        house: { level: 1, decor: { roof: null, window: null, side: null, front: null } },
        scene: { object: null, background: null },
        inventory: { pots: {}, decor: {}, houseDecor: {}, sceneObjects: {}, backgrounds: {}, items: { phan_bon: 3 }, powers: { cu_huc: 1 }, fish: {}, seeds: { ...C.RULES.starterSeeds } },
        unlocked: { species: C.SPECIES.filter((x) => !x.unlock && !x.wheel).map((x) => x.id), pots: ["nhua"], decor: [], pets: [], sceneObjects: [], backgrounds: [] },
        wheel: { spins: 0, pityEpic: 0, pityLeg: 0, freeDay: null, history: [], pending: null },
        daily: { last: null, streak: 0 },
        pets: { owned: [], active: null, status: {} },
        // status[id] = { sleepUntil, blocks }
        arena: { power: "cu_huc", wins: 0, losses: 0 },
        // Đấu trường thú (nhóm Supabase)
        minigames: { day: null, plays: {}, pending: null, best: {} },
        // Bắt sâu, Ghép cặp, Câu cá (src/core/minigames.js)
        unlocks: {},
        stats: { harvested: 0, watered: 0, earned: 0, stolenFromMe: 0 },
        log: [],
        settings: defaultSettings()
      };
    }
    function defaultSettings() {
      return {
        ownerName: "",
        schedule: JSON.parse(JSON.stringify(S.DEFAULT_SCHEDULE)),
        position: "bottom",
        // bottom | top
        barWidth: "full",
        // full | compact
        alwaysOnTop: true,
        notify: true,
        autoStart: false,
        usePacks: true,
        petTalk: true,
        talkRate: "vua",
        // it | vua | nhieu
        music: false,
        // nhạc nền (mặc định tắt vì dùng ở văn phòng)
        sfx: true,
        volume: 50
      };
    }
    function migrate(raw, now = Date.now()) {
      const base = createState(now);
      if (!raw || typeof raw !== "object") return base;
      const st = { ...base, ...raw };
      st.settings = { ...base.settings, ...raw.settings || {} };
      st.settings.schedule = { ...base.settings.schedule, ...(raw.settings || {}).schedule || {} };
      st.inventory = { ...base.inventory, ...raw.inventory || {} };
      for (const k of ["pots", "decor", "houseDecor", "sceneObjects", "backgrounds", "items", "seeds", "powers", "fish"]) st.inventory[k] = { ...st.inventory[k] || {} };
      st.inventory.powers.cu_huc = 1;
      st.arena = { ...base.arena, ...raw.arena || {} };
      if (!st.inventory.powers[st.arena.power]) st.arena.power = "cu_huc";
      st.scene = { ...base.scene, ...raw.scene || {} };
      if (!D.SCENE_OBJECTS_BY_ID[st.scene.object] || !st.inventory.sceneObjects[st.scene.object]) st.scene.object = null;
      if (!D.BACKGROUNDS_BY_ID[st.scene.background] || !st.inventory.backgrounds[st.scene.background]) st.scene.background = null;
      if (Array.isArray(raw.decor)) {
        const OLD = { hang_rao: 60, den_long: 150, chuong_gio: 140, ech_gom: 260, ghe_da: 200, meo_ngu: 320, bu_nhin: 420, dai_phun: 850 };
        let refund = 0;
        raw.decor.forEach((id) => {
          if (id && OLD[id]) refund += OLD[id];
        });
        Object.entries((raw.inventory || {}).decor || {}).forEach(([id, n]) => {
          if (OLD[id]) refund += OLD[id] * n;
        });
        st.inventory.decor = {};
        if (refund) {
          st.money += refund;
          st.log.unshift({ at: now, type: "refund", text: `Trang tr\xED \u0111\xE3 \u0111\u1ED5i sang ki\u1EC3u theo t\u1EEBng ch\u1EADu: ho\xE0n ${refund} xu cho \u0111\u1ED3 trang tr\xED c\u0169.` });
        }
      }
      delete st.decor;
      st.slots = st.slots.map((x) => ({ ...x, decor: Array.isArray(x.decor) && x.decor.length === 4 ? x.decor : [null, null, null, null] }));
      st.house = { level: 1, ...raw.house || {} };
      st.house.decor = { roof: null, window: null, side: null, front: null, ...(raw.house || {}).decor || {} };
      if (!raw.unlocked) {
        const used = new Set(st.slots.map((x) => x.plant && x.plant.species).filter(Boolean));
        st.unlocked = {
          species: C.SPECIES.filter((x) => !x.unlock || used.has(x.id)).map((x) => x.id),
          pots: ["nhua", ...new Set([...Object.keys(st.inventory.pots), ...st.slots.map((x) => x.pot)].filter((x) => x !== "nhua"))]
        };
        if (!raw.inventory || !raw.inventory.seeds) st.inventory.seeds = { ...C.RULES.starterSeeds };
      }
      st.unlocked = {
        species: [...st.unlocked.species || []],
        pots: [...st.unlocked.pots || ["nhua"]],
        decor: [...st.unlocked.decor || []],
        pets: [...st.unlocked.pets || []],
        sceneObjects: [...st.unlocked.sceneObjects || []],
        backgrounds: [...st.unlocked.backgrounds || []]
      };
      for (const id of Object.keys(st.inventory.decor)) if (D.POT_DECOR_BY_ID[id] && D.POT_DECOR_BY_ID[id].wheel && !st.unlocked.decor.includes(id)) st.unlocked.decor.push(id);
      for (const sl of st.slots) for (const id of sl.decor || []) if (id && D.POT_DECOR_BY_ID[id] && D.POT_DECOR_BY_ID[id].wheel && !st.unlocked.decor.includes(id)) st.unlocked.decor.push(id);
      for (const id of st.pets && st.pets.owned || []) if (!st.unlocked.pets.includes(id)) st.unlocked.pets.push(id);
      st.wheel = { spins: 0, pityEpic: 0, pityLeg: 0, freeDay: null, history: [], pending: null, ...raw.wheel || {} };
      st.daily = { last: null, streak: 0, ...raw.daily || {} };
      st.stats = { ...base.stats, ...raw.stats || {} };
      st.pets = { ...base.pets, ...raw.pets || {} };
      if (!Array.isArray(st.pets.owned)) st.pets.owned = [];
      st.pets.status = { ...st.pets.status || {} };
      if (!Array.isArray(st.slots) || !st.slots.length) st.slots = base.slots;
      if (!Array.isArray(st.log)) st.log = [];
      if (typeof st.simTime !== "number" || st.simTime > now) st.simTime = now;
      st.version = STATE_VERSION;
      return st;
    }
    function decorFx() {
      return {};
    }
    function potOf(slot) {
      return C.POTS_BY_ID[slot.pot] || C.POTS_BY_ID.nhua;
    }
    function mods(slot) {
      const pot = potOf(slot);
      const m = { water: pot.water, growth: pot.growth || 0, sell: pot.sell || 0, exp: pot.exp || 0, guard: 0 };
      let dw = 0;
      for (const id of slot.decor || []) {
        const d = id && D.POT_DECOR_BY_ID[id];
        if (!d) continue;
        dw += d.fx.water || 0;
        m.growth += d.fx.growth || 0;
        m.sell += d.fx.sell || 0;
        m.exp += d.fx.exp || 0;
        m.guard += d.fx.guard || 0;
      }
      m.water *= 1 + dw;
      m.guard = Math.min(0.6, m.guard);
      return m;
    }
    function drainPerMin(species, m) {
      return 100 / (species.waterMinutes * m.water);
    }
    function growthMult(plant, m) {
      return 1 + (m.growth || 0);
    }
    function hasWindow(species, schedule) {
      return S.windowUsable(species.window, schedule);
    }
    function log(state, type, text, extra = {}) {
      state.log.unshift({ at: Date.now(), type, text, ...extra });
      if (state.log.length > LOG_MAX) state.log.length = LOG_MAX;
    }
    function stepPlant(state, idx, t, fx, offline) {
      const slot = state.slots[idx];
      const p = slot.plant;
      if (!p || p.dead) return null;
      if (p.bloomed) {
        p.faded = false;
        p.water = Math.max(p.water, C.RULES.thirstyAt);
        return null;
      }
      const sp = C.SPECIES_BY_ID[p.species];
      const m = mods(slot);
      const schedule = state.settings.schedule;
      let ev = null;
      const before = p.water;
      p.water = Math.max(0, p.water - drainPerMin(sp, m));
      if (before >= C.RULES.thirstyAt && p.water < C.RULES.thirstyAt) ev = "thirsty";
      if (p.water <= 0) {
        const floor = offline ? C.RULES.offlineMinHealth : 0;
        p.health = Math.max(Math.min(p.health, floor), p.health - C.RULES.dryHealthLossPerMin);
        if (p.health <= 0) {
          p.dead = true;
          return "dead";
        }
      }
      if (p.old) return ev;
      let g = growthMult(p, m);
      if (p.water <= 0) g = 0;
      else if (p.water < C.RULES.thirstyAt) g *= 0.5;
      const windowed = hasWindow(sp, schedule);
      if (!p.bloomed) {
        p.progress = Math.min(1, p.progress + g / sp.bloomMinutes);
        p.waiting = false;
        if (p.progress >= 1) {
          if (!windowed || S.inWindow(t, sp.window)) {
            p.bloomed = true;
            p.faded = false;
            p.bloomAge = 0;
            ev = "bloom";
          } else {
            p.waiting = true;
          }
        }
      }
      return ev;
    }
    function advance(state, now = Date.now(), opts = {}) {
      const offline = opts.offline ?? now - state.simTime > C.RULES.offlineGapMs;
      const events = [];
      const schedule = state.settings.schedule;
      const fx = decorFx(state);
      let cursor = state.simTime;
      for (const [s, e] of S.workSpans(state.simTime, now, schedule)) {
        let t = Math.max(s, cursor);
        while (t + S.MIN <= e) {
          for (let i = 0; i < state.slots.length; i++) {
            const type = stepPlant(state, i, t, fx, offline);
            if (type) events.push({ type, slot: i, species: state.slots[i].plant.species, at: t });
          }
          t += S.MIN;
        }
        cursor = e >= now ? t : e;
      }
      state.simTime = Math.max(cursor, Math.min(now, state.simTime));
      if (!S.workSpans(state.simTime, now, schedule).length) state.simTime = now;
      for (const ev of events) {
        const name = C.SPECIES_BY_ID[ev.species].name;
        if (ev.type === "bloom") log(state, "bloom", `${name} (\xF4 ${ev.slot + 1}) \u0111\xE3 n\u1EDF!`);
        if (ev.type === "dead") log(state, "dead", `${name} (\xF4 ${ev.slot + 1}) \u0111\xE3 ch\u1EBFt v\xEC thi\u1EBFu n\u01B0\u1EDBc.`);
        if (ev.type === "faded") log(state, "faded", `${name} (\xF4 ${ev.slot + 1}) \u0111\xE3 t\xE0n, thu ho\u1EA1ch s\u1EBD \xEDt ti\u1EC1n h\u01A1n.`);
      }
      return events;
    }
    function fastForward(state, minutes, now = Date.now(), opts = {}) {
      const fx = decorFx(state);
      const events = [];
      const n = Math.max(0, Math.min(60 * 24 * 7, Math.round(minutes)));
      for (let m = 0; m < n; m++) {
        for (let i = 0; i < state.slots.length; i++) {
          const p = state.slots[i].plant;
          if (opts.ignoreWindows && p && p.progress >= 1 && !p.bloomed && !p.dead) {
            p.bloomed = true;
            p.bloomAge = 0;
            p.waiting = false;
            events.push({ type: "bloom", slot: i, species: p.species, at: now });
            continue;
          }
          const type = stepPlant(state, i, now, fx, false);
          if (type) events.push({ type, slot: i, species: state.slots[i].plant.species, at: now });
        }
      }
      log(state, "admin", `[Admin] Tua nhanh ${n} ph\xFAt v\u01B0\u1EDDn.`);
      return events;
    }
    var ADMIN = {
      money(state, a) {
        const n = Math.round(Number(a.amount) || 0);
        state.money = Math.max(0, state.money + n);
        return `${n >= 0 ? "+" : ""}${n} xu`;
      },
      exp(state, a) {
        const n = Math.round(Number(a.amount) || 0);
        if (n >= 0) {
          gainExp(state, n);
          return `+${n} EXP (c\u1EA5p ${state.level})`;
        }
        let left = -n;
        while (left > 0) {
          if (state.exp >= left) {
            state.exp -= left;
            left = 0;
          } else if (state.level > 1) {
            left -= state.exp + 1;
            state.level -= 1;
            state.exp = C.expToNext(state.level) - 1;
          } else {
            state.exp = 0;
            left = 0;
          }
        }
        return `${n} EXP (c\u1EA5p ${state.level})`;
      },
      level(state, a) {
        state.level = Math.max(1, Math.min(99, state.level + (Number(a.amount) || 1)));
        state.exp = 0;
        return `C\u1EA5p ${state.level}`;
      },
      forward(state, a) {
        const ev = fastForward(state, Number(a.minutes) || 0, Date.now());
        return `\u0110\xE3 tua ${a.minutes} ph\xFAt (${ev.length} s\u1EF1 ki\u1EC7n).`;
      },
      bloomAll(state) {
        let n = 0;
        state.slots.forEach((sl) => {
          const p = sl.plant;
          if (p && !p.dead && !p.bloomed && !p.old) {
            p.progress = 1;
            p.bloomed = true;
            p.faded = false;
            p.bloomAge = 0;
            p.waiting = false;
            n++;
          }
        });
        return `\u0110\xE3 cho ${n} c\xE2y n\u1EDF.`;
      },
      thirstAll(state) {
        state.slots.forEach((sl) => {
          if (sl.plant && !sl.plant.dead) sl.plant.water = 10;
        });
        return "T\u1EA5t c\u1EA3 c\xE2y \u0111ang kh\xE1t.";
      },
      wakePet(state) {
        Object.values(state.pets.status).forEach((st) => {
          st.sleepUntil = 0;
        });
        return "\u0110\xE3 \u0111\xE1nh th\u1EE9c pet.";
      },
      resetGames(state) {
        const mg = state.minigames || (state.minigames = { day: null, plays: {}, pending: null, best: {} });
        mg.plays = {};
        return "\u0110\xE3 \u0111\u1EB7t l\u1EA1i l\u01B0\u1EE3t ch\u01A1i mini game h\xF4m nay.";
      },
      freeSpin(state) {
        state.wheel.freeDay = null;
        return "C\xF3 th\xEAm 1 l\u01B0\u1EE3t quay mi\u1EC5n ph\xED.";
      },
      resetDaily(state) {
        state.daily.last = null;
        return "C\xF3 th\u1EC3 m\u1EDF qu\xE0 h\u1EB1ng ng\xE0y l\u1EA1i.";
      },
      seeds(state) {
        state.unlocked.species.forEach((id) => {
          state.inventory.seeds[id] = (state.inventory.seeds[id] || 0) + 5;
        });
        return "+5 h\u1EA1t m\u1ED7i gi\u1ED1ng \u0111\xE3 m\u1EDF kho\xE1.";
      },
      unlockAll(state) {
        state.unlocked.species = C.SPECIES.map((x) => x.id);
        state.unlocked.pots = C.POTS.map((x) => x.id);
        return "\u0110\xE3 m\u1EDF kho\xE1 t\u1EA5t c\u1EA3 gi\u1ED1ng v\xE0 ch\u1EADu.";
      },
      fert(state) {
        state.inventory.items.phan_bon = (state.inventory.items.phan_bon || 0) + 10;
        return "+10 ph\xE2n b\xF3n.";
      },
      steal(state) {
        const i = state.slots.findIndex((sl) => sl.plant && sl.plant.bloomed && !sl.plant.faded && !sl.plant.dead);
        if (i < 0) return "Kh\xF4ng c\xF3 hoa n\u1EDF \u0111\u1EC3 th\u1EED h\xE1i tr\u1ED9m.";
        return `Kh\xE1ch test h\xE1i tr\u1ED9m \xF4 ${i + 1}: ${visitSteal(state, i, "Kh\xE1ch test").msg}`;
      }
    };
    function admin(state, a) {
      const fn = ADMIN[a.op];
      if (!fn) return fail("L\u1EC7nh admin kh\xF4ng h\u1EE3p l\u1EC7.");
      return okr(fn(state, a));
    }
    var fail = (msg, extra = {}) => ({ ok: false, msg, ...extra });
    var okr = (msg, extra = {}) => ({ ok: true, msg, ...extra });
    function getSlot(state, idx) {
      return Number.isInteger(idx) && idx >= 0 && idx < state.slots.length ? state.slots[idx] : null;
    }
    function plantSeed(state, idx, speciesId, now = Date.now()) {
      const slot = getSlot(state, idx);
      const sp = C.SPECIES_BY_ID[speciesId];
      if (!slot || !sp) return fail("Kh\xF4ng t\xECm th\u1EA5y \xF4 ho\u1EB7c lo\xE0i c\xE2y.");
      if (slot.plant) return fail("\xD4 n\xE0y \u0111\xE3 c\xF3 c\xE2y.");
      if (!((state.inventory.seeds[sp.id] || 0) > 0)) return fail(`H\u1EBFt h\u1EA1t ${sp.name} \u2013 mua th\xEAm trong c\u1EEDa h\xE0ng.`);
      state.inventory.seeds[sp.id] -= 1;
      slot.plant = {
        species: sp.id,
        progress: 0,
        water: 100,
        health: 100,
        bloomed: false,
        faded: false,
        waiting: false,
        bloomAge: 0,
        fert: 0,
        harvests: 0,
        old: false,
        dead: false,
        plantedAt: now,
        theft: [],
        visitors: []
      };
      log(state, "plant", `Gieo ${sp.name} v\xE0o \xF4 ${idx + 1}.`);
      const lv = gainExp(state, C.RULES.plantExp);
      return okr(`\u0110\xE3 gieo ${sp.name}: +${C.RULES.plantExp} EXP`, { exp: C.RULES.plantExp, levelUp: lv });
    }
    function water(state, idx, by = null) {
      const slot = getSlot(state, idx);
      const p = slot && slot.plant;
      if (!p) return fail("\xD4 tr\u1ED1ng, ch\u01B0a c\xF3 c\xE2y \u0111\u1EC3 t\u01B0\u1EDBi.");
      if (p.dead) return fail("C\xE2y \u0111\xE3 ch\u1EBFt, h\xE3y nh\u1ED5 \u0111i.");
      if (p.bloomed) return fail("Hoa \u0111\xE3 n\u1EDF, kh\xF4ng c\u1EA7n t\u01B0\u1EDBi n\u1EEFa \u2013 thu ho\u1EA1ch th\xF4i!");
      if (p.water > C.RULES.waterBlockAbove) return fail("\u0110\u1EA5t c\xF2n \u1EA9m, ch\u01B0a c\u1EA7n t\u01B0\u1EDBi.");
      const dry = p.water < C.RULES.waterExpBelow;
      p.water = 100;
      if (by) {
        p.visitors.unshift({ by, at: Date.now(), type: "water" });
        p.visitors.length = Math.min(p.visitors.length, 10);
        log(state, "visit_water", `${by} \u0111\xE3 t\u01B0\u1EDBi h\u1ED9 ${C.SPECIES_BY_ID[p.species].name} (\xF4 ${idx + 1}).`);
        return okr("\u0110\xE3 t\u01B0\u1EDBi h\u1ED9.");
      }
      state.stats.watered += 1;
      if (!dry) return okr("\u0110\xE3 t\u01B0\u1EDBi n\u01B0\u1EDBc (\u0111\u1EA5t c\xF2n kh\xE1 \u1EA9m n\xEAn kh\xF4ng c\xF3 EXP).");
      const lv = gainExp(state, C.RULES.waterExp);
      return okr(`\u0110\xE3 t\u01B0\u1EDBi n\u01B0\u1EDBc: +${C.RULES.waterExp} EXP`, { exp: C.RULES.waterExp, levelUp: lv });
    }
    function waterAll(state) {
      if (!state.unlocks.binh_lon) return fail('C\u1EA7n mua "B\xECnh t\u01B0\u1EDBi l\u1EDBn" trong c\u1EEDa h\xE0ng.');
      let n = 0;
      state.slots.forEach((s, i) => {
        if (water(state, i).ok) n++;
      });
      return n ? okr(`\u0110\xE3 t\u01B0\u1EDBi ${n} c\xE2y.`) : fail("Kh\xF4ng c\xF3 c\xE2y n\xE0o c\u1EA7n t\u01B0\u1EDBi.");
    }
    function harvestValue(state, slot) {
      const p = slot.plant;
      const sp = C.SPECIES_BY_ID[p.species];
      const m = mods(slot);
      let k = p.faded ? C.RULES.fadedValue : 1;
      if (p.health < 50) k *= 0.7;
      return {
        money: Math.round(sp.sell * k * (1 + m.sell)),
        exp: Math.round(sp.exp * k * (1 + m.exp))
      };
    }
    function afterPick(slot) {
      const p = slot.plant;
      const sp = C.SPECIES_BY_ID[p.species];
      p.harvests += 1;
      if (!sp.regrow) {
        slot.plant = null;
        return;
      }
      p.bloomed = false;
      p.faded = false;
      p.bloomAge = 0;
      p.waiting = false;
      if (p.harvests >= sp.regrow.harvests) {
        p.old = true;
        p.progress = 0.7;
      } else {
        p.progress = Math.max(0, 1 - sp.regrow.minutes / sp.bloomMinutes);
      }
    }
    function harvest(state, idx) {
      const slot = getSlot(state, idx);
      const p = slot && slot.plant;
      if (!p) return fail("\xD4 tr\u1ED1ng.");
      if (p.dead) return fail("C\xE2y \u0111\xE3 ch\u1EBFt.");
      if (!p.bloomed) return fail("Hoa ch\u01B0a n\u1EDF.");
      const sp = C.SPECIES_BY_ID[p.species];
      const v = harvestValue(state, slot);
      const wasFaded = p.faded;
      state.money += v.money;
      state.stats.earned += v.money;
      state.stats.harvested += 1;
      afterPick(slot);
      const lv = gainExp(state, v.exp);
      log(state, "harvest", `Thu ho\u1EA1ch ${sp.name}${wasFaded ? " (\u0111\xE3 t\xE0n)" : ""}: +${v.money} xu, +${v.exp} EXP.`);
      return okr(`+${v.money} xu, +${v.exp} EXP`, { ...v, levelUp: lv });
    }
    function fertilize(state, idx, id = "phan_bon") {
      const it = C.ITEMS_BY_ID[id];
      if (!it || !it.fert) return fail("Lo\u1EA1i ph\xE2n b\xF3n kh\xF4ng h\u1EE3p l\u1EC7.");
      const slot = getSlot(state, idx);
      const p = slot && slot.plant;
      if (!p || p.dead) return fail("Kh\xF4ng c\xF3 c\xE2y \u0111\u1EC3 b\xF3n.");
      if (p.bloomed || p.old) return fail("Ch\u1EC9 b\xF3n cho c\xE2y \u0111ang l\u1EDBn.");
      if (p.progress >= 1) return fail("C\xE2y \u0111\xE3 ra n\u1EE5, ch\u1EDD t\u1EDBi gi\u1EDD n\u1EDF \u2013 kh\xF4ng c\u1EA7n b\xF3n n\u1EEFa.");
      if ((state.inventory.items[id] || 0) <= 0) return fail(`H\u1EBFt ${it.name}, mua th\xEAm trong c\u1EEDa h\xE0ng.`);
      const sp = C.SPECIES_BY_ID[p.species];
      const left = (1 - p.progress) * sp.bloomMinutes;
      const cut = Math.min(it.fert, left);
      state.inventory.items[id] -= 1;
      p.progress = Math.min(1, p.progress + it.fert / sp.bloomMinutes);
      const exp = Math.max(1, Math.round(it.fert * C.RULES.fertExpPerMin));
      const lv = gainExp(state, exp);
      log(state, "fert", `B\xF3n ${it.name} cho ${sp.name} (\xF4 ${idx + 1}): n\u1EDF s\u1EDBm h\u01A1n ${Math.ceil(cut)} ph\xFAt.`);
      return okr(`${it.name}: n\u1EDF s\u1EDBm h\u01A1n ${Math.ceil(cut)} ph\xFAt, +${exp} EXP`, { exp, levelUp: lv });
    }
    function removePlant(state, idx) {
      const slot = getSlot(state, idx);
      if (!slot || !slot.plant) return fail("\xD4 tr\u1ED1ng.");
      const name = C.SPECIES_BY_ID[slot.plant.species].name;
      slot.plant = null;
      log(state, "remove", `Nh\u1ED5 ${name} \u1EDF \xF4 ${idx + 1}.`);
      return okr(`\u0110\xE3 nh\u1ED5 ${name}.`);
    }
    function clearTheft(state, idx) {
      const slot = getSlot(state, idx);
      if (!slot) return fail("Kh\xF4ng c\xF3 \xF4.");
      if (slot.theftMark) slot.theftMark = null;
      if (slot.plant) slot.plant.theft = [];
      return okr("\u0110\xE3 d\u1ECDn d\u1EA5u v\u1EBFt.");
    }
    function buy(state, kind, id, qty = 1) {
      const list = { pot: C.POTS_BY_ID, decor: D.POT_DECOR_BY_ID, hdecor: D.HOUSE_DECOR_BY_ID, scene: D.SCENE_OBJECTS_BY_ID, background: D.BACKGROUNDS_BY_ID, item: C.ITEMS_BY_ID, pet: C.PETS_BY_ID, seed: C.SPECIES_BY_ID, power: C.POWERS_BY_ID }[kind];
      const it = list && list[id];
      if (!it) return fail("Kh\xF4ng c\xF3 m\xF3n n\xE0y.");
      if (kind === "seed") return buySeeds(state, id, qty);
      if (kind !== "pet" && kind !== "hdecor" && kind !== "power" && state.level < it.level) return fail(`C\u1EA7n c\u1EA5p ${it.level}.`);
      if (kind === "pot" && !state.unlocked.pots.includes(id)) return fail(`C\u1EA7n m\u1EDF kho\xE1 ${it.name} tr\u01B0\u1EDBc.`);
      if (it.once && state.unlocks[id]) return fail("B\u1EA1n \u0111\xE3 c\xF3 m\xF3n n\xE0y.");
      if (kind === "pet" && state.pets.owned.includes(id)) return fail(`B\u1EA1n \u0111\xE3 c\xF3 ${it.name}.`);
      if (kind === "scene" && state.inventory.sceneObjects[id]) return fail(`B\u1EA1n \u0111\xE3 c\xF3 ${it.name}.`);
      if (kind === "background" && state.inventory.backgrounds[id]) return fail(`B\u1EA1n \u0111\xE3 c\xF3 ${it.name}.`);
      if (it.wheel && (kind === "scene" || kind === "background" || kind === "item" || kind === "power")) return fail(`${it.name} ch\u1EC9 c\xF3 t\u1EEB V\xF2ng quay may m\u1EAFn.`);
      if (kind === "power" && state.inventory.powers[id]) return fail(`B\u1EA1n \u0111\xE3 c\xF3 ${it.name}.`);
      if (kind === "power" && !it.price) return fail(`${it.name} kh\xF4ng b\xE1n.`);
      if (it.trophy) return fail(`${it.name} ch\u1EC9 d\xE0nh cho ng\u01B0\u1EDDi \u0111\u1EE9ng \u0111\u1EA7u Th\u1EA7n m\u1ED9c.`);
      if (it.wheel && kind === "decor" && !state.unlocked.decor.includes(id)) return fail(`${it.name} ch\u1EC9 c\xF3 khi quay tr\xFAng \u1EDF V\xF2ng quay may m\u1EAFn.`);
      if (it.wheel && kind === "pet" && !state.unlocked.pets.includes(id)) return fail(`${it.name} ch\u1EC9 c\xF3 khi quay tr\xFAng \u1EDF V\xF2ng quay may m\u1EAFn.`);
      if (state.money < it.price) return fail(`Kh\xF4ng \u0111\u1EE7 xu (c\u1EA7n ${it.price}).`);
      state.money -= it.price;
      if (kind === "pot") state.inventory.pots[id] = (state.inventory.pots[id] || 0) + 1;
      if (kind === "decor") state.inventory.decor[id] = (state.inventory.decor[id] || 0) + 1;
      if (kind === "hdecor") state.inventory.houseDecor[id] = (state.inventory.houseDecor[id] || 0) + 1;
      if (kind === "scene") {
        state.inventory.sceneObjects[id] = 1;
        state.scene.object = id;
      }
      if (kind === "background") {
        state.inventory.backgrounds[id] = 1;
        state.scene.background = id;
      }
      if (kind === "pet") {
        state.pets.owned.push(id);
        state.pets.status[id] = { sleepUntil: 0, blocks: 0 };
        if (!state.pets.active) state.pets.active = id;
      }
      if (kind === "power") state.inventory.powers[id] = 1;
      if (kind === "item") {
        if (it.once) state.unlocks[id] = true;
        else state.inventory.items[id] = (state.inventory.items[id] || 0) + 1;
      }
      log(state, "buy", `Mua ${it.name} (-${it.price} xu).`);
      return okr(`\u0110\xE3 mua ${it.name}.`);
    }
    function equipPower(state, id) {
      if (!C.POWERS_BY_ID[id] || !state.inventory.powers[id]) return fail("B\u1EA1n ch\u01B0a c\xF3 ch\u01B0\u1EDFng l\u1EF1c n\xE0y.");
      state.arena.power = id;
      return okr(`Pet s\u1EBD d\xF9ng ${C.POWERS_BY_ID[id].name} \u1EDF \u0110\u1EA5u tr\u01B0\u1EDDng.`);
    }
    function arenaBag(state) {
      const seeds = Object.entries(state.inventory.seeds).filter(([id, n]) => n > 0 && C.SPECIES_BY_ID[id]).map(([id, n]) => ({ kind: "seed", id, n }));
      const pots = Object.entries(state.inventory.pots).filter(([id, n]) => n > 0 && C.POTS_BY_ID[id]).map(([id, n]) => ({ kind: "pot", id, n }));
      return [...seeds, ...pots].slice(0, 60);
    }
    function arenaTransfer(state, prize, gain, opponent) {
      const list = prize && (prize.kind === "seed" ? state.inventory.seeds : prize.kind === "pot" ? state.inventory.pots : null);
      const it = prize && (prize.kind === "seed" ? C.SPECIES_BY_ID[prize.id] : C.POTS_BY_ID[prize.id]);
      if (gain) {
        state.arena.wins += 1;
      } else {
        state.arena.losses += 1;
      }
      if (!list || !it) {
        log(state, "arena", gain ? `Th\u1EAFng ${opponent} \u1EDF \u0110\u1EA5u tr\u01B0\u1EDDng!` : `Thua ${opponent} \u1EDF \u0110\u1EA5u tr\u01B0\u1EDDng.`);
        return;
      }
      const name = prize.kind === "seed" ? `1 h\u1EA1t ${it.name}` : `1 ${it.name}`;
      if (gain) {
        list[prize.id] = (list[prize.id] || 0) + 1;
        log(state, "arena", `Th\u1EAFng ${opponent} \u1EDF \u0110\u1EA5u tr\u01B0\u1EDDng, l\u1EA5y \u0111\u01B0\u1EE3c ${name}!`);
      } else {
        if ((list[prize.id] || 0) > 0) list[prize.id] -= 1;
        log(state, "arena", `Thua ${opponent} \u1EDF \u0110\u1EA5u tr\u01B0\u1EDDng, m\u1EA5t ${name}.`);
      }
    }
    function treeChest(state, milestone, rng = Math.random) {
      const m = Math.max(1, Math.min(10, Math.round(Number(milestone) || 1)));
      const gifts = [];
      const item = (id, n) => {
        state.inventory.items[id] = (state.inventory.items[id] || 0) + n;
        gifts.push(`${n} ${C.ITEMS_BY_ID[id].name}`);
      };
      const coin = (n) => {
        state.money += n;
        gifts.push(`${n} xu`);
      };
      const pickOne = (list) => list[Math.floor(rng() * list.length)];
      const seed = (minTier, maxTier, n) => {
        const sp = pickOne(C.SPECIES.filter((s) => s.tier >= minTier && s.tier <= maxTier));
        state.inventory.seeds[sp.id] = (state.inventory.seeds[sp.id] || 0) + n;
        gifts.push(`${n} h\u1EA1t ${sp.name}`);
      };
      const pot = (minTier, maxTier) => {
        const p = pickOne(C.POTS.filter((x) => x.id !== "nhua" && x.tier >= minTier && x.tier <= maxTier));
        state.inventory.pots[p.id] = (state.inventory.pots[p.id] || 0) + 1;
        gifts.push(`1 ${p.name}`);
      };
      const power = (wheelOnly, fallback) => {
        const list = C.POWERS.filter((x) => (wheelOnly ? x.wheel : !x.wheel && x.price) && !state.inventory.powers[x.id]);
        if (!list.length) {
          fallback();
          return;
        }
        const pw = pickOne(list);
        state.inventory.powers[pw.id] = 1;
        gifts.push(`ch\u01B0\u1EDFng l\u1EF1c ${pw.name}`);
      };
      if (m === 1) {
        item("phan_bon", 2);
        seed(0, 1, 2);
      } else if (m === 2) {
        item("phan_npk", 2);
        seed(0, 2, 3);
      } else if (m === 3) {
        item("phan_sieu_toc", 1);
        coin(200);
      } else if (m === 4) {
        pot(1, 2);
        item("phan_npk", 2);
      } else if (m === 5) {
        item("phan_than_ky", 1);
        coin(500);
      } else if (m === 6) {
        pot(2, 3);
        item("phan_sieu_toc", 1);
      } else if (m === 7) power(false, () => coin(1500));
      else if (m === 8) {
        item("phan_than_ky", 2);
        seed(3, 4, 1);
      } else if (m === 9) {
        item("tien_duoc", 1);
        pot(3, 4);
      } else power(true, () => {
        item("tien_duoc", 2);
        coin(3e3);
      });
      log(state, "tree", `R\u01B0\u01A1ng Th\u1EA7n m\u1ED9c m\u1ED1c ${m}: ${gifts.join(", ")}.`);
      return okr(`\u{1F381} R\u01B0\u01A1ng m\u1ED1c ${m}: ${gifts.join(", ")}`, { gifts });
    }
    function treeTopChest(state, rank, rng = Math.random) {
      const r = Math.max(1, Math.min(3, Math.round(Number(rank) || 3)));
      const gifts = [];
      const item = (id, n) => {
        state.inventory.items[id] = (state.inventory.items[id] || 0) + n;
        gifts.push(`${n} ${C.ITEMS_BY_ID[id].name}`);
      };
      if (r === 1) {
        const list = C.POWERS.filter((x) => x.wheel && !state.inventory.powers[x.id]);
        if (list.length) {
          const pw = list[Math.floor(rng() * list.length)];
          state.inventory.powers[pw.id] = 1;
          gifts.push(`ch\u01B0\u1EDFng l\u1EF1c ${pw.name}`);
        } else item("tien_duoc", 2);
        item("tien_duoc", 1);
        state.inventory.decor.tuong_than_moc = (state.inventory.decor.tuong_than_moc || 0) + 1;
        if (!state.unlocked.decor.includes("tuong_than_moc")) state.unlocked.decor.push("tuong_than_moc");
        gifts.push("\u{1F3C6} T\u01B0\u1EE3ng Th\u1EA7n m\u1ED9c");
      } else if (r === 2) {
        const pots = C.POTS.filter((x) => x.tier === 3);
        const p = pots[Math.floor(rng() * pots.length)];
        state.inventory.pots[p.id] = (state.inventory.pots[p.id] || 0) + 1;
        gifts.push(`1 ${p.name}`);
        item("phan_than_ky", 2);
      } else {
        item("phan_than_ky", 3);
        state.money += 500;
        gifts.push("500 xu");
      }
      log(state, "tree", `Top ${r} Th\u1EA7n m\u1ED9c: ${gifts.join(", ")}.`);
      return okr(`\u{1F3C6} R\u01B0\u01A1ng top ${r}: ${gifts.join(", ")}`, { gifts });
    }
    function equipScene(state, kind, id) {
      const isObject = kind === "scene";
      if (!isObject && kind !== "background") return fail("Lo\u1EA1i c\u1EA3nh kh\xF4ng h\u1EE3p l\u1EC7.");
      const list = isObject ? D.SCENE_OBJECTS_BY_ID : D.BACKGROUNDS_BY_ID;
      const owned = isObject ? state.inventory.sceneObjects : state.inventory.backgrounds;
      if (id !== null && (!list[id] || !owned[id])) return fail("B\u1EA1n ch\u01B0a c\xF3 c\u1EA3nh n\xE0y.");
      state.scene[isObject ? "object" : "background"] = id;
      return okr(id ? `\u0110\xE3 \u0111\u1EB7t ${list[id].name}.` : "\u0110\xE3 c\u1EA5t c\u1EA3nh v\xE0o kho.");
    }
    function buySeeds(state, id, qty) {
      const sp = C.SPECIES_BY_ID[id];
      const n = Math.max(1, Math.min(99, Math.round(Number(qty) || 1)));
      if (!state.unlocked.species.includes(id)) return fail(`C\u1EA7n m\u1EDF kho\xE1 gi\u1ED1ng ${sp.name} tr\u01B0\u1EDBc.`);
      const cost = sp.seed * n;
      if (state.money < cost) return fail(`Kh\xF4ng \u0111\u1EE7 xu (c\u1EA7n ${cost}).`);
      state.money -= cost;
      state.inventory.seeds[id] = (state.inventory.seeds[id] || 0) + n;
      return okr(`\u0110\xE3 mua ${n} h\u1EA1t ${sp.name}.`);
    }
    function unlock(state, kind, id) {
      const it = kind === "species" ? C.SPECIES_BY_ID[id] : kind === "pot" ? C.POTS_BY_ID[id] : null;
      if (!it) return fail("Kh\xF4ng c\xF3 m\xF3n n\xE0y.");
      const list = kind === "species" ? state.unlocked.species : state.unlocked.pots;
      if (list.includes(id)) return fail("\u0110\xE3 m\u1EDF kho\xE1 r\u1ED3i.");
      if (it.wheel) return fail(`${it.name} ch\u1EC9 m\u1EDF kho\xE1 \u0111\u01B0\u1EE3c khi quay tr\xFAng \u1EDF V\xF2ng quay may m\u1EAFn.`);
      if (state.level < it.level) return fail(`C\u1EA7n c\u1EA5p ${it.level} \u0111\u1EC3 m\u1EDF kho\xE1 ${it.name}.`);
      if (state.money < it.unlock) return fail(`Kh\xF4ng \u0111\u1EE7 xu (c\u1EA7n ${it.unlock}).`);
      state.money -= it.unlock;
      list.push(id);
      log(state, "unlock", `M\u1EDF kho\xE1 ${kind === "species" ? "gi\u1ED1ng" : ""} ${it.name} (-${it.unlock} xu).`);
      return okr(`\u0110\xE3 m\u1EDF kho\xE1 ${it.name}!`);
    }
    function dayKey(ms) {
      const d = CL.parts(ms);
      return `${d.y}-${String(d.mo + 1).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
    function dailyAvailable(state, now = Date.now()) {
      return state.daily.last !== dayKey(now);
    }
    function pickWeighted(items, weight, rng) {
      const total = items.reduce((s, x) => s + weight(x), 0);
      let r = rng() * total;
      for (const x of items) {
        r -= weight(x);
        if (r <= 0) return x;
      }
      return items[items.length - 1];
    }
    function claimDaily(state, now = Date.now(), rng = Math.random) {
      if (!dailyAvailable(state, now)) return fail("H\xF4m nay \u0111\xE3 nh\u1EADn qu\xE0 r\u1ED3i, mai quay l\u1EA1i nh\xE9!");
      const R = C.RULES.daily;
      const yesterday = dayKey(now - 864e5);
      state.daily.streak = state.daily.last === yesterday ? state.daily.streak + 1 : 1;
      state.daily.last = dayKey(now);
      const roll = rng();
      const pets = C.PETS.filter((p) => p.tier === 0 && !p.wheel && !state.pets.owned.includes(p.id));
      const pots = state.unlocked.pots.filter((id) => id !== "nhua").map((id) => C.POTS_BY_ID[id]);
      let reward;
      if (roll < R.pet && pets.length) {
        const p = pets[Math.floor(rng() * pets.length)];
        state.pets.owned.push(p.id);
        state.pets.status[p.id] = { sleepUntil: 0, blocks: 0 };
        if (!state.pets.active) state.pets.active = p.id;
        reward = { kind: "pet", id: p.id, qty: 1, name: p.name, rare: true };
      } else if (roll < R.pet + R.pot && pots.length) {
        const pot = pickWeighted(pots, (x) => 1 / Math.max(1, x.price), rng);
        state.inventory.pots[pot.id] = (state.inventory.pots[pot.id] || 0) + 1;
        reward = { kind: "pot", id: pot.id, qty: 1, name: pot.name };
      } else {
        const sps = state.unlocked.species.map((id) => C.SPECIES_BY_ID[id]);
        const sp = pickWeighted(sps, (x) => 1 / x.seed, rng);
        const qty = pickWeighted(R.seedQty, (x) => x[1], rng)[0];
        state.inventory.seeds[sp.id] = (state.inventory.seeds[sp.id] || 0) + qty;
        reward = { kind: "seed", id: sp.id, qty, name: sp.name };
      }
      log(state, "gift", `Qu\xE0 h\u1EB1ng ng\xE0y: ${reward.qty > 1 ? `${reward.qty} ` : ""}${reward.kind === "seed" ? "h\u1EA1t " : ""}${reward.name}${reward.rare ? " (hi\u1EBFm!)" : ""}.`);
      return okr(`Qu\xE0 h\xF4m nay: ${reward.qty > 1 ? `${reward.qty} ` : ""}${reward.kind === "seed" ? "h\u1EA1t " : ""}${reward.name}!`, { reward, streak: state.daily.streak });
    }
    function wheelPool() {
      const pool = C.TIERS.map(() => []);
      C.SPECIES.filter((x) => x.wheel).forEach((x) => pool[x.tier].push({ kind: "species", id: x.id, name: x.name, tier: x.tier }));
      C.POTS.filter((x) => x.wheel).forEach((x) => pool[x.tier].push({ kind: "pot", id: x.id, name: x.name, tier: x.tier }));
      D.POT_DECOR.filter((x) => x.wheel).forEach((x) => pool[x.tier].push({ kind: "decor", id: x.id, name: x.name, tier: x.tier }));
      D.SCENE_OBJECTS.filter((x) => x.wheel).forEach((x) => pool[x.tier].push({ kind: "scene", id: x.id, name: x.name, tier: x.tier }));
      D.BACKGROUNDS.filter((x) => x.wheel).forEach((x) => pool[x.tier].push({ kind: "background", id: x.id, name: x.name, tier: x.tier }));
      C.PETS.filter((x) => x.wheel).forEach((x) => pool[x.tier].push({ kind: "pet", id: x.id, name: x.name, tier: x.tier }));
      C.POWERS.filter((x) => x.wheel).forEach((x) => pool[x.tier].push({ kind: "power", id: x.id, name: x.name, tier: x.tier }));
      C.ITEMS.filter((x) => x.wheel && x.fert).forEach((x) => pool[x.tier].push({ kind: "fert", id: x.id, name: x.name, tier: x.tier }));
      return pool;
    }
    function wheelOwned(state, it) {
      if (it.kind === "species") return state.unlocked.species.includes(it.id);
      if (it.kind === "pot") return state.unlocked.pots.includes(it.id);
      if (it.kind === "decor") return state.unlocked.decor.includes(it.id);
      if (it.kind === "scene") return !!state.inventory.sceneObjects[it.id];
      if (it.kind === "background") return !!state.inventory.backgrounds[it.id];
      if (it.kind === "power") return !!state.inventory.powers[it.id];
      if (it.kind === "fert") return false;
      return state.unlocked.pets.includes(it.id) || state.pets.owned.includes(it.id);
    }
    function rollTier(state, rng) {
      const W = C.RULES.wheel;
      let minTier = 0;
      if (state.wheel.pityLeg >= W.pityLegendary - 1) minTier = 4;
      else if (state.wheel.pityEpic >= W.pityEpic - 1) minTier = 2;
      const rates = W.rates.map((r, i) => i >= minTier ? r : 0);
      const total = rates.reduce((a, b) => a + b, 0);
      let x = rng() * total;
      for (let i = 0; i < rates.length; i++) {
        x -= rates[i];
        if (x < 0) return i;
      }
      return rates.length - 1;
    }
    function spinOnce(state, rng) {
      const W = C.RULES.wheel;
      const tier = rollTier(state, rng);
      state.wheel.spins += 1;
      state.wheel.pityEpic = tier >= 2 ? 0 : state.wheel.pityEpic + 1;
      state.wheel.pityLeg = tier >= 4 ? 0 : state.wheel.pityLeg + 1;
      const items = wheelPool()[tier];
      if (!items.length || tier === 0 && rng() >= W.commonItemChance) {
        const r = rng();
        if (r < 0.45) {
          const n = 60 + Math.floor(rng() * 10) * 10;
          state.money += n;
          return { tier, kind: "coin", name: `${n} xu`, qty: n };
        }
        if (r < 0.7) {
          state.inventory.items.phan_npk = (state.inventory.items.phan_npk || 0) + 2;
          return { tier, kind: "item", id: "phan_npk", name: "2 Ph\xE2n NPK", qty: 2 };
        }
        const sps = state.unlocked.species.map((id) => C.SPECIES_BY_ID[id]);
        const sp = pickWeighted(sps, (x) => 1 / x.seed, rng);
        state.inventory.seeds[sp.id] = (state.inventory.seeds[sp.id] || 0) + 3;
        return { tier, kind: "seed", id: sp.id, name: `3 h\u1EA1t ${sp.name}`, qty: 3 };
      }
      const fresh = items.filter((it2) => !wheelOwned(state, it2));
      const pickFrom = fresh.length && rng() < W.newItemChance ? fresh : items;
      const it = pickFrom[Math.floor(rng() * pickFrom.length)];
      const dup = wheelOwned(state, it);
      const res = { tier, kind: it.kind, id: it.id, name: it.name, dup };
      if (it.kind === "species") {
        if (!dup) state.unlocked.species.push(it.id);
        const n = dup ? 3 : 2;
        state.inventory.seeds[it.id] = (state.inventory.seeds[it.id] || 0) + n;
        res.bonus = `${n} h\u1EA1t`;
      } else if (it.kind === "pot") {
        if (!dup) state.unlocked.pots.push(it.id);
        state.inventory.pots[it.id] = (state.inventory.pots[it.id] || 0) + 1;
        res.bonus = "1 ch\u1EADu";
      } else if (it.kind === "decor") {
        if (!dup) state.unlocked.decor.push(it.id);
        state.inventory.decor[it.id] = (state.inventory.decor[it.id] || 0) + 1;
        res.bonus = "1 m\xF3n";
      } else if (it.kind === "scene" || it.kind === "background") {
        const isObject = it.kind === "scene";
        const stock = isObject ? state.inventory.sceneObjects : state.inventory.backgrounds;
        const unlocks = isObject ? state.unlocked.sceneObjects : state.unlocked.backgrounds;
        if (dup) {
          const item = isObject ? D.SCENE_OBJECTS_BY_ID[it.id] : D.BACKGROUNDS_BY_ID[it.id];
          const n = Math.round(item.price * 0.1);
          state.money += n;
          res.bonus = `${n} xu (tr\xF9ng)`;
        } else {
          unlocks.push(it.id);
          stock[it.id] = 1;
          state.scene[isObject ? "object" : "background"] = it.id;
          res.bonus = "\u0111\xE3 \u0111\u1EB7t v\xE0o v\u01B0\u1EDDn";
        }
      } else if (it.kind === "power") {
        if (dup) {
          const n = 50 * (it.tier + 1);
          state.money += n;
          res.bonus = `${n} xu (tr\xF9ng)`;
        } else {
          state.inventory.powers[it.id] = 1;
          res.bonus = "ch\u01B0\u1EDFng l\u1EF1c m\u1EDBi";
        }
      } else if (it.kind === "fert") {
        state.inventory.items[it.id] = (state.inventory.items[it.id] || 0) + 2;
        res.bonus = "2 l\u1ECD";
      } else if (dup) {
        const n = Math.round(C.PETS_BY_ID[it.id].price * 0.1);
        state.money += n;
        res.bonus = `${n} xu (tr\xF9ng)`;
      } else {
        state.unlocked.pets.push(it.id);
        res.bonus = "m\u1EDF kho\xE1 \u0111\u1EC3 mua";
      }
      return res;
    }
    function spinWheel(state, count = 1, now = Date.now(), rng = Math.random) {
      if (state.wheel.pending) return fail("H\xE3y xem ph\u1EA7n th\u01B0\u1EDFng v\u1EEBa quay tr\u01B0\u1EDBc khi quay ti\u1EBFp.");
      const W = C.RULES.wheel;
      const n = count === 10 ? 10 : 1;
      const today = dayKey(now);
      const free = n === 1 && state.wheel.freeDay !== today;
      const cost = free ? 0 : n === 10 ? W.cost10 : W.cost;
      if (state.money < cost) return fail(`Kh\xF4ng \u0111\u1EE7 xu (c\u1EA7n ${cost}).`);
      state.money -= cost;
      if (free) state.wheel.freeDay = today;
      const results = Array.from({ length: n }, () => spinOnce(state, rng));
      const best = results.reduce((a, b) => b.tier > a.tier ? b : a);
      for (const r of results) if (r.tier >= 3) log(state, "wheel", `\u{1F3A1} V\xF2ng quay: tr\xFAng ${C.TIERS[r.tier].name} \u2013 ${r.name}${r.dup ? " (tr\xF9ng)" : ""}!`);
      state.wheel.history = [...results.map((r) => ({ ...r, at: now })), ...state.wheel.history].slice(0, 30);
      state.wheel.pending = { results, best, free };
      return okr(n === 1 ? `Tr\xFAng ${C.TIERS[best.tier].name}: ${best.name}!` : `Quay 10 l\u01B0\u1EE3t \u2013 cao nh\u1EA5t: ${C.TIERS[best.tier].name} ${best.name}`, { results, best, free });
    }
    function ackSpin(state) {
      if (!state.wheel.pending) return fail("Kh\xF4ng c\xF3 ph\u1EA7n th\u01B0\u1EDFng n\xE0o \u0111ang ch\u1EDD xem.");
      state.wheel.pending = null;
      return okr("\u0110\xE3 xem ph\u1EA7n th\u01B0\u1EDFng.");
    }
    function buySlot(state) {
      if (state.slots.length >= C.RULES.maxSlots) return fail("V\u01B0\u1EDDn \u0111\xE3 \u0111\u1EE7 \xF4 t\u1ED1i \u0111a.");
      const needLv = C.RULES.slotLevel(state.slots.length);
      if (state.level < needLv) return fail(`C\u1EA7n c\u1EA5p ${needLv} \u0111\u1EC3 m\u1EDF th\xEAm \xF4 ch\u1EADu.`);
      const price = C.RULES.slotPrice(state.slots.length);
      if (state.money < price) return fail(`Kh\xF4ng \u0111\u1EE7 xu (c\u1EA7n ${price}).`);
      state.money -= price;
      state.slots.push({ pot: "nhua", plant: null, decor: [null, null, null, null] });
      return okr(`\u0110\xE3 m\u1EDF th\xEAm \xF4 ch\u1EADu th\u1EE9 ${state.slots.length}.`);
    }
    function placePot(state, idx, potId) {
      const slot = getSlot(state, idx);
      if (!slot || !C.POTS_BY_ID[potId]) return fail("Kh\xF4ng h\u1EE3p l\u1EC7.");
      if (potId !== "nhua" && !(state.inventory.pots[potId] > 0)) return fail("B\u1EA1n ch\u01B0a c\xF3 ch\u1EADu n\xE0y.");
      if (slot.pot === potId) return fail("\xD4 \u0111ang d\xF9ng ch\u1EADu n\xE0y r\u1ED3i.");
      if (potId !== "nhua") state.inventory.pots[potId] -= 1;
      if (slot.pot !== "nhua") state.inventory.pots[slot.pot] = (state.inventory.pots[slot.pot] || 0) + 1;
      slot.pot = potId;
      return okr(`\u0110\xE3 thay ${C.POTS_BY_ID[potId].name}.`);
    }
    function placeDecor(state, idx, pos, id) {
      const slot = getSlot(state, idx);
      const k = D.POT_SLOTS.indexOf(pos);
      if (!slot || k < 0) return fail("Ch\u1ED7 trang tr\xED kh\xF4ng h\u1EE3p l\u1EC7.");
      if (!slot.decor) slot.decor = [null, null, null, null];
      const old = slot.decor[k];
      if (id) {
        const d = D.POT_DECOR_BY_ID[id];
        if (!d) return fail("Kh\xF4ng c\xF3 m\xF3n n\xE0y.");
        const place = pos === "left" || pos === "right" ? "side" : pos;
        if (d.place !== place) return fail(`${d.name} kh\xF4ng \u0111\u1EB7t \u1EDF ${D.SLOT_NAMES[pos].toLowerCase()} \u0111\u01B0\u1EE3c.`);
        if (!(state.inventory.decor[id] > 0)) return fail("B\u1EA1n ch\u01B0a c\xF3 m\xF3n n\xE0y \u2013 mua \u1EDF C\u1EEDa h\xE0ng \u203A Trang tr\xED.");
        state.inventory.decor[id] -= 1;
      }
      if (old) state.inventory.decor[old] = (state.inventory.decor[old] || 0) + 1;
      slot.decor[k] = id || null;
      return okr(id ? `\u0110\xE3 \u0111\u1EB7t ${D.POT_DECOR_BY_ID[id].name} cho ch\u1EADu \xF4 ${idx + 1}.` : "\u0110\xE3 c\u1EA5t v\xE0o kho.");
    }
    function houseLevel(state) {
      return D.HOUSE_LEVELS[Math.max(1, Math.min(D.HOUSE_LEVELS.length, state.house.level)) - 1];
    }
    function upgradeHouse(state) {
      if (!state.pets.owned.length) return fail("C\u1EA7n c\xF3 pet tr\u01B0\u1EDBc.");
      const next = D.HOUSE_LEVELS[state.house.level];
      if (!next) return fail("Nh\xE0 th\xFA \u0111\xE3 \u1EDF c\u1EA5p cao nh\u1EA5t.");
      if (state.money < next.price) return fail(`Kh\xF4ng \u0111\u1EE7 xu (c\u1EA7n ${next.price}).`);
      state.money -= next.price;
      state.house.level = next.level;
      log(state, "house", `N\xE2ng c\u1EA5p nh\xE0 th\xFA: ${next.name}.`);
      return okr(`Nh\xE0 th\xFA \u0111\xE3 th\xE0nh ${next.name}!`);
    }
    function placeHouseDecor(state, pos, id) {
      if (!D.HOUSE_SLOTS.includes(pos)) return fail("Ch\u1ED7 trang tr\xED kh\xF4ng h\u1EE3p l\u1EC7.");
      const old = state.house.decor[pos];
      if (id) {
        const d = D.HOUSE_DECOR_BY_ID[id];
        if (!d || d.place !== pos) return fail("M\xF3n n\xE0y kh\xF4ng \u0111\u1EB7t \u1EDF \u0111\xE2y \u0111\u01B0\u1EE3c.");
        if (!(state.inventory.houseDecor[id] > 0)) return fail("B\u1EA1n ch\u01B0a c\xF3 m\xF3n n\xE0y.");
        state.inventory.houseDecor[id] -= 1;
      }
      if (old) state.inventory.houseDecor[old] = (state.inventory.houseDecor[old] || 0) + 1;
      state.house.decor[pos] = id || null;
      return okr(id ? `\u0110\xE3 \u0111\u1EB7t ${D.HOUSE_DECOR_BY_ID[id].name}.` : "\u0110\xE3 c\u1EA5t v\xE0o kho.");
    }
    function setPet(state, id) {
      if (id && !state.pets.owned.includes(id)) return fail("B\u1EA1n ch\u01B0a c\xF3 pet n\xE0y.");
      state.pets.active = id || null;
      return okr(id ? `${C.PETS_BY_ID[id].name} \u0111\xE3 ra v\u01B0\u1EDDn.` : "\u0110\xE3 cho pet v\xE0o nh\xE0.");
    }
    function petInfo(state, now = Date.now()) {
      const id = state.pets.active;
      if (!id || !C.PETS_BY_ID[id]) return null;
      const st = state.pets.status[id] || { sleepUntil: 0, blocks: 0 };
      const sleepMs = Math.max(0, (st.sleepUntil || 0) - now);
      return { id, name: C.PETS_BY_ID[id].name, sleeping: sleepMs > 0, sleepMs, blocks: st.blocks || 0 };
    }
    function gainExp(state, n) {
      state.exp += n;
      let up = false;
      while (state.exp >= C.expToNext(state.level)) {
        state.exp -= C.expToNext(state.level);
        state.level += 1;
        up = true;
        log(state, "level", `L\xEAn c\u1EA5p ${state.level}!`);
      }
      return up;
    }
    function visitSteal(state, idx, by, rng = Math.random, now = Date.now()) {
      const slot = getSlot(state, idx);
      const p = slot && slot.plant;
      if (!p || p.dead || !p.bloomed) return fail("Kh\xF4ng c\xF3 hoa n\u1EDF \u0111\u1EC3 h\xE1i.");
      if (p.faded) return fail("Hoa \u0111\xE3 t\xE0n, kh\xF4ng \u0111\xE1ng h\xE1i.");
      const sp = C.SPECIES_BY_ID[p.species];
      const pet = petInfo(state, now);
      if (pet && !pet.sleeping) {
        const st = state.pets.status[pet.id] || (state.pets.status[pet.id] = { sleepUntil: 0, blocks: 0 });
        const mins = houseLevel(state).sleepMin;
        st.sleepUntil = now + mins * 6e4;
        st.blocks = (st.blocks || 0) + 1;
        log(state, "guarded", `${pet.name} \u0111\xE3 \u0111u\u1ED5i ${by} kh\u1ECFi ${sp.name} (\xF4 ${idx + 1})! Pet v\u1EC1 nh\xE0 ng\u1EE7 ${mins} ph\xFAt.`, { by });
        return fail(`B\u1ECB ${pet.name} \u0111u\u1ED5i \u0111i!`, { blockedBy: pet.id });
      }
      const fx = mods(slot);
      if (rng() < fx.guard) {
        log(state, "guarded", `${by} \u0111\u1ECBnh h\xE1i tr\u1ED9m ${sp.name} (\xF4 ${idx + 1}) nh\u01B0ng b\u1ECB \u0111u\u1ED5i \u0111i!`);
        return fail("B\u1ECB b\u1EA3o v\u1EC7 v\u01B0\u1EDDn \u0111u\u1ED5i \u0111i!");
      }
      const v = harvestValue(state, slot);
      const loot = { money: Math.round(v.money * C.RULES.stealShare), exp: Math.round(v.exp * C.RULES.stealShare) };
      slot.theftMark = { by, at: Date.now(), species: sp.id };
      afterPick(slot);
      state.stats.stolenFromMe += 1;
      log(state, "stolen", `${by} \u0111\xE3 h\xE1i tr\u1ED9m ${sp.name} \u1EDF \xF4 ${idx + 1}!`, { by });
      return okr(`H\xE1i tr\u1ED9m ${sp.name}: +${loot.money} xu`, { loot });
    }
    function visitWater(state, idx, by) {
      return water(state, idx, by);
    }
    function remoteGuard(state, now = Date.now()) {
      const slots = state.slots.map((slot) => {
        const p = slot && slot.plant;
        const guard = slot ? Math.round(mods(slot).guard * 100) / 100 : 0;
        if (!p || p.dead || !p.bloomed || p.faded) return { loot: null, guard };
        const v = harvestValue(state, slot);
        return { loot: { money: Math.round(v.money * C.RULES.stealShare), exp: Math.round(v.exp * C.RULES.stealShare) }, guard };
      });
      const pet = petInfo(state, now);
      const st = pet && state.pets.status[pet.id];
      return { slots, guard: { pet: !!pet, petSleepUntil: st ? st.sleepUntil || 0 : 0, petSleepMs: houseLevel(state).sleepMin * 6e4 } };
    }
    function applyRemoteVisit(state, ev, now = Date.now()) {
      const by = String(ev && ev.by || "Ng\u01B0\u1EDDi ch\u01A1i").slice(0, 24);
      const idx = Number(ev && ev.slot);
      const slot = getSlot(state, idx);
      const p = slot && slot.plant;
      const sp = C.SPECIES_BY_ID[ev && ev.species];
      const spName = sp ? sp.name : "c\xE2y";
      if (ev.kind === "water") {
        if (ev.result === "ok" && p && p.species === ev.species) water(state, idx, by);
        return;
      }
      if (ev.kind !== "steal") return;
      if (ev.result === "pet") {
        const pet = petInfo(state, now);
        if (!pet) return;
        const st = state.pets.status[pet.id] || (state.pets.status[pet.id] = { sleepUntil: 0, blocks: 0 });
        const mins = houseLevel(state).sleepMin;
        st.sleepUntil = Math.max(st.sleepUntil || 0, (Number(ev.at) || now) + mins * 6e4);
        st.blocks = (st.blocks || 0) + 1;
        log(state, "guarded", `${pet.name} \u0111\xE3 \u0111u\u1ED5i ${by} kh\u1ECFi ${spName} (\xF4 ${idx + 1})! Pet v\u1EC1 nh\xE0 ng\u1EE7 ${mins} ph\xFAt.`, { by });
        return;
      }
      if (ev.result === "guard") {
        log(state, "guarded", `${by} \u0111\u1ECBnh h\xE1i tr\u1ED9m ${spName} (\xF4 ${idx + 1}) nh\u01B0ng b\u1ECB \u0111u\u1ED5i \u0111i!`);
        return;
      }
      if (ev.result !== "ok") return;
      if (p && !p.dead && p.bloomed && p.species === ev.species) {
        slot.theftMark = { by, at: Number(ev.at) || now, species: ev.species };
        afterPick(slot);
      }
      state.stats.stolenFromMe += 1;
      log(state, "stolen", `${by} \u0111\xE3 h\xE1i tr\u1ED9m ${spName} \u1EDF \xF4 ${idx + 1}!`, { by });
    }
    function stageOf(p) {
      if (!p) return "empty";
      if (p.dead) return "dead";
      if (p.bloomed) return p.faded ? "faded" : "bloom";
      if (p.old) return "young";
      if (p.progress >= 1) return "bud";
      if (p.progress >= 0.7) return "bud";
      if (p.progress >= 0.35) return "young";
      if (p.progress >= 0.1) return "sprout";
      return "seed";
    }
    function view(state, now = Date.now()) {
      const fx = decorFx(state);
      const schedule = state.settings.schedule;
      const slots = state.slots.map((slot, i) => {
        const p = slot.plant;
        const mm = mods(slot);
        const base = { i, pot: slot.pot, theftMark: slot.theftMark || null, decor: slot.decor || [null, null, null, null], mods: mm };
        if (!p) return { ...base, stage: "empty" };
        const sp = C.SPECIES_BY_ID[p.species];
        const drain = drainPerMin(sp, mm);
        const v = {
          ...base,
          species: sp.id,
          name: sp.name,
          stage: stageOf(p),
          water: Math.round(p.water),
          health: Math.round(p.health),
          fert: p.fert,
          waiting: p.waiting,
          old: p.old,
          harvests: p.harvests,
          visitors: p.visitors.slice(0, 3),
          progress: p.progress,
          wilting: p.water <= 0 && !p.bloomed,
          thirsty: p.water < C.RULES.thirstyAt && !p.dead && !p.bloomed
        };
        v.thirstyInMin = p.water > C.RULES.thirstyAt ? (p.water - C.RULES.thirstyAt) / drain : 0;
        if (!p.bloomed && !p.old && !p.dead) {
          v.bloomInMin = (1 - p.progress) * sp.bloomMinutes / growthMult(p, mm);
        }
        if (p.bloomed) v.thirstyInMin = 0;
        if (p.bloomed) v.value = harvestValue(state, slot);
        if (hasWindow(sp, schedule)) v.window = sp.window;
        return v;
      });
      return {
        money: state.money,
        exp: state.exp,
        level: state.level,
        expNext: C.expToNext(state.level),
        pet: petInfo(state, now),
        pets: { owned: state.pets.owned, status: state.pets.status },
        slots,
        house: state.pets.owned.length ? { ...state.house, info: houseLevel(state) } : null,
        scene: state.scene,
        inventory: state.inventory,
        unlocks: state.unlocks,
        stats: state.stats,
        log: state.log.slice(0, 40),
        settings: state.settings,
        fx,
        nextSlotPrice: state.slots.length < C.RULES.maxSlots ? C.RULES.slotPrice(state.slots.length) : null,
        nextSlotLevel: state.slots.length < C.RULES.maxSlots ? C.RULES.slotLevel(state.slots.length) : null,
        wheel: { pityEpic: state.wheel.pityEpic, pityLeg: state.wheel.pityLeg, spins: state.wheel.spins, free: state.wheel.freeDay !== dayKey(now), history: state.wheel.history.slice(0, 12), pending: state.wheel.pending },
        arena: state.arena,
        minigames: MG.info(state, now),
        unlocked: state.unlocked,
        daily: { available: dailyAvailable(state, now), streak: state.daily.streak },
        clock: S.describeNow(now, schedule),
        now
      };
    }
    module.exports = {
      createState,
      migrate,
      advance,
      view,
      stageOf,
      decorFx,
      plantSeed,
      water,
      waterAll,
      harvest,
      fertilize,
      removePlant,
      clearTheft,
      buy,
      equipScene,
      buySlot,
      unlock,
      spinWheel,
      ackSpin,
      wheelPool,
      upgradeHouse,
      placeHouseDecor,
      houseLevel,
      mods,
      claimDaily,
      dailyAvailable,
      dayKey,
      placePot,
      placeDecor,
      setPet,
      petInfo,
      gainExp,
      fastForward,
      admin,
      visitSteal,
      visitWater,
      harvestValue,
      remoteGuard,
      applyRemoteVisit,
      equipPower,
      arenaBag,
      arenaTransfer,
      treeChest,
      treeTopChest
    };
  }
});

// src/core/actions.js
var require_actions = __commonJS({
  "src/core/actions.js"(exports, module) {
    "use strict";
    var G = require_garden();
    var MG = require_minigames();
    var CL = require_clock();
    var TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
    var PROTOCOL = 1;
    function updateSettings(state, patch, now = Date.now()) {
      G.advance(state, now);
      const s = state.settings;
      if (patch.schedule) {
        const sc = { ...s.schedule, ...patch.schedule };
        sc.lunch = { ...s.schedule.lunch, ...patch.schedule.lunch || {} };
        sc.lunch.enabled = !!sc.lunch.enabled;
        const times = [sc.start, sc.end, sc.lunch.start, sc.lunch.end];
        if (!times.every((t) => TIME_RE.test(t))) return { ok: false, msg: "Gi\u1EDD ph\u1EA3i c\xF3 d\u1EA1ng HH:MM." };
        if (sc.end <= sc.start) return { ok: false, msg: "Gi\u1EDD k\u1EBFt th\xFAc ph\u1EA3i sau gi\u1EDD b\u1EAFt \u0111\u1EA7u." };
        if (!Array.isArray(sc.workdays) || !sc.workdays.length) return { ok: false, msg: "Ch\u1ECDn \xEDt nh\u1EA5t 1 ng\xE0y v\u01B0\u1EDDn ho\u1EA1t \u0111\u1ED9ng." };
        sc.workdays = [...new Set(sc.workdays.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
        if (!sc.workdays.length) return { ok: false, msg: "Ch\u1ECDn \xEDt nh\u1EA5t 1 ng\xE0y v\u01B0\u1EDDn ho\u1EA1t \u0111\u1ED9ng." };
        s.schedule = { start: sc.start, end: sc.end, lunch: { enabled: sc.lunch.enabled, start: sc.lunch.start, end: sc.lunch.end }, workdays: sc.workdays };
      }
      for (const k of ["ownerName", "notify", "usePacks", "music", "sfx"]) if (k in patch) s[k] = k === "ownerName" ? String(patch[k]).slice(0, 24) : !!patch[k];
      if ("petTalk" in patch) s.petTalk = !!patch.petTalk;
      if (["it", "vua", "nhieu"].includes(patch.talkRate)) s.talkRate = patch.talkRate;
      if ("volume" in patch) s.volume = Math.max(0, Math.min(100, Number(patch.volume) || 0));
      if (patch.position && ["top", "bottom"].includes(patch.position)) s.position = patch.position;
      if (patch.barWidth && ["full", "compact"].includes(patch.barWidth)) s.barWidth = patch.barWidth;
      if ("alwaysOnTop" in patch) s.alwaysOnTop = !!patch.alwaysOnTop;
      if ("autoStart" in patch) s.autoStart = !!patch.autoStart;
      return { ok: true, msg: "\u0110\xE3 l\u01B0u c\xE0i \u0111\u1EB7t." };
    }
    function resetShift(state, now = Date.now()) {
      const toMin = (t) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      const sc = state.settings.schedule;
      const len = toMin(sc.end) - toMin(sc.start);
      const d = CL.parts(now);
      const start = d.h * 60 + d.mi;
      const end = Math.min(start + len, 23 * 60 + 59);
      if (end - start < 30) return { ok: false, msg: "\u0110\xE3 qu\xE1 mu\u1ED9n trong ng\xE0y \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u l\u1EA1i." };
      const workdays = sc.workdays.includes(d.dow) ? sc.workdays : [...sc.workdays, d.dow].sort();
      const r = updateSettings(state, { schedule: { start: fmt(start), end: fmt(end), workdays } }, now);
      return r.ok ? { ok: true, msg: "V\u01B0\u1EDDn b\u1EAFt \u0111\u1EA7u t\xEDnh th\u1EDDi gian t\u1EEB b\xE2y gi\u1EDD." } : r;
    }
    var ACTIONS = {
      plant: (s, a) => G.plantSeed(s, a.slot, a.species),
      water: (s, a) => G.water(s, a.slot),
      waterAll: (s) => G.waterAll(s),
      harvest: (s, a) => G.harvest(s, a.slot),
      fertilize: (s, a) => G.fertilize(s, a.slot, a.item),
      equipPower: (s, a) => G.equipPower(s, a.id),
      gameStart: (s, a, c) => MG.start(s, a.game, c.now, c.rng, { bet: a.bet, bets: a.bets }),
      gameFinish: (s, a) => MG.finish(s, a.game, a.token, a.result && typeof a.result === "object" ? a.result : {}),
      gameMove: (s, a) => MG.move(s, a.game, a.token, a.move),
      sellFish: (s, a) => MG.sellFish(s, a.id, a.all === true),
      remove: (s, a) => G.removePlant(s, a.slot),
      clearTheft: (s, a) => G.clearTheft(s, a.slot),
      buy: (s, a) => G.buy(s, a.kind, a.id, a.qty),
      equipScene: (s, a) => G.equipScene(s, a.kind, a.id),
      unlock: (s, a) => G.unlock(s, a.kind, a.id),
      daily: (s) => G.claimDaily(s),
      spin: (s, a) => G.spinWheel(s, a.count === 10 ? 10 : 1),
      ackSpin: (s) => G.ackSpin(s),
      buySlot: (s) => G.buySlot(s),
      placePot: (s, a) => G.placePot(s, a.slot, a.pot),
      placeDecor: (s, a) => G.placeDecor(s, a.slot, a.pos, a.id),
      placeHouseDecor: (s, a) => G.placeHouseDecor(s, a.pos, a.id),
      upgradeHouse: (s) => G.upgradeHouse(s),
      setPet: (s, a) => G.setPet(s, a.id),
      settings: (s, a, c) => updateSettings(s, a.patch && typeof a.patch === "object" ? a.patch : {}, c.now),
      resetShift: (s, a, c) => resetShift(s, c.now),
      admin: (s, a, c) => c.admin ? G.admin(s, a) : { ok: false, msg: "Admin \u0111\xE3 t\u1EAFt." }
    };
    function run(state, a, ctx = {}) {
      const c = { now: ctx.now || Date.now(), rng: ctx.rng || Math.random, admin: !!ctx.admin };
      if (!a || typeof a !== "object") return { r: { ok: false, msg: "H\xE0nh \u0111\u1ED9ng kh\xF4ng h\u1EE3p l\u1EC7." }, state };
      G.advance(state, c.now);
      if (a.type === "adminReset") {
        if (!c.admin) return { r: { ok: false, msg: "Admin \u0111\xE3 t\u1EAFt." }, state };
        const fresh = G.createState(c.now);
        fresh.settings = state.settings;
        return { r: { ok: true, msg: "\u0110\xE3 ch\u01A1i l\u1EA1i t\u1EEB \u0111\u1EA7u." }, state: fresh };
      }
      const fn = Object.prototype.hasOwnProperty.call(ACTIONS, a.type) ? ACTIONS[a.type] : null;
      if (!fn) return { r: { ok: false, msg: "H\xE0nh \u0111\u1ED9ng kh\xF4ng h\u1EE3p l\u1EC7." }, state };
      return { r: fn(state, a, c) || { ok: false, msg: "Kh\xF4ng th\u1EF1c hi\u1EC7n \u0111\u01B0\u1EE3c." }, state };
    }
    var ADMIN_TYPES = /* @__PURE__ */ new Set(["admin", "adminReset", "adminList", "adminUser"]);
    module.exports = { PROTOCOL, ACTIONS, ADMIN_TYPES, run, updateSettings, resetShift, TIME_RE };
  }
});

// src/core/snapshot.js
var require_snapshot = __commonJS({
  "src/core/snapshot.js"(exports, module) {
    "use strict";
    var G = require_garden();
    function publicGarden(view) {
      return {
        slots: (view.slots || []).slice(0, 12).map((s) => ({
          pot: s.pot,
          decor: (s.decor || []).slice(0, 4),
          species: s.species || null,
          stage: s.stage,
          water: Math.round(Number(s.water) || 0),
          thirsty: !!s.thirsty
        })),
        pet: view.pet ? view.pet.id : null,
        house: view.house ? { level: view.house.level, decor: view.house.decor } : null,
        scene: { object: view.scene && view.scene.object || null, background: view.scene && view.scene.background || null }
      };
    }
    function groupGarden(state, now = Date.now()) {
      const pub = publicGarden(G.view(state, now));
      const rg = G.remoteGuard(state, now);
      pub.slots.forEach((s, i) => Object.assign(s, rg.slots[i] || {}));
      pub.guard = rg.guard;
      pub.pet = state.pets.active || null;
      pub.bag = G.arenaBag(state);
      return pub;
    }
    module.exports = { publicGarden, groupGarden };
  }
});

// server/game.js
var require_game = __commonJS({
  "server/game.js"(exports, module) {
    "use strict";
    var G = require_garden();
    var MG = require_minigames();
    var C = require_catalog();
    var A = require_actions();
    var CL = require_clock();
    var { groupGarden } = require_snapshot();
    var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    var ADMIN_WINDOW_MS = 2 * 60 * 1e3;
    var SEEN_MAX = 300;
    var HttpError = class extends Error {
      constructor(status, msg) {
        super(msg);
        this.status = status;
      }
    };
    var b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    async function verifyEd25519(publicKeyB64, data, sigB64) {
      try {
        const key = await crypto.subtle.importKey("spki", b64(publicKeyB64), { name: "Ed25519" }, false, ["verify"]);
        return await crypto.subtle.verify({ name: "Ed25519" }, key, b64(sigB64), new TextEncoder().encode(data));
      } catch (_) {
        return false;
      }
    }
    function publicState(state) {
      const s = JSON.parse(JSON.stringify(state));
      if (s.minigames) s.minigames.pending = null;
      delete s.serverSeen;
      return s;
    }
    function createHandler2({ url, serviceKey: serviceKey2, adminPublicKey, fetch = globalThis.fetch, now = Date.now, rng = Math.random }) {
      const base = String(url || "").replace(/\/+$/, "");
      const svcHeaders = { apikey: serviceKey2, "content-type": "application/json" };
      if (/^eyJ/.test(serviceKey2 || "")) svcHeaders.authorization = `Bearer ${serviceKey2}`;
      const tokenCache = /* @__PURE__ */ new Map();
      async function rest(path, body, headers = svcHeaders) {
        const res = await fetch(`${base}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
        const text = await res.text();
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (_) {
          data = null;
        }
        if (!res.ok) throw new HttpError(res.status >= 500 ? 502 : 400, String(data && (data.message || data.msg) || `L\u1ED7i c\u01A1 s\u1EDF d\u1EEF li\u1EC7u (${res.status}).`).slice(0, 200));
        return data;
      }
      const rpc = (fn, args) => rest(`/rest/v1/rpc/${fn}`, args);
      const srv = (uid, fn, args) => rpc("vp_srv", { p_uid: uid, p_fn: fn, p_args: args });
      async function userOf(req) {
        const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") || "");
        if (!m) throw new HttpError(401, "Ch\u01B0a \u0111\u0103ng nh\u1EADp.");
        const token = m[1];
        const hit = tokenCache.get(token);
        if (hit && hit.until > now()) return hit.uid;
        const res = await fetch(`${base}/auth/v1/user`, { headers: { apikey: serviceKey2, authorization: `Bearer ${token}` } });
        const u = res.ok ? await res.json().catch(() => null) : null;
        if (!u || !UUID.test(String(u.id))) throw new HttpError(401, "Phi\xEAn \u0111\u0103ng nh\u1EADp h\u1EBFt h\u1EA1n.");
        if (tokenCache.size > 5e3) tokenCache.clear();
        tokenCache.set(token, { uid: u.id, until: now() + 5 * 60 * 1e3 });
        return u.id;
      }
      async function load(uid) {
        const rec = await rpc("vp_save_get", { p_uid: uid });
        return rec && rec.state ? { state: rec.state, version: Number(rec.version) } : null;
      }
      function prepare(rec, ctx) {
        const t = now();
        let state;
        if (rec) state = G.migrate(rec.state, t);
        else {
          state = G.createState(t);
          const init = ctx.init && typeof ctx.init === "object" ? ctx.init : {};
          if (init.settings && typeof init.settings === "object") {
            const { schedule, ownerName, notify, usePacks, music, sfx, petTalk, talkRate, volume, position, barWidth, alwaysOnTop, autoStart } = init.settings;
            A.updateSettings(state, { schedule, ownerName, notify, usePacks, music, sfx, petTalk, talkRate, volume, position, barWidth, alwaysOnTop, autoStart }, t);
          }
          state.log.unshift({ at: t, type: "system", text: "V\u01B0\u1EDDn c\u1EE7a b\u1EA1n gi\u1EDD \u0111\u01B0\u1EE3c l\u01B0u tr\xEAn m\xE1y ch\u1EE7 nh\xF3m (ch\u1ED1ng s\u1EEDa ch\u1EC9 s\u1ED1)." });
        }
        if (Number.isFinite(ctx.tz) && ctx.tz >= -720 && ctx.tz <= 840) state.settings.tzOffset = Math.round(ctx.tz);
        if (!state.serverSeen || typeof state.serverSeen !== "object") state.serverSeen = { visits: [], duels: [] };
        CL.setOffset(state.settings.tzOffset);
        return { state, t };
      }
      async function mutate(uid, ctx, fn) {
        for (let attempt = 0; attempt < 8; attempt++) {
          if (attempt) await new Promise((r) => setTimeout(r, 15 + Math.floor(rng() * 60 * attempt)));
          const rec = await load(uid);
          const { state, t } = prepare(rec, ctx);
          const out = fn(state, t) || {};
          const next = out.replaceState || state;
          if (out.replaceState) next.serverSeen = state.serverSeen;
          const pub = publicState(next);
          const mg = MG.info(next, t);
          if (out.skipSave && rec) return { out, state: next, pub, mg, garden: null, t };
          const garden = ctx.group && out.push !== false ? groupGarden(next, t) : null;
          const ok = await rpc("vp_save_put", { p_uid: uid, p_state: next, p_version: rec ? rec.version : 0 });
          if (ok === true) return { out, state: next, pub, mg, garden, t };
        }
        throw new HttpError(409, "M\xE1y ch\u1EE7 \u0111ang b\u1EADn, th\u1EED l\u1EA1i.");
      }
      const reply = (m, extra = {}) => ({ ok: true, ...extra, state: m.pub, mg: m.mg });
      async function pushGarden(uid, group, garden) {
        if (!group || !garden) return [];
        try {
          const ev = await srv(uid, "push", { group, garden });
          return Array.isArray(ev) ? ev : [];
        } catch (_) {
          return [];
        }
      }
      async function gameAction(uid, a, ctx, isAdmin) {
        const m = await mutate(uid, ctx, (state, t) => {
          const { r, state: next } = A.run(state, a, { now: t, rng, admin: isAdmin });
          return next !== state ? { r, replaceState: next } : { r };
        });
        if (m.out.r && m.out.r.ok) await pushGarden(uid, ctx.group, m.garden);
        return reply(m, { r: m.out.r });
      }
      async function tick(uid, ctx) {
        let m = await mutate(uid, ctx, (state, t) => {
          G.advance(state, t);
          return { r: { ok: true } };
        });
        const events = (await pushGarden(uid, ctx.group, m.garden)).filter((e) => e && Number.isSafeInteger(e.id));
        if (events.length) {
          m = await mutate(uid, ctx, (state, t) => {
            G.advance(state, t);
            const seen = state.serverSeen.visits;
            for (const ev of events) {
              if (seen.includes(ev.id)) continue;
              G.applyRemoteVisit(state, ev, t);
              seen.push(ev.id);
            }
            state.serverSeen.visits = seen.slice(-SEEN_MAX);
            return { r: { ok: true } };
          });
          await srv(uid, "ack", { group: ctx.group, ids: events.map((e) => e.id) }).catch(() => {
          });
          await pushGarden(uid, ctx.group, m.garden);
        }
        return reply(m, { r: { ok: true }, applied: events.length });
      }
      const gain = (state, money, exp) => {
        state.money += money;
        if (exp) G.gainExp(state, exp);
      };
      const clampLoot = (x) => Math.max(0, Math.min(1e4, Math.round(Number(x) || 0)));
      async function groupAction(uid, a, ctx) {
        const group = ctx.group;
        if (!UUID.test(String(group || ""))) throw new HttpError(400, "H\xE3y v\xE0o nh\xF3m tr\u01B0\u1EDBc.");
        switch (a.type) {
          case "visit": {
            if (!UUID.test(String(a.target)) || !["water", "steal"].includes(a.kind) || !Number.isInteger(a.slot) || a.slot < 0 || a.slot > 11) {
              return { ok: true, r: { ok: false, msg: "H\xE0nh \u0111\u1ED9ng kh\xF4ng h\u1EE3p l\u1EC7." } };
            }
            const v = await srv(uid, "visit", { group, owner: a.target, kind: a.kind, slot: a.slot });
            const r = { ok: !!(v && v.ok), msg: String(v && v.msg || "Kh\xF4ng th\u1EF1c hi\u1EC7n \u0111\u01B0\u1EE3c.").slice(0, 200) };
            if (!r.ok || !v.loot) return { ok: true, r };
            const loot = { money: clampLoot(v.loot.money), exp: clampLoot(v.loot.exp) };
            const m = await mutate(uid, ctx, (state) => {
              gain(state, loot.money, loot.exp);
              return { r };
            });
            if (a.kind === "steal") r.loot = loot;
            return reply(m, { r });
          }
          case "treeWater": {
            const v = await srv(uid, "tree_give", { group, kind: "water", amount: 0 });
            if (!v || !v.ok) return { ok: true, r: { ok: false, msg: String(v && v.msg || "Kh\xF4ng t\u01B0\u1EDBi \u0111\u01B0\u1EE3c.") } };
            const m = await mutate(uid, ctx, (state) => {
              G.gainExp(state, 5);
              return { r: { ok: true, msg: `${v.msg} +5 EXP` } };
            });
            return reply(m, { r: m.out.r });
          }
          case "treeFert": {
            const it = C.ITEMS_BY_ID[a.item];
            if (!it || !it.fert) return { ok: true, r: { ok: false, msg: "Lo\u1EA1i ph\xE2n kh\xF4ng h\u1EE3p l\u1EC7." } };
            const take = await mutate(uid, ctx, (state) => {
              if ((state.inventory.items[it.id] || 0) <= 0) return { r: { ok: false, msg: `B\u1EA1n kh\xF4ng c\xF3 ${it.name}.` }, skipSave: true };
              state.inventory.items[it.id] -= 1;
              return { r: { ok: true }, push: false };
            });
            if (!take.out.r.ok) return reply(take, { r: take.out.r });
            let v = null;
            try {
              v = await srv(uid, "tree_give", { group, kind: "fert", amount: it.fert });
            } catch (e) {
              v = { ok: false, msg: e.message };
            }
            const exp = Math.max(1, Math.round(it.fert * C.RULES.fertExpPerMin));
            const m = await mutate(uid, ctx, (state) => {
              if (!v || !v.ok) {
                state.inventory.items[it.id] = (state.inventory.items[it.id] || 0) + 1;
                return { r: { ok: false, msg: String(v && v.msg || "Kh\xF4ng g\xF3p \u0111\u01B0\u1EE3c.") }, push: false };
              }
              G.gainExp(state, exp);
              return { r: { ok: true, msg: `${v.msg} +${exp} EXP` }, push: false };
            });
            return reply(m, { r: m.out.r });
          }
          case "treeClaim":
          case "treeClaimTop": {
            const top = a.type === "treeClaimTop";
            const v = await srv(uid, top ? "tree_claim_top" : "tree_claim", top ? { group } : { group, milestone: Number(a.milestone) });
            if (!v || !v.ok) return { ok: true, r: { ok: false, msg: String(v && v.msg || "Kh\xF4ng nh\u1EADn \u0111\u01B0\u1EE3c.") } };
            const m = await mutate(uid, ctx, (state) => ({ r: top ? G.treeTopChest(state, Number(v.rank), rng) : G.treeChest(state, Number(v.milestone), rng) }));
            return reply(m, { r: m.out.r });
          }
          case "duelInvite":
          case "duelRespond": {
            const rec = await load(uid);
            const { state } = prepare(rec, ctx);
            const pet = state.pets.active || null;
            const power = state.arena.power || "cu_huc";
            const accept = a.type === "duelInvite" || a.accept === true;
            if (accept && !pet) return { ok: true, r: { ok: false, msg: "B\u1EA1n c\u1EA7n c\xF3 pet \u0111ang ra v\u01B0\u1EDDn \u0111\u1EC3 v\xE0o \u0111\u1EA5u tr\u01B0\u1EDDng." } };
            if (a.type === "duelInvite") {
              if (!UUID.test(String(a.target))) return { ok: true, r: { ok: false, msg: "Ng\u01B0\u1EDDi ch\u01A1i kh\xF4ng h\u1EE3p l\u1EC7." } };
              const id = await srv(uid, "duel_invite", { group, opponent: a.target, pet, power });
              return { ok: true, r: { ok: true, id, msg: "\u0110\xE3 g\u1EEDi l\u1EDDi th\xE1ch \u0111\u1EA5u, ch\u1EDD \u0111\u1ED1i th\u1EE7 \u0111\u1ED3ng \xFD\u2026" } };
            }
            if (!UUID.test(String(a.id))) return { ok: true, r: { ok: false, msg: "Kh\xF4ng t\xECm th\u1EA5y l\u1EDDi m\u1EDDi." } };
            await srv(uid, "duel_respond", { duel: a.id, accept, pet, power });
            return { ok: true, r: { ok: true, msg: accept ? "V\xE0o \u0111\u1EA5u tr\u01B0\u1EDDng!" : "\u0110\xE3 t\u1EEB ch\u1ED1i l\u1EDDi th\xE1ch \u0111\u1EA5u." } };
          }
          case "duelSettle": {
            if (!UUID.test(String(a.id))) return { ok: true, r: { ok: false, msg: "Tr\u1EADn kh\xF4ng h\u1EE3p l\u1EC7." } };
            const d = await srv(uid, "duel_state", { duel: a.id });
            if (!d || d.status !== "finished" || d.applied) return { ok: true, r: { ok: true, applied: !!(d && d.applied) } };
            const meId = d[d.me] && d[d.me].id;
            if (d.winner && !Number.isInteger(d.pick)) return { ok: true, r: { ok: true, applied: false } };
            const opp = d.me === "a" ? d.b : d.a;
            const m = await mutate(uid, ctx, (state) => {
              const seen = state.serverSeen.duels;
              if (seen.includes(d.id)) return { r: { ok: true, applied: true }, skipSave: true };
              if (d.winner) G.arenaTransfer(state, d.prize, d.winner === meId, String(opp && opp.name || "\u0111\u1ED1i th\u1EE7").slice(0, 24));
              seen.push(d.id);
              state.serverSeen.duels = seen.slice(-SEEN_MAX);
              return { r: { ok: true, applied: true } };
            });
            await srv(uid, "duel_ack", { duel: a.id });
            return reply(m, { r: m.out.r });
          }
          default:
            return { ok: true, r: { ok: false, msg: "H\xE0nh \u0111\u1ED9ng nh\xF3m kh\xF4ng h\u1EE3p l\u1EC7." } };
        }
      }
      async function adminAccounts(uid, a, ctx) {
        if (a.type === "adminList") {
          const list = await rpc("vp_admin_list", {});
          return { ok: true, r: { ok: true, accounts: Array.isArray(list) ? list.map((x) => ({ ...x, me: x.id === uid })) : [] } };
        }
        const target = String(a.target || "");
        const inner = a.a && typeof a.a === "object" ? a.a : null;
        if (!UUID.test(target) || !inner || !["admin", "adminReset"].includes(inner.type)) return { ok: true, r: { ok: false, msg: "L\u1EC7nh kh\xF4ng h\u1EE3p l\u1EC7." } };
        if (!await load(target)) return { ok: true, r: { ok: false, msg: "Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n n\xE0y." } };
        const self = target === uid;
        const m = await mutate(target, self ? ctx : { tz: NaN, group: null }, (state, t) => {
          const { r, state: next } = A.run(state, inner, { now: t, rng, admin: true });
          return next !== state ? { r, replaceState: next } : { r };
        });
        return self ? reply(m, { r: m.out.r }) : { ok: true, r: m.out.r };
      }
      const GROUP_TYPES = /* @__PURE__ */ new Set(["visit", "treeWater", "treeFert", "treeClaim", "treeClaimTop", "duelInvite", "duelRespond", "duelSettle"]);
      async function handle(body, uid) {
        if (!body || typeof body !== "object") throw new HttpError(400, "Y\xEAu c\u1EA7u kh\xF4ng h\u1EE3p l\u1EC7.");
        if (body.v !== A.PROTOCOL) throw new HttpError(426, "Phi\xEAn b\u1EA3n game \u0111\xE3 c\u0169 \u2013 h\xE3y t\u1EA3i b\u1EA3n m\u1EDBi nh\u1EA5t \u0111\u1EC3 ch\u01A1i ti\u1EBFp.");
        const ctx = { tz: Number(body.tz), group: UUID.test(String(body.group || "")) ? body.group : null, init: body.init };
        let a = body.a;
        let isAdmin = false;
        if (body.admin) {
          const { payload, sig } = body.admin;
          if (!adminPublicKey || typeof payload !== "string" || typeof sig !== "string" || !await verifyEd25519(adminPublicKey, payload, sig)) {
            throw new HttpError(403, "Ch\u1EEF k\xFD Admin kh\xF4ng h\u1EE3p l\u1EC7.");
          }
          const p = JSON.parse(payload);
          if (p.uid !== uid || !(Math.abs(now() - Number(p.ts)) < ADMIN_WINDOW_MS)) throw new HttpError(403, "L\u1EC7nh Admin \u0111\xE3 h\u1EBFt h\u1EA1n.");
          a = p.a;
          isAdmin = true;
        }
        if (!a || typeof a !== "object" || typeof a.type !== "string") throw new HttpError(400, "H\xE0nh \u0111\u1ED9ng kh\xF4ng h\u1EE3p l\u1EC7.");
        if (A.ADMIN_TYPES.has(a.type) && !isAdmin) return { ok: true, r: { ok: false, msg: "Admin \u0111\xE3 t\u1EAFt." } };
        if (a.type === "adminList" || a.type === "adminUser") return adminAccounts(uid, a, ctx);
        if (a.type === "tick") return tick(uid, ctx);
        if (GROUP_TYPES.has(a.type)) return groupAction(uid, a, ctx);
        return gameAction(uid, a, ctx, isAdmin);
      }
      return async function handler(req) {
        const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
        if (req.method !== "POST") return json(405, { ok: false, msg: "Ch\u1EC9 nh\u1EADn POST." });
        try {
          const uid = await userOf(req);
          const body = await req.json().catch(() => null);
          return json(200, await handle(body, uid));
        } catch (e) {
          const status = e instanceof HttpError ? e.status : 500;
          if (status === 500) console.error(e);
          return json(status, { ok: false, msg: status === 500 ? "L\u1ED7i m\xE1y ch\u1EE7 tr\xF2 ch\u01A1i." : e.message });
        }
      };
    }
    module.exports = { createHandler: createHandler2, publicState, verifyEd25519 };
  }
});

// supabase/functions/game/admin-key.js
var require_admin_key = __commonJS({
  "supabase/functions/game/admin-key.js"(exports, module) {
    module.exports = "MCowBQYDK2VwAyEAikeBVrp3kW7ZEDE+QysgaPAWlVQ5phbC4XU0+okRrVc=";
  }
});

// supabase/functions/game/entry.js
var { createHandler } = require_game();
var ADMIN_PUBLIC_KEY = require_admin_key();
var env = (k) => Deno.env.get(k) || "";
function serviceKey() {
  if (env("SUPABASE_SERVICE_ROLE_KEY")) return env("SUPABASE_SERVICE_ROLE_KEY");
  try {
    const ks = JSON.parse(env("SUPABASE_SECRET_KEYS"));
    return ks.default || Object.values(ks)[0] || "";
  } catch (_) {
    return "";
  }
}
Deno.serve(createHandler({
  url: env("SUPABASE_URL"),
  serviceKey: serviceKey(),
  adminPublicKey: env("VP_ADMIN_PUBLIC_KEY") || ADMIN_PUBLIC_KEY
}));
