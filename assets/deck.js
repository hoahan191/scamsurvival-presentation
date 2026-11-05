(() => {
  const slides = [...document.querySelectorAll('#stage > .s')];
  const N = slides.length;
  const isSpeaker = new URLSearchParams(location.search).has('speaker');
  const chan = 'BroadcastChannel' in window ? new BroadcastChannel('scamsurvival-deck') : null;
  const $ = (s) => document.querySelector(s);
  let cur = 0, interacted = false, typed = '';

  // ---------- scaling ----------
  const stage = $('#stage');
  function fit() {
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `scale(${k})`;
    document.querySelectorAll('.thumb, #spk .view').forEach(scaleMini);
  }
  function scaleMini(box) {
    const m = box.querySelector('.mini');
    if (m) m.style.transform = `scale(${box.clientWidth / 1920})`;
  }

  // ---------- clones for overview / speaker view (videos become posters) ----------
  function cloneSlide(i) {
    const c = slides[i].firstElementChild.cloneNode(true);
    c.querySelectorAll('video').forEach(v => {
      const img = document.createElement('img');
      img.src = v.getAttribute('poster'); img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block';
      v.replaceWith(img);
    });
    c.querySelectorAll('.play-btn').forEach(b => b.remove());
    const w = document.createElement('div'); w.className = 'mini'; w.appendChild(c);
    return w;
  }

  // ---------- video ----------
  function videoOf(i) { return slides[i] && slides[i].querySelector('video'); }
  function playCurrent() {
    const v = videoOf(cur); if (!v) return;
    v.play().catch(() => {});
  }
  function toggleVideo() {
    const v = videoOf(cur); if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
  }
  slides.forEach(s => {
    const v = s.querySelector('video'); if (!v) return;
    const wrap = v.closest('.video-wrap');
    const sync = () => wrap.classList.toggle('playing', !v.paused && !v.ended);
    ['play', 'pause', 'ended'].forEach(e => v.addEventListener(e, sync));
    const b = s.querySelector('.play-btn');
    if (b) b.addEventListener('click', (e) => { e.stopPropagation(); interacted = true; v.play().catch(() => {}); });
  });

  // ---------- navigation ----------
  function go(i, from) {
    i = Math.max(0, Math.min(N - 1, i));
    const prev = cur; cur = i;
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    slides.forEach((s, k) => { if (k !== i) { const v = videoOf(k); if (v && !v.paused) v.pause(); } });
    if (!isSpeaker) {
      const v = videoOf(i);
      if (v && prev !== i) { if (v.ended) v.currentTime = 0; if (interacted) playCurrent(); }
    }
    if (location.hash !== '#' + (i + 1)) history.replaceState(null, '', '#' + (i + 1));
    $('#counter').textContent = `${i + 1} / ${N}`;
    $('#bar').style.width = ((i + 1) / N * 100) + '%';
    const notes = slides[i].dataset.notes || '';
    $('#notes').innerHTML = `<b>Ghi chú · ${i + 1}/${N} · ${esc(slides[i].dataset.label || '')}</b>${esc(notes) || '<i>Không có ghi chú.</i>'}`;
    document.title = `${i + 1}/${N} · ${slides[i].dataset.label || ''} · SCAM SURVIVAL`;
    if (isSpeaker) renderSpeaker();
    if (chan && from !== 'remote') chan.postMessage({ type: 'go', i });
  }
  const esc = (t) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const next = () => go(cur + 1), prev = () => go(cur - 1);

  if (chan) chan.onmessage = (e) => {
    const m = e.data || {};
    if (m.type === 'go' && m.i !== cur) go(m.i, 'remote');
    if (m.type === 'video' && !isSpeaker) toggleVideo();
    if (m.type === 'hello' && !isSpeaker) chan.postMessage({ type: 'go', i: cur });
  };

  // ---------- overlays ----------
  function toggle(id, force) {
    const el = $(id); const open = force ?? !el.classList.contains('open');
    document.querySelectorAll('.overlay').forEach(o => { if (o !== el) o.classList.remove('open'); });
    el.classList.toggle('open', open);
    if (id === '#overview' && open) buildGrid();
  }
  let gridBuilt = false;
  function buildGrid() {
    const g = $('#grid');
    if (!gridBuilt) {
      slides.forEach((s, i) => {
        const t = document.createElement('div'); t.className = 'thumb'; t.dataset.i = i;
        t.appendChild(cloneSlide(i));
        const lab = document.createElement('i'); lab.textContent = `${i + 1}. ${s.dataset.label || ''}`; t.appendChild(lab);
        t.addEventListener('click', () => { toggle('#overview', false); go(i); });
        g.appendChild(t);
      });
      gridBuilt = true;
    }
    g.querySelectorAll('.thumb').forEach(t => { t.classList.toggle('cur', +t.dataset.i === cur); scaleMini(t); });
  }
  function fullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }
  function openSpeaker() {
    window.open(location.pathname + '?speaker#' + (cur + 1), 'scamsurvival-speaker', 'width=1280,height=800');
  }

  // ---------- keyboard / pointer ----------
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    interacted = true;
    const k = e.key;
    if (/^[0-9]$/.test(k)) { typed += k; return; }
    if (k === 'Enter' && typed) { go(parseInt(typed, 10) - 1); typed = ''; return; }
    typed = '';
    const overlayOpen = document.querySelector('.overlay.open');
    if (k === 'Escape') { document.querySelectorAll('.overlay').forEach(o => o.classList.remove('open')); $('#notes').classList.remove('open'); return; }
    if (overlayOpen && !['g', 'G', 'o', 'O', '?', 'h', 'H'].includes(k)) return;
    switch (k) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': e.preventDefault(); prev(); break;
      case 'Home': go(0); break;
      case 'End': go(N - 1); break;
      case 'f': case 'F': fullscreen(); break;
      case 'n': case 'N': $('#notes').classList.toggle('open'); break;
      case 'g': case 'G': case 'o': case 'O': toggle('#overview'); break;
      case 's': case 'S': if (!isSpeaker) openSpeaker(); break;
      case 'p': case 'P': case 'k': case 'K':
        isSpeaker ? chan && chan.postMessage({ type: 'video' }) : toggleVideo(); break;
      case '?': case 'h': case 'H': toggle('#help'); break;
    }
  });
  // keep video keyboard focus from swallowing navigation
  document.querySelectorAll('video').forEach(v => v.addEventListener('focus', () => v.blur()));

  let tx = null;
  addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', (e) => {
    if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) { interacted = true; dx < 0 ? next() : prev(); }
  });
  addEventListener('pointerdown', () => { interacted = true; });

  let idleT;
  addEventListener('mousemove', () => {
    document.body.classList.remove('idle'); clearTimeout(idleT);
    idleT = setTimeout(() => document.body.classList.add('idle'), 2500);
  });

  $('#b-prev').onclick = prev; $('#b-next').onclick = next;
  $('#b-grid').onclick = () => toggle('#overview');
  $('#b-notes').onclick = () => $('#notes').classList.toggle('open');
  $('#b-full').onclick = fullscreen;
  $('#b-help').onclick = () => toggle('#help');
  $('#help').addEventListener('click', (e) => { if (e.target.id === 'help') toggle('#help', false); });

  // ---------- speaker view ----------
  let t0 = null, timerI = null;
  function renderSpeaker() {
    const put = (sel, i) => {
      const box = $(sel); box.innerHTML = '';
      if (i < N) { box.appendChild(cloneSlide(i)); scaleMini(box); }
      else box.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#8a93a2;font-size:20px">Hết bài</div>';
    };
    put('#spk-cur', cur); put('#spk-next', cur + 1);
    $('#spk-count').textContent = `Slide ${cur + 1} / ${N} · ${slides[cur].dataset.label || ''}`;
    $('#spk-notes').textContent = slides[cur].dataset.notes || 'Không có ghi chú.';
  }
  if (isSpeaker) {
    document.body.classList.add('speaker');
    document.querySelectorAll('#stage video').forEach(v => { v.muted = true; v.removeAttribute('autoplay'); v.preload = 'none'; });
    const tick = () => {
      const s = t0 ? Math.floor((Date.now() - t0) / 1000) : 0;
      $('#spk-time').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };
    $('#spk-start').onclick = () => { t0 = Date.now(); clearInterval(timerI); timerI = setInterval(tick, 500); tick(); };
    $('#spk-prev').onclick = prev; $('#spk-next-b').onclick = next;
    $('#spk-video').onclick = () => chan && chan.postMessage({ type: 'video' });
    tick();
    if (chan) chan.postMessage({ type: 'hello' });
  }

  addEventListener('resize', fit);
  addEventListener('hashchange', () => { const n = parseInt(location.hash.slice(1), 10); if (n && n - 1 !== cur) go(n - 1); });
  fit();
  const start = parseInt(location.hash.slice(1), 10);
  go(start && start <= N ? start - 1 : 0, 'remote');
})();
