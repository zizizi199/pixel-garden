'use strict';
/**
 * Thoại của pet: câu vui ngẫu nhiên, câu theo tình hình vườn, thông tin trong ngày nhẹ nhàng
 * (thứ, ngày lễ sắp tới, mùa hoa) và mẩu kiến thức về hoa. Tất cả tự viết.
 * Không nhắc tới giờ làm việc (riêng tư).
 */
(function () {
  const FUNNY = [
    'Tưới cây chưa? Tưới rồi thì tưới… tâm hồn đi.',
    'Mình canh vườn thôi nha, không canh deadline đâu.',
    'Hôm nay mình chọn bình yên… và một miếng snack.',
    'Cây lớn chậm cũng được, miễn là lớn. Giống mình.',
    'Đừng nhìn mình, nhìn hoa kìa!',
    'Mình không lười, mình đang tiết kiệm năng lượng.',
    'Cây uống nước, người uống cà phê, còn mình uống… sự chú ý.',
    'Ai vừa nói “họp” à? Mình đi tuần tra đây!',
    'Hoa nở là để ngắm, không phải để hái trộm nha!',
    'Vươn vai cái nào! Cây còn vươn lên được mà.',
    'Nhớ uống nước nhé. Cây với người đều cần.',
    'Bí kíp sống: tưới đều, nắng đủ, bớt nghĩ nhiều.',
    'Thu hoạch xong nhớ thưởng mình ít hạt nha.',
    'Nghe đồn vườn bên kia đẹp hơn. Mình không tin.',
    'Mình không ngủ gật, mình chỉ chớp mắt hơi lâu.',
    'Cây ơi lớn nhanh lên, chủ còn xây nhà mới cho mình!',
    'Vườn mình đẹp nhất công ty. Nguồn: mình tự nói.',
    'Có xu không? Cho mình mượn tí mua bát mới.',
    'KPI hôm nay của mình: chạy 37 vòng quanh chậu.',
    'Mood hôm nay: 🌸 sắp nở.',
    'Ai đặt tên cho cái chậu nhựa này vậy, nghe buồn ghê.',
    'Kẻ trộm hoa ơi, đừng để mình thấy nha!',
    'Một ngày không tưới cây là một ngày… cây buồn.',
    'Nhìn bông hoa này xem, nó cười với mình đó.',
    'Mình đang luyện võ canh vườn. Hiện mới tới đai trắng.',
    'Nếu buồn quá thì ra đây ngắm hoa với mình.',
    'Tiền không mọc trên cây. Nhưng hoa thì bán ra tiền đó!',
    'Đã ai khen bạn hôm nay chưa? Mình khen nè: giỏi lắm!',
    'Hít thở sâu nào… hương hoa thơm ghê.',
    'Mình đang tập đi nhẹ để không làm cây giật mình.',
    // kiểu nói trend mạng (không gán cho người thật, giữ lịch sự nơi công sở)
    'Ét o ét! Có cây khát nước nè!',
    'Vườn hôm nay đỉnh nóc, kịch trần, bay phấp phới!',
    'Chuyện nhỏ như con thỏ, tưới cái là xong.',
    'Khum sao đâu, hôm nay chưa nở thì mai nở.',
    'Ủa alo? Ai đó vừa thu hoạch mà không rủ mình?',
    'Bình tĩnh, tự tin, không cay cú – kể cả khi bị hái trộm.',
    'Xu ít nhưng vui là chính, đúng không nè?',
    'Đi làm vui vẻ, về nhà ngủ khoẻ, hoa thì nở đều.',
    'Mình là pet chứ không phải pet-ty đâu nha.',
    'Hôm nay ai mặc đẹp nhất? Bông hoa ô 1 chứ ai!',
    'Một ngày không hoa là một ngày… thiếu vitamin vui.',
    'Ủa em tưởng anh tưới rồi?',
    // thêm cho vui
    'Mình vừa đếm: vườn có 0 con sâu và 1 con pet đẹp trai.',
    'Hoa nở chậm là do hoa đang chờ đúng người thu hoạch.',
    'Đừng lo, deadline không đuổi kịp mình đâu, mình chạy nhanh lắm.',
    'Hôm nay mình quyết tâm… ngủ trưa đúng giờ.',
    'Ai cho mình mượn cái ô? Sợ nắng làm đen lông.',
    'Mình đã sẵn sàng làm việc. Việc thì chưa sẵn sàng.',
    'Muốn giàu thì trồng hoa, muốn vui thì nuôi mình.',
    'Hôm qua mình mơ thấy vòng quay ra Secret. Tỉnh dậy mất xu.',
    'Cây không biết nói nhưng cây biết khát. Tưới đi nha.',
    'Thấy cái chậu vàng không? Mai mốt mình cũng có nhà vàng.',
    'Nghỉ tay 1 phút, ngắm hoa 1 phút, vui cả ngày.',
    'Pháp sư cấp cao nhất là người nhớ tưới cây mỗi ngày.',
    'Mình không phải dậy sớm, mình chỉ là… chưa ngủ.',
    'Ước gì quỹ lương cũng lớn nhanh như hoa dừa cạn.',
    'Thu hoạch đúng lúc là một loại tài năng.',
    'Có lẽ mình nên ăn kiêng. Sau bữa này đã.',
    'Hoa thơm quá, chắc tại người trồng có tâm.',
    'Ai đó vừa nhắc tới trà sữa? Mình nghe rõ lắm.',
    'Mình đi tuần một vòng, tiện thể khoe dáng.',
    'Chuyện gì khó cứ để mai tính. Còn tưới cây thì tính ngay.',
    'Năng suất hôm nay: mình đã ngồi đúng tư thế đẹp 3 lần.',
    'Đừng hái trộm hoa nhà mình, vì mình biết chạy.',
    'Nếu buồn thì hãy nhớ: hoa cũng phải đợi mới nở.',
    'Xu nhiều để làm gì? Để quay vòng quay chứ làm gì!',
    'Vòng quay hôm nay chưa quay hả? Lãng phí quá trời.',
    'Một hạt giống nhỏ, một ước mơ to. Mình mơ cái bát mới.',
    'Tớ bảo này: uống nước đi, đừng chỉ tưới cây.',
    'Cây xanh là phổi của văn phòng, còn mình là trái tim.',
    'Gió thổi mát quá, ai bật quạt cho vườn vậy?',
    'Hôm nay nhìn bạn có vẻ giỏi giang hơn hôm qua đó.',
    'Mình kiểm tra rồi: vườn an toàn, hoa đẹp, chủ dễ thương.',
    'Lên cấp đi rồi mở khoá cho mình bạn mới chơi cùng.',
    'Chạy bộ quanh chậu cũng tính là tập thể dục nha.',
    'Đố bạn: con gì đi canh vườn mà không lấy lương? Mình nè.',
    'Mình nói nhiều quá hả? Tại vườn yên tĩnh quá đó.',
    'Bông hoa nào nở trước, bông đó được mình khen trước.',
    'Bí mật nhỏ: mình hay đếm số giọt nước lúc bạn tưới.',
    'Cuộc sống như vòng quay: quan trọng là còn xu để quay.',
    'Tưới vừa đủ thôi, đừng để cây phải đi bơi.',
    'Hoa đẹp không bằng người tưới hoa. Ai đó vừa đỏ mặt kìa.',
    'Mình vừa hỏi cây có ổn không. Cây giơ lá đồng ý.',
    'Đất bảo khô cổ. Mình chỉ biết đi tìm bình tưới.',
    'Bông này đang tạo dáng, chờ mình ngắm thêm chút!',
    'Mình canh vườn rất nghiêm. Chỉ cười lúc không ai nhìn.',
    'Nếu chậu biết nói, chắc nó xin đổi màu sơn.',
    'Mình vừa chạy đua với bóng mình. Hoà!',
    'Hạt giống đâu rồi? À, đang bận làm việc dưới đất.',
    'Hoa bảo cần không gian riêng. Mình đứng cách một chậu.',
    'Mình đếm lá để thư giãn. Lá mọc thêm, đếm lại!',
    'Vườn sạch bong. Mình vừa kiểm tra bằng mắt.',
    'Mình định thu hoạch hộ, nhưng chưa được cấp xẻng.',
    'Mình đã luyện ánh mắt nghiêm nghị để canh hoa.',
    'Chậu trống cũng có tiềm năng. Tin mình đi!',
    'Cây lớn từng chút, mình cổ vũ từng chút.',
    'Mình vừa nghe hoa thì thầm… chắc là gió.',
    'Đứng cạnh hoa lâu quá, mình cũng thấy mình toả sáng.',
    'Bón phân cho cây nhé. Mình không nhận món đó đâu.',
    'Mình đi vòng vòng để kiểm tra chu vi vườn thôi.',
    'Mình đang luyện nói chuyện với cây. Cây giỏi lắng nghe.',
    'Hoa nở đẹp quá. Mình xin nhận công cổ vũ.',
  ];
  const BY_MOVE = {
    fly: ['Nhìn từ trên này vườn đẹp ghê!', 'Bay một vòng kiểm tra an ninh nè.', 'Gió hôm nay thổi dễ chịu ghê.'],
    crawl: ['Từ từ rồi cũng tới, đúng không?', 'Chậm mà chắc, mình là chuyên gia.'],
    hop: ['Nhảy một cái cho khoẻ người!', 'Hop hop! Ai bắt được mình nào?'],
    swim: ['Bơi một vòng cho mát nè.'],
    walk: ['Đi dạo một vòng cho dãn gân cốt.', 'Tuần tra vườn: mọi thứ ổn!'],
  };
  const SLEEPY = ['Zzz… vừa đuổi trộm xong, mệt ghê…', 'Đừng gọi… cho ngủ thêm năm phút…', 'Zzz… mơ thấy cả vườn nở hoa…'];

  // Ngày lễ dương lịch (ngày/tháng) – nhắc trước tối đa 10 ngày.
  const HOLIDAYS = [
    [1, 1, 'Tết Dương lịch'], [14, 2, 'Valentine'], [8, 3, 'Quốc tế Phụ nữ 8/3'], [30, 4, 'ngày 30/4'], [1, 5, 'Quốc tế Lao động 1/5'],
    [1, 6, 'Quốc tế Thiếu nhi'], [2, 9, 'Quốc khánh 2/9'], [20, 10, 'Ngày Phụ nữ Việt Nam 20/10'], [31, 10, 'Halloween'],
    [20, 11, 'Ngày Nhà giáo Việt Nam 20/11'], [24, 12, 'Giáng sinh'],
  ];
  // Mùng 1 Tết Nguyên đán (dương lịch).
  const TET = ['2027-02-06', '2028-01-26'];
  const MONTH_FLOWERS = {
    1: 'Tháng 1 là mùa đào, mai chuẩn bị cho Tết.', 2: 'Tháng 2 mùa hoa ban, hoa mận nở trắng vùng cao.', 3: 'Tháng 3 hoa gạo, hoa sưa nở đỏ – trắng Hà Nội.',
    4: 'Tháng 4 là mùa hoa loa kèn trắng.', 5: 'Tháng 5 phượng bắt đầu đỏ rực, mùa hè tới rồi.', 6: 'Tháng 6 sen nở khắp hồ.',
    7: 'Tháng 7 mùa hoa bằng lăng tím.', 8: 'Tháng 8 hoa sen cuối mùa vẫn thơm lắm.', 9: 'Tháng 9 mùa hoa sữa sắp về.',
    10: 'Tháng 10 hoa sữa thơm nồng, cúc họa mi sắp tới.', 11: 'Tháng 11 là mùa cúc họa mi trắng muốt.', 12: 'Tháng 12 mùa dã quỳ vàng ở Đà Lạt.',
  };
  const WEEKDAY = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const DAY_MOOD = {
    1: 'Thứ Hai rồi, khởi động nhẹ nhàng thôi nha!', 2: 'Thứ Ba – tuần mới đã vào guồng.', 3: 'Thứ Tư – qua nửa tuần rồi!',
    4: 'Thứ Năm – cuối tuần đang vẫy tay kìa.', 5: 'Thứ Sáu rồi! Cuối tuần đi đâu chơi không?', 6: 'Thứ Bảy thảnh thơi ghê.', 0: 'Chủ nhật nghỉ ngơi cho khoẻ nha.',
  };

  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const DAY = 86400000;

  function dailyInfo(now = new Date()) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const out = [`Hôm nay ${WEEKDAY[now.getDay()]}, ngày ${now.getDate()}/${now.getMonth() + 1}. ${DAY_MOOD[now.getDay()]}`];
    for (const [d, m, name] of HOLIDAYS) {
      let t = new Date(today.getFullYear(), m - 1, d);
      if (t < today) t = new Date(today.getFullYear() + 1, m - 1, d);
      const n = Math.round((t - today) / DAY);
      if (n === 0) out.push(`Hôm nay là ${name} đó!`);
      else if (n <= 10) out.push(`Còn ${n} ngày nữa là ${name}.`);
    }
    for (const s of TET) {
      const n = Math.round((new Date(`${s}T00:00:00`) - today) / DAY);
      if (n >= 0 && n <= 60) out.push(n === 0 ? 'Chúc mừng năm mới! Tết rồi!' : `Còn ${n} ngày nữa là Tết Nguyên đán!`);
    }
    out.push(MONTH_FLOWERS[now.getMonth() + 1]);
    return out;
  }

  function context(V, SP) {
    const out = [];
    const thirsty = V.slots.filter((s) => s.thirsty && s.stage !== 'dead');
    const bloom = V.slots.filter((s) => s.stage === 'bloom');
    if (thirsty.length) out.push(`Ô ${thirsty[0].i + 1} khát nước kìa, tưới giúp với!`);
    if (bloom.length) out.push(bloom.length > 1 ? `Có ${bloom.length} bông nở rồi, thu hoạch đi!` : `${SP[bloom[0].species].name} nở rồi kìa!`);
    if (V.daily && V.daily.available) out.push('Hôm nay có quà kìa, mở đi mở đi!');
    if (V.house && V.house.level === 1) out.push('Hộp các-tông này… chắc ở tạm thôi ha?');
    if (V.house && V.house.level === 4) out.push('Sống trong lâu đài, mình thấy mình sang ghê.');
    if (!V.slots.some((s) => s.stage !== 'empty')) out.push('Vườn trống trơn, gieo hạt đi nào!');
    return out;
  }

  function fact(CAT) {
    const sp = pick(CAT.species);
    const first = sp.info.split('. ')[0];
    return `Bạn biết không: ${sp.name} – ${first.replace(/\.$/, '')}.`;
  }

  /** Chọn 1 câu: 50% vui, 20% theo vườn, 15% thông tin trong ngày, 15% kiến thức hoa. */
  function line({ V, CAT, SP, pet, sleeping }) {
    if (sleeping) return pick(SLEEPY);
    const r = Math.random();
    if (r < 0.2) { const c = context(V, SP); if (c.length) return pick(c); }
    if (r < 0.35) return pick(dailyInfo());
    if (r < 0.5) return fact(CAT);
    const pool = FUNNY.concat(BY_MOVE[pet.move] || []);
    return pick(pool);
  }

  window.PetTalk = { line, dailyInfo };
})();
