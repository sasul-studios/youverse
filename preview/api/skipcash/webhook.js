// POST /api/skipcash/webhook — SkipCash calls this after each payment change.
// 1) the HMAC signature must match our Webhook Key, 2) we re-read the payment from SkipCash before trusting it.
const L = require('../_lib/skipcash');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') throw new L.HttpError(405, 'POST only');
    const raw = await L.rawBody(req);
    const f = L.literalFields(raw, L.WEBHOOK_FIELDS);
    const expected = L.sign(L.WEBHOOK_FIELDS, f, L.need('SKIPCASH_WEBHOOK_KEY'));
    if (!L.safeEqual(expected, req.headers.authorization)) {
      console.warn('[skipcash] webhook rejected: bad signature for payment', f.PaymentId || '?');
      return L.send(res, 401, { error: 'Invalid signature' });
    }
    if (!f.PaymentId) throw new L.HttpError(400, 'PaymentId missing');
    const p = await L.skipcashGet(f.PaymentId);
    const out = await L.applyPayment(p);
    L.send(res, 200, { ok: true, status: L.STATUS[out.statusId] || out.statusId });
  } catch (e) { L.fail(res, e); }
};
