# Thiết kế Vườn Pixel

## 1. Thư viện / công nghệ (nghiên cứu 11/2026)

| Nhu cầu | Đã chọn | Phương án khác | Lý do chọn |
|---|---|---|---|
| Khung app desktop | **Electron** | Tauri 2 (bộ cài ~8–10MB nhưng cần Rust + VS Build Tools; phần mạng phải viết Rust), NW.js, Neutralinojs | Đồng nghiệp chỉ cần Node.js để `npm start`; Node có sẵn `dgram`/`http` cho chế độ LAN |
| Cửa sổ thanh ngang | API `BrowserWindow` (frameless, transparent, alwaysOnTop, skipTaskbar) + `screen.workArea` | — | Có sẵn, không cần native module |
| Vẽ pixel | **Canvas 2D** + `image-rendering: pixelated` | PixiJS, Phaser 3, KAPLAY | Vườn ít đối tượng, không cần engine; giữ app nhẹ |
| Đóng gói `.exe` | **electron-builder** (portable + NSIS) | Electron Forge | Cấu hình ngắn trong `package.json` |
| Lưu game | File JSON (ghi tạm → đổi tên) | electron-store, better-sqlite3 | Đủ cho 1 người chơi, dễ sửa tay |
| Test | `node:test` có sẵn | Jest, Vitest | Không thêm thư viện |
| LAN – tìm máy (giai đoạn 2) | `dgram` UDP broadcast (Node có sẵn) | `bonjour-service` (mDNS) | Không thêm thư viện; mDNS hay bị chặn trong mạng doanh nghiệp |
| LAN – giao tiếp (giai đoạn 2) | `http` có sẵn + `ws` (WebSocket) | socket.io, fastify | `ws` nhỏ, phổ biến |
| Vẽ / sửa sprite | — | Aseprite (trả phí), LibreSprite, Piskel (miễn phí) | Dùng khi tự làm asset pack |

Asset pack gợi ý và giấy phép: xem `assets/packs/README.md`.

## 2. Thời gian theo giờ làm

- Mặc định: T2–T6, 08:00–17:00, nghỉ trưa 12:00–13:00 → **8 giờ làm/ngày**. Chỉnh được trong Cài đặt.
- Chỉ các phút trong giờ làm mới được tính: cây lớn, nước cạn, hoa tàn. Ngoài giờ vườn "ngủ".
- App tắt rồi mở lại: vườn được "tua" phần giờ làm đã trôi qua (`advance` trong `src/core/garden.js`).
  Nếu vắng > 10 phút (tắt app, máy ngủ, nghỉ phép) cây không chết, máu tối thiểu 30%.
- Thời gian ra hoa rút gọn còn **2–8 giờ** (lâu nhất = 1 ngày vườn: gieo hôm nay, hôm sau nở).

**Nhịp tưới** (cây khát khi nước < 25%, ví dụ 8 giờ làm/ngày):

| Loài | Cạn nước sau | Tưới khoảng |
|---|---|---|
| Sen | 2 giờ | 5 lần/ngày (thử thách) |
| Hướng dương, păng-xê | 2g30 | 4 lần/ngày |
| Vạn thọ, zinnia, hồng, tulip, mõm sói | 3 giờ | 3–4 lần/ngày |
| Sao nhái, mười giờ | 4–4g30 | 2–3 lần/ngày |
| Hoa giấy, oải hương, quỳnh, lan | 5–7 giờ | 1–2 lần/ngày |
| Xương rồng | 9 giờ | 1 lần/ngày |

→ Nhịp hợp lý cho dân văn phòng: tưới đầu giờ sáng, trước nghỉ trưa, đầu giờ chiều, trước khi về.

## 3. Dữ liệu cây (nguồn số ngày ra hoa)

