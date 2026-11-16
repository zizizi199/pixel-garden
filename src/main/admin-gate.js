'use strict';

// Công cụ Admin chỉ dành cho phiên chạy mã nguồn có chủ ý bật kiểm thử.
// Bản đóng gói luôn từ chối, kể cả khi máy người chơi đặt biến môi trường.
module.exports = (isPackaged, env = process.env) => !isPackaged && env.PIXEL_GARDEN_ADMIN === '1';
