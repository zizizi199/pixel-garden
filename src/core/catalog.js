'use strict';
/**
 * Danh mục dữ liệu game: loài cây, chậu, đồ trang trí, vật phẩm, cấp độ.
 *
 * Thời gian trong game chỉ đếm khi vườn hoạt động (xem schedule.js).
 * Thời gian nở được rút gọn: hoa đầu tiên 5–10 phút, tăng dần tới hoa hiếm nhất 90 phút.
 * Giá bán = hạt + lãi; lãi và EXP mỗi loài tỉ lệ với số phút nở (hoa nở lâu lời nhiều hơn mỗi lần,
 * nhưng tiền/EXP mỗi giờ của các loài tương đương nhau, cây cấp cao vẫn lời hơn mỗi giờ).
 * Số ngày thực tế lấy từ tài liệu làm vườn (xem docs/THIET-KE.md, mục Nguồn).
 *
 * Trường của mỗi loài:
 *  bloomMinutes số phút (giờ vườn hoạt động) từ lúc gieo đến lúc nở
 *  waterMinutes số phút (giờ vườn hoạt động) để nước trong chậu cạn từ 100% → 0%,
 *               tỉ lệ theo thời gian nở: hoa nở nhanh thì cũng mau khát
 *  window       khung giờ hoa chịu nở [bắt đầu, kết thúc] (HH:MM); ngoài khung thì nụ chờ,
 *               và hoa đang nở sẽ khép/tàn khi hết khung
 *  fadeMinutes  số phút làm việc hoa giữ được vẻ đẹp sau khi nở, quá thì "tàn" (giá giảm)
 *  regrow       {minutes, harvests}: cây lâu năm, sau thu hoạch ra nụ lại trong `minutes` phút,
 *               thu hoạch tối đa `harvests` lần rồi cây già (phải nhổ)
 *  unlock       tiền mở khoá giống (1 lần, khi đủ cấp); seed = giá 1 hạt (gieo được 1 lần)
 *  shape/colors gợi ý cho bộ vẽ sprite pixel mặc định
 */

const { PETS } = require('./pets');

/** Bậc độ hiếm dùng chung cho cây, chậu, trang trí, pet (giống các game gacha phổ biến). */
const TIERS = [
  { id: 'common', name: 'Common', vi: 'Thường', color: '#9aa5b1' },
  { id: 'uncommon', name: 'Uncommon', vi: 'Khá', color: '#52b788' },
  { id: 'rare', name: 'Rare', vi: 'Hiếm', color: '#3a86ff' },
  { id: 'epic', name: 'Epic', vi: 'Sử thi', color: '#9d4edd' },
  { id: 'legendary', name: 'Legendary', vi: 'Huyền thoại', color: '#f4a300' },
  { id: 'mythic', name: 'Mythic', vi: 'Thần thoại', color: '#e5383b' },
  { id: 'secret', name: 'Secret', vi: 'Bí ẩn', color: '#ff4fd8' },
];
const PET_TIERS = TIERS.map((t) => t.name);

