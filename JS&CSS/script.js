function $(id) {
  const el = document.getElementById(id);
  if (!el) console.warn('[КУЛЬТУРИ] не найден #' + id);
  return el;
}
const wait = ms => new Promise(r => setTimeout(r, ms));

function lockIntroScroll() {
  document.body.classList.add('intro-locked');
}

function unlockIntroScroll() {
  document.body.classList.remove('intro-locked');
}

function lockStoryScroll() {
  document.body.classList.add('story-locked');
}

function unlockStoryScroll() {
  document.body.classList.remove('story-locked');
}

function cutOffIntro() {
  document.body.classList.add('past-intro');
}

lockIntroScroll();
;(function initPlugWorld() {
  const track = $('plug-track');
  if (!track) return;
  let current = 0;
  function goTo(n) {
    current = Math.max(0, Math.min(n, 2));
    track.style.transform = 'translateX(-' + (current * 100) + 'vw)';

    var wp = document.querySelector('.wire-path');

  if (current === 1) {
    var wp = document.querySelector('.wire-path');
    if (wp) wp.classList.add('wire-drawn');
  }
  }
  const world = $('plug-world');
  if (world) {
    world.addEventListener('wheel', function(e) {
      e.preventDefault();
      if ((e.deltaY > 30 || e.deltaX > 30) && current < 1) goTo(current + 1);
      else if ((e.deltaY < -30 || e.deltaX < -30) && current > 0) goTo(current - 1);
    }, { passive: false });
  }

  const btn = $('scroll-arrow-btn');
  if (btn) btn.addEventListener('click', function() { if (current < 1) goTo(1); });

  window._plugWorld = { goTo, get: function() { return current; } };
})();

