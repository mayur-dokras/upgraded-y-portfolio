(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Header + nav ---------- */
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

  /* ---------- Hero: risk heatmap ---------- */
  const heat = $('#heat');
  // 5x5 likelihood x impact grid, six key risks plotted (Kultura)
  const risks = new Set(['1-3', '1-4', '2-2', '2-4', '3-1', '3-3']);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const score = (4 - r) + c; // 0..8
      const cell = document.createElement('span');
      const color = score >= 6 ? 'rgba(217,102,91,.75)' : score >= 4 ? 'rgba(226,160,79,.7)' : 'rgba(111,184,168,.55)';
      cell.style.background = color;
      if (risks.has(r + '-' + c)) cell.className = 'dot';
      heat.appendChild(cell);
    }
  }

  /* ---------- Hero: 3D stack ---------- */
  const stack = $('#stack');
  const scene = $('#scene');
  const portrait = $('.hero-portrait');
  requestAnimationFrame(() => setTimeout(() => stack.classList.add('ready'), reduced ? 0 : 150));

  if (!reduced) {
    const hero = $('.hero');
    hero.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const r = scene.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / r.width;
      const y = (e.clientY - (r.top + r.height / 2)) / r.height;
      stack.style.setProperty('--rx', (-y * 14).toFixed(2) + 'deg');
      stack.style.setProperty('--ry', (x * 18).toFixed(2) + 'deg');
      portrait.style.setProperty('--px', (x * -14).toFixed(1) + 'px');
      portrait.style.setProperty('--py', (y * -10).toFixed(1) + 'px');
    });
    hero.addEventListener('pointerleave', () => {
      stack.style.setProperty('--rx', '0deg');
      stack.style.setProperty('--ry', '0deg');
      portrait.style.setProperty('--px', '0px');
      portrait.style.setProperty('--py', '0px');
    });
  }

  /* ---------- Scroll effects ---------- */
  const cases = $$('.case');
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 8);
    if (reduced) return;
    // explode layers as you scroll past the hero
    if (stack.classList.contains('ready')) {
      const gap = 64 + Math.min(y, 500) * 0.09;
      stack.style.setProperty('--gap', gap.toFixed(1) + 'px');
    }
    // case-study cards recede as the next one slides over
    if (window.innerWidth > 760) {
      cases.forEach((card, i) => {
        const next = cases[i + 1];
        if (!next) return;
        const a = card.getBoundingClientRect();
        const b = next.getBoundingClientRect();
        const overlap = Math.min(Math.max((a.bottom - b.top) / a.height, 0), 1);
        card.style.setProperty('--sc', (1 - overlap * 0.06).toFixed(4));
        card.style.setProperty('--br', (1 - overlap * 0.35).toFixed(3));
      });
    }
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Experience Gantt ---------- */
  const roles = [
    {
      id: 'be', type: 'edu', label: 'BE Instrumentation & Control', sub: 'AISSMS IOIT, Pune',
      start: '2018-08', end: '2022-06', dates: '2018 to 2022',
      title: 'BE Instrumentation and Control Engineering', org: 'AISSMS IOIT, Pune',
      points: [
        'CGPA 8.72/10 with Distinction.',
        'Industry-sponsored final-year project: a digital twin box-lifting system, planned and documented over 8.5 months.',
        'Published research on digital twin technology.'
      ],
      img: 'assets/img/digital-twin.webp', alt: 'Digital twin simulation of a conveyor and box-lift mechanism', cap: 'Digital twin simulation built in iPhysics Player for the final-year project.'
    },
    {
      id: 'aiesec', type: 'lead', label: 'International Relations Manager', sub: 'AIESEC in Pune',
      start: '2021-02', end: '2022-01', dates: 'Feb 2021 to Jan 2022',
      title: 'International Relations Manager and Senior Manager, University Relations', org: 'AIESEC in Pune',
      points: [
        'Coordinated with university partners and AIESEC teams in Sri Lanka, Egypt and Turkey across cultures and time zones.',
        'Supported two university MoUs and presented opportunities at six colleges.',
        'Led a six-person volunteer team recognised as Best Team / Best Delegation at the regional conference.',
        'Part of the Pune entity recognised as Best Entity in India at the national conference.'
      ],
      img: 'assets/img/aiesec-team.jpg', alt: 'Yukta Soman, in the centre, with her AIESEC team at a regional conference', cap: 'October regional conference, Best Team / Best Delegation. Yukta is in the centre.'
    },
    {
      id: 'borgward', type: 'work', label: 'Brand Development Manager', sub: 'Borgward Group, Pune',
      start: '2022-12', end: '2024-03', dates: 'Dec 2022 to Mar 2024',
      title: 'Brand Development Manager', org: 'Borgward Group, Pune, reporting to the Director',
      points: [
        'Kept 20+ client-facing software, website, digital, creative and technical projects moving across a 32-person organisation.',
        'Turned client briefs into schedules, milestones, owners and action trackers, and captured decisions in MoMs.',
        'Tracked budgets, supplier quotations, resources, risks, changes and approvals, raising blockers with their likely cost or schedule impact.',
        'Recovered a software project after its developer left: clarified client concerns, secured freelance cover and added end-of-sprint reviews.',
        'Researched and presented a seven-part educational video series on technical topics; the strongest reached about 3,400 views.'
      ],
      img: 'assets/img/borgward-delivery.svg', alt: 'Non-confidential reconstruction of cross-functional delivery responsibilities at Borgward Group', cap: 'Non-confidential reconstruction of my responsibilities. No client or commercially sensitive information is shown.'
    },
    {
      id: 'msc', type: 'edu', label: 'MSc Project Management', sub: 'University of Southampton',
      start: '2024-09', end: '2025-09', dates: '2024 to 2025',
      title: 'MSc Project Management, Distinction', org: 'University of Southampton',
      points: [
        "Dean's List for outstanding achievement.",
        'Dissertation (72%) on procurement-phase construction risks, using survey data from 54 professionals.'
      ]
    },
    {
      id: 'kultura', type: 'client', label: 'Quality Assurance Lead', sub: 'Kultura client project',
      start: '2024-10', end: '2025-05', dates: 'Oct 2024 to May 2025',
      title: 'Quality Assurance Lead, Kultura', org: 'University of Southampton client project. Winner, APM Wessex PM Challenge 2025',
      points: [
        'Set the quality plan, acceptance criteria, KPIs and review checkpoints.',
        'Maintained a 25-item risk register and helped prioritise six key risks.',
        'Reviewed outputs against client, GDPR and accessibility requirements, and turned gaps into corrective actions.',
        'Kept evidence, decisions and progress visible in ClickUp and Notion.'
      ],
      img: 'assets/img/kultura-prototype.webp', alt: 'Kultura mobile prototype screens', cap: 'Kultura prototype by The Thrive Tribe for the APM Wessex Region challenge.'
    },
    {
      id: 'ufton', type: 'client', label: 'Project Lead', sub: 'Ufton Court client project',
      start: '2025-01', end: '2025-02', dates: 'Jan to Feb 2025',
      title: 'Project Lead, Exploring Navigation', org: 'Ufton Court client project',
      points: [
        'Led a four-week assignment from an open brief to a project plan, team actions and a final client presentation.',
        'One concept was shortlisted for possible implementation.'
      ],
      img: 'assets/img/ufton-navigation.webp', alt: 'Operation Ufton Rescue concept slide', cap: 'Operation Ufton Rescue, one of the concepts presented to Ufton Court.'
    },
    {
      id: 'sainsburys', type: 'work', label: 'Trading Assistant, part-time', sub: "Sainsbury's Local, Southampton",
      start: '2025-04', end: null, dates: 'Apr 2025 to present',
      title: 'Trading Assistant (part-time)', org: "Sainsbury's Local, Southampton",
      points: [
        'Customer service, stock accuracy and clear shift handovers in a fast-paced UK retail environment.',
        'Balancing changing priorities alongside study and job search.'
      ]
    }
  ];

  const toMonths = s => { const [y, m] = s.split('-').map(Number); return y * 12 + (m - 1); };
  const now = new Date();
  const nowM = now.getFullYear() * 12 + now.getMonth();
  const axisStart = 2018 * 12;
  const axisEnd = (now.getFullYear() + 1) * 12;
  const span = axisEnd - axisStart;
  const pct = m => ((m - axisStart) / span) * 100;

  const axis = $('#gantt-axis');
  const rowsEl = $('#gantt-rows');
  rowsEl.style.setProperty('--year-w', (12 / span * 100) + '%');
  const years = now.getFullYear() + 1 - 2018;
  for (let y = 2018; y <= now.getFullYear(); y++) {
    const s = document.createElement('span');
    s.textContent = y;
    s.style.left = pct(y * 12 + 6) + '%';
    if (window.innerWidth < 520 && y % 2) s.style.display = 'none';
    axis.appendChild(s);
  }
  const today = document.createElement('i');
  today.className = 'g-today';
  today.style.left = pct(nowM) + '%';
  axis.appendChild(today);

  const panel = $('#role-panel');
  const bars = [];
  roles.forEach(r => {
    const row = document.createElement('div');
    row.className = 'g-row';
    row.innerHTML = `<div class="g-label">${r.label}<small>${r.sub}</small></div><div class="g-track"></div>`;
    const bar = document.createElement('button');
    bar.type = 'button';
    bar.className = 'g-bar ' + r.type + (r.end ? '' : ' ongoing');
    bar.setAttribute('role', 'tab');
    bar.setAttribute('aria-selected', 'false');
    bar.setAttribute('aria-controls', 'role-panel');
    bar.setAttribute('aria-label', `${r.title}, ${r.org}, ${r.dates}`);
    bar.id = 'bar-' + r.id;
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
  // today line across rows
  const todayRows = document.createElement('i');
  todayRows.className = 'g-today';
  todayRows.classList.add('no-label');
  todayRows.style.left = `calc(var(--label) + (100% - var(--label)) * ${pct(nowM) / 100})`;
  todayRows.setAttribute('aria-hidden', 'true');
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
        <p class="role-meta">${r.dates}</p>
        <h3>${r.title}</h3>
        <p class="role-org">${r.org}</p>
        <ul>${r.points.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>
      ${r.img ? `<figure class="role-media"><img src="${r.img}" alt="${r.alt}" loading="lazy"><figcaption>${r.cap}</figcaption></figure>` : ''}`;
    if (animate && !reduced) {
      panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
    }
  }
  select('borgward', false);

  /* ---------- Skills matrix ---------- */
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
