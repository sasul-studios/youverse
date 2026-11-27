// SkipCash + Supabase helpers for the Youverse serverless API (Vercel).
// Keys come only from Vercel environment variables, never from the client or the repo.
const crypto = require('crypto');

const ENV = String(process.env.SKIPCASH_ENV || 'sandbox').toLowerCase() === 'production' ? 'production' : 'sandbox';
const BASE = ENV === 'production' ? 'https://api.skipcash.app' : 'https://skipcashtest.azurewebsites.net';
const SB_URL = 'https://bhcvhdyutwanorlpesnu.supabase.co';
const SB_PUBLISHABLE = 'sb_publishable_mKEqP1C7P-lnGcWQwaQM3w_cm1A1NXm';

// Ordered fields that take part in each signature (order is mandatory, empty values are skipped).
const CREATE_FIELDS = ['Uid', 'KeyId', 'Amount', 'FirstName', 'LastName', 'Phone', 'Email', 'Street', 'City', 'State', 'Country', 'PostalCode', 'TransactionId', 'Custom1'];
const WEBHOOK_FIELDS = ['PaymentId', 'Amount', 'StatusId', 'TransactionId', 'Custom1', 'VisaId'];
const STATUS = { 0: 'new', 1: 'pending', 2: 'paid', 3: 'canceled', 4: 'failed', 5: 'rejected', 6: 'refunded', 7: 'pending_refund', 8: 'refund_failed', 12: 'in_progress' };

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

function need(name) {
  const v = process.env[name];
  if (!v) throw new HttpError(503, 'Payments are not configured yet (' + name + ' is missing).');
  return v;
}

function payload(fields, data) {
  return fields.filter(f => data[f] !== undefined && data[f] !== null && data[f] !== '').map(f => f + '=' + String(data[f])).join(',');
}
function sign(fields, data, secret) {
  return crypto.createHmac('sha256', secret).update(payload(fields, data), 'utf8').digest('base64');
}
function safeEqual(a, b) {
  const A = Buffer.from(String(a || '').trim()), B = Buffer.from(String(b || '').trim());
  return A.length === B.length && A.length > 0 && crypto.timingSafeEqual(A, B);
}

// ---- Supabase (server side, secret key) ----
async function sb(path, { method = 'GET', body, prefer } = {}) {
  const key = need('SUPABASE_SERVICE_ROLE_KEY');
  const headers = { apikey: key, 'Content-Type': 'application/json' };
  if (key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + key;
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(SB_URL + '/rest/v1/' + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text();
  if (!r.ok) throw new HttpError(500, 'Database error ' + r.status + ': ' + text.slice(0, 300));
  return text ? JSON.parse(text) : null;
}

async function userFromToken(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  if (!token) throw new HttpError(401, 'Please sign in first.');
  const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: SB_PUBLISHABLE, Authorization: 'Bearer ' + token } });
  if (!r.ok) throw new HttpError(401, 'Your session has expired. Please sign in again.');
  const u = await r.json();
  const prof = await sb('profiles?select=role,status,full_name,is_minor&id=eq.' + encodeURIComponent(u.id));
  const p = prof && prof[0] || {};
  if (p.status === 'blocked') throw new HttpError(403, 'This account is blocked.');
  return { id: u.id, email: u.email, role: p.role || 'youer', name: p.full_name || '', isMinor: !!p.is_minor };
}

