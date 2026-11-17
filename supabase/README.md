# Nhóm chơi chung qua Supabase

Supabase thay cho máy trung chuyển Cloudflare: có database nên **thăm vườn, tưới hộ, hái trộm được cả khi
chủ vườn đã tắt game**, chat nhóm lưu 7 ngày, không cần ai làm "chủ phòng".

Từ bản 0.3, **vườn, xu, EXP, đồ… của mọi người chơi lưu trên Supabase** (bảng `vp_saves`) và được tính bởi
**máy chủ trò chơi** – Edge Function `game` (`server/game.js` + `src/core`, gộp thành `supabase/functions/game/index.ts`).
Game trên máy chỉ gửi "muốn làm gì", nên sửa file save / bộ nhớ / gọi thẳng API đều không cộng được xu.
Game **cần Internet** để chơi (mất mạng vẫn xem được vườn, nhưng không thao tác được).

## Cài đặt (1 lần, ~10 phút)

1. Vào <https://supabase.com> → đăng nhập → **New project** (gói Free; Region nên chọn Singapore).
2. **Authentication › Sign In / Providers** → bật **Allow anonymous sign-ins** → Save.
3. **SQL Editor › New query** → dán toàn bộ `supabase/schema.sql` → **Run** (chạy lại nhiều lần không sao – mỗi khi
   file này được cập nhật, ví dụ khi thêm Đấu trường thú, hãy chạy lại).
4. **Project Settings › API Keys** (hoặc **Data API**): copy **Project URL** (`https://xxxx.supabase.co`)
   và **anon / publishable key**. **Không** dùng `service_role` / secret key.
5. Bấm đúp `supabase\cau-hinh-supabase.cmd`, dán 2 giá trị trên → script ghi vào `package.json`.
6. **Máy chủ trò chơi**: bấm đúp `supabase\deploy-game.cmd` → dán Access Token (tạo ở
   <https://supabase.com/dashboard/account/tokens> › Generate new token). Script gộp mã và deploy Edge Function `game`
   (tắt "Verify JWT" – hàm tự kiểm tra đăng nhập). **Chạy lại mỗi khi sửa `src/core` hoặc `server/`.**
   Không muốn dùng token: Dashboard › **Edge Functions › Deploy a new function › Via Editor** → tên `game` →
   dán toàn bộ `supabase/functions/game/index.ts` → Deploy → trong Settings của hàm tắt **Verify JWT**.
7. Chạy `scripts\publish-release.cmd` để phát hành bản mới cho đồng nghiệp.

**Thứ tự khi cập nhật:** chạy `schema.sql` mới + deploy `game` **trước**, rồi mới phát hành bản game. Bản game cũ
(lưu vườn trên máy) sẽ không dùng được tính năng nhóm nữa (máy chủ đã khoá các hàm cũ) – nhắc mọi người tải bản mới.

## Lưu game trên máy chủ & Admin

- Lần đầu mở bản mới, mỗi người **bắt đầu vườn mới trên máy chủ** (chỉ giữ Cài đặt) – save cũ trên máy có thể đã bị sửa.
- Tài khoản = đăng nhập ẩn danh lưu trong `lan.sec` (thư mục dữ liệu, mã hoá theo tài khoản Windows). Mất file này
  (cài lại Windows, đổi máy) là mất quyền vào vườn cũ. Admin khôi phục được bằng SQL:
  `update vp_saves set user_id = '<mã mới>' where user_id = '<mã cũ>';` (mã cũ được game nhớ trong `lan.sec` → `auth.prev`).
- Nút Admin vẫn chỉ hiện trên máy admin (`%APPDATA%\vuon-pixel-admin.key`). Mỗi lệnh Admin được **ký Ed25519** bằng khoá bí mật
  `%USERPROFILE%\.vuon-pixel-admin\admin-private.pem` (chỉ có trên máy admin); máy chủ kiểm chữ ký bằng `adminPublicKey`
  (gộp vào index.ts lúc build, hoặc đặt biến môi trường `VP_ADMIN_PUBLIC_KEY` của Edge Function). Chữ ký gắn với tài khoản
  và chỉ có hiệu lực 2 phút. Đổi khoá Admin → chạy lại `deploy-game.cmd`.
- Xem/sửa vườn của ai đó: SQL Editor › `select state from vp_saves where user_id = '…'`.
- Gói Free: Edge Functions 500.000 lượt gọi/tháng. Mỗi người đang mở game ≈ 1 lượt/phút + 1 lượt mỗi thao tác
  (~600 lượt/ngày làm việc) → thoải mái cho vài chục người.

Trong game: **🌐 Bạn bè & chat › 🌱 Tạo nhóm mới** → gửi riêng **mã nhóm** `VP-XXXX-…` cho đồng nghiệp →
họ dán vào ô **Vào nhóm**.

## Đấu trường thú – từ tiếng Anh lấy online

Từ được lấy từ từ điển **Datamuse** (`api.datamuse.com`, miễn phí, không cần khoá) bằng extension **http** của
Supabase (schema.sql tự bật). Mỗi độ dài giữ ~300 từ thông dụng nhất, lưu đệm 7 ngày rồi tải lại; có bộ lọc từ
không phù hợp nơi công sở. Nếu Datamuse không phản hồi và chưa có từ đệm, game báo "Không lấy được từ tiếng Anh online".
Nếu SQL Editor báo không bật được extension http: vào **Database › Extensions**, bật **http** rồi chạy lại schema.sql.

## Bảo mật

- Anon key nằm trong game là bình thường (khoá công khai). Mọi bảng bật RLS **không có policy** nên không ai
  đọc/ghi thẳng được; game chỉ gọi các hàm `vp_*` và mỗi hàm tự kiểm tra người gọi là thành viên nhóm.
- Mã nhóm không gửi lên server (chỉ gửi SHA-256). Chat mã hoá AES-256-GCM bằng khoá suy ra từ mã nhóm:
  Supabase không đọc được nội dung chat. Biệt danh và ảnh chụp vườn (chậu, hoa, % nước, pet) thì server thấy được.
- Toàn bộ vườn (kể cả Cài đặt: giờ vườn hoạt động, múi giờ) nằm trên máy chủ để máy chủ tính được thời gian cây lớn.
  Người chơi khác không đọc được bảng `vp_saves`; họ chỉ thấy ảnh chụp vườn (chậu, hoa, % nước, pet) do máy chủ tạo.
- Tưới hộ / hái trộm, Thần mộc, Đấu trường: chỉ Edge Function gọi được các hàm có cộng/trừ đồ (qua `vp_srv`, cần
  khoá service_role – khoá này Supabase tự cấp cho Edge Function, không nằm trong game).
- Gói Free: dự án tự **tạm dừng sau 7 ngày không ai dùng** – vào dashboard bấm Restore là chạy lại.

## Chạy thử trên máy

`supabase start` (Supabase CLI) rồi chạy game với
`set PIXEL_GARDEN_SUPABASE_URL=http://127.0.0.1:54321 && set PIXEL_GARDEN_SUPABASE_KEY=<anon key> && npm start`.
