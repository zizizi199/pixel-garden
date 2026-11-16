# Máy trung chuyển phòng Internet (Cloudflare Worker)

Dùng khi mạng công ty chặn kết nối LAN giữa các máy. Mọi người chỉ kết nối **ra** Cloudflare,
không ai phải mở cổng hay chỉnh tường lửa.

- Trạm chỉ chuyển tiếp dữ liệu đã được game mã hoá đầu-cuối (AES-256-GCM, khoá nằm trong mã mời).
  Cloudflare không đọc hay sửa được tin chat, tên, vườn.
- Trạm không lưu tin nhắn. Mỗi phòng chỉ lưu dấu băm khoá chủ phòng (để người khác không chiếm phòng),
  tự xoá sau 30 ngày không dùng.
- Gói miễn phí của Cloudflare Workers đủ cho vài phòng chơi hằng ngày (WebSocket ngủ đông khi rảnh).

## Cài đặt (1 lần)

Bấm đúp `relay\deploy-relay.cmd`: cài wrangler → đăng nhập Cloudflare (trình duyệt) → deploy →
dán địa chỉ `https://pixel-garden-relay.<tên>.workers.dev` → script ghi `relayUrl` (dạng `wss://…`)
vào `package.json` của game. Sau đó chạy `scripts\publish-release.cmd` để phát hành bản mới.

Thử trên máy: `cd relay && npx wrangler dev --port 8787`, rồi chạy game với
`set PIXEL_GARDEN_RELAY=ws://127.0.0.1:8787 && npm start`.

## Giao thức

WebSocket `wss://<trạm>/room/<mã phòng>?role=host&token=…` hoặc `?role=guest&peer=<mã khách>`.
Khung tin JSON: khách → `{to:'host', n, body}`; chủ → `{to:<mã khách>, n, status, body}`.
Trạm gắn `from` theo kết nối (khách không giả mạo được), báo `{sys:'host-offline'}` khi chủ vắng.
