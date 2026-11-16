'use strict';
/**
 * Trang trí:
 *  - POT_DECOR: đồ trang trí cho TỪNG chậu. Mỗi chậu có 4 chỗ:
 *      soil  (trên mặt đất trong chậu), front (mặt trước chậu), left / right (cắm cạnh chậu).
 *    Mỗi món chỉ buff cho chậu được đặt. fx: water (+% giữ ẩm), growth (+% lớn nhanh),
 *    sell (+% tiền), exp (+% EXP), guard (tỉ lệ chặn hái trộm ở ô này).
 *  - HOUSE_LEVELS / HOUSE_DECOR: nhà thú (hiện khi đã có pet). Nâng cấp làm nhà đẹp hơn và
 *    pet ngủ ít hơn sau khi chặn trộm; đồ trang trí nhà thú chỉ để làm đẹp.
 */

const POT_SLOTS = ['soil', 'front', 'left', 'right'];
const SLOT_NAMES = { soil: 'Mặt đất', front: 'Mặt chậu', left: 'Cạnh trái', right: 'Cạnh phải' };

const POT_DECOR = [
  // trên mặt đất
  { id: 'soi_trang', name: 'Sỏi trắng', place: 'soil', tier: 0, price: 40, level: 1, fx: { water: 0.05 }, desc: '+5% giữ ẩm.' },
  { id: 'reu_xanh', name: 'Thảm rêu', place: 'soil', tier: 0, price: 70, level: 2, fx: { water: 0.08 }, desc: '+8% giữ ẩm.' },
  { id: 'nam_nho', name: 'Nấm tí hon', place: 'soil', tier: 1, price: 90, level: 3, fx: { growth: 0.05 }, desc: '+5% lớn nhanh.' },
  { id: 'chu_lun', name: 'Chú lùn gốm', place: 'soil', tier: 2, price: 260, level: 5, fx: { sell: 0.08 }, desc: '+8% tiền.' },
  // mặt chậu
  { id: 'no_do', name: 'Nơ đỏ', place: 'front', tier: 0, price: 50, level: 1, fx: { exp: 0.03 }, desc: '+3% EXP.' },
  { id: 'the_ten', name: 'Thẻ tên gỗ', place: 'front', tier: 0, price: 80, level: 2, fx: { exp: 0.05 }, desc: '+5% EXP.' },
  { id: 'day_den', name: 'Dây đèn mini', place: 'front', tier: 1, price: 180, level: 4, fx: { exp: 0.05, sell: 0.03 }, desc: '+5% EXP, +3% tiền.' },
  { id: 'huy_hieu', name: 'Huy hiệu vàng', place: 'front', tier: 2, price: 420, level: 7, fx: { sell: 0.1 }, desc: '+10% tiền.' },
  // cắm cạnh chậu (trái hoặc phải)
  { id: 'chong_chong', name: 'Chong chóng', place: 'side', tier: 0, price: 90, level: 2, fx: { water: 0.05 }, desc: '+5% giữ ẩm.' },
  { id: 'den_cam', name: 'Đèn cắm vườn', place: 'side', tier: 1, price: 130, level: 3, fx: { growth: 0.05 }, desc: '+5% lớn nhanh.' },
  { id: 'chuong_gio', name: 'Chuông gió', place: 'side', tier: 1, price: 150, level: 3, fx: { water: 0.08 }, desc: '+8% giữ ẩm.' },
  { id: 'buom_que', name: 'Bướm cắm que', place: 'side', tier: 1, price: 160, level: 4, fx: { exp: 0.06 }, desc: '+6% EXP.' },
  { id: 'bu_nhin', name: 'Bù nhìn mini', place: 'side', tier: 2, price: 260, level: 5, fx: { guard: 0.2 }, desc: 'Chặn 20% hái trộm ô này.' },
  { id: 'ca_chep', name: 'Đèn cá chép', place: 'side', tier: 4, wheel: true, price: 500, level: 1, fx: { sell: 0.1, water: 0.1 }, desc: '+10% tiền, +10% giữ ẩm.' },
  { id: 'ngoi_sao', name: 'Que sao băng', place: 'side', tier: 5, wheel: true, price: 900, level: 1, fx: { exp: 0.15, growth: 0.1, guard: 0.1 }, desc: '+15% EXP, lớn nhanh +10%, chặn 10% trộm.' },
  { id: 'rong_vang', name: 'Tượng rồng vàng', place: 'soil', tier: 6, wheel: true, price: 1600, level: 1, fx: { sell: 0.2, exp: 0.15, guard: 0.2 }, desc: 'Bí ẩn: +20% tiền, +15% EXP, chặn 20% trộm.' },
  { id: 'hang_rao_trang', name: 'Hàng rào trắng mini', place: 'side', tier: 1, wheel: true, price: 70, level: 1, fx: { guard: 0.05, water: 0.03 }, desc: 'Chặn 5% trộm, +3% giữ ẩm.' },
  { id: 'den_hoi_an', name: 'Đèn lồng Hội An', place: 'side', tier: 3, wheel: true, price: 300, level: 1, fx: { exp: 0.08, sell: 0.05 }, desc: '+8% EXP, +5% tiền.' },
  { id: 'hoa_dang', name: 'Hoa đăng', place: 'soil', tier: 5, wheel: true, price: 950, level: 1, fx: { exp: 0.12, growth: 0.12, water: 0.1 }, desc: '+12% EXP, lớn nhanh +12%, giữ ẩm +10%.' },
  { id: 'meo_su', name: 'Mèo sứ vẫy tay', place: 'side', tier: 3, wheel: true, price: 380, level: 1, fx: { guard: 0.15, sell: 0.05 }, desc: 'Chặn 15% hái trộm, +5% tiền.' },
];

