/* ===================================================================
   Zin Zin Aye Chan — Portfolio
   Nav toggle, active-link tracking, filter + pagination,
   re-firing scroll reveals, and Formspree AJAX contact form.
   =================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- mobile nav toggle ---------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', function () {
    var isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- active nav link on scroll ---------- */
  var sections = document.querySelectorAll('section[id]');
  var navItems = navLinks.querySelectorAll('a:not(.btn)');
  var navMap = {};
  navItems.forEach(function (a) {
    navMap[a.getAttribute('href').slice(1)] = a;
  });

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navItems.forEach(function (a) { a.classList.remove('active'); });
          var current = navMap[entry.target.id];
          if (current) current.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ---------- filter + pagination ---------- */
  var PER_PAGE = 6;
  var filterBtns = document.querySelectorAll('.filter-btn');
  var projectCards = Array.prototype.slice.call(document.querySelectorAll('#projectsGrid .project-card'));
  var pagination = document.getElementById('pagination');
  var pageNumsEl = document.getElementById('pageNums');
  var pagePrevBtn = document.getElementById('pagePrev');
  var pageNextBtn = document.getElementById('pageNext');
  var projectsSection = document.getElementById('projects');

  var state = { filter: 'all', page: 1 };

  function getMatching() {
    return projectCards.filter(function (card) {
      var cats = (card.getAttribute('data-category') || '').split(' ');
      return state.filter === 'all' || cats.indexOf(state.filter) !== -1;
    });
  }

  function applyView() {
    var matching = getMatching();
    var totalPages = Math.max(1, Math.ceil(matching.length / PER_PAGE));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    projectCards.forEach(function (card) {
      var cats = (card.getAttribute('data-category') || '').split(' ');
      var matches = state.filter === 'all' || cats.indexOf(state.filter) !== -1;
      card.classList.toggle('filter-hide', !matches);
    });

    matching.forEach(function (card, i) {
      var inPage = i >= (state.page - 1) * PER_PAGE && i < state.page * PER_PAGE;
      card.classList.toggle('page-hide', !inPage);
    });

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (!pagination) return;
    if (totalPages <= 1) {
      pagination.classList.add('hidden');
      return;
    }
    pagination.classList.remove('hidden');

    pageNumsEl.innerHTML = '';
    for (var i = 1; i <= totalPages; i++) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'page-num' + (i === state.page ? ' active' : '');
      btn.textContent = i;
      btn.setAttribute('aria-label', 'Page ' + i);
      if (i === state.page) btn.setAttribute('aria-current', 'page');
      (function (page) {
        btn.addEventListener('click', function () {
          state.page = page;
          applyView();
          scrollToProjects();
        });
      })(i);
      pageNumsEl.appendChild(btn);
    }

    pagePrevBtn.disabled = state.page <= 1;
    pageNextBtn.disabled = state.page >= totalPages;
  }

  function scrollToProjects() {
    if (projectsSection) {
      var top = projectsSection.getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  if (pagePrevBtn) {
    pagePrevBtn.addEventListener('click', function () {
      if (state.page > 1) { state.page -= 1; applyView(); scrollToProjects(); }
    });
  }
  if (pageNextBtn) {
    pageNextBtn.addEventListener('click', function () {
      state.page += 1; applyView(); scrollToProjects();
    });
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.filter = btn.getAttribute('data-filter');
      state.page = 1;
      applyView();
    });
  });

  /* initial render */
  applyView();

  /* ---------- re-firing scroll reveal (replays on scroll up + down) ---------- */
  var revealEls = document.querySelectorAll('.card');
  revealEls.forEach(function (el) { el.classList.add('reveal'); });

  if ('IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('visible', entry.isIntersecting);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- contact form — Formspree AJAX ---------- */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';

      var action = form.getAttribute('action');

      if (action.indexOf('YOUR_FORM_ID') !== -1) {
        status.textContent = 'Contact form is not connected yet.';
        status.classList.add('error');
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (response) {
        if (response.ok) {
          status.textContent = 'Thanks, your message has been sent. I will get back to you soon.';
          status.classList.add('success');
          form.reset();
        } else {
          status.textContent = 'Something went wrong. Please email me directly at zinzinayechan@gmail.com.';
          status.classList.add('error');
        }
      }).catch(function () {
        status.textContent = 'Something went wrong. Please email me directly at zinzinayechan@gmail.com.';
        status.classList.add('error');
      }).finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
    });
  }

});