| Loài | Ngoài đời | Trong game | Đặc biệt |
|---|---|---|---|
| Mười giờ | 6–8 tuần | 3 giờ | Hoa chỉ mở khi nắng → nở 10:00–15:00 |
| Cúc vạn thọ | 50–60 ngày | 3g30 | |
| Zinnia | 60–70 ngày | 4 giờ | |
| Sao nhái (Cosmos) | 50–90 ngày | 4g30 | |
| Păng-xê | 60–90 ngày | 5 giờ | Ưa ẩm |
| Hướng dương | 70–120 ngày | 6 giờ | Cần nhiều nước |
| Mõm sói | 85–120 ngày | 7 giờ | |
| Sen | ~2–3 tháng | 8 giờ | Nở sáng 08:00–11:00, nhanh khát, ra hoa lại |
| Hồng (cành giâm) | 2–3 tháng | 9 giờ | Ra hoa lại 5 lần |
| Tulip (củ) | 3–4 tháng | 10 giờ | |
| Hoa giấy | ~6 tháng | 12 giờ | "Cánh" là lá bắc; chịu hạn |
| Oải hương | ~1 năm | 18 giờ | Ưa khô |
| Xương rồng | 2–3 năm | 27 giờ | Hoa chỉ giữ ~1 ngày |
| Quỳnh | 2–3 năm | 27 giờ | Nở đêm → trong game nở 16:00–17:00, tàn sau 1 giờ |
| Lan hồ điệp | 2–3 năm | 36 giờ | Hoa bền lâu |

