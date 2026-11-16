# Asset pack hình ảnh

Mặc định game tự vẽ sprite pixel bằng code nên chạy được ngay, không cần tải gì.
Muốn hình đẹp hơn thì thêm asset pack theo cách dưới đây. Pack có thể chỉ thay **một phần**
(ví dụ chỉ hoa hồng, hoặc chỉ chậu); phần còn thiếu vẫn dùng hình mặc định.

## Cách thêm một pack

1. Tải pack (PNG) về, giải nén vào `assets/packs/<ten-pack>/`
   (hoặc `%APPDATA%/pixel-garden/packs/<ten-pack>/` nếu không muốn sửa thư mục cài đặt).
2. Tạo file `manifest.json` trong thư mục đó, khai báo ảnh nào ứng với cây/chậu/đồ nào
   (mẫu đầy đủ: [`manifest.example.json`](manifest.example.json)).
3. Trong game: **Cài đặt → Quét lại pack**.

Mỗi ảnh khai báo theo 1 trong 2 dạng:

```jsonc
"bloom": "flowers/rose.png"                                   // cả file ảnh
"bloom": { "file": "sheet.png", "x": 32, "y": 0, "w": 16, "h": 32 } // cắt 1 ô trong spritesheet
```

Giai đoạn của cây: `seed`, `sprout`, `young`, `bud`, `bloom`, `faded`, `dead`.
**Chỉ cần khai báo `bloom`**: game tự tạo `sprout`, `young`, `bud` bằng cách tách phần lá/thân khỏi bông hoa
trong chính ảnh đó (nên khớp nét và màu của pack); thiếu `faded` thì dùng ảnh `bloom` làm nhạt màu.

Thuộc tính thêm cho mọi ảnh:

| Thuộc tính | Ý nghĩa | Ví dụ |
|---|---|---|
| `filter` | Đổi màu bằng CSS filter (tạo biến thể từ 1 ảnh) | `"hue-rotate(200deg) saturate(1.4)"` |
| `scale` | Số px màn hình cho 1 pixel ảnh (mặc định 3) | `2` |
| `frames`, `dx`, `fps` | Hoạt ảnh: số khung xếp ngang, bước giữa 2 khung (mặc định = `w`), tốc độ | `4`, `32`, `8` |

Pet có thể khai báo theo trạng thái và thêm phụ kiện để tạo pet hiếm từ thú thường:

```jsonc
"ky_lan": {
  "walk":  { "file": "cat.png", "x": 0,  "y": 0, "w": 32, "h": 32, "frames": 6, "fps": 8 },
  "idle":  { "file": "cat.png", "x": 0,  "y": 32, "w": 32, "h": 32, "frames": 4 },
  "sleep": { "file": "cat.png", "x": 0,  "y": 64, "w": 32, "h": 32, "frames": 2, "fps": 2 },
  "faces": "right",                      // hướng nhìn của ảnh gốc
  "filter": "hue-rotate(250deg) brightness(1.3)",
  "fx": ["horn", "sparkle", "glow:#c77dff"]   // crown, halo, horn, wings, bow, flame, sparkle[:màu], glow:màu
}
```

Mã loài cây (`plants`): `muoi_gio`, `van_tho`, `cuc_zinnia`, `sao_nhai`, `pang_xe`, `huong_duong`, `moi_soi`,
`hoa_sen`, `hoa_hong`, `tulip`, `hoa_giay`, `oai_huong`, `xuong_rong`, `hoa_quynh`, `lan_ho_diep`.

Mã chậu (`pots`): `nhua`, `dat_nung`, `su_trang`, `go`, `men_lam`, `ngoc`, `vang`.

Mã đồ trang trí (`decor`): `hang_rao`, `den_long`, `chuong_gio`, `ech_gom`, `ghe_da`, `meo_ngu`, `bu_nhin`, `dai_phun`.

Mã pet (`pets`, mỗi pet 1 ảnh, mặt hướng như sprite gốc trong `src/core/pets.js`): `oc_sen`, `ga_con`, `ech_xanh`, `vit_con`,
`chuot_dong`, `meo_muop`, `cho_co`, `tho_trang`, `nhim`, `soc_nau`, `rua_go`, `chim_se`, `ca_koi`, `cao_lua`, `gau_truc_do`,
`buom_phuong`, `cu_meo`, `chim_cong`, `ky_lan`, `cuu_vi_ho`, `rong_may`, `phuong_hoang`.

Ảnh cây hiển thị cao 90px, chậu 60×33px; nên dùng sprite tỉ lệ khoảng 2:3 (vd 16×24, 16×32, 32×48).

## Pack gợi ý và bản quyền — đọc trước khi đẩy lên GitHub

| Pack | Giá | Giấy phép | Được đưa vào repo GitHub? |
|---|---|---|---|
| [Free Pixel Art Flower Pack – Karsiori](https://karsiori.itch.io/free-pixel-art-flower-pack) | Miễn phí | CC0 1.0 | **Được** (CC0, ghi công là tuỳ chọn) |
| [Pixel Flowers Farm Pack 16x32 – Pixelmoth](https://pixelmoth.itch.io/pixel-flowers-farm-pack-16x32-18-plants-set) | từ $2.99 | Riêng của tác giả: cấm phân phối lại file gốc | **Không** – mỗi người tự mua/tải |
| [Growing Plant Animations – SnowDayDev](https://snowdaydev.itch.io/growing-plant-animations) | từ $2 | Riêng của tác giả: cấm phân phối lại | **Không** |
| [Rustic Pots Pixelart Pack – Liamlie](https://liamlie.itch.io/rustic-pots-pixelart-pack) | Tự chọn giá | Bắt buộc ghi công, đọc file T.O.S kèm theo | Đọc T.O.S trước |

`.gitignore` đã bỏ qua mọi thư mục con trong `assets/packs/` để tránh lỡ đẩy pack trả phí lên GitHub.
Với pack CC0 muốn đưa vào repo: `git add -f assets/packs/<ten-pack>`.

Giấy phép trên được đọc từ trang itch.io tháng 11/2026 — tác giả có thể đổi, hãy kiểm tra lại khi tải.