/** Nhà thú: nâng cấp tuần tự. sleepMin = số phút pet ngủ sau khi chặn trộm. */
const HOUSE_LEVELS = [
  { level: 1, name: 'Hộp các-tông', price: 0, sleepMin: 30, desc: 'Nhà đầu tiên của pet.' },
  { level: 2, name: 'Nhà gỗ', price: 800, sleepMin: 25, desc: 'Pet ngủ 25 phút sau khi chặn trộm.' },
  { level: 3, name: 'Nhà mái ngói đỏ', price: 3000, sleepMin: 20, desc: 'Pet ngủ 20 phút sau khi chặn trộm.' },
  { level: 4, name: 'Lâu đài mini', price: 10000, sleepMin: 15, desc: 'Pet chỉ ngủ 15 phút sau khi chặn trộm.' },
];

const HOUSE_SLOTS = ['roof', 'window', 'side', 'front'];
const HOUSE_SLOT_NAMES = { roof: 'Mái', window: 'Cửa sổ', side: 'Bên cạnh', front: 'Trước cửa' };

const HOUSE_DECOR = [
  { id: 'co_do', name: 'Cờ đuôi nheo đỏ', place: 'roof', tier: 0, price: 100, desc: 'Phấp phới trên mái.' },
  { id: 'co_sao', name: 'Cờ sao vàng', place: 'roof', tier: 1, price: 180, desc: 'Cờ vàng có ngôi sao.' },
  { id: 'hop_hoa', name: 'Hộp hoa cửa sổ', place: 'window', tier: 1, price: 150, desc: 'Hoa nhỏ bên cửa sổ.' },
  { id: 'rem_ke', name: 'Rèm kẻ caro', place: 'window', tier: 0, price: 120, desc: 'Rèm cửa xinh xắn.' },
  { id: 'den_long_nha', name: 'Đèn lồng', place: 'side', tier: 2, price: 160, desc: 'Đèn lồng đỏ đung đưa.' },
  { id: 'cay_bui', name: 'Bụi cây tròn', place: 'side', tier: 0, price: 110, desc: 'Bụi cây cắt tỉa tròn.' },
  { id: 'bat_an', name: 'Bát ăn', place: 'front', tier: 0, price: 60, desc: 'Bát đồ ăn cho pet.' },
  { id: 'tham_cua', name: 'Thảm chùi chân', place: 'front', tier: 1, price: 90, desc: 'Thảm hồng trước cửa.' },
];

