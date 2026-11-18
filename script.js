/* =========================================================
   Window Tinting Services: interactions & animation
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  if (!hasGSAP) { root.classList.remove('js'); root.classList.add('no-js'); }
  if (reduced) root.classList.add('reduced');
  $$('.year').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Smooth scroll ---------- */
  var lenis = null;
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  if (hasGSAP && !reduced && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.3 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ---------- Header, progress, mobile bar ---------- */
  var nav = $('.nav'), progress = $('.progress span'), mbar = $('.mbar'), hero = $('.hero');
  var lastY = window.scrollY, menuOpen = false, formVisible = false;
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-solid', y > 40);
    if (!menuOpen) {
      if (y > 500 && y > lastY + 2) nav.classList.add('is-hidden');
      else if (y < lastY - 2 || y <= 500) nav.classList.remove('is-hidden');
    }
    lastY = y;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (mbar) mbar.classList.toggle('is-on', y > hero.offsetHeight * 0.6 && !formVisible && !menuOpen);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  if ('IntersectionObserver' in window) {
    var navLinks = $$('.nav__links a');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) io.observe(s); });
    new IntersectionObserver(function (en) { formVisible = en[0].isIntersecting; onScroll(); }, { rootMargin: '0px 0px -12% 0px' }).observe($('.formcard'));
  }

  /* ---------- Mobile menu ---------- */
  var burger = $('.burger'), menu = $('#mobile-menu');
  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.remove('is-hidden');
    onScroll();
    if (open) {
      menu.hidden = false;
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
      if (hasGSAP && !reduced) {
        gsap.fromTo(menu, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power4.inOut' });
        gsap.fromTo($$('nav a, .mmenu__foot > *', menu), { x: -30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.05, duration: 0.6, delay: 0.25, ease: 'power3.out' });
      }
      var first = $('nav a', menu); if (first) first.focus({ preventScroll: true });
    } else {
      document.body.style.overflow = '';
      if (lenis) lenis.start();
      var done = function () { menu.hidden = true; };
      if (hasGSAP && !reduced) gsap.to(menu, { clipPath: 'inset(0 0 0 100%)', duration: 0.55, ease: 'power4.inOut', onComplete: done });
      else done();
    }
  }
  burger.addEventListener('click', function () { setMenu(!menuOpen); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 1023 && menuOpen) setMenu(false); });

  function goTo(id) {
    var target = $(id);
    if (!target) return;
    var wasOpen = menuOpen;
    setMenu(false);
    setTimeout(function () {
      scrollToTarget(id === '#home' ? 0 : target);
      if (id !== '#home') {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }, wasOpen ? 380 : 0);
    if (history.replaceState) history.replaceState(null, '', id);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2 || !$(id)) return;
      e.preventDefault();
      var svc = a.getAttribute('data-service');
      if (svc) {
        var sel = $('#f-service'); sel.value = svc; sel.dispatchEvent(new Event('change'));
        var type = /Residential/.test(svc) ? 'Home' : /Commercial/.test(svc) ? 'Business' : 'Vehicle';
        var r = $('input[name="project-type"][value="' + type + '"]'); if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
      }
      goTo(id);
    });
  });

  /* ---------- Accordion ---------- */
  var accItems = $$('.acc__item');
  function setAcc(item, open) {
    var btn = $('.acc__btn', item), panel = $('.acc__panel', item);
    btn.setAttribute('aria-expanded', String(open));
    item.classList.toggle('is-open', open);
    if (hasGSAP && !reduced) gsap.to(panel, { height: open ? 'auto' : 0, duration: 0.55, ease: 'power3.inOut' });
    else panel.style.height = open ? 'auto' : '0px';
  }
  accItems.forEach(function (item, i) {
    $('.acc__btn', item).addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      accItems.forEach(function (o) { if (o !== item && o.classList.contains('is-open')) setAcc(o, false); });
      setAcc(item, open);
    });
    if (i === 0) { item.classList.add('is-open'); $('.acc__btn', item).setAttribute('aria-expanded', 'true'); $('.acc__panel', item).style.height = 'auto'; }
  });

  /* =========================================================
     Tint Lab: shade picker + before/after divider
     ========================================================= */
  (function tintLab() {
    var stage = $('.lab__stage'), handle = $('.lab__handle');
    if (!stage) return;
    var shades = $$('.shade'), vltEl = $('.lab__vlt'), nameEl = $('.lab__name'), textEl = $('.lab__readout-text'), tagVlt = $('.lab__tag-vlt');
    var copy = {
      70: 'A subtle, factory-like look that keeps things bright while taking the edge off the sun.',
      50: 'A light-to-medium shade with a touch of privacy and less glare.',
      35: 'A balanced, popular look with noticeably less glare and a clean finish.',
      20: 'A dark, sleek look with strong privacy. Check your local limits for front windows.',
      5: 'The darkest "limo" shade, usually chosen for rear windows. Legal limits apply.'
    };
    function setShade(btn) {
      var v = parseInt(btn.getAttribute('data-vlt'), 10);
      shades.forEach(function (s) { var on = s === btn; s.classList.toggle('is-on', on); s.setAttribute('aria-checked', String(on)); s.tabIndex = on ? 0 : -1; });
      stage.style.setProperty('--vlt', v / 100);
      vltEl.textContent = v + '%'; tagVlt.textContent = v + '%';
      nameEl.textContent = $('span', btn).textContent;
      textEl.textContent = copy[v];
      var fs = $('#f-shade'); if (fs) { $$('option', fs).forEach(function (o) { if (o.textContent.indexOf(v + '%') === 0) fs.value = o.value; }); }
    }
    shades.forEach(function (s, i) {
      s.tabIndex = s.classList.contains('is-on') ? 0 : -1;
      s.addEventListener('click', function () { setShade(s); });
      s.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = shades[(i + 1) % shades.length];
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = shades[(i - 1 + shades.length) % shades.length];
        if (n) { e.preventDefault(); setShade(n); n.focus(); }
      });
    });
    // divider
    var split = 50, dragging = false;
    function setSplit(p) {
      split = Math.max(0, Math.min(100, p));
      stage.style.setProperty('--split', split + '%');
      handle.setAttribute('aria-valuenow', Math.round(split));
      handle.setAttribute('aria-valuetext', Math.round(100 - split) + ' percent of the view tinted');
    }
    function fromEvent(e) { var r = stage.getBoundingClientRect(); setSplit((e.clientX - r.left) / r.width * 100); }
    handle.addEventListener('pointerdown', function (e) { dragging = true; try { handle.setPointerCapture(e.pointerId); } catch (err) { /* noop */ } if (intro) intro.kill(); });
    handle.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { handle.addEventListener(ev, function () { dragging = false; }); });
    stage.addEventListener('click', function (e) { if (e.target.closest('.lab__handle')) return; if (intro) intro.kill(); fromEvent(e); });
    handle.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setSplit(split - step); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setSplit(split + step); }
      else if (e.key === 'Home') { e.preventDefault(); setSplit(0); }
      else if (e.key === 'End') { e.preventDefault(); setSplit(100); }
    });
    var intro = null;
    if (hasGSAP && !reduced) {
      var o = { p: 85 };
      setSplit(85);
      ScrollTrigger.create({
        trigger: stage, start: 'top 70%', once: true,
        onEnter: function () {
          intro = gsap.timeline()
            .to(o, { p: 15, duration: 1.6, ease: 'power2.inOut', onUpdate: function () { setSplit(o.p); } })
            .to(o, { p: 50, duration: 1.1, ease: 'power2.inOut', onUpdate: function () { setSplit(o.p); } });
        }
      });
    } else setSplit(50);
  })();

  /* =========================================================
     Quote form (Netlify Forms, AJAX)
     ========================================================= */
  (function form() {
    var f = $('.qform');
    if (!f) return;
    var success = $('.qsuccess'), errBox = $('.qform__error'), date = $('#f-date'), lbl = $('.lbl-vehicle');
    if (date) { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); date.min = d.toISOString().slice(0, 10); }
    $$('input[name="project-type"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        lbl.textContent = r.value === 'Vehicle' ? 'Year, make & model' : r.value === 'Home' ? 'Home details (rooms / windows)' : 'Business details (windows / storefront)';
      });
    });
    var rules = {
      'f-name': function (v) { return v.trim().length > 1 || 'Please enter your name.'; },
      'f-phone': function (v) { return v.replace(/\D/g, '').length >= 10 || 'Please enter a phone number with at least 10 digits.'; },
      'f-email': function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.'; },
      'f-service': function (v) { return !!v || 'Please choose a service.'; }
    };
    function check(id) {
      var el = document.getElementById(id), res = rules[id](el.value), err = document.getElementById(id + '-err'), ok = res === true;
      el.closest('.field').classList.toggle('is-invalid', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      if (err) { err.textContent = ok ? '' : res; if (ok) el.removeAttribute('aria-describedby'); else el.setAttribute('aria-describedby', id + '-err'); }
      return ok;
    }
    Object.keys(rules).forEach(function (id) {
      var el = document.getElementById(id), fld = el.closest('.field');
      el.addEventListener('blur', function () { if (el.value) check(id); });
      ['input', 'change'].forEach(function (ev) { el.addEventListener(ev, function () { if (fld.classList.contains('is-invalid')) check(id); }); });
    });
    function showError(msg) {
      errBox.innerHTML = msg + ' You can also call <a href="tel:+10000000000">(000) 000-0000</a>.';
      errBox.hidden = false;
    }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      errBox.hidden = true;
      var bad = null;
      Object.keys(rules).forEach(function (id) { if (!check(id) && !bad) bad = document.getElementById(id); });
      if (bad) { bad.focus(); showError('Please fix the highlighted fields.'); return; }
      f.classList.add('is-sending');
      var label = $('.qform__label', f), orig = label.textContent;
      label.textContent = 'Sending';
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(f)).toString() })
        .then(function (r) {
          if (!r.ok) throw new Error('Status ' + r.status);
          f.hidden = true; success.hidden = false; success.focus();
          if (hasGSAP && !reduced) {
            gsap.from(success.children, { y: 26, autoAlpha: 0, stagger: 0.08, duration: 0.7, ease: 'power3.out' });
            gsap.from($('.qsuccess__ico', success), { scale: 0, duration: 0.9, ease: 'back.out(2)' });
          }
        })
        .catch(function () { showError('Sorry, your request could not be sent. Please try again in a moment.'); })
        .then(function () { f.classList.remove('is-sending'); label.textContent = orig; });
    });
    $('.qsuccess__again').addEventListener('click', function () {
      f.reset(); success.hidden = true; f.hidden = false; errBox.hidden = true;
      $$('.field', f).forEach(function (x) { x.classList.remove('is-invalid'); });
      lbl.textContent = 'Year, make & model';
      $('#f-name').focus();
    });
  })();

  /* =========================================================
     Pointer effects
     ========================================================= */
  if (finePointer && !reduced && hasGSAP) {
    $$('.magnetic').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.22); my((e.clientY - r.top - r.height / 2) * 0.28); });
      el.addEventListener('pointerleave', function () { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, .45)' }); });
    });
    var sheen = $('.sheen-text');
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      hero.style.setProperty('--mx', px * 100 + '%'); hero.style.setProperty('--my', py * 100 + '%');
      if (sheen) gsap.to(sheen, { '--sx': (100 - px * 100) + '%', duration: 0.8, ease: 'power3.out' });
      gsap.to('.hero__media img', { x: (px - 0.5) * -20, y: (py - 0.5) * -12, duration: 1.2, ease: 'power3.out' });
    });
  }

  /* =========================================================
     GSAP choreography
     ========================================================= */
  if (!hasGSAP) return;

  $$('.split').forEach(function (h) {
    var label = h.textContent.replace(/\s+/g, ' ').trim();
    h.innerHTML = label.split(' ').map(function (w) { return '<span class="w" aria-hidden="true"><span>' + w + '</span></span>'; }).join(' ');
    h.setAttribute('aria-label', label);
  });

  if (reduced) return;

  /* ---------- Hero: film applied across the glass ---------- */
  var vltNum = $('.hero__vlt-num'), vltDot = $('.hero__vlt-bar em'), vlt = { v: 70 };
  var edge = { e: 0 };
  var htl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  htl.from('.hero__media img', { scale: 1.25, filter: 'brightness(1.8)', duration: 2.4 }, 0)
    .set('.hero__squeegee', { opacity: 1 }, 0.3)
    .to(edge, { e: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: function () { hero.style.setProperty('--edge', edge.e + '%'); } }, 0.3)
    .to(vlt, { v: 20, duration: 1.8, ease: 'power2.inOut', onUpdate: function () { vltNum.textContent = Math.round(vlt.v); vltDot.style.left = (100 - vlt.v) + '%'; } }, 0.3)
    .to('.hero__squeegee', { opacity: 0, duration: 0.4 }, 2)
    .from('.nav__inner', { y: -30, autoAlpha: 0, duration: 1 }, 0.2)
    .from('.hero__kicker', { y: 20, autoAlpha: 0, duration: 0.9 }, 0.5)
    .from('.hero__title .ln__in', { yPercent: 110, stagger: 0.12, duration: 1.2 }, 0.6)
    .from('.hero__lead, .hero__actions > *', { y: 24, autoAlpha: 0, stagger: 0.08, duration: 1 }, 1.1)
    .from('.hero__vlt', { x: 40, autoAlpha: 0, duration: 1 }, 0.4)
    .fromTo('.sheen-text', { '--sx': '100%' }, { '--sx': '0%', duration: 2.2, ease: 'power2.inOut' }, 1.4);

  gsap.to('.hero__media', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { y: -80, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });

  /* ---------- Ticker with scroll velocity ---------- */
  var tick = $('.ticker__track'), loop = null;
  if (tick) { loop = gsap.fromTo(tick, { xPercent: 0 }, { xPercent: -50, duration: 30, ease: 'none', repeat: -1 }); loop.totalTime(loop.duration() * 100); }
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      if (!loop) return;
      var v = self.getVelocity(), dir = self.direction;
      gsap.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(v) / 280, 5)), duration: 0.2, overwrite: true, onComplete: function () { gsap.to(loop, { timeScale: dir, duration: 1.2 }); } });
    }
  });

  /* ---------- Headings ---------- */
  $$('.split').forEach(function (h) {
    gsap.from($$('.w > span', h), { yPercent: 110, stagger: 0.05, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });
  $$('.kicker:not(.hero__kicker), .shead__lead, .contact__lead').forEach(function (el) {
    gsap.from(el, { y: 20, autoAlpha: 0, duration: 0.85, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });

  /* ---------- Services ---------- */
  ScrollTrigger.batch('.card', {
    start: 'top 90%', once: true,
    onEnter: function (els) { gsap.fromTo(els, { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, duration: 1.1, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }); }
  });
  gsap.set('.card', { autoAlpha: 0 });

  /* ---------- Tint lab ---------- */
  gsap.from('.lab__stage', { clipPath: 'inset(10% 6% 10% 6% round 26px)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: '.lab__stage', start: 'top 85%' } });
  gsap.from('.shade', { y: 24, autoAlpha: 0, stagger: 0.06, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: '.shades', start: 'top 92%' } });

  /* ---------- Benefits: window tints as you scroll ---------- */
  var pct = $('.benefits__pct');
  gsap.to('.benefits__tint', {
    opacity: 0.72, ease: 'none',
    scrollTrigger: {
      trigger: '.benefits', start: 'top 60%', end: 'bottom 70%', scrub: true,
      onUpdate: function (self) {
        var p = self.progress;
        pct.textContent = p < 0.12 ? 'Clear glass' : p < 0.4 ? '50% VLT' : p < 0.7 ? '35% VLT' : '20% VLT';
      }
    }
  });
  gsap.from('.perk', { y: 40, autoAlpha: 0, stagger: 0.08, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.perks', start: 'top 88%' } });

  /* ---------- Process ---------- */
  gsap.from('.process__img', { clipPath: 'inset(0 100% 0 0 round 26px)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: '.process__media', start: 'top 80%' } });
  gsap.fromTo('.process__line', { left: '0%', opacity: 0 }, { left: '100%', opacity: 1, duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: '.process__media', start: 'top 80%' }, onComplete: function () { gsap.to('.process__line', { opacity: 0, duration: 0.4 }); } });
  gsap.fromTo('.process__img img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.process', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.step', { x: -30, autoAlpha: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.steps', start: 'top 85%' } });

  /* ---------- Gallery ---------- */
  ScrollTrigger.batch('.gal__item', {
    start: 'top 92%', once: true,
    onEnter: function (els) {
      gsap.fromTo(els, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', stagger: 0.1, duration: 1.2, ease: 'expo.inOut', clearProps: 'clipPath' });
    }
  });

  /* ---------- FAQ / contact / footer ---------- */
  gsap.from('.acc__item', { y: 26, autoAlpha: 0, stagger: 0.06, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.acc', start: 'top 88%' } });
  gsap.from('.contact__points li, .contact__phone', { x: -24, autoAlpha: 0, stagger: 0.08, duration: 0.85, ease: 'power3.out', scrollTrigger: { trigger: '.contact__points', start: 'top 90%' } });
  gsap.from('.formcard', { y: 70, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.formcard', start: 'top 92%' } });
  gsap.fromTo('.foot__word-in', { '--fx': '100%' }, { '--fx': '0%', ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
