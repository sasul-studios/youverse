// POST /api/skipcash/create — the server works out the price, saves a pending order and returns SkipCash's payUrl.
const crypto = require('crypto');
const L = require('../_lib/skipcash');

const clean = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);
const money = n => (Math.round(Number(n) * 100) / 100).toFixed(2);

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') throw new L.HttpError(405, 'POST only');
    const user = await L.userFromToken(req);
    const b = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const first = clean(b.first_name, 60), last = clean(b.last_name, 60) || '-';
    let phone = String(b.phone || '').replace(/[^\d+]/g, '');
    if (/^\d{8}$/.test(phone)) phone = '+974' + phone;
    if (!first) throw new L.HttpError(400, 'First name is required.');
    if (!/^\+\d{8,15}$/.test(phone)) throw new L.HttpError(400, 'Enter a valid phone number.');

    let amount, label, itemId = null, booking = null;
    const type = String(b.item_type || '');
    if (type === 'masterclass') {
      const mc = await L.sb('masterclasses?select=id,title_ar,title_en,price_qar&status=eq.published&id=eq.' + encodeURIComponent(b.item_id || ''));
      if (!mc || !mc[0]) throw new L.HttpError(404, 'Masterclass not found.');
      const have = await L.sb('enrollments?select=masterclass_id&user_id=eq.' + user.id + '&masterclass_id=eq.' + mc[0].id);
      if (have && have.length) throw new L.HttpError(409, 'You already own this masterclass.');
      amount = +mc[0].price_qar; label = mc[0].title_ar || mc[0].title_en; itemId = mc[0].id;
    } else if (type === 'subscription') {
      const plan = b.plan === 'yearly' ? 'yearly' : 'monthly';
      const st = await L.sb('settings?select=value&key=eq.plan_' + plan + '_qar');
      amount = Number(st && st[0] && st[0].value); label = plan === 'yearly' ? 'yearly subscription' : 'monthly subscription';
    } else if (type === 'session') {
      const minutes = +b.minutes === 60 ? 60 : 30;
      const start = new Date(b.starts_at);
      if (isNaN(start) || start < new Date(Date.now() + 3600e3)) throw new L.HttpError(400, 'Choose a time at least one hour from now.');
      const m = await L.sb('mentors?select=id,name,price_30,price_60&approved=eq.true&id=eq.' + encodeURIComponent(b.mentor_id || ''));
      if (!m || !m[0]) throw new L.HttpError(404, 'Mentor not found.');
      amount = Number(minutes === 60 ? m[0].price_60 : m[0].price_30);
      label = 'session ' + minutes + ' min with ' + m[0].name; itemId = m[0].id;
      booking = { mentor_id: m[0].id, user_id: user.id, starts_at: start.toISOString(), minutes, note: clean(b.note, 240) || null, status: 'pending_payment' };
    } else if (type === 'test') {
      if (L.ENV !== 'sandbox') throw new L.HttpError(400, 'Test payments only work in sandbox.');
      if (user.role !== 'admin') throw new L.HttpError(403, 'Admins only.');
      amount = 1; label = 'sandbox test';
    } else throw new L.HttpError(400, 'Unknown item.');
    if (!(amount > 0)) throw new L.HttpError(400, 'This item has no price yet.');

    const ins = await L.sb('orders', { method: 'POST', prefer: 'return=representation', body: {
      user_id: user.id, item_type: type, item_id: itemId, item_label: label, amount_qar: money(amount),
      status: 'pending', idempotency_key: crypto.randomUUID(), buyer_email: user.email, env: L.ENV } });
    const order = ins[0];
    if (booking) await L.sb('bookings', { method: 'POST', body: { ...booking, order_id: order.id } });

    const site = process.env.SITE_URL || ('https://' + req.headers.host);
    let pay;
    try {
      pay = await L.skipcashCreate(
        { Amount: money(amount), FirstName: first, LastName: last, Phone: phone, Email: user.email, TransactionId: order.id, Custom1: type },
        { ReturnUrl: site + '/pay-return.html', WebhookUrl: site + '/api/skipcash/webhook', Subject: 'Youverse', Description: label.slice(0, 120) });
    } catch (e) {
      await L.sb('orders?id=eq.' + order.id, { method: 'PATCH', body: { status: 'failed' } });
      if (booking) await L.sb('bookings?order_id=eq.' + order.id, { method: 'PATCH', body: { status: 'cancelled' } });
      throw e;
    }
    await L.sb('orders?id=eq.' + order.id, { method: 'PATCH', body: { skipcash_payment_id: pay.id } });
    L.send(res, 200, { payUrl: pay.payUrl, orderId: order.id, env: L.ENV });
  } catch (e) { L.fail(res, e); }
};