const SPECIES = [
  {
    id: 'muoi_gio', name: 'Hoa mười giờ', sci: 'Portulaca grandiflora',
    info: 'Cây mọng nước, chịu nóng và hạn rất tốt. Hoa chỉ mở khi có nắng, khép lại khi trời tối hoặc âm u. Ngoài đời ra hoa sau khoảng 6–8 tuần.',
    realDays: '42–56 ngày', bloomMinutes: 5, waterMinutes: 11, window: ['10:00', '15:00'], fadeMinutes: 240,
    unlock: 0, seed: 10, sell: 13, exp: 1, level: 1, shape: 'star', colors: ['#ff4fa3', '#ffd23f'],
    tier: 0,
  },
  {
    id: 'van_tho', name: 'Cúc vạn thọ', sci: 'Tagetes erecta',
    info: 'Loài hoa quen thuộc ngày Tết, dễ trồng, ưa nắng. Mùi lá hăng giúp xua côn trùng. Từ hạt đến ra hoa khoảng 50–60 ngày.',
    realDays: '50–60 ngày', bloomMinutes: 8, waterMinutes: 10, fadeMinutes: 240,
    unlock: 0, seed: 12, sell: 17, exp: 2, level: 1, shape: 'pompom', colors: ['#ff9f1c', '#ffbf47'],
    tier: 0,
  },
  {
    id: 'dua_can', name: 'Hoa dừa cạn', sci: 'Catharanthus roseus',
    info: 'Cây bụi nhỏ rất dễ trồng, chịu nắng nóng và khô hạn, ra hoa quanh năm. Hoa 5 cánh có mắt hồng đậm ở giữa. Từ hạt ra hoa khoảng 2–3 tháng.',
    realDays: '60–90 ngày', bloomMinutes: 5, waterMinutes: 10, fadeMinutes: 240,
    unlock: 0, seed: 9, sell: 12, exp: 1, level: 1, shape: 'daisy', colors: ['#ff5fa2', '#c9184a'],
    tier: 1, wheel: true,
  },
  {
    id: 'cuc_zinnia', name: 'Cúc ngũ sắc (Zinnia)', sci: 'Zinnia elegans',
    info: 'Hoa nhiều màu, chịu nóng, càng cắt hoa càng ra nhiều. Không ưa tưới lên lá. Ra hoa sau khoảng 60–70 ngày.',
    realDays: '60–70 ngày', bloomMinutes: 10, waterMinutes: 10, fadeMinutes: 240,
    unlock: 120, seed: 15, sell: 23, exp: 4, level: 2, shape: 'pompom', colors: ['#e63946', '#ff7b8a'],
    tier: 0,
  },
  {
    id: 'sao_nhai', name: 'Sao nhái (Cosmos)', sci: 'Cosmos bipinnatus',
    info: 'Hoa cánh mỏng đung đưa, chịu đất nghèo và hạn, rất hợp người mới trồng. Ra hoa sau khoảng 50–90 ngày.',
    realDays: '50–90 ngày', bloomMinutes: 10, waterMinutes: 13, fadeMinutes: 240,
    unlock: 150, seed: 16, sell: 24, exp: 4, level: 2, shape: 'daisy', colors: ['#f78fb3', '#ffd23f'],
    tier: 0,
  },
  {
    id: 'cuc_hoa_mi', name: 'Cúc họa mi', sci: 'Chrysanthemum indicum (dạng hoa trắng)',
    info: 'Loài cúc nhỏ cánh trắng nhụy vàng, nở rộ ở Hà Nội vào đầu mùa đông (khoảng tháng 11) và chỉ kéo dài vài tuần.',
    realDays: '~3 tháng', bloomMinutes: 12, waterMinutes: 12, fadeMinutes: 240,
    unlock: 0, seed: 18, sell: 28, exp: 4, level: 1, shape: 'daisy', colors: ['#ffffff', '#ffd23f'],
    tier: 1, wheel: true,
  },
  {
    id: 'pang_xe', name: 'Hoa păng-xê (Pansy)', sci: 'Viola × wittrockiana',
    info: 'Ưa mát và ẩm, cánh hoa có "mặt" đặc trưng. Ở Việt Nam trồng đẹp nhất ở Đà Lạt, Sa Pa. Ra hoa sau 60–90 ngày.',
    realDays: '60–90 ngày', bloomMinutes: 12, waterMinutes: 10, fadeMinutes: 240,
    unlock: 250, seed: 20, sell: 32, exp: 5, level: 3, shape: 'pansy', colors: ['#6a4c93', '#ffd23f'],
    tier: 1,
  },
  {
    id: 'bim_bim', name: 'Hoa bìm bìm', sci: 'Ipomoea purpurea',
    info: 'Dây leo hoa hình phễu. Hoa nở vào sáng sớm và héo trong ngày nên còn gọi là "morning glory". Trong game chỉ nở 08:00–10:00.',
    realDays: '~2 tháng', bloomMinutes: 10, waterMinutes: 10, window: ['08:00', '10:00'], fadeMinutes: 240,
    unlock: 0, seed: 18, sell: 28, exp: 4, level: 1, shape: 'trumpet', colors: ['#7b5cff', '#ffffff'],
    tier: 2, wheel: true,
  },
  {
    id: 'huong_duong', name: 'Hướng dương', sci: 'Helianthus annuus',
    info: 'Cây non xoay theo hướng mặt trời; khi trưởng thành bông hoa thường quay về hướng đông. Cần nhiều nước và nắng. Ra hoa sau 70–120 ngày.',
    realDays: '70–120 ngày', bloomMinutes: 15, waterMinutes: 10, fadeMinutes: 300,
    unlock: 320, seed: 25, sell: 40, exp: 6, level: 3, shape: 'sunflower', colors: ['#ffc300', '#6b3e26'],
    tier: 1,
  },
  {
    id: 'moi_soi', name: 'Mõm sói', sci: 'Antirrhinum majus',
    info: 'Hoa mọc thành chùm dọc thân; bóp nhẹ hai bên bông hoa sẽ "há miệng" như mõm sói. Ra hoa sau 85–120 ngày.',
    realDays: '85–120 ngày', bloomMinutes: 20, waterMinutes: 13, fadeMinutes: 300,
    unlock: 420, seed: 30, sell: 54, exp: 10, level: 4, shape: 'spike', colors: ['#ff6b6b', '#ffe066'],
    tier: 1,
  },
  {
    id: 'dong_tien', name: 'Hoa đồng tiền', sci: 'Gerbera jamesonii',
    info: 'Hoa to tròn như đồng xu, nhiều màu, hay dùng cắm lọ ngày Tết với ý nghĩa tài lộc. Ưa sáng, không ưa úng. Từ hạt ra hoa khoảng 4 tháng.',
    realDays: '100–130 ngày', bloomMinutes: 20, waterMinutes: 16, fadeMinutes: 240,
    unlock: 0, seed: 32, sell: 56, exp: 10, level: 1, shape: 'sunflower', colors: ['#ff6b35', '#7a3b12'],
    tier: 2, wheel: true,
  },
  {
    id: 'cam_chuong', name: 'Hoa cẩm chướng', sci: 'Dianthus caryophyllus',
    info: 'Cánh hoa mép răng cưa xếp nhiều lớp, thơm nhẹ. Ưa khí hậu mát, trồng nhiều ở Đà Lạt. Từ hạt ra hoa khoảng 5 tháng.',
    realDays: '~150 ngày', bloomMinutes: 25, waterMinutes: 15, fadeMinutes: 240,
    unlock: 0, seed: 34, sell: 64, exp: 12, level: 1, shape: 'pompom', colors: ['#ff4d6d', '#ffccd5'],
    tier: 2, wheel: true,
  },
  {
    id: 'hoa_sen', name: 'Hoa sen', sci: 'Nelumbo nucifera',
    info: 'Quốc hoa không chính thức của Việt Nam. Sống trong nước nên rất nhanh khát. Hoa nở từ sáng sớm và khép lại vào buổi trưa – chiều.',
    realDays: '~60–90 ngày', bloomMinutes: 25, waterMinutes: 10, window: ['08:00', '11:00'], fadeMinutes: 180,
    regrow: { minutes: 15, harvests: 4 },
    unlock: 700, seed: 60, sell: 95, exp: 14, level: 5, shape: 'lotus', colors: ['#ff8fab', '#ffd6e0'],
    tier: 2,
  },
  {
    id: 'hoa_hong', name: 'Hoa hồng', sci: 'Rosa spp.',
    info: 'Thường trồng từ cành giâm, ưa nắng ít nhất 6 giờ/ngày, tưới vào gốc. Cành giâm ra hoa sau khoảng 2–3 tháng, sau đó ra hoa nhiều đợt.',
    realDays: '60–90 ngày (cành giâm)', bloomMinutes: 30, waterMinutes: 16, fadeMinutes: 300,
    regrow: { minutes: 15, harvests: 5 },
    unlock: 900, seed: 80, sell: 122, exp: 17, level: 5, shape: 'rose', colors: ['#d00000', '#ff4d6d'],
    tier: 2,
  },
  {
    id: 'thuoc_duoc', name: 'Hoa thược dược', sci: 'Dahlia pinnata',
    info: 'Hoa to nhiều lớp cánh nhọn, hay trồng chơi Tết ở miền Bắc. Trồng từ củ nhanh hơn từ hạt; từ hạt ra hoa khoảng 3–4 tháng.',
    realDays: '90–120 ngày', bloomMinutes: 30, waterMinutes: 16, fadeMinutes: 240,
    unlock: 0, seed: 45, sell: 87, exp: 17, level: 1, shape: 'dahlia', colors: ['#d00060', '#ff8fc8'],
    tier: 3, wheel: true,
  },
  {
    id: 'tulip', name: 'Tulip', sci: 'Tulipa gesneriana',
    info: 'Trồng từ củ, cần một mùa lạnh để ra hoa nên ở xứ nóng phải xử lý lạnh củ trước khi trồng. Thời gian từ trồng củ đến ra hoa khoảng 3–4 tháng.',
    realDays: '90–120 ngày', bloomMinutes: 40, waterMinutes: 20, fadeMinutes: 300,
    unlock: 1100, seed: 50, sell: 114, exp: 26, level: 6, shape: 'cup', colors: ['#ff5d8f', '#ffb3c6'],
    tier: 2,
  },
  {
    id: 'hoa_nhai', name: 'Hoa nhài', sci: 'Jasminum sambac',
    info: 'Cây bụi hoa trắng nhỏ, rất thơm, thường nở về chiều tối; hay dùng ướp trà. Trong game nhài nở 15:00–17:00. Ra hoa nhiều đợt.',
    realDays: 'vài tháng (cành giâm)', bloomMinutes: 25, waterMinutes: 20, window: ['15:00', '17:00'], fadeMinutes: 240,
    regrow: { minutes: 15, harvests: 5 },
    unlock: 0, seed: 90, sell: 130, exp: 16, level: 1, shape: 'bract', colors: ['#ffffff', '#fff7c2'],
    tier: 3, wheel: true,
  },
  {
    id: 'hoa_giay', name: 'Hoa giấy', sci: 'Bougainvillea spectabilis',
    info: 'Phần "cánh hoa" sặc sỡ thực ra là lá bắc, hoa thật rất nhỏ màu trắng ở giữa. Rất chịu hạn – càng hơi khô càng ra nhiều hoa.',
    realDays: '~6 tháng (cành giâm)', bloomMinutes: 40, waterMinutes: 33, fadeMinutes: 300,
    regrow: { minutes: 25, harvests: 6 },
    unlock: 1400, seed: 120, sell: 192, exp: 29, level: 7, shape: 'bract', colors: ['#c9184a', '#ff4d9d'],
    tier: 3,
  },
  {
    id: 'cam_tu_cau', name: 'Cẩm tú cầu', sci: 'Hydrangea macrophylla',
    info: 'Hoa mọc thành chùm tròn như quả cầu. Màu hoa đổi theo độ chua của đất: đất chua cho hoa xanh, đất kiềm cho hoa hồng. Ưa mát, nhiều nước.',
    realDays: '1–2 năm (cành giâm)', bloomMinutes: 45, waterMinutes: 17, fadeMinutes: 240,
    regrow: { minutes: 30, harvests: 5 },
    unlock: 0, seed: 130, sell: 211, exp: 33, level: 1, shape: 'cluster', colors: ['#5aa9e6', '#c8e7ff'],
    tier: 4, wheel: true,
  },
  {
    id: 'oai_huong', name: 'Oải hương', sci: 'Lavandula angustifolia',
    info: 'Ưa nắng, đất thoát nước tốt và khá khô, sợ úng. Trồng từ hạt thường mất gần một năm mới ra hoa. Hương thơm giúp thư giãn.',
    realDays: '~1 năm', bloomMinutes: 55, waterMinutes: 47, fadeMinutes: 300,
    unlock: 1800, seed: 110, sell: 220, exp: 44, level: 8, shape: 'spike', colors: ['#7b2cbf', '#c77dff'],
    tier: 3,
  },
  {
    id: 'xuong_rong', name: 'Xương rồng ra hoa', sci: 'Echinopsis spp.',
    info: 'Cần rất ít nước. Nhiều loài xương rồng nở hoa to rực rỡ nhưng mỗi bông chỉ giữ được khoảng một ngày.',
    realDays: '2–3 năm', bloomMinutes: 55, waterMinutes: 71, fadeMinutes: 300,
    unlock: 2400, seed: 150, sell: 271, exp: 48, level: 9, shape: 'cactus', colors: ['#ff70a6', '#2d6a4f'],
    tier: 3,
  },
  {
    id: 'hoa_quynh', name: 'Hoa quỳnh', sci: 'Epiphyllum oxypetalum',
    info: '"Nữ hoàng bóng đêm": nở về đêm, hương rất thơm và tàn trước khi trời sáng. Trong game, quỳnh chỉ nở vào giờ cuối ca (16:00–17:00) – hết giờ là tàn!',
    realDays: '2–3 năm (cành giâm)', bloomMinutes: 90, waterMinutes: 68, window: ['16:00', '17:00'], fadeMinutes: 60,
    regrow: { minutes: 55, harvests: 3 },
    unlock: 3500, seed: 260, sell: 476, exp: 86, level: 10, shape: 'night', colors: ['#ffffff', '#fff3b0'],
    tier: 4,
  },
  {
    id: 'mai_vang', name: 'Mai vàng', sci: 'Ochna integerrima',
    info: 'Biểu tượng Tết miền Nam. Nhà vườn tuốt lá khoảng một tháng trước Tết để mai nở đúng dịp. Hoa 5 cánh vàng rực.',
    realDays: 'nhiều năm (cây cảnh)', bloomMinutes: 70, waterMinutes: 37, fadeMinutes: 240,
    regrow: { minutes: 35, harvests: 4 },
    unlock: 0, seed: 300, sell: 482, exp: 72, level: 1, shape: 'branch', colors: ['#ffd23f', '#ff9f1c'],
    tier: 5, wheel: true,
  },
  {
    id: 'hoa_dao', name: 'Hoa đào', sci: 'Prunus persica',
    info: 'Biểu tượng Tết miền Bắc, nổi tiếng đào Nhật Tân. Hoa nở trên cành khẳng khiu khi cây rụng lá vào cuối đông.',
    realDays: 'nhiều năm (cây cảnh)', bloomMinutes: 70, waterMinutes: 37, fadeMinutes: 240,
    regrow: { minutes: 35, harvests: 4 },
    unlock: 0, seed: 300, sell: 482, exp: 72, level: 1, shape: 'branch', colors: ['#ff8fab', '#ffe5ec'],
    tier: 6, wheel: true,
  },
  {
    id: 'lan_ho_diep', name: 'Lan hồ điệp', sci: 'Phalaenopsis spp.',
    info: 'Loài lan phổ biến nhất ngày Tết. Rễ khí sinh, sợ úng – chỉ tưới khi giá thể gần khô. Một cành hoa có thể bền 2–3 tháng.',
    realDays: '2–3 năm', bloomMinutes: 90, waterMinutes: 79, fadeMinutes: 600,
    regrow: { minutes: 55, harvests: 4 },
    unlock: 5000, seed: 400, sell: 652, exp: 99, level: 12, shape: 'orchid', colors: ['#f72585', '#ffffff'],
    tier: 4,
  },
  {
    id: 'cuc_dai', name: 'Hoa cúc dại', sci: 'Bellis perennis',
    info: 'Bông cúc nhỏ mọc hoang ven đường, cánh trắng viền hồng, nhuỵ vàng. Bé xíu nhưng rất bền bỉ.',
    realDays: '~8–10 tuần', bloomMinutes: 5, waterMinutes: 10, fadeMinutes: 240,
    unlock: 0, seed: 8, sell: 11, exp: 1, level: 1, shape: 'daisy', colors: ['#fff0f6', '#ffd23f'],
    tier: 0, wheel: true,
  },
  {
    id: 'su_quan_tu', name: 'Hoa sử quân tử', sci: 'Combretum indicum',
    info: 'Dây leo hoa chùm, thơm về chiều. Hoa đổi màu từ trắng sang hồng rồi đỏ sau vài ngày nên một chùm có nhiều màu.',
    realDays: 'vài tháng (cành giâm)', bloomMinutes: 10, waterMinutes: 10, fadeMinutes: 240,
    unlock: 0, seed: 20, sell: 30, exp: 4, level: 1, shape: 'cluster', colors: ['#ff4d6d', '#ffffff'],
    tier: 1, wheel: true,
  },
  {
    id: 'anh_dao', name: 'Hoa anh đào', sci: 'Prunus serrulata',
    info: 'Biểu tượng mùa xuân Nhật Bản. Ở Việt Nam có mai anh đào Đà Lạt nở hồng rực vào khoảng tháng 1–2.',
    realDays: 'nhiều năm (cây cảnh)', bloomMinutes: 40, waterMinutes: 27, fadeMinutes: 240,
    regrow: { minutes: 25, harvests: 5 },
    unlock: 0, seed: 140, sell: 212, exp: 29, level: 1, shape: 'branch', colors: ['#ffc8dd', '#ffe5ec'],
    tier: 3, wheel: true,
  },
  {
    id: 'sen_vang', name: 'Sen vàng', sci: 'Nelumbo lutea',
    info: 'Loài sen hoa vàng nhạt có nguồn gốc châu Mỹ, hiếm gặp ở Việt Nam. Giống sen hồng, hoa nở buổi sáng.',
    realDays: '~3 tháng', bloomMinutes: 45, waterMinutes: 14, window: ['08:00', '11:00'], fadeMinutes: 180,
    regrow: { minutes: 20, harvests: 5 },
    unlock: 0, seed: 220, sell: 319, exp: 39, level: 1, shape: 'lotus', colors: ['#ffd23f', '#fff3b0'],
    tier: 4, wheel: true,
  },
  {
    id: 'uu_dam', name: 'Hoa ưu đàm', sci: 'Udumbara (truyền thuyết)',
    info: 'Theo truyền thuyết Phật giáo, ưu đàm 3000 năm mới nở một lần. Ngoài đời, thứ hay bị gọi nhầm là "hoa ưu đàm" thực ra là trứng của loài côn trùng cánh gân.',
    realDays: '3000 năm (truyền thuyết)', bloomMinutes: 90, waterMinutes: 68, fadeMinutes: 120,
    unlock: 0, seed: 500, sell: 752, exp: 99, level: 1, shape: 'star', colors: ['#ffffff', '#c8e7ff'],
    tier: 6, wheel: true,
  },
];

