# Nhóm chơi chung qua Supabase

Supabase thay cho máy trung chuyển Cloudflare: có database nên **thăm vườn, tưới hộ, hái trộm được cả khi
chủ vườn đã tắt game**, chat nhóm lưu 7 ngày, không cần ai làm "chủ phòng".

## Cài đặt (1 lần, ~10 phút)

1. Vào <https://supabase.com> → đăng nhập → **New project** (gói Free; Region nên chọn Singapore).
2. **Authentication › Sign In / Providers** → bật **Allow anonymous sign-ins** → Save.
3. **SQL Editor › New query** → dán toàn bộ `supabase/schema.sql` → **Run** (chạy lại nhiều lần không sao – mỗi khi
   file này được cập nhật, ví dụ khi thêm Đấu trường thú, hãy chạy lại).
4. **Project Settings › API Keys** (hoặc **Data API**): copy **Project URL** (`https://xxxx.supabase.co`)
   và **anon / publishable key**. **Không** dùng `service_role` / secret key.
5. Bấm đúp `supabase\cau-hinh-supabase.cmd`, dán 2 giá trị trên → script ghi vào `package.json`.
6. Chạy `scripts\publish-release.cmd` để phát hành bản mới cho đồng nghiệp.

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
- Không gửi lịch hoạt động. Tưới hộ / hái trộm được kiểm tra trên server (hoa nở, chủ vắng mặt hoặc tắt game
  quá 30 giây, pet canh vườn, đồ trang trí chống trộm); game của chủ áp kết quả khi mở lại.
- Gói Free: dự án tự **tạm dừng sau 7 ngày không ai dùng** – vào dashboard bấm Restore là chạy lại.

## Chạy thử trên máy

`supabase start` (Supabase CLI) rồi chạy game với
`set PIXEL_GARDEN_SUPABASE_URL=http://127.0.0.1:54321 && set PIXEL_GARDEN_SUPABASE_KEY=<anon key> && npm start`.
