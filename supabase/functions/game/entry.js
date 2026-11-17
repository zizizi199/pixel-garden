// Nguồn của Edge Function "game". KHÔNG dán file này lên Supabase – chạy `node scripts/build-edge.js`
// để gộp với src/core thành index.ts (file đó mới là thứ deploy).
/* global Deno */
const { createHandler } = require('../../../server/game');
const ADMIN_PUBLIC_KEY = require('./admin-key');

const env = (k) => Deno.env.get(k) || '';
function serviceKey() {
  if (env('SUPABASE_SERVICE_ROLE_KEY')) return env('SUPABASE_SERVICE_ROLE_KEY');
  try { const ks = JSON.parse(env('SUPABASE_SECRET_KEYS')); return ks.default || Object.values(ks)[0] || ''; } catch (_) { return ''; }
}

Deno.serve(createHandler({
  url: env('SUPABASE_URL'),
  serviceKey: serviceKey(),
  adminPublicKey: env('VP_ADMIN_PUBLIC_KEY') || ADMIN_PUBLIC_KEY,
}));
