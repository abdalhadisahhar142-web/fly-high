/* =========================================================
   Fly High - main.js
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll progress bar ---------- */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);

  /* ---------- Preloader ---------- */
  document.body.classList.add('loading');
  const preloader = $('#preloader');
  const finishLoading = () => {
    if (!preloader || preloader.classList.contains('hide')) return;
    preloader.classList.add('hide');
    document.body.classList.remove('loading');
    setTimeout(startHero, 300);
  };
  window.addEventListener('load', () => setTimeout(finishLoading, 900));
  setTimeout(finishLoading, 4000); // safety

  /* ---------- Hero slider ---------- */
  const heroData = [
    { w1: 'حلّق', w2: 'عالياً', sub: 'لا نحجز لك مقعداً في طائرة فقط، بل نصمّم لك رحلة تعزلك عن ضجيج العالم' },
    { w1: 'اكتشف', w2: 'الأردن', sub: 'خمسة أيام بين سحر البتراء وهدوء وادي رم ورفاهية البحر الميت' },
    { w1: 'سافر', w2: 'بثقة', sub: 'تأشيرات بغداد، حجوزات وبرامج سياحية، ومكتبان في دمشق وبغداد لخدمتك' }
  ];
  const slides = $$('.hero__slide');
  const counterItems = $$('#heroCounter li');
  const word1 = $('#heroWord1');
  const word2 = $('#heroWord2');
  const heroSub = $('#heroSub');
  const heroProgress = $('#heroProgress');
  const SLIDE_TIME = 7000;
  let heroIndex = 0;
  let heroTimer = null;
  let progressStart = 0;

  function startHero() {
    $$('[data-hero]').forEach((el, i) => setTimeout(() => el.classList.add('in'), 500 + i * 180));
    setTimeout(() => word1.classList.add('in'), 150);
    setTimeout(() => word2.classList.add('in'), 330);
    launchPlane();
    restartHeroTimer();
    requestAnimationFrame(tickProgress);
  }

  function goToSlide(i) {
    if (i === heroIndex) return;
    slides[heroIndex].classList.remove('active');
    counterItems[heroIndex].classList.remove('active');
    heroIndex = (i + slides.length) % slides.length;
    slides[heroIndex].classList.add('active');
    counterItems[heroIndex].classList.add('active');

    // animate the words out then in
    [word1, word2].forEach(w => { w.classList.remove('in'); w.classList.add('out'); });
    heroSub.style.opacity = 0;
    setTimeout(() => {
      [word1, word2].forEach(w => {
        w.classList.remove('out');
        w.style.transition = 'none';
        w.style.transform = 'translateY(110%)';
      });
      word1.textContent = heroData[heroIndex].w1;
      word2.textContent = heroData[heroIndex].w2;
      heroSub.textContent = heroData[heroIndex].sub;
      void word1.offsetWidth;
      [word1, word2].forEach((w, k) => {
        w.style.transition = '';
        w.style.transform = '';
        setTimeout(() => w.classList.add('in'), k * 180);
      });
      heroSub.style.opacity = 1;
    }, 600);
    restartHeroTimer();
  }

  function restartHeroTimer() {
    clearInterval(heroTimer);
    progressStart = performance.now();
    heroTimer = setInterval(() => goToSlide(heroIndex + 1), SLIDE_TIME);
  }

  function tickProgress(now) {
    const p = Math.min((now - progressStart) / SLIDE_TIME, 1);
    // progress fills the 3 cards area: each slide owns a third
    heroProgress.style.width = ((heroIndex + p) / slides.length) * 100 + '%';
    requestAnimationFrame(tickProgress);
  }

  counterItems.forEach(li => li.addEventListener('click', () => goToSlide(+li.dataset.slide)));

  /* ---------- Flying plane along the SVG path ---------- */
  const plane = $('#flyingPlane');
  const flightPath = $('#flightPath');
  const hero = $('.hero');

  function launchPlane() {
    if (!plane || !flightPath || reduceMotion) return;
    const total = flightPath.getTotalLength();
    const dur = 9000;
    const start = performance.now();
    flightPath.style.transition = 'none';
    flightPath.style.strokeDasharray = `${total}`;
    flightPath.style.strokeDashoffset = `${total}`;

    function step(now) {
      const t = Math.min((now - start) / dur, 1);
      const e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic
      const len = e * total;
      const sx = hero.clientWidth / 1440;
      const sy = hero.clientHeight / 700;
      const p = flightPath.getPointAtLength(len);
      const p2 = flightPath.getPointAtLength(Math.min(len + 1, total));
      const angle = Math.atan2((p2.y - p.y) * sy, (p2.x - p.x) * sx) * 180 / Math.PI + 90;
      plane.style.transform = `translate(${p.x * sx - 17}px, ${p.y * sy - 17}px) rotate(${angle}deg)`;
      plane.style.opacity = t < .05 ? t / .05 : t > .92 ? (1 - t) / .08 : 1;
      flightPath.style.strokeDashoffset = total - len;
      if (t < 1) requestAnimationFrame(step);
      else {
        // fade the trail and fly again later
        flightPath.style.transition = 'stroke-dashoffset 2s ease';
        setTimeout(() => { flightPath.style.strokeDashoffset = -total; }, 600);
        setTimeout(launchPlane, 6000);
      }
    }
    requestAnimationFrame(step);
  }

  /* ---------- Header: scrolled / hide on scroll down ---------- */
  const header = $('#header');
  const toTop = $('#toTop');
  let lastY = 0;
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    header.classList.toggle('hidden', y > lastY && y > 500 && !nav.classList.contains('open'));
    toTop.classList.toggle('show', y > 700);
    const h = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.width = (y / h) * 100 + '%';
    lastY = y;
    parallax();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Nav: indicator + active link + mobile menu ---------- */
  const nav = $('#nav');
  const navLinks = $$('.nav__link');
  const indicator = $('#navIndicator');
  const burger = $('#burger');

  function moveIndicator(link) {
    if (!link || innerWidth <= 860) return;
    indicator.style.width = link.offsetWidth - 20 + 'px';
    indicator.style.left = link.offsetLeft + 10 + 'px';
  }
  navLinks.forEach(l => {
    l.addEventListener('mouseenter', () => moveIndicator(l));
    l.addEventListener('click', () => {
      nav.classList.remove('open');
      burger.classList.remove('open');
      header.classList.remove('menu-open');
    });
  });
  nav.addEventListener('mouseleave', () => moveIndicator($('.nav__link.active')));
  window.addEventListener('resize', () => moveIndicator($('.nav__link.active')));
  window.addEventListener('load', () => moveIndicator($('.nav__link.active')));

  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
    burger.classList.toggle('open');
    header.classList.toggle('menu-open', nav.classList.contains('open'));
  });

  /* ---------- Dark / Light mode ---------- */
  const root = document.documentElement;
  $('#themeToggle').addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.classList.add('theme-anim');
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('flyhigh-theme', next); } catch (e) {}
    setTimeout(() => root.classList.remove('theme-anim'), 600);
  });

  const sections = navLinks.map(l => $(l.getAttribute('href'))).filter(Boolean);
  const secObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const link = navLinks.find(l => l.getAttribute('href') === '#' + entry.target.id);
      if (!link) return;
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      moveIndicator(link);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => secObserver.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      setTimeout(() => el.classList.add('in'), +(el.dataset.delay || 0));
      revealObserver.unobserve(el);
    });
  }, { threshold: 0.15 });
  $$('[data-reveal]').forEach(el => revealObserver.observe(el));

  /* ---------- Counters ---------- */
  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.count;
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const dur = 2000;
      const start = performance.now();
      const step = now => {
        const t = Math.min((now - start) / dur, 1);
        const val = Math.round(target * (1 - Math.pow(1 - t, 4)));
        el.textContent = prefix + val.toLocaleString('en-US') + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countObserver.observe(el));

  /* ---------- Destinations slider (RTL) ---------- */
  const track = $('#destTrack');
  const cards = $$('.dest-card', track);
  const dotsWrap = $('#destDots');
  let destIndex = 0;
  let destTimer;

  const perView = () => (innerWidth <= 540 ? 1 : innerWidth <= 860 ? 2 : innerWidth <= 1024 ? 3 : 4);
  const maxIndex = () => Math.max(0, cards.length - perView());

  function buildDots() {
    dotsWrap.innerHTML = '';
    for (let i = 0; i <= maxIndex(); i++) {
      const b = document.createElement('button');
      b.setAttribute('aria-label', 'شريحة ' + (i + 1));
      b.addEventListener('click', () => { goDest(i); restartDest(); });
      dotsWrap.appendChild(b);
    }
  }
  function goDest(i) {
    const max = maxIndex();
    destIndex = i > max ? 0 : i < 0 ? max : i;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const offset = destIndex * (cards[0].offsetWidth + gap);
    track.style.transform = `translateX(${offset}px)`; // positive in RTL
    $$('button', dotsWrap).forEach((d, k) => d.classList.toggle('active', k === destIndex));
  }
  function restartDest() {
    clearInterval(destTimer);
    destTimer = setInterval(() => goDest(destIndex + 1), 4500);
  }
  $('#destNext').addEventListener('click', () => { goDest(destIndex + 1); restartDest(); });
  $('#destPrev').addEventListener('click', () => { goDest(destIndex - 1); restartDest(); });
  $('#destSlider').addEventListener('mouseenter', () => clearInterval(destTimer));
  $('#destSlider').addEventListener('mouseleave', restartDest);

  // swipe
  let touchX = null;
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) { goDest(destIndex + (dx > 0 ? 1 : -1)); restartDest(); }
    touchX = null;
  });

  buildDots(); goDest(0); restartDest();
  window.addEventListener('resize', () => { buildDots(); goDest(Math.min(destIndex, maxIndex())); });

  /* ---------- Visas: select a row → update map card + WhatsApp link ---------- */
  const visaRows = $$('.visa-row');
  const visaSel = $('#visaSelected');
  visaRows.forEach(row => {
    row.addEventListener('click', () => {
      if (row.classList.contains('active')) return;
      visaRows.forEach(r => r.classList.remove('active'));
      row.classList.add('active');
      $('#visaSelTitle').textContent = row.dataset.title;
      $('#visaSelNote').textContent = row.dataset.note;
      $('#visaWa').href = 'https://wa.me/963982379379?text=' + encodeURIComponent(row.dataset.msg);
      visaSel.classList.remove('swap'); void visaSel.offsetWidth; visaSel.classList.add('swap');
    });
  });

  /* ---------- 3D tilt on cards ---------- */
  if (window.matchMedia('(hover: hover)').matches && !reduceMotion) {
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- Parallax ---------- */
  const parallaxEls = $$('[data-parallax]');
  function parallax() {
    if (reduceMotion) return;
    parallaxEls.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      el.style.transform = `translateY(${p * -80}px)`;
    });
    // subtle hero parallax
    const y = window.scrollY;
    if (y < innerHeight) {
      $('.hero__slides').style.transform = `translateY(${y * 0.35}px)`;
      $('.hero__content').style.transform = `translateY(${y * 0.15}px)`;
      $('.hero__content').style.opacity = 1 - y / (innerHeight * .9);
    }
  }

  /* ---------- Video modal ---------- */
  const modal = $('#videoModal');
  const video = $('#promoVideo');
  $('#playBtn').addEventListener('click', () => {
    modal.classList.add('open');
    if (video && video.play) video.play().catch(() => {});
  });
  const closeModal = () => {
    modal.classList.remove('open');
    if (video && video.pause) video.pause();
  };
  $('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  /* ---------- Lightbox ---------- */
  const lightbox = $('#lightbox');
  const lbImg = $('img', lightbox);
  $$('.gallery__item img, .journey__img img').forEach(img => {
    img.addEventListener('click', () => {
      lbImg.src = img.src;
      lightbox.classList.add('open');
    });
  });
  lightbox.addEventListener('click', () => lightbox.classList.remove('open'));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); lightbox.classList.remove('open'); }
  });

  /* ---------- Contact form → WhatsApp ---------- */
  const form = $('#contactForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#fName').value.trim();
    const phone = $('#fPhone').value.trim();
    const service = $('#fService').value;
    const msg = $('#fMsg').value.trim();
    const text =
      `مرحباً Fly High،\n` +
      `الاسم: ${name}\n` +
      `الهاتف: ${phone}\n` +
      `الخدمة: ${service}` +
      (msg ? `\nالتفاصيل: ${msg}` : '');
    const btn = $('.btn--send', form);
    btn.classList.add('sent');
    setTimeout(() => {
      window.open('https://wa.me/963982379379?text=' + encodeURIComponent(text), '_blank');
      btn.classList.remove('sent');
      form.reset();
    }, 700);
  });

  /* ---------- Misc ---------- */
  $('#year').textContent = new Date().getFullYear();
  onScroll();
})();
