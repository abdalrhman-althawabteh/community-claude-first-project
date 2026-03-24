/* ══════════════════════════════════════════════════
   LEEDS ALCHEMY — Premium Scripts
══════════════════════════════════════════════════ */

const navbar  = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

/* ─── Navbar: frosted glass on scroll ─── */
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 24);
  updateActiveNavLink();
}, { passive: true });


/* ─── Mobile nav toggle ─── */
navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('click', (e) => {
  if (!navbar.contains(e.target)) {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});


/* ─── Hero headline: word-by-word staggered entrance with 3D feel ─── */
function animateHeroHeadline() {
  const headline = document.querySelector('.hero-headline');
  if (!headline) return;

  headline.querySelectorAll('.word').forEach((word, i) => {
    word.style.transitionDelay = `${0.3 + i * 0.1}s`;
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      headline.classList.add('animate');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', animateHeroHeadline);
} else {
  animateHeroHeadline();
}


/* ─── Hero: cursor spotlight (blue glow follows mouse) ─── */
const hero = document.querySelector('.hero');
if (hero) {
  let mouseX = 0, mouseY = 0, currentX = 0, currentY = 0;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }, { passive: true });

  // Smooth lerp for premium feel
  function updateSpotlight() {
    currentX += (mouseX - currentX) * 0.08;
    currentY += (mouseY - currentY) * 0.08;
    hero.style.setProperty('--mx', currentX + 'px');
    hero.style.setProperty('--my', currentY + 'px');
    requestAnimationFrame(updateSpotlight);
  }
  requestAnimationFrame(updateSpotlight);
}


/* ─── Scroll-triggered fade-in (IntersectionObserver) ─── */
const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.06, rootMargin: '0px 0px -60px 0px' }
);

document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));


/* ─── Active nav link on scroll ─── */
const sections   = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-links a');

function updateActiveNavLink() {
  const scrollPos = window.scrollY + navbar.offsetHeight + 60;
  sections.forEach(section => {
    const top    = section.offsetTop;
    const bottom = top + section.offsetHeight;
    const id     = section.getAttribute('id');
    if (scrollPos >= top && scrollPos < bottom) {
      navLinkEls.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
  moveIndicator();
}


/* ─── Tubelight Nav Indicator ─── */
const navIndicator = document.getElementById('navIndicator');

function moveIndicator() {
  const activeLink = document.querySelector('.nav-links a.active');
  if (!navIndicator) return;

  if (window.innerWidth <= 960) {
    navIndicator.style.opacity = '0';
    return;
  }

  if (!activeLink) {
    navIndicator.style.opacity = '0';
    return;
  }

  const navLinksRect = navLinks.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();
  const padding = 14;

  navIndicator.style.opacity = '1';
  navIndicator.style.left = (linkRect.left - navLinksRect.left - padding) + 'px';
  navIndicator.style.width = (linkRect.width + padding * 2) + 'px';
}

navLinkEls.forEach(link => {
  link.addEventListener('click', () => {
    navLinkEls.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    moveIndicator();
  });
});

window.addEventListener('resize', moveIndicator, { passive: true });

requestAnimationFrame(() => {
  updateActiveNavLink();
  if (!document.querySelector('.nav-links a.active') && navLinkEls.length) {
    navLinkEls[0].classList.add('active');
    moveIndicator();
  }
});


/* ─── Smooth scroll for anchor links ─── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


/* ─── Number counter animation (eased) ─── */
function animateCount(el) {
  const target = parseInt(el.getAttribute('data-count'), 10);
  if (isNaN(target)) return;

  const prefix  = el.getAttribute('data-prefix') || '';
  const suffix  = el.getAttribute('data-suffix') || '';
  const duration = 1600;
  const startTime = performance.now();

  const innerSpan = el.querySelector('span');

  function update(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(eased * target);

    if (innerSpan) {
      el.childNodes[0].textContent = prefix + value;
    } else {
      el.textContent = prefix + value + suffix;
    }

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.hasAttribute('data-count')) {
        animateCount(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.4 }
);

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));


/* ─── Supabase Client ─── */
// Keys loaded from config.js (gitignored)
let supabaseClient = null;
try {
  if (window.supabase && typeof CONFIG !== 'undefined') {
    supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn('Supabase SDK not loaded:', e);
}


/* ─── Contact Form Submission ─── */
const contactForm = document.getElementById('contactForm');
const formStatus  = document.getElementById('formStatus');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('formSubmit');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Sending...';
    submitBtn.disabled = true;
    formStatus.textContent = '';
    formStatus.className = 'form-status';

    try {
      const formData = new FormData(contactForm);

      // Save to Supabase database
      if (supabaseClient) {
        const { error: dbError } = await supabaseClient
          .from('contact_submissions')
          .insert({
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone') || null,
            service_type: formData.get('service_type'),
            budget_range: formData.get('budget_range'),
            timeline: formData.get('timeline'),
            message: formData.get('message')
          });

        if (dbError) throw new Error('Database error');
      }

      // Also send email via FormSubmit
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok && !supabaseClient) throw new Error('Server error');

      formStatus.textContent = 'Message sent successfully! We\'ll get back to you within 24 hours.';
      formStatus.className = 'form-status success';
      contactForm.reset();
    } catch (err) {
      formStatus.textContent = 'Something went wrong. Please try again or email us directly.';
      formStatus.className = 'form-status error';
    } finally {
      submitBtn.innerHTML = originalHTML;
      submitBtn.disabled = false;
    }
  });
}
