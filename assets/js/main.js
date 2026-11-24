(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  requestAnimationFrame(() => document.body.classList.add('loaded'));

  /* ================= Header + nav ================= */
  const header = $('.site-header');
  const nav = $('#site-nav');
  const toggle = $('.menu-toggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
  });
  $$('#site-nav a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Menu';
  }));
  const navLinks = $$('#site-nav a:not(.nav-cta)');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  /* ================= Galaxy: 3D star particles ================= */
  const canvas = $('#galaxy');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  let mouseX = 0, mouseY = 0, tiltX = 0, tiltY = 0;
  let scrollY = window.scrollY;

  const rand = (a, b) => a + Math.random() * (b - a);
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  // far-field stars
  const stars = Array.from({ length: 620 }, () => ({
    x: Math.random(), y: Math.random(), z: Math.random(),
    s: Math.random() < .06 ? rand(1.2, 1.9) : rand(.35, 1),
    t: Math.random() * Math.PI * 2, tw: rand(.6, 2.2)
  }));

  // the ring: points on a torus with gaussian thickness, assembling from scattered positions
  const RING_N = window.innerWidth < 760 ? 1800 : 3400;
  const ring = Array.from({ length: RING_N }, (_, i) => {
    const a = Math.random() * Math.PI * 2;
    const clump = 1 + .18 * Math.sin(a * 3) + .1 * Math.sin(a * 7 + 1.3);
    const r = (1 + gauss() * .11 * clump);
    const h = gauss() * .07;
    const bright = Math.random() < .018;
    return {
      a, r, h,
      // scattered start (for the assembly moment)
      sx: rand(-2.4, 2.4), sy: rand(-1.6, 1.6), sz: rand(-1.5, 1.5),
      size: bright ? rand(1.3, 2.1) : rand(.35, 1.05),
      bright,
      tw: Math.random() * Math.PI * 2
    };
  });

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.75);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  if (finePointer) {
    window.addEventListener('pointermove', e => {
      mouseX = (e.clientX / W) - .5;
      mouseY = (e.clientY / H) - .5;
    }, { passive: true });
  }

  const start = performance.now();
  const ease = t => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 4);

  function frame(now) {
    const t = (now - start) / 1000;
    tiltX += (mouseY - tiltX) * .04;
    tiltY += (mouseX - tiltY) * .04;
    ctx.clearRect(0, 0, W, H);

    // --- far stars (parallax with scroll + pointer) ---
    for (const s of stars) {
      const px = ((s.x * W + tiltY * -30 * s.z) % W + W) % W;
      const py = (((s.y * H - scrollY * (.04 + s.z * .08) + tiltX * -20 * s.z) % H) + H) % H;
      const a = .35 + .45 * (.5 + .5 * Math.sin(t * s.tw + s.t));
      ctx.fillStyle = `rgba(220,232,255,${a * (.5 + s.z * .5)})`;
      ctx.fillRect(px, py, s.s, s.s);
    }

    // --- ring placement ---
    const mobile = W < 760;
    const R = Math.min(W, H) * (mobile ? .36 : .27);
    let cx = W * (mobile ? .72 : .7);
    let cy = H * (mobile ? .3 : .44) - scrollY * .35;
    const fade = Math.max(0, 1 - scrollY / (H * 1.4));
    const spread = 1 + Math.min(scrollY / H, 1.5) * .55;

    if (fade > 0.01) {
      const assemble = reduced ? 1 : ease((t - .2) / 2.6);
      const spin = reduced ? 0 : t * .07;
      const tilt = .62 + tiltX * .5;          // rotation about X axis
      const yaw = -.35 + tiltY * .6;            // rotation about Y axis
      const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
      const f = 3.2;

      // soft nebula glow behind the ring
      const g = ctx.createRadialGradient(cx, cy, R * .2, cx, cy, R * 1.6 * spread);
      g.addColorStop(0, `rgba(70,110,200,${.10 * fade})`);
      g.addColorStop(.55, `rgba(40,80,170,${.07 * fade})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of ring) {
        const ang = p.a + spin;
        // ring coords (unit)
        let x = Math.cos(ang) * p.r * spread;
        let y = Math.sin(ang) * p.r * spread;
        let z = p.h;
        // blend from scattered
        x = p.sx + (x - p.sx) * assemble;
        y = p.sy + (y - p.sy) * assemble;
        z = p.sz + (z - p.sz) * assemble;
        // rotate about X (tilt the ring)
        const y1 = y * cosT - z * sinT;
        const z1 = y * sinT + z * cosT;
        // rotate about Y
        const x2 = x * cosY + z1 * sinY;
        const z2 = -x * sinY + z1 * cosY;
        const persp = f / (f + z2);
        const sx = cx + x2 * R * persp;
        const sy = cy + y1 * R * persp;
        const depth = Math.max(.25, Math.min(1, persp - .35));
        const tw = .65 + .35 * Math.sin(t * 2 + p.tw);
        const core = Math.max(0, 1 - Math.abs(p.r - 1) * 5);
        const alpha = (p.bright ? 1 : .32 + .6 * core) * depth * tw * fade * (mobile ? .7 : 1);
        const size = p.size * persp;
        if (p.bright) {
          ctx.fillStyle = `rgba(150,190,255,${alpha * .12})`;
          ctx.beginPath(); ctx.arc(sx, sy, size * 2.2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath(); ctx.arc(sx, sy, size * .8, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = `rgba(205,222,255,${alpha})`;
          ctx.fillRect(sx, sy, size * 1.15, size * 1.15);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    if (!reduced) raf = requestAnimationFrame(frame);
  }
  let raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!reduced) raf = requestAnimationFrame(frame);
  });

  /* ================= Scroll effects ================= */
  const cases = $$('.case');
  let ticking = false;
  function onScroll() {
    ticking = false;
    scrollY = window.scrollY;
    header.classList.toggle('scrolled', scrollY > 8);
    if (reduced && !ticking) requestAnimationFrame(frame);
    if (reduced || window.innerWidth <= 760) return;
    cases.forEach((card, i) => {
      const next = cases[i + 1];
      if (!next) return;
      const a = card.getBoundingClientRect();
      const b = next.getBoundingClientRect();
      const overlap = Math.min(Math.max((a.bottom - b.top) / a.height, 0), 1);
      card.style.setProperty('--sc', (1 - overlap * .06).toFixed(4));
      card.style.setProperty('--br', (1 - overlap * .45).toFixed(3));
    });
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ================= 3D tilt on cards ================= */
  if (finePointer && !reduced) {
    $$('.tilt').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty('--tx', (-y * 7).toFixed(2) + 'deg');
        el.style.setProperty('--ty', (x * 9).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--tx', '0deg');
        el.style.setProperty('--ty', '0deg');
      });
    });
  }

  /* ================= Count-up metrics ================= */
  const counter = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      counter.unobserve(e.target);
      if (reduced) return;
      const el = e.target, target = +el.dataset.count, suffix = el.dataset.suffix || '';
      const t0 = performance.now();
      const step = now => {
        const p = Math.min((now - t0) / 1100, 1);
        el.textContent = Math.round(target * ease(p)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(el => counter.observe(el));

  /* ================= Ask the portfolio ================= */
  const form = $('#prompt');
  const input = $('#prompt-input');
  const result = $('#prompt-result');
  const phrases = [
    'Find a project coordinator who keeps plans, risks and people in step.',
    'Show me how Yukta recovered an at-risk software project.',
    'What did she do as Quality Assurance Lead on Kultura?',
    'Which PM tools does she use day to day?'
  ];
  let typing = true, pi = 0, ci = 0, deleting = false, typeTimer;
  function typeLoop() {
    if (!typing) return;
    const full = phrases[pi];
    if (!deleting) {
      ci++;
      input.placeholder = full.slice(0, ci);
      if (ci >= full.length) { deleting = true; typeTimer = setTimeout(typeLoop, 2200); return; }
      typeTimer = setTimeout(typeLoop, 34 + Math.random() * 40);
    } else {
      ci -= 3;
      input.placeholder = full.slice(0, Math.max(ci, 0));
      if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; ci = 0; typeTimer = setTimeout(typeLoop, 400); return; }
      typeTimer = setTimeout(typeLoop, 18);
    }
  }
  if (reduced) input.placeholder = phrases[0];
  else {
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting) { io.disconnect(); typeLoop(); }
    }, { threshold: .4 });
    io.observe(form);
  }
  input.addEventListener('focus', () => { typing = false; clearTimeout(typeTimer); input.placeholder = 'Ask about experience, risk, projects, skills or contact'; });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });

  const routes = [
    { id: 'contact', words: ['contact', 'email', 'hire', 'reach', 'linkedin', 'phone', 'available', 'cv', 'resume'], say: 'Opening contact details' },
    { id: 'work', words: ['project', 'case', 'kultura', 'recover', 'ufton', 'navigation', 'twin', 'deliver', 'outcome', 'portfolio'], say: 'Opening case studies' },
    { id: 'skills', words: ['skill', 'tool', 'jira', 'excel', 'ms project', 'microsoft', 'agile', 'scrum', 'method', 'raid', 'risk', 'budget', 'quality'], say: 'Opening the skills evidence matrix' },
    { id: 'timeline', words: ['experience', 'role', 'job', 'work', 'career', 'borgward', 'aiesec', 'sainsbury'], say: 'Opening the experience timeline' },
    { id: 'education', words: ['education', 'degree', 'msc', 'study', 'university', 'southampton', 'certif', 'award', 'apm'], say: 'Opening education and recognition' },
    { id: 'approach', words: ['approach', 'how', 'process', 'phase', 'method'], say: 'Opening how Yukta works' }
  ];
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = (input.value || input.placeholder).toLowerCase();
    let best = routes.find(r => r.words.some(w => q.includes(w))) || routes[3];
    result.textContent = best.say + ' …';
    setTimeout(() => {
      document.getElementById(best.id).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      result.textContent = '';
    }, reduced ? 0 : 500);
  });
  $$('.chips-row button').forEach(b => b.addEventListener('click', () => {
    typing = false; clearTimeout(typeTimer);
    input.value = b.dataset.q;
    form.requestSubmit();
  }));

  /* ================= Experience Gantt ================= */
  const roles = [
    { id: 'be', type: 'edu', label: 'BE Instrumentation & Control', sub: 'AISSMS IOIT, Pune', start: '2018-08', end: '2022-06', dates: '2018 – 2022',
      title: 'BE Instrumentation and Control Engineering', org: 'AISSMS IOIT, Pune',
      points: ['CGPA 8.72/10 with Distinction.', 'Industry-sponsored final-year project: a digital twin box-lifting system, planned and documented over 8.5 months.', 'Published research on digital twin technology.'],
      img: 'assets/img/digital-twin.webp', alt: 'Digital twin simulation of a conveyor and box-lift mechanism', cap: 'Digital twin simulation built in iPhysics Player for the final-year project.' },
    { id: 'aiesec', type: 'lead', label: 'International Relations Manager', sub: 'AIESEC in Pune', start: '2021-02', end: '2022-01', dates: 'Feb 2021 – Jan 2022',
      title: 'International Relations Manager & Senior Manager, University Relations', org: 'AIESEC in Pune',
      points: ['Coordinated with university partners and AIESEC teams in Sri Lanka, Egypt and Turkey across cultures and time zones.', 'Supported two university MoUs and presented opportunities at six colleges.', 'Led a six-person volunteer team recognised as Best Team / Best Delegation at the regional conference.', 'Part of the Pune entity recognised as Best Entity in India at the national conference.'],
      img: 'assets/img/aiesec-team.jpg', alt: 'Yukta Soman, in the centre, with her AIESEC team at a regional conference', cap: 'October regional conference, Best Team / Best Delegation. Yukta is in the centre.' },
    { id: 'borgward', type: 'work', label: 'Brand Development Manager', sub: 'Borgward Group, Pune', start: '2022-12', end: '2024-03', dates: 'Dec 2022 – Mar 2024',
      title: 'Brand Development Manager', org: 'Borgward Group, Pune · reporting to the Director',
      points: ['Kept 20+ client-facing software, website, digital, creative and technical projects moving across a 32-person organisation.', 'Turned client briefs into schedules, milestones, owners and action trackers, and captured decisions in MoMs.', 'Tracked budgets, supplier quotations, resources, risks, changes and approvals, raising blockers with their likely cost or schedule impact.', 'Recovered a software project after its developer left: clarified client concerns, secured freelance cover and added end-of-sprint reviews.', 'Researched and presented a seven-part educational video series on technical topics; the strongest reached about 3,400 views.'],
      img: 'assets/img/borgward-delivery.svg', alt: 'Non-confidential reconstruction of cross-functional delivery responsibilities at Borgward Group', cap: 'Non-confidential reconstruction of my responsibilities. No client or commercially sensitive information is shown.' },
    { id: 'msc', type: 'edu', label: 'MSc Project Management', sub: 'University of Southampton', start: '2024-09', end: '2025-09', dates: '2024 – 2025',
      title: 'MSc Project Management, Distinction', org: 'University of Southampton',
      points: ["Dean's List for outstanding achievement.", 'Dissertation (72%) on procurement-phase construction risks, using survey data from 54 professionals.'] },
    { id: 'kultura', type: 'client', label: 'Quality Assurance Lead', sub: 'Kultura client project', start: '2024-10', end: '2025-05', dates: 'Oct 2024 – May 2025',
      title: 'Quality Assurance Lead, Kultura', org: 'University of Southampton client project · APM Wessex winner 2025',
      points: ['Set the quality plan, acceptance criteria, KPIs and review checkpoints.', 'Maintained a 25-item risk register and helped prioritise six key risks.', 'Reviewed outputs against client, GDPR and accessibility requirements, and turned gaps into corrective actions.', 'Kept evidence, decisions and progress visible in ClickUp and Notion.'],
      img: 'assets/img/kultura-prototype.webp', alt: 'Kultura mobile prototype screens', cap: 'Kultura prototype by The Thrive Tribe for the APM Wessex Region challenge.' },
    { id: 'ufton', type: 'client', label: 'Project Lead', sub: 'Ufton Court client project', start: '2025-01', end: '2025-02', dates: 'Jan – Feb 2025',
      title: 'Project Lead, Exploring Navigation', org: 'Ufton Court client project',
      points: ['Led a four-week assignment from an open brief to a project plan, team actions and a final client presentation.', 'One concept was shortlisted for possible implementation.'],
      img: 'assets/img/ufton-navigation.webp', alt: 'Operation Ufton Rescue concept slide', cap: 'Operation Ufton Rescue, one of the concepts presented to Ufton Court.' },
    { id: 'sainsburys', type: 'work', label: 'Trading Assistant, part-time', sub: "Sainsbury's Local, Southampton", start: '2025-04', end: null, dates: 'Apr 2025 – present',
      title: 'Trading Assistant (part-time)', org: "Sainsbury's Local, Southampton",
      points: ['Customer service, stock accuracy and clear shift handovers in a fast-paced UK retail environment.', 'Balancing changing priorities alongside study and job search.'] }
  ];

  const toMonths = s => { const [y, m] = s.split('-').map(Number); return y * 12 + (m - 1); };
  const now = new Date();
  const nowM = now.getFullYear() * 12 + now.getMonth();
  const axisStart = 2018 * 12, axisEnd = (now.getFullYear() + 1) * 12, span = axisEnd - axisStart;
  const pct = m => ((m - axisStart) / span) * 100;

  const axis = $('#gantt-axis');
  const rowsEl = $('#gantt-rows');
  rowsEl.style.setProperty('--year-w', (12 / span * 100) + '%');
  for (let y = 2018; y <= now.getFullYear(); y++) {
    const s = document.createElement('span');
    s.textContent = y;
    s.style.left = pct(y * 12 + 6) + '%';
    if (window.innerWidth < 520 && y % 2) s.style.display = 'none';
    axis.appendChild(s);
  }
  const todayAxis = document.createElement('i');
  todayAxis.className = 'g-today';
  todayAxis.style.left = pct(nowM) + '%';
  axis.appendChild(todayAxis);

  const panel = $('#role-panel');
  const bars = [];
  roles.forEach(r => {
    const row = document.createElement('div');
    row.className = 'g-row';
    row.innerHTML = `<div class="g-label">${r.label}<small>${r.sub}</small></div><div class="g-track"></div>`;
    const bar = document.createElement('button');
    bar.type = 'button';
    bar.className = 'g-bar ' + r.type + (r.end ? '' : ' ongoing');
    bar.id = 'bar-' + r.id;
    bar.setAttribute('role', 'tab');
    bar.setAttribute('aria-selected', 'false');
    bar.setAttribute('aria-controls', 'role-panel');
    bar.setAttribute('aria-label', `${r.title}, ${r.org}, ${r.dates}`);
    const s = toMonths(r.start);
    const e = r.end ? toMonths(r.end) + 1 : nowM + 1;
    bar.style.left = pct(s) + '%';
    bar.style.width = (pct(e) - pct(s)) + '%';
    bar.addEventListener('click', () => select(r.id, true));
    bar.addEventListener('keydown', ev => {
      const i = roles.findIndex(x => x.id === r.id);
      let j = null;
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') j = (i + 1) % roles.length;
      if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') j = (i - 1 + roles.length) % roles.length;
      if (j !== null) { ev.preventDefault(); select(roles[j].id, true); bars[j].focus(); }
    });
    row.querySelector('.g-track').appendChild(bar);
    rowsEl.appendChild(row);
    bars.push(bar);
  });
  const todayRows = document.createElement('i');
  todayRows.className = 'g-today no-label';
  todayRows.setAttribute('aria-hidden', 'true');
  todayRows.style.left = `calc(var(--label) + (100% - var(--label)) * ${pct(nowM) / 100})`;
  rowsEl.appendChild(todayRows);

  function select(id, animate) {
    const r = roles.find(x => x.id === id);
    bars.forEach((b, i) => {
      const on = roles[i].id === id;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', 'bar-' + id);
    panel.classList.toggle('no-media', !r.img);
    panel.innerHTML = `
      <div>
        <p class="label small">${r.dates}</p>
        <h3>${r.title}</h3>
        <p class="role-org">${r.org}</p>
        <ul>${r.points.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>
      ${r.img ? `<figure class="role-media"><img src="${r.img}" alt="${r.alt}" loading="lazy"><figcaption>${r.cap}</figcaption></figure>` : ''}`;
    if (animate && !reduced) { panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap'); }
  }
  select('borgward', false);

  /* ================= Skills matrix ================= */
  const cols = ['Borgward', 'Kultura', 'Ufton Court', 'AIESEC', 'MSc'];
  const matrix = [
    ['Scope definition and WBS', [1, 1, 1, 0, 1]],
    ['Schedules, milestones and dependencies', [1, 1, 1, 0, 0]],
    ['Budget, supplier and resource tracking', [1, 0, 0, 0, 0]],
    ['RAID logs and risk registers', [1, 1, 0, 0, 1]],
    ['Quality plans and acceptance criteria', [1, 1, 0, 0, 0]],
    ['Status reporting and MoMs', [1, 1, 1, 1, 0]],
    ['Change control and approvals', [1, 0, 0, 0, 0]],
    ['UAT and handover', [1, 1, 0, 0, 0]],
    ['Client and partner presentations', [1, 1, 1, 1, 0]],
    ['International, cross-cultural teams', [0, 1, 0, 1, 1]]
  ];
  $('#matrix-body').innerHTML = matrix.map(([name, flags]) =>
    `<tr><th scope="row">${name}</th>${flags.map((f, i) =>
      `<td>${f ? `<span class="m-dot" role="img" aria-label="Used at ${cols[i]}"></span>` : `<span class="m-none" role="img" aria-label="Not applicable"></span>`}</td>`).join('')}</tr>`
  ).join('');

  $('#year').textContent = now.getFullYear();
})();