/** Chậu: price = giá 1 chậu, unlock = tiền mở khoá loại chậu (1 lần, khi đủ cấp); water = hệ số giữ nước (lớn hơn → khát chậm hơn), sell/exp/growth = % thưởng. */
const POTS = [
  { id: 'nhua', name: 'Chậu nhựa', tier: 0, price: 0, unlock: 0, level: 1, color: '#5c7a99', water: 1, sell: 0, exp: 0, growth: 0, desc: 'Chậu mặc định.' },
  { id: 'dat_nung', name: 'Chậu đất nung', tier: 0, price: 40, unlock: 100, level: 1, color: '#c8553d', water: 1.2, sell: 0, exp: 0, growth: 0, desc: 'Giữ ẩm tốt: cây khát chậm hơn 20%.' },
  { id: 'su_trang', name: 'Chậu sứ trắng', tier: 1, price: 90, unlock: 250, level: 3, color: '#e9ecef', water: 1, sell: 0.1, exp: 0, growth: 0, desc: '+10% tiền khi thu hoạch.' },
  { id: 'go', name: 'Chậu gỗ', tier: 1, price: 130, unlock: 350, level: 4, color: '#8d5a2b', water: 1.1, sell: 0, exp: 0, growth: 0.1, desc: 'Cây lớn nhanh hơn 10%, giữ ẩm +10%.' },
  { id: 'men_lam', name: 'Chậu gốm men lam', tier: 2, price: 200, unlock: 550, level: 5, color: '#3a6ea5', pattern: 'stripe', water: 1.3, sell: 0.15, exp: 0, growth: 0, desc: 'Gốm men lam: giữ ẩm +30%, +15% tiền.' },
  { id: 'ngoc', name: 'Chậu ngọc bích', tier: 3, price: 380, unlock: 1000, level: 8, color: '#2a9d8f', pattern: 'shine', water: 1.2, sell: 0.1, exp: 0.15, growth: 0.1, desc: '+15% EXP, +10% tiền, lớn nhanh +10%.' },
  { id: 'vang', name: 'Chậu vàng', tier: 4, price: 700, unlock: 2000, level: 10, color: '#e9c46a', pattern: 'shine', water: 1.2, sell: 0.3, exp: 0.2, growth: 0, desc: '+30% tiền, +20% EXP. Sang chảnh!' },
  { id: 'hoa_van', name: 'Chậu gốm hoa văn', tier: 2, wheel: true, price: 220, unlock: 0, level: 1, color: '#f8f9fa', pattern: 'floral', water: 1.2, sell: 0.12, exp: 0.05, growth: 0, desc: 'Gốm trắng vẽ hoa lam: giữ ẩm +20%, +12% tiền, +5% EXP.' },
  { id: 'pha_le', name: 'Chậu pha lê', tier: 3, wheel: true, price: 500, unlock: 0, level: 1, color: '#a5e4ff', pattern: 'crystal', water: 1.3, sell: 0.15, exp: 0.15, growth: 0.1, desc: 'Trong suốt lấp lánh: giữ ẩm +30%, +15% tiền, +15% EXP, lớn nhanh +10%.' },
  { id: 'cau_vong', name: 'Chậu cầu vồng', tier: 5, wheel: true, price: 1500, unlock: 0, level: 1, color: '#ff595e', pattern: 'rainbow', water: 1.4, sell: 0.35, exp: 0.25, growth: 0.15, desc: '+35% tiền, +25% EXP, lớn nhanh +15%, giữ ẩm +40%.' },
  { id: 'ngan_ha', name: 'Chậu ngân hà', tier: 6, wheel: true, price: 3000, unlock: 0, level: 1, color: '#3c096c', pattern: 'galaxy', water: 1.5, sell: 0.5, exp: 0.35, growth: 0.2, desc: 'Bí ẩn: +50% tiền, +35% EXP, lớn nhanh +20%, giữ ẩm +50%.' },
  { id: 'sanh', name: 'Chậu sành', tier: 0, wheel: true, price: 25, unlock: 0, level: 1, color: '#7f5539', pattern: 'drip', water: 1.15, sell: 0.03, exp: 0, growth: 0, desc: 'Sành men chảy: giữ ẩm +15%, +3% tiền.' },
  { id: 'tre_dan', name: 'Chậu tre đan', tier: 2, wheel: true, price: 160, unlock: 0, level: 1, color: '#d4a96a', pattern: 'weave', water: 1.1, sell: 0.08, exp: 0, growth: 0.08, desc: 'Tre đan thủ công: lớn nhanh +8%, +8% tiền, giữ ẩm +10%.' },
  { id: 'cam_thach', name: 'Chậu cẩm thạch', tier: 5, wheel: true, price: 1800, unlock: 0, level: 1, color: '#f1f3f5', pattern: 'marble', water: 1.4, sell: 0.4, exp: 0.25, growth: 0.12, desc: 'Vân đá quý: +40% tiền, +25% EXP, lớn nhanh +12%, giữ ẩm +40%.' },
];