// ---- SkipCash ----
async function skipcashCreate(fields, extra) {
  const keyId = need('SKIPCASH_KEY_ID'), secret = need('SKIPCASH_KEY_SECRET');
  const data = { Uid: crypto.randomUUID(), KeyId: keyId, ...fields };
  const signature = sign(CREATE_FIELDS, data, secret);
  const body = { ...data, ...extra };
  for (const k of Object.keys(body)) if (body[k] === undefined || body[k] === null || body[k] === '') delete body[k];
  const r = await fetch(BASE + '/api/v1/payments', { method: 'POST', headers: { Authorization: signature, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.resultObj || (j.returnCode && +j.returnCode >= 400)) {
    const msg = j.errorMessage || (j.validationErrors && JSON.stringify(j.validationErrors)) || ('HTTP ' + r.status);
    throw new HttpError(502, 'SkipCash refused the payment: ' + msg);
  }
  return j.resultObj; // { id, payUrl, ... }
}

async function skipcashGet(paymentId) {
  const clientId = need('SKIPCASH_CLIENT_ID');
  const r = await fetch(BASE + '/api/v1/payments/' + encodeURIComponent(paymentId), { headers: { Authorization: clientId } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.resultObj) throw new HttpError(502, 'Could not read the payment from SkipCash (HTTP ' + r.status + ').');
  return j.resultObj; // { id, statusId, amount, transactionId, ... }
}

// ---- Apply a payment to our order (idempotent) ----
async function applyPayment(p) {
  const statusId = +p.statusId;
  const orders = await sb('orders?select=*&skipcash_payment_id=eq.' + encodeURIComponent(p.id));
  let order = orders && orders[0];
  if (!order && p.transactionId) {
    const o2 = await sb('orders?select=*&id=eq.' + encodeURIComponent(p.transactionId));
    order = o2 && o2[0];
  }
  if (!order) throw new HttpError(404, 'Order not found for this payment.');
  if (order.skipcash_payment_id && order.skipcash_payment_id !== p.id) throw new HttpError(409, 'Payment does not belong to this order.');

  await sb('orders?id=eq.' + order.id, { method: 'PATCH', body: { skipcash_status_id: statusId } });

  if (statusId === 2) {
    if (Math.abs(Number(p.amount) - Number(order.amount_qar)) > 0.009) throw new HttpError(409, 'Paid amount does not match the order.');
    // Only the first call that moves pending -> paid fulfils the order.
    const moved = await sb('orders?id=eq.' + order.id + '&status=eq.pending', { method: 'PATCH', body: { status: 'paid', paid_at: new Date().toISOString() }, prefer: 'return=representation' });
    if (moved && moved.length) await fulfil(moved[0]);
    return { order: { ...order, status: 'paid' }, statusId };
  }
  if ([3, 4, 5].includes(statusId) && order.status === 'pending') {
    await sb('orders?id=eq.' + order.id + '&status=eq.pending', { method: 'PATCH', body: { status: statusId === 3 ? 'cancelled' : 'failed' } });
    if (order.item_type === 'session') await sb('bookings?order_id=eq.' + order.id + '&status=eq.pending_payment', { method: 'PATCH', body: { status: 'cancelled' } });
    return { order: { ...order, status: statusId === 3 ? 'cancelled' : 'failed' }, statusId };
  }
  if (statusId === 6 && order.status === 'paid') {
    await sb('orders?id=eq.' + order.id, { method: 'PATCH', body: { status: 'refunded' } });
    return { order: { ...order, status: 'refunded' }, statusId };
  }
  return { order, statusId };
}

async function fulfil(order) {
  if (order.item_type === 'masterclass' && order.user_id) {
    await sb('enrollments?on_conflict=user_id,masterclass_id', { method: 'POST', body: { user_id: order.user_id, masterclass_id: order.item_id, order_id: order.id }, prefer: 'resolution=ignore-duplicates' });
  } else if (order.item_type === 'session') {
    const bk = await sb('bookings?select=id,mentor_id,user_id&order_id=eq.' + order.id);
    for (const b of bk || []) {
      const prof = await sb('profiles?select=is_minor,parent_consent&id=eq.' + b.user_id);
      const minor = prof && prof[0] && prof[0].is_minor && prof[0].parent_consent !== 'granted';
      const link = await sb('mentor_private?select=meeting_url&mentor_id=eq.' + b.mentor_id);
      await sb('bookings?id=eq.' + b.id, { method: 'PATCH', body: { status: minor ? 'pending_consent' : 'confirmed', meeting_url: (link && link[0] && link[0].meeting_url) || null } });
    }
  } else if (order.item_type === 'subscription' && order.user_id) {
    const days = /yearly/.test(order.item_label || '') ? 365 : 30;
    const prof = await sb('profiles?select=plan_until&id=eq.' + order.user_id);
    const cur = prof && prof[0] && prof[0].plan_until ? new Date(prof[0].plan_until) : null;
    const start = cur && cur > new Date() ? cur : new Date();
    await sb('profiles?id=eq.' + order.user_id, { method: 'PATCH', body: { plan: days === 365 ? 'yearly' : 'monthly', plan_until: new Date(start.getTime() + days * 864e5).toISOString() } });
  }
}

// Read the raw request body (keeps numbers exactly as SkipCash sent them, for the signature).
function rawBody(req) {
  return new Promise((resolve, reject) => {
    let d = ''; req.setEncoding('utf8');
    req.on('data', c => { d += c; if (d.length > 1e5) reject(new HttpError(413, 'Body too large')); });
    req.on('end', () => resolve(d)); req.on('error', reject);
  });
}
// Take each field's literal text from the JSON so 250.00 stays "250.00".
function literalFields(raw, fields) {
  const out = {};
  for (const f of fields) {
    const m = raw.match(new RegExp('"' + f + '"\\s*:\\s*("((?:[^"\\\\]|\\\\.)*)"|[^,}\\s]+)', 'i'));
    if (!m) continue;
    out[f] = m[2] !== undefined ? JSON.parse('"' + m[2] + '"') : (m[1] === 'null' ? null : m[1]);
  }
  return out;
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
function fail(res, e) {
  const status = e instanceof HttpError ? e.status : 500;
  if (status >= 500) console.error('[skipcash]', e && e.message);
  send(res, status, { error: status >= 500 && !(e instanceof HttpError) ? 'Server error' : e.message });
}

module.exports = { ENV, STATUS, WEBHOOK_FIELDS, HttpError, need, sign, safeEqual, sb, userFromToken, skipcashCreate, skipcashGet, applyPayment, rawBody, literalFields, send, fail, payload };
