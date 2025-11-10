// script.js
// Basic interactivity: sticky navbar on scroll, mobile toggle, smooth scroll, reveal on scroll

document.addEventListener('DOMContentLoaded', function () {
  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const planVisit = document.getElementById('plan-visit');
  const yearEl = document.getElementById('year');

  // set current year
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Determine page type: 'home' pages get transparent dark nav; other pages get a light nav
  const isHome = document.body.classList.contains('home');
  if (navbar) {
    if (isHome) {
      navbar.classList.add('transparent');
    } else {
      navbar.classList.add('light');
    }
  }

  // Highlight the current page link in the navbar
  try {
    const currentFile = (() => {
      if (isHome) return 'index.html';
      const p = window.location.pathname.toLowerCase();
      const last = p.split('/').pop();
      return last && last.includes('.html') ? last : 'index.html';
    })();

    document.querySelectorAll('.nav-links a').forEach((a) => {
      const hrefFile = (() => {
        try {
          const u = new URL(a.getAttribute('href'), window.location.href);
          return u.pathname.toLowerCase().split('/').pop();
        } catch {
          const h = a.getAttribute('href') || '';
          return h.toLowerCase().split('/').pop();
        }
      })();
      if (hrefFile === currentFile) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  } catch (e) {
    // non-fatal; ignore
  }

  // Hero parallax / navbar shrink using requestAnimationFrame for performance
  const hero = document.querySelector('.home-hero') || document.querySelector('.hero');
  const heroContent = document.querySelector('.hero-content');
  const scheduleSection = document.querySelector('.section.schedule');
  const welcomeSection = document.getElementById('welcome');
  let ticking = false;
  let heroHeight = 0;

  function computeThresholds() {
    heroHeight = hero ? hero.offsetHeight : 0;
  }
  computeThresholds();
  window.addEventListener('resize', () => {
    computeThresholds();
    onScrollHandler();
  });

  function updateOnScroll() {
    const y = window.scrollY || window.pageYOffset;

    // Navbar scrolled toggle and class handling
    if (isHome) {
      const navH = navbar ? navbar.offsetHeight : 0;
      const passedHero = (y + navH) >= Math.max(0, heroHeight - 8);
      if (passedHero) {
        // Switch to light navbar once we are past the hero section
        navbar.classList.add('light');
        navbar.classList.add('scrolled');
        navbar.classList.remove('transparent');
      } else {
        // Within hero: dark/transparent styles
        navbar.classList.remove('light');
        if (y > 40) {
          navbar.classList.add('scrolled');
          navbar.classList.remove('transparent');
        } else {
          navbar.classList.remove('scrolled');
          navbar.classList.add('transparent');
        }
      }
    } else {
      // non-home pages keep a light navbar; add scrolled for extra elevation
      if (y > 8) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    // Hero parallax and subtle scale (clamp values)
    if (heroContent && hero) {
      const maxTranslate = 40; // px
      const maxScaleDiff = 0.04; // scale down at most
      const pct = Math.min(y / (window.innerHeight || 800), 1);
      const translate = Math.round(pct * maxTranslate);
      const scale = 1 - pct * maxScaleDiff;
      heroContent.style.transform = `translateY(${translate}px) scale(${scale})`;
      heroContent.style.opacity = `${1 - pct * 0.15}`;
      // subtle overlay dimming
      const overlay = hero.querySelector('.hero-overlay');
      if (overlay) overlay.style.opacity = `${0.9 - pct * 0.6}`;
    }

    // Engage schedule cards when the section is near the top
    if (scheduleSection) {
      const rect = scheduleSection.getBoundingClientRect();
      const topEdge = 120; // px from top where we "engage"
      if (rect.top <= topEdge && rect.bottom > topEdge) {
        scheduleSection.classList.add('engaged');
      } else {
        scheduleSection.classList.remove('engaged');
      }
    }

    // (Removed) welcome background intensify on scroll — no scroll-based toggling

    ticking = false;
  }

  function onScrollHandler() {
    if (!ticking) {
      window.requestAnimationFrame(updateOnScroll);
      ticking = true;
    }
  }

  // initial update
  onScrollHandler();
  window.addEventListener('scroll', onScrollHandler, { passive: true });

  // mobile nav toggle
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }

  // close mobile nav on link click
  document.querySelectorAll('.nav-links a').forEach((a) => {
    a.addEventListener('click', function () {
      if (navLinks.classList.contains('open')) navLinks.classList.remove('open');
    });
  });

  // smooth scroll for plan visit (extra safety) and nav links
  planVisit && planVisit.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector('#contact').scrollIntoView({ behavior: 'smooth' });
  });

  // IntersectionObserver for reveal animations
  const reveals = document.querySelectorAll('.reveal');
  const obsOptions = { root: null, rootMargin: '0px', threshold: 0.12 };
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Optional: unobserve to keep it from toggling
        revealObserver.unobserve(entry.target);
      }
    });
  }, obsOptions);

  reveals.forEach((el, i) => {
    // staggered entrance
    el.style.transitionDelay = `${Math.min(i * 80, 400)}ms`;
    revealObserver.observe(el);
  });

  // Welcome section animations (run once on page load only)
  if (welcomeSection) {
    // Title letter splitting animation
    const title = welcomeSection.querySelector('.welcome-title');
    if (title && !title.dataset.split) {
      const rawHTML = title.innerHTML; // preserve <br/>
      const blocks = rawHTML.split(/<br\s*\/?>(?![^]*<br)/i); // split on <br>
      title.innerHTML = '';
      let i = 0;
      // build spans preserving spaces and line breaks
      rawHTML.split(/(<br\s*\/?\s*>)/i).forEach((token) => {
        if (/^<br\s*\/?\s*>$/i.test(token)) {
          title.appendChild(document.createElement('br'));
          return;
        }
        for (const ch of token) {
          const span = document.createElement('span');
          span.className = 'char';
          // preserve space width using nbsp
          span.textContent = ch === ' ' ? '\u00A0' : ch;
          span.style.transitionDelay = `${120 + i * 22}ms`;
          title.appendChild(span);
          i++;
        }
      });
      title.dataset.split = '1';
      setTimeout(() => {
        title.querySelectorAll('.char').forEach((c) => c.classList.add('in'));
      }, 150);
    }

    // Paragraphs + signature blur-in with stagger — no observers, just once on load
    const lines = welcomeSection.querySelectorAll('.message p, .signature strong, .signature span');
    lines.forEach((el, i) => {
      el.style.transitionDelay = `${200 + i * 140}ms`;
      setTimeout(() => el.classList.add('in'), 260 + i * 140);
    });
  }

  // Normalize YouTube iframe URLs: convert watch URLs or short links to embed URLs
  function normalizeYouTubeIframes() {
    const iframes = document.querySelectorAll('iframe');
    const ytRegexes = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/i,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
      /v=([a-zA-Z0-9_-]{11})/i,
    ];

    iframes.forEach((iframe) => {
      if (!iframe.src) return;
      try {
        const src = iframe.getAttribute('src');
        // Only process YouTube URLs (watch or short links)
        if (/youtube\.com|youtu\.be/i.test(src) && !/\/embed\//i.test(src)) {
          let id = null;
          for (const re of ytRegexes) {
            const m = src.match(re);
            if (m && m[1]) {
              id = m[1];
              break;
            }
          }
          if (id) {
            const embed = `https://www.youtube.com/embed/${id}`;
            iframe.setAttribute('src', embed + '?rel=0');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('allowfullscreen', '');
          }
        }
      } catch (err) {
        // ignore malformed src
        console.warn('YouTube iframe normalization error', err);
      }
    });
  }

  // Run normalization once DOM is ready
  normalizeYouTubeIframes();

  /* Home page cinematic load sequence */
  if (isHome) {
    const heroBg = document.querySelector('.home-hero .hero-bg');
    const title = document.querySelector('.hero-title');
    const sub = document.querySelector('.hero-sub');
    const cta = document.querySelector('.cta');
    const logoImg = document.querySelector('.logo img');

    // small entrance timeline
    setTimeout(() => {
      if (logoImg) logoImg.style.transform = 'translateY(0)';
      if (title) title.classList.add('show');
    }, 200);

    setTimeout(() => {
      if (sub) sub.classList.add('show');
    }, 420);

    setTimeout(() => {
      if (cta) {
        cta.classList.add('show');
        cta.classList.add('glow');
      }
    }, 760);

    // background slow zoom (loop via CSS transform on hero-bg)
    if (heroBg) {
      heroBg.style.transform = 'scale(1)';
      // slowly animate to 1.12 over time
      setTimeout(() => (heroBg.style.transform = 'scale(1.12)'), 100);
    }

    // subtle particle opacity ramp
    const parts = document.querySelectorAll('.particle');
    parts.forEach((p, i) => {
      p.style.opacity = '0';
      setTimeout(() => (p.style.opacity = '1'), 400 + i * 150);
    });
  }

  // Basic contact form handling (placeholder for backend integration)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      // Collect form data and clear - placeholder behavior
      const formData = new FormData(contactForm);
      console.log('Contact form submitted:', Object.fromEntries(formData.entries()));
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Sent ✓';
      setTimeout(() => {
        contactForm.reset();
        if (submitBtn) submitBtn.textContent = 'Send Message';
      }, 1200);
    });
  }
});