/**
 * Đồ trang trí: đặt vào ô trang trí, cộng hiệu ứng toàn vườn.
 * guard = tỉ lệ chặn hái trộm (dùng cho chế độ LAN sau này).
 */
const DECOR = [
  { id: 'hang_rao', name: 'Hàng rào gỗ', price: 60, level: 1, desc: 'Cho vườn gọn gàng.', fx: {} },
  { id: 'den_long', name: 'Đèn lồng', price: 150, level: 2, desc: '+5% EXP.', fx: { exp: 0.05 } },
  { id: 'chuong_gio', name: 'Chuông gió', price: 140, level: 2, desc: 'Cây khát chậm hơn 5%.', fx: { water: 0.05 } },
  { id: 'ech_gom', name: 'Tượng ếch gốm', price: 260, level: 3, desc: '+5% tiền khi thu hoạch.', fx: { sell: 0.05 } },
  { id: 'ghe_da', name: 'Ghế đá', price: 200, level: 3, desc: 'Chỗ ngồi nghỉ trưa.', fx: {} },
  { id: 'meo_ngu', name: 'Mèo ngủ', price: 320, level: 4, desc: 'Canh vườn: chặn 20% lần hái trộm.', fx: { guard: 0.2 } },
  { id: 'bu_nhin', name: 'Bù nhìn', price: 420, level: 6, desc: 'Chặn 30% lần hái trộm.', fx: { guard: 0.3 } },
  { id: 'dai_phun', name: 'Đài phun nước mini', price: 850, level: 7, desc: 'Cây khát chậm hơn 10%, +5% EXP.', fx: { water: 0.1, exp: 0.05 } },
];

