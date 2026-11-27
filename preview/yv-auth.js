/* Youverse: real student accounts in the site header.
   Sends "Sign in" to account.html and "My Space" to space.html, and shows the student's first name when signed in.
   Reads the Supabase session that supabase-js keeps in this browser (no extra library on content pages). */
(function () {
  var KEY = 'sb-bhcvhdyutwanorlpesnu-auth-token';
  var s = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  var u = s && s.user ? s.user : null;
  var meta = (u && u.user_metadata) || {};
  var first = String(meta.full_name || '').trim().split(/\s+/)[0] || '';
  window.YV_USER = u ? { id: u.id, email: u.email, name: meta.full_name || '', first: first } : null;

  var REG = /(?:^|[#\/])register(-en)?$|Register(-EN)?\.dc\.html$/i;
  var YOU = /(?:^|[#\/])you(-en)?$|You(-EN)?\.dc\.html$/i;
  function isEn(h) { return /-en$|-EN\.dc\.html$|lang=en/.test(h) || document.documentElement.lang === 'en'; }

  // Old design pages for sign-up and My Space now open the real pages.
  function route() {
    var h = location.hash.replace('#', '');
    if (/^you(-en)?$/.test(h)) location.replace('space.html' + (/-en$/.test(h) ? '?lang=en' : ''));
    else if (/^register(-en)?$/.test(h)) location.replace('account.html' + (/-en$/.test(h) ? '?lang=en' : ''));
  }
  if (/app\.html|\/$/.test(location.pathname)) { route(); window.addEventListener('hashchange', route); }

  function patch() {
    var as = document.querySelectorAll('a[href]');
    for (var i = 0; i < as.length; i++) {
      var a = as[i], h = a.getAttribute('href');
      if (a.dataset.yvAuth) continue;
      if (REG.test(h)) {
        var en = isEn(h);
        a.dataset.yvAuth = '1';
        if (window.YV_USER) {
          a.setAttribute('href', 'space.html' + (en ? '?lang=en' : ''));
          a.textContent = first || (en ? 'My Space' : 'مساحتي');
          a.title = u.email;
        } else {
          var login = /تسجيل الدخول|sign ?in|log ?in/i.test(a.textContent);
          a.setAttribute('href', 'account.html' + (en ? '?lang=en' : '') + (login ? (en ? '&' : '?') + 'mode=login' : ''));
        }
      } else if (YOU.test(h)) {
        a.dataset.yvAuth = '1';
        a.setAttribute('href', 'space.html' + (isEn(h) ? '?lang=en' : ''));
      }
    }
  }
  var t = null;
  function soon() { if (t) return; t = setTimeout(function () { t = null; patch(); }, 30); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch); else patch();
  new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true });
})();