Nguồn: [Epic Gardening – Days from seed to bloom](https://www.epicgardening.com/?p=338080),
[NC State Extension – Portulaca grandiflora](https://plants.ces.ncsu.edu/plants/portulaca-grandiflora),
[Wisconsin Horticulture – Moss rose](https://hort.extension.wisc.edu/articles/moss-rose-portulaca-grandiflora),
[Báo Pháp Luật – Được mùa quỳnh thơm](https://baophapluat.vn/duoc-mua-quynh-thom-post142897.html),
[Gardena – The flower clock](https://cmsprod.gardena.com/global/garden-life/garden-magazine/the-flower-clock).
Các con số đã được làm tròn cho phù hợp game.

## 4. Kinh tế

- Bắt đầu 60 xu, 4 ô chậu, 1 phân bón. Ô thêm: 150 → 300 → 600… (tối đa 12).
- EXP lên cấp: `60 × cấp^1.5` (cấp 1→2: 60, 5→6: 671, 10→11: 1897).
- Tưới: +1 EXP. Thu hoạch: tiền/EXP theo loài × hệ số chậu & trang trí; hoa tàn còn 40%, cây yếu (<50% máu) còn 70%.
- Cấp mở khoá loài, chậu, đồ trang trí; "Bình tưới lớn" (cấp 5) mở nút Tưới tất cả.

## 5. Chế độ mạng LAN

Đã có bản đầu trong `src/main/lan.js` và panel **Bạn bè & chat LAN**. Giao thức dùng HTTP trên một địa chỉ IPv4
nội bộ do chủ phòng chọn; từng lời mời có khoá riêng để mã hoá nội dung bằng AES-256-GCM. Không dùng UDP
broadcast hoặc máy chủ Internet. Chat là phòng chung do máy mở phòng chuyển tiếp, lưu tối đa 50 tin trong bộ nhớ.
Chưa kiểm thử trực tiếp trên hai máy Windows và với Windows Firewall của mạng thực tế.

Yêu cầu đã chốt: chỉ chơi trong LAN, không truy cập file hoặc thông tin máy của người khác. Có danh sách bạn bè,
thăm vườn để tưới hộ, hái trộm hoa **chỉ khi chủ vườn đã thu gọn thành thanh nhỏ (tự chuyển Vắng mặt)**, và phòng chat chung cho
những người cùng phòng LAN. Vắng mặt nghĩa là app vẫn chạy để máy chủ vườn tự xử lý hành động;
khi app tắt thì không thể thăm hay hái trộm vườn đó.

### Kết nối và quyền riêng tư

- Chế độ LAN mặc định **tắt**. Một người chủ động mở phòng LAN và mời bạn bằng địa chỉ nội bộ cùng lời mời riêng,
  có hạn sử dụng. Không tự tìm máy, không UDP broadcast, không Internet, không máy chủ ngoài LAN.
- Danh sách bạn bè chỉ gồm người đã chấp nhận lời mời; có thể xoá/chặn, xem trạng thái Đang chơi / Vắng mặt /
  Mất kết nối. Trạng thái Vắng mặt tự theo chế độ giao diện `collapsed`, không suy từ lịch hoạt động hay đồng hồ hệ thống.
- Chat thế giới là phòng chat của những người đã vào **cùng phòng LAN**. Máy mở phòng chuyển tiếp tin nhắn;
  không lưu lịch sử chat vào save game. Nội dung chat hiển thị bằng text an toàn, giới hạn độ dài và tốc độ gửi.
- Không gửi `G.view(state)` qua mạng: hàm đó có lịch hoạt động, tên chủ, nhật ký, kho đồ và các thời gian tính sẵn.
  Tạo `publicGarden()` bằng danh sách trường cho phép: hình chậu/cây/trang trí/pet và trạng thái cần để chơi.
  Không gửi `settings`, lịch, `clock`, thời điểm gieo, thời gian dự kiến nở, xu, EXP, kho, nhật ký hay đường dẫn máy.
  Người xem liên tục vẫn có thể suy ra nhịp chơi từ thay đổi trong vườn; cần giới hạn cập nhật và cho chủ vườn
  quyền dừng chia sẻ ngay.
- Kết nối phải được xác thực theo từng bạn và mã hoá. Chỉ nghe trên card mạng nội bộ đã chọn; giới hạn thêm
  ứng dụng/cổng/IP được phép bằng Windows Firewall. IP nội bộ **không phải** bằng chứng người truy cập đáng tin.
  Không đưa mã mời hoặc khoá phiên vào URL, nhật ký hay tin nhắn chat.

### Hành động trong vườn

- Máy chủ của **chính vườn đó** kiểm tra quyền và quyết định kết quả. API mạng chỉ có xem bản vườn công khai,
  tưới hộ và hái trộm; không mở IPC `ACTIONS`, Admin, file save hay API hệ điều hành cho khách.
- `visitWater` và `visitSteal` trong `src/core/garden.js` là nền logic hiện có. Trước khi gọi, lớp mạng phải xác thực
  người gửi, kiểm tra ô, giới hạn tần suất, giới hạn độ dài dữ liệu và quyền của hành động.
- Hái trộm chỉ được xử lý khi chủ vườn đang Vắng mặt **và vẫn kết nối**. Chủ vườn kiểm tra điều này ngay lúc nhận
  yêu cầu, không tin trạng thái do khách hoặc máy mở phòng gửi. Mỗi khách tối đa 1 lần trên một đợt nở, tối đa
  3 lần/giờ; hoa đã tàn không được lấy. Pet/trang trí vẫn chặn theo luật hiện hành. Dấu 👣 chỉ ghi tên hiển thị
  đã xác thực, không nhận chuỗi tên tuỳ ý từ khách.
- Phần thưởng tưới/trộm và nhật ký chỉ là dữ liệu game; không truy cập thông tin máy người khác. Mọi tin nhắn
  mạng có cấu trúc cố định, giới hạn kích thước và được kiểm thử với dữ liệu lỗi, yêu cầu lặp và người chưa ghép cặp.

### Điều kiện kiểm thử trước khi bật LAN

Kiểm tra trên hai máy Windows thật: dùng tài khoản chưa được mời để xác nhận không xem/không hành động được;
kiểm tra gói tin không chứa lịch, tên máy, đường dẫn, save, kho hay nhật ký; thử thoát app, mất mạng, đổi IP,
thu hồi lời mời, gửi chat quá dài và gửi nhiều yêu cầu liên tiếp. Không mở LAN mặc định trong bản đóng gói
cho tới khi các kiểm tra này đạt.