const ITEMS = [
  { id: 'phan_bon', name: 'Phân bón', price: 30, level: 1, desc: 'Bón 1 cây đang lớn: lớn nhanh gấp đôi trong 20 phút.' },
  { id: 'binh_lon', name: 'Bình tưới lớn', price: 500, level: 5, once: true, desc: 'Mở khoá nút "Tưới tất cả".' },
];

const RULES = {
  startMoney: 60,
  startSlots: 4,
  maxSlots: 12,
  slotPrice: (owned) => 150 * Math.pow(2, owned - 4), // 150, 300, 600...
  slotLevel: (owned) => [2, 3, 4, 5, 6, 8, 10, 12][owned - 4] || 99, // cấp cần để mở ô thứ owned+1
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
  wheel: { cost: 300, cost10: 2700, freePerDay: 1, rates: [55, 30, 12.5, 2, 0.45, 0.045, 0.005], pityEpic: 10, pityLegendary: 60, newItemChance: 0.75, commonItemChance: 0.35 },
  daily: { pet: 0.01, pot: 0.27, seedQty: [[1, 0.6], [2, 0.3], [3, 0.1]] },
  decorSlots: 4,
  thirstyAt: 25, // % nước: dưới mức này cây "khát" → lớn chậm 50%
  waterBlockAbove: 85, // % nước: trên mức này đất còn ẩm, chưa cần tưới
  dryHealthLossPerMin: 1 / 3, // khi cạn nước: mất 1 máu mỗi 3 phút làm việc (~5 giờ là chết)
  offlineGapMs: 10 * 60 * 1000, // app không chạy quá 10 phút → coi là vắng mặt
  offlineMinHealth: 30,
  fertMinutes: 20, // phân bón: lớn nhanh x2 trong 20 phút (hoa nở 5–90 phút)
  fertMult: 2,
  fadedValue: 0.4,
  stealShare: 0.5,
  petSleepMs: 30 * 60 * 1000, // pet chặn trộm xong ngủ 30 phút (thời gian thực)
  waterExp: 1, // chỉ cộng khi tưới cây đang khát (nước < thirstyAt)
};

/** EXP cần để lên cấp tiếp theo. */
function expToNext(level) {
  return Math.round(60 * Math.pow(level, 1.5));
}

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));

module.exports = {
  SPECIES, POTS, DECOR, ITEMS, PETS, PET_TIERS, TIERS, RULES, expToNext, PETS_BY_ID: byId(PETS),
  SPECIES_BY_ID: byId(SPECIES), POTS_BY_ID: byId(POTS), DECOR_BY_ID: byId(DECOR), ITEMS_BY_ID: byId(ITEMS),
};