// Một mô hình ở khoảng trống cạnh nhà thú và một phông nền phủ bầu trời.
// Các món `wheel` được nhận trực tiếp từ vòng quay; các món khác mua một lần.
const SCENE_OBJECTS = [
  { id: 'vuon_buom', name: 'Công viên bướm', tier: 0, price: 420, level: 1, desc: 'Bướm bay quanh lối dạo hoa.' },
  { id: 'ho_ca_may', name: 'Hồ cá trên mây', tier: 1, price: 760, level: 3, desc: 'Cá nhỏ bơi giữa các đám mây.' },
  { id: 'du_quay_keo', name: 'Đu quay kẹo ngọt', tier: 2, price: 1350, level: 6, desc: 'Đu quay tí hon xoay bên nhà thú.' },
  { id: 'thap_dong_ho', name: 'Tháp đồng hồ hoa', tier: 2, price: 1850, level: 8, desc: 'Kim đồng hồ quay trên tháp hoa.' },
  { id: 'cong_cau_vong', name: 'Cổng cầu vồng', tier: 3, price: 2400, level: 10, desc: 'Cầu vồng và sao lấp lánh.' },
  { id: 'banh_xe_sao', name: 'Vòng quay ngôi sao', tier: 3, wheel: true, price: 3000, level: 1, desc: 'Vòng quay rực sáng chỉ có từ vòng quay may mắn.' },
  { id: 'cay_uoc_nguyen', name: 'Cây ước nguyện', tier: 4, wheel: true, price: 5200, level: 1, desc: 'Những điều ước bay lên như đom đóm.' },
  { id: 'hanh_tinh_ti_hon', name: 'Hành tinh tí hon', tier: 5, wheel: true, price: 8500, level: 1, desc: 'Một thế giới nhỏ đang xoay trong vườn.' },
];

const BACKGROUNDS = [
  { id: 'chieu_hoa_anh_dao', name: 'Chiều hoa anh đào', tier: 0, price: 360, level: 1, desc: 'Cánh hoa bay qua bầu trời hồng.' },
  { id: 'le_hoi_den_long', name: 'Lễ hội đèn lồng', tier: 1, price: 720, level: 3, desc: 'Đèn ấm áp trôi lên trong đêm.' },
  { id: 'bien_may', name: 'Biển mây xanh', tier: 2, price: 1200, level: 5, desc: 'Những lớp mây trôi chầm chậm.' },
  { id: 'vuon_keo_ngot', name: 'Vườn kẹo ngọt', tier: 2, price: 1650, level: 7, desc: 'Mây bông màu kẹo và nắng mật ong.' },
  { id: 'cuc_quang', name: 'Đêm cực quang', tier: 3, wheel: true, price: 2800, level: 1, desc: 'Dải sáng đổi màu giữa trời sao.' },
  { id: 'ngan_ha_hoa', name: 'Ngân hà hoa', tier: 4, wheel: true, price: 4900, level: 1, desc: 'Tinh vân tím và sao rơi.' },
  { id: 'lau_dai_tren_may', name: 'Lâu đài trên mây', tier: 5, wheel: true, price: 7600, level: 1, desc: 'Tháp mây xa xa hiện ra trong ánh bình minh.' },
];

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));

module.exports = {
  POT_SLOTS, SLOT_NAMES, POT_DECOR, POT_DECOR_BY_ID: byId(POT_DECOR),
  HOUSE_LEVELS, HOUSE_SLOTS, HOUSE_SLOT_NAMES, HOUSE_DECOR, HOUSE_DECOR_BY_ID: byId(HOUSE_DECOR),
  SCENE_OBJECTS, SCENE_OBJECTS_BY_ID: byId(SCENE_OBJECTS),
  BACKGROUNDS, BACKGROUNDS_BY_ID: byId(BACKGROUNDS),
};
