(() => {
  // ---- RESUME SETTINGS ----
  // Paste your Google Drive file ID here (see the steps in the chat).
  // Example link: https://drive.google.com/file/d/1AbC...xyz/view  ->  ID is 1AbC...xyz
  // Leave empty to use a local resume.pdf placed next to index.html.
  const RESUME_FILE_ID = '1ReQgqbvZJt-97X9NP9AkbdI872kdXIti';

  if (RESUME_FILE_ID) {
    const view = `https://drive.google.com/file/d/${RESUME_FILE_ID}/view`;
    const dl = `https://drive.google.com/uc?export=download&id=${RESUME_FILE_ID}`;
    const prev = `https://drive.google.com/file/d/${RESUME_FILE_ID}/preview`;
    document.querySelectorAll('#resume a[href="resume.pdf"]').forEach(a => {
      a.href = a.hasAttribute('download') ? dl : view;
      a.removeAttribute('download');
    });
    const f = document.querySelector('#resume iframe');
    if (f) f.dataset.src = prev;
  }

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();

  // Mobile nav
  const toggle = document.querySelector('.nav__toggle');
  const links = document.getElementById('nav-links');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', e => {
    if (e.target.tagName === 'A') {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Resume preview (loads the PDF only when asked)
  const pBtn = document.getElementById('preview-toggle');
  const pBox = document.getElementById('resume-preview');
  pBtn.addEventListener('click', () => {
    const opening = pBox.hidden;
    const frame = pBox.querySelector('iframe');
    if (opening && !frame.src) frame.src = frame.dataset.src;
    pBox.hidden = !opening;
    pBtn.setAttribute('aria-expanded', opening);
    pBtn.textContent = opening ? 'Hide preview' : 'Preview here';
  });

  // Highlight current section in nav
  const navLinks = [...links.querySelectorAll('a')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(a => {
    const s = document.querySelector(a.getAttribute('href'));
    if (s) spy.observe(s);
  });

  // Hero: a small network where packets hop between nodes
  const canvas = document.getElementById('net');
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = getComputedStyle(document.documentElement);
  const PEACH = css.getPropertyValue('--peach').trim();
  const AMBER = css.getPropertyValue('--amber').trim();
  const CREAM = css.getPropertyValue('--cream').trim();

  const LABELS = ['Web', 'Desktop', 'Algorithms', 'Data', 'Community'];
  let w, h, nodes = [], edges = [], packets = [], mouse = null;

  function build() {
    const dpr = window.devicePixelRatio || 1;
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.round(Math.min(46, Math.max(16, (w * h) / 22000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18,
      r: 2.5 + Math.random() * 2.5
    }));
    // Labeled nodes stay on the right half of wide screens so they don't cover the headline
    const minX = w > 900 ? w * 0.55 : 0;
    nodes.slice(0, LABELS.length).forEach((n, i) => {
      n.label = LABELS[i]; n.r = 6; n.minX = minX;
      n.x = minX + 40 + Math.random() * (w - minX - 140);
      n.y = 60 + Math.random() * (h - 120);
    });
    packets = [];
  }

  function link() {
    const max = Math.min(190, Math.max(130, w / 6));
    edges = [];
    nodes.forEach((a, i) => {
      a.nb = [];
    });
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d < max) {
          edges.push([i, j, 1 - d / max]);
          nodes[i].nb.push(j); nodes[j].nb.push(i);
        }
      }
    }
  }

  function spawn() {
    const from = Math.floor(Math.random() * nodes.length);
    const nb = nodes[from].nb;
    if (!nb || !nb.length) return;
    packets.push({ from, to: nb[Math.floor(Math.random() * nb.length)], t: 0, hops: 0, speed: .008 + Math.random() * .008 });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    if (!reduce) {
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < (n.minX || 0) || n.x > (n.label ? w - 110 : w)) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });
    }
    link();

    edges.forEach(([i, j, s]) => {
      ctx.strokeStyle = PEACH;
      ctx.globalAlpha = .08 + s * .22;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(nodes[i].x, nodes[i].y);
      ctx.lineTo(nodes[j].x, nodes[j].y);
      ctx.stroke();
    });

    nodes.forEach(n => {
      const near = mouse && Math.hypot(n.x - mouse.x, n.y - mouse.y) < 90;
      ctx.globalAlpha = near ? 1 : .55;
      ctx.fillStyle = near ? AMBER : PEACH;
      ctx.beginPath();
      ctx.arc(n.x, n.y, near ? n.r + 2 : n.r, 0, Math.PI * 2);
      ctx.fill();
      if (n.label) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = CREAM;
        ctx.font = '600 15px "Instrument Sans", sans-serif';
        ctx.fillText(n.label, n.x + n.r + 8, n.y + 5);
      }
    });

    ctx.globalAlpha = 1;
    packets = packets.filter(p => {
      const a = nodes[p.from], b = nodes[p.to];
      p.t += p.speed;
      if (p.t >= 1) {
        p.hops++;
        if (p.hops >= 5) return false;
        const opts = b.nb.filter(k => k !== p.from);
        if (!opts.length) return false;
        p.from = p.to;
        p.to = opts[Math.floor(Math.random() * opts.length)];
        p.t = 0;
        return true;
      }
      const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
      ctx.fillStyle = AMBER;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.globalAlpha = .25; ctx.fill();
      ctx.fillStyle = CREAM;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.globalAlpha = 1; ctx.fill();
      return true;
    });

    if (!reduce && packets.length < 5 && Math.random() < .03) spawn();
    if (!reduce) requestAnimationFrame(draw);
  }

  canvas.parentElement.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  canvas.parentElement.addEventListener('mouseleave', () => { mouse = null; });
  window.addEventListener('resize', () => { build(); if (reduce) draw(); });

  build();
  draw();
})();