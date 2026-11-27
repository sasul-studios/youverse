// GET /api/skipcash/status?id=<paymentId> — used by the return page. Re-reads the payment from SkipCash
// and applies it (covers a late or missed webhook). Returns no personal data.
const L = require('../_lib/skipcash');

module.exports = async (req, res) => {
  try {
    const id = String((req.query && req.query.id) || '').trim();
    if (!/^[0-9a-f-]{16,64}$/i.test(id)) throw new L.HttpError(400, 'Invalid payment id');
    const p = await L.skipcashGet(id);
    const out = await L.applyPayment(p);
    L.send(res, 200, { status: out.order.status, skipcash: L.STATUS[out.statusId] || String(out.statusId), item: out.order.item_type, label: out.order.item_label, amount: out.order.amount_qar });
  } catch (e) { L.fail(res, e); }
};
