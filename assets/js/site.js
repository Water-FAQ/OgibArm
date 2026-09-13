(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.nav');
  const mobileToc = document.querySelector('[data-mobile-toc]');
  const tocButton = mobileToc?.querySelector('[data-toc-toggle]');
  const tocPanel = mobileToc?.querySelector('[data-toc-panel]');

  const closeMenu = () => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };

  const closeMobileToc = () => {
    if (!tocButton || !tocPanel) return;
    tocButton.setAttribute('aria-expanded', 'false');
    tocButton.setAttribute('aria-label', tocButton.dataset.openLabel);
    tocPanel.setAttribute('aria-hidden', 'true');
    tocPanel.classList.remove('is-open');
  };

  if (menuButton && navigation) {
    menuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      if (open) closeMobileToc();
      menuButton.setAttribute('aria-expanded', String(open));
      navigation.classList.toggle('is-open', open);
    });
    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('click', (event) => {
      if (!navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  if (mobileToc && tocButton && tocPanel) {
    tocButton.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = tocButton.getAttribute('aria-expanded') !== 'true';
      if (open) closeMenu();
      tocButton.setAttribute('aria-expanded', String(open));
      tocButton.setAttribute('aria-label', open ? tocButton.dataset.closeLabel : tocButton.dataset.openLabel);
      tocPanel.setAttribute('aria-hidden', String(!open));
      tocPanel.classList.toggle('is-open', open);
    });
    tocPanel.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMobileToc();
    });
    document.addEventListener('click', (event) => {
      if (!mobileToc.contains(event.target)) closeMobileToc();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMobileToc();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 680) closeMobileToc();
    });
  }

  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    const updateVisibility = () => {
      const visible = window.scrollY > 120;
      backToTop.classList.toggle('is-visible', visible);
      backToTop.setAttribute('aria-hidden', visible ? 'false' : 'true');
    };
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
  }

  const faqDetails = [...document.querySelectorAll('.faq-list details')];
  let bulkFaqChange = false;
  const getTocTop = () => {
    const sidebar = document.querySelector('.faq-sidebar, .version-sidebar');
    if (!sidebar || window.getComputedStyle(sidebar).display === 'none') return 16;
    return Math.max(0, Number.parseFloat(window.getComputedStyle(sidebar).top) || 0);
  };
  const desktopFaqTocIsVisible = () => {
    const sidebar = document.querySelector('.faq-sidebar');
    return Boolean(sidebar && window.getComputedStyle(sidebar).display !== 'none');
  };

  faqDetails.forEach((details) => {
    details.addEventListener('toggle', () => {
      if (!details.open || bulkFaqChange) return;
      window.requestAnimationFrame(() => {
        const top = details.getBoundingClientRect().top + window.scrollY - getTocTop();
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      });
    });
  });

  const setAllFaqDetails = (open) => {
    if (!faqDetails.length) return;
    bulkFaqChange = true;
    faqDetails.forEach((details) => { details.open = open; });
    closeMobileToc();
    window.setTimeout(() => {
      bulkFaqChange = false;
      window.dispatchEvent(new Event('scroll'));
    }, 100);
  };
  document.querySelectorAll('[data-faq-expand-all]').forEach((button) => button.addEventListener('click', () => setAllFaqDetails(true)));
  document.querySelectorAll('[data-faq-collapse-all]').forEach((button) => button.addEventListener('click', () => setAllFaqDetails(false)));

  const scrollSections = [...document.querySelectorAll('[data-scroll-section]')];
  const scrollLinks = [...document.querySelectorAll('[data-scroll-nav] a')];
  if (scrollSections.length) {
    let scheduled = false;
    let pinnedSectionId = null;
    const setActiveSection = (id) => scrollLinks.forEach((link) => link.classList.toggle('is-active', link.hash === `#${id}`));
    const updateActiveSection = () => {
      scheduled = false;
      if (pinnedSectionId) {
        setActiveSection(pinnedSectionId);
        return;
      }
      let active = scrollSections[0];
      const trackingLine = Math.max(getTocTop(), window.innerHeight * 0.55);
      scrollSections.forEach((section) => {
        const target = section.matches('.faq-group') ? section.querySelector('.faq-list details') || section : section;
        if (target.getBoundingClientRect().top <= trackingLine) active = section;
      });
      setActiveSection(active.id);
    };
    const scheduleUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(updateActiveSection);
    };
    const scrollToSection = (id) => {
      const target = document.getElementById(id);
      if (!target) return;
      pinnedSectionId = id;
      const alignmentTarget = target.matches('.faq-group') && desktopFaqTocIsVisible() ? target.querySelector('.faq-list details') || target : target;
      const top = alignmentTarget.getBoundingClientRect().top + window.scrollY - getTocTop();
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      setActiveSection(id);
    };
    scrollLinks.forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      const id = link.hash.slice(1);
      window.history.replaceState(null, '', `#${id}`);
      scrollToSection(id);
    }));
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    const releasePin = () => {
      if (!pinnedSectionId) return;
      pinnedSectionId = null;
      scheduleUpdate();
    };
    window.addEventListener('wheel', releasePin, { passive: true });
    window.addEventListener('touchstart', releasePin, { passive: true });
    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) releasePin();
    });
    updateActiveSection();
  }

  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
    const dots = [...carousel.querySelectorAll('[data-carousel-dot]')];
    const previous = carousel.querySelector('[data-carousel-previous]');
    const next = carousel.querySelector('[data-carousel-next]');
    if (slides.length < 2) return;
    let index = 0;
    let timer = null;
    const show = (target) => {
      index = (target + slides.length) % slides.length;
      slides.forEach((slide, itemIndex) => slide.classList.toggle('is-active', itemIndex === index));
      dots.forEach((dot, itemIndex) => {
        const active = itemIndex === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', String(active));
      });
    };
    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = window.setInterval(() => show(index + 1), 6000);
    };
    previous?.addEventListener('click', () => { show(index - 1); start(); });
    next?.addEventListener('click', () => { show(index + 1); start(); });
    dots.forEach((dot) => dot.addEventListener('click', () => { show(Number(dot.dataset.carouselDot)); start(); }));
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', start);
    let touchStart = 0;
    carousel.addEventListener('touchstart', (event) => { touchStart = event.changedTouches[0].clientX; stop(); }, { passive: true });
    carousel.addEventListener('touchend', (event) => {
      const shift = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(shift) > 45) show(index + (shift < 0 ? 1 : -1));
      start();
    }, { passive: true });
    show(0);
    start();
  });

  document.querySelectorAll('[data-current-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
  const versionNode = document.getElementById('version');
  const downloadNode = document.getElementById('download');
  if (versionNode || downloadNode) {
    fetch('update.json', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('manifest unavailable')))
      .then((manifest) => {
        if (versionNode && manifest.version) versionNode.textContent = `Последняя версия: v${manifest.version}`;
        if (downloadNode && manifest.download_url) downloadNode.href = manifest.download_url;
      })
      .catch(() => {});
  }
})();