;(function initPlugDrag() {
const plug = $('plug');
const socket = $('socket');
if (!plug || !socket) return;

const plugNormal = $('plug-normal');
const plugInserted = $('plug-inserted');
const plugLabel = $('plug-label');
const plugTail = $('plug-cable-exit');

let dragging = false;
let dragOX = 0;
let dragOY = 0;
let savedWidth = 0;
let homeX = 0;
let homeY = 0;
let connected = false;

function socketCenter() {
  const r = socket.getBoundingClientRect();
  return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 };
}

function pt(e) {
  return e.touches
    ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
    : { x: e.clientX, y: e.clientY };
}

function updateWire() {
  const paths = document.querySelectorAll('.wire-path-dynamic');
  const svgs = document.querySelectorAll('.wire-svg-dynamic');
  if (!paths.length) return;

  const anchor = plugTail && plugTail.getBoundingClientRect
    ? plugTail.getBoundingClientRect()
    : plug.getBoundingClientRect();

  const x1 = anchor.left;
  const y1 = anchor.top + anchor.height / 2 - 6;

  const x2 = window.innerWidth;
  const y2 = y1;

  const cx1 = x1 + 40;
  const cy1 = y1;

  const cx2 = x1 + 180;
  const cy2 = y1;

  const d =
    'M ' + x1 + ' ' + y1 +
    ' C ' + cx1 + ' ' + cy1 +
    ' ' + cx2 + ' ' + cy2 +
    ' ' + x2 + ' ' + y2;

  paths.forEach(function(p) { p.setAttribute('d', d); });
  svgs.forEach(function(s) { s.style.display = 'block'; });
}

function hideWire() {
  document.querySelectorAll('.wire-svg-dynamic').forEach(function(s) {
    s.style.display = 'none';
  });
  document.querySelectorAll('.wire-path-dynamic').forEach(function(p) {
    p.setAttribute('d', '');
  });
}

function onStart(e) {
  if (connected) return;
  e.preventDefault();
  dragging = true;

  const r = plug.getBoundingClientRect();
  savedWidth = r.width;

  const p = pt(e);
  dragOX = p.x - r.left;
  dragOY = p.y - r.top;

  homeX = r.left;
  homeY = r.top;

  plug.style.cssText = [
    'position: fixed',
    'left: ' + (p.x - dragOX) + 'px',
    'top: ' + (p.y - dragOY) + 'px',
    'right: auto',
    'bottom: auto',
    'width: ' + savedWidth + 'px',
    'z-index: 9999',
    'cursor: grabbing',
    'transition: none',
    'animation: none',
    'transform: rotate(0deg) scale(1.05)',
    'filter: drop-shadow(0 16px 32px rgba(80,60,40,0.35))'
  ].join(';');
}

function onMove(e) {
  if (!dragging) return;
  e.preventDefault();

  const p = pt(e);
  plug.style.left = (p.x - dragOX) + 'px';
  plug.style.top = (p.y - dragOY) + 'px';
  updateWire();
}

function onEnd() {
  if (!dragging) return;
  dragging = false;
  plug.classList.remove('plug--dragging');
  plug.style.cursor = 'grab';

  const pr = plug.getBoundingClientRect();
  const sc = socketCenter();
  const dist = Math.hypot(
    pr.left + pr.width / 2 - sc.x,
    pr.top + pr.height / 2 - sc.y
  );

  if (dist < 120) {
    socket.classList.remove('socket--active');
    connected = true;

    const socketRect = socket.getBoundingClientRect();
    const insertedW = Math.round(socketRect.width * 0.92);
    const insertedH = Math.round(insertedW * (136 / 180));
    const snapX = sc.x - insertedW / 2;
    const snapY = sc.y - insertedH / 2;

    plug.style.width = insertedW + 'px';
    plug.style.filter = 'drop-shadow(0 0 18px rgba(255,220,80,0.55))';

    plugInserted.style.width = '100%';
    plugInserted.style.height = 'auto';

    plug.style.transition = 'left 0.35s cubic-bezier(0.4,0,0.2,1), top 0.35s cubic-bezier(0.4,0,0.2,1)';
    plug.style.left = snapX + 'px';
    plug.style.top = snapY + 'px';

    setTimeout(function() {
      if (plugNormal) plugNormal.style.display = 'none';
      if (plugInserted) plugInserted.style.display = 'block';
      if (plugLabel) plugLabel.style.opacity = '0';
      hideWire();
    }, 280);

    setTimeout(function() { triggerConnection(); }, 200);

  } else {
    plug.style.transition = 'left 0.4s cubic-bezier(0.4,0,0.2,1), top 0.4s cubic-bezier(0.4,0,0.2,1)';
    plug.style.left = homeX + 'px';
    plug.style.top = homeY + 'px';

    setTimeout(function() {
      plug.style.position = '';
      plug.style.left = '';
      plug.style.top = '';
      plug.style.right = '';
      plug.style.bottom = '';
      plug.style.width = '';
      plug.style.height = '';
      plug.style.zIndex = '';
      plug.style.transition = '';
      updateWire();
    }, 420);
  }
}

plug.addEventListener('mousedown', onStart);
plug.addEventListener('touchstart', onStart, { passive: false });
document.addEventListener('mousemove', onMove);
document.addEventListener('touchmove', onMove, { passive: false });
document.addEventListener('mouseup', onEnd);
document.addEventListener('touchend', onEnd);

updateWire();
window.addEventListener('resize', updateWire);
})();

async function triggerConnection() {
  console.log('%c✅ triggerConnection СРАБОТАЛ', 'color: lime; font-size: 16px;');

  const flash = $('connect-flash');
  const ct    = $('connect-text');
  const phone = $('phone-section');
  const audio = $('phone-ring-audio');

  if (flash) {
    flash.classList.add('flashing');
    setTimeout(function() {
      flash.classList.remove('flashing');
    }, 900);
  }

  document.body.classList.add('shaking');
  setTimeout(function() {
    document.body.classList.remove('shaking');
  }, 700);

  await wait(300);

  if (phone) {
    phone.classList.add('active');
  }

  if (audio) {
    audio.currentTime = 0;
    audio.loop = true;  
    const playPromise = audio.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(err => {
        console.warn('Не удалось воспроизвести звук звонка:', err);
      });
    }
  }

  if (ct) {
    ct.classList.add('visible');
    setTimeout(function() {
      ct.classList.remove('visible');
    }, 900);
  }

  await wait(600);
  startPhoneSequence();
}

