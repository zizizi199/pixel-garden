'use strict';
// Ảnh chụp vườn gửi cho người khác trong nhóm (chỉ các trường cho phép, không sao chép thẳng G.view).
const G = require('./garden');

function publicGarden(view) {
  return {
    slots: (view.slots || []).slice(0, 12).map((s) => ({ pot: s.pot, decor: (s.decor || []).slice(0, 4), species: s.species || null, stage: s.stage,
      water: Math.round(Number(s.water) || 0), thirsty: !!s.thirsty })),
    pet: view.pet ? view.pet.id : null,
    house: view.house ? { level: view.house.level, decor: view.house.decor } : null,
    scene: { object: view.scene && view.scene.object || null, background: view.scene && view.scene.background || null },
  };
}

/** Ảnh chụp cho nhóm Supabase = phần hiển thị + phần thưởng/khả năng chặn trộm từng ô + túi đồ đấu trường. */
function groupGarden(state, now = Date.now()) {
  const pub = publicGarden(G.view(state, now));
  const rg = G.remoteGuard(state, now);
  pub.slots.forEach((s, i) => Object.assign(s, rg.slots[i] || {}));
  pub.guard = rg.guard;
  pub.pet = state.pets.active || null;
  pub.bag = G.arenaBag(state); // món có thể mất khi thua ở Đấu trường (server không trả phần này cho người khác)
  return pub;
}

module.exports = { publicGarden, groupGarden };