function startPhoneSequence() {
  const sec = $('phone-section');
  if (!sec) return;
  sec.classList.add('ringing');

  const btn = $('phone-pick-btn');
  if (!btn) return;
  btn.style.display = 'block';

  btn.addEventListener('click', async function handler() {
  btn.removeEventListener('click', handler);
  btn.style.display = 'none';
  sec.classList.remove('ringing');

  const audio = $('phone-ring-audio');
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.loop = false;
  }

  const nextMusic = $('phone-next-audio');
  if (nextMusic) {
  nextMusic.currentTime = 0;
  nextMusic.play().catch(err => {
    console.warn('Не удалось запустить вторую музыку:', err);
  });
  }

  const q = $('dial-question');
  const a = $('dial-ask');
  const m = $('dial-mock');

  function showLine(el) {
    if (!el) return;
    el.style.display = 'block';
    requestAnimationFrame(() => el.classList.add('visible'));
  }

  function swapState(fromId, toId) {
    const from = $(fromId);
    const to = $(toId);
    if (from) from.style.display = 'none';
    if (to) to.style.display = 'flex';
  }

  try {
    swapState('phone-ringing', 'phone-lifted');
    await wait(800);

    showLine(q);
    await wait(1500);

    showLine(a);
    await wait(2000);

    swapState('phone-lifted', 'phone-mockery');
    showLine(m);
    await wait(3100);
  } catch (err) {
    console.error('Ошибка в сценарии телефона:', err);
  }

  triggerDark();
});
}

async function triggerDark() {
  cutOffIntro();

  const phone = $('phone-section');
  if (phone) {
    phone.classList.remove('active');
    phone.style.opacity = '0';
    phone.style.pointerEvents = 'none';
  }

  const dt = $('dark-transition');
  if (dt) {
    const ov = dt.querySelector('.transition-overlay');
    if (ov) ov.style.opacity = '1';
  }

  await wait(400);

  unlockIntroScroll();
  unlockStoryScroll();
  const story = $('story');
  if (story) story.scrollIntoView({ behavior: 'smooth' });
  initStorySlider();
}

let _storyInit = false;
function initStorySlider() {
  if (_storyInit) return;
  _storyInit = true;

  const slides = Array.from(document.querySelectorAll('.story-block'));
  const cur    = $('story-current');
  const tot    = $('story-total');
  const sec    = $('story');
  if (!slides.length) return;

  let current = 0, busy = false;
  if (tot) tot.textContent = slides.length;

  function go(n) {
    if (busy || n < 0 || n >= slides.length || n === current) return;
    busy = true;
    slides[current].classList.remove('active');
    slides[current].classList.add('leaving');
    slides[n].classList.add('active');
    current = n;
    if (cur) cur.textContent = current + 1;

    setTimeout(function() {
      slides.forEach(function(s) { s.classList.remove('leaving'); });
      busy = false;
    }, 800);

    if (current === slides.length - 1) {
      setTimeout(function() {
        revealCta();
      }, 900);
    }
  }

  slides[0].classList.add('active');
  if (cur) cur.textContent = '1';

  let wt = null;
  if (sec) {
    sec.addEventListener('wheel', function(e) {
      e.preventDefault();
      if (current === slides.length - 1 && e.deltaY > 40) { revealCta(); return; }
      clearTimeout(wt);
      wt = setTimeout(function() {
        if (e.deltaY > 30) go(current + 1);
        else if (e.deltaY < -30) go(current - 1);
      }, 40);
    }, { passive: false });
  }

  document.addEventListener('keydown', function(e) {
    if (!sec) return;
    const r = sec.getBoundingClientRect();
    if (r.top > window.innerHeight || r.bottom < 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
    if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  { e.preventDefault(); go(current - 1); }
  });

  let ty = 0, tx = 0;
  if (sec) {
    sec.addEventListener('touchstart', function(e) {
      ty = e.touches[0].clientY;
      tx = e.touches[0].clientX;
    }, { passive: true });

    sec.addEventListener('touchend', function(e) {
      const dy = ty - e.changedTouches[0].clientY;
      const dx = tx - e.changedTouches[0].clientX;
      if (Math.abs(dy) > Math.abs(dx)) {
        if (dy > 50) go(current + 1);
        if (dy < -50) go(current - 1);
      }
    }, { passive: true });
  }
}

function revealCta() {
  const cta = $('cta');
  if (!cta) return;

  const portrait = cta.querySelector('.cta-portrait');
  if (portrait) {
    portrait.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    cta.scrollIntoView({ behavior: 'smooth' });
  }

  setTimeout(function() {
    const el = cta.querySelector('.cta-portrait');
    if (el) el.classList.add('visible');
  }, 600);

  setTimeout(function() {
    const el = cta.querySelector('.cta-text');
    if (el) el.classList.add('visible');
  }, 1200);

  setTimeout(function() {
    const el = $('paintings-orbit');
    if (el) el.classList.add('active');
  }, 1800);

  setTimeout(function() {
    cta.querySelectorAll('.download-btn').forEach(function(b) {
      b.classList.add('visible');
    });
  }, 2200);
}

;(function initNavTheme() {
  const nav = $('navbar');
  if (!nav) return;
  const darkIds = ['story', 'cta', 'topics', 'contacts'];
  function check() {
    const nb = nav.getBoundingClientRect().bottom;
    let dark = false;
    darkIds.forEach(function(id) {
      const el = document.getElementById(id); if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top <= nb && r.bottom >= 0) dark = true;
    });
    nav.classList.toggle('navbar--dark', dark);
  }
  window.addEventListener('scroll', check, { passive: true });
  check();
})();

;(function() {
  const els = document.querySelectorAll('.reveal-on-scroll');
  if (!els.length) return;
  const obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); obs.unobserve(entry.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  els.forEach(function(el) { obs.observe(el); });
})();

;(function() {
  const cta = $('cta');
  if (!cta) return;
  const obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) { if (entry.isIntersecting) { revealCta(); obs.unobserve(cta); } });
  }, { threshold: 0.2 });
  obs.observe(cta);
})();

;(function() {
  document.querySelectorAll('.topic-card').forEach(function(c) {
    c.addEventListener('focus', function() { c.style.transform = 'translateY(-24px)'; });
    c.addEventListener('blur',  function() { c.style.transform = ''; });
  });

  document.querySelectorAll('.download-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault(); 
      btn.style.transform = 'scale(0.96)';
      setTimeout(function() {
        btn.style.transform = '';
        window.location.href = btn.getAttribute('href');
      }, 150);
    });
});
})();

;(function() {
  const world = $('plug-world');
  if (!world || !window._plugWorld) return;
  let startX = 0;
  world.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; }, { passive: true });
  world.addEventListener('touchend', function(e) {
    const diff = startX - e.changedTouches[0].clientX;
    const cur = window._plugWorld.get();
    if (diff > 50 && cur < 1) window._plugWorld.goTo(1);
    if (diff < -50 && cur > 0) window._plugWorld.goTo(0);
  }, { passive: true });
})();

console.log('%c🎨 КУЛЬТУРИ загружен', 'background:#120808;color:#d8c9b6;padding:4px 12px;border-radius:4px;');