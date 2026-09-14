/* Scroll follows the document; no scroll interception or animation library. */
(function () {
  var hero = document.querySelector('[data-video-hero]');
  if (!hero) return;

  var video = hero.querySelector('[data-hero-video]');
  var toggle = hero.querySelector('[data-video-toggle]');
  var copy = hero.querySelector('[data-video-copy]');
  var controls = hero.querySelector('[data-video-controls]');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var sentence = document.querySelector('[data-scroll-sentence]');
  var words = [];
  if (sentence) {
    var text = sentence.textContent.trim().split(/\s+/);
    sentence.textContent = '';
    text.forEach(function (word, index) {
      var span = document.createElement('span');
      span.textContent = word;
      sentence.appendChild(span);
      if (index < text.length - 1) sentence.appendChild(document.createTextNode(' '));
      words.push(span);
    });
    sentence.classList.add('is-scroll-ready');
  }
  var rotator = hero.querySelector('[data-hero-rotator]');
  if (rotator) {
    var rotatorItems = rotator.querySelectorAll('.video-hero__rotator-item');
    var rotatorIndex = 0;
    if (rotatorItems.length > 1 && !motion.matches) {
      window.setInterval(function () {
        rotatorItems[rotatorIndex].classList.remove('is-active');
        rotatorIndex = (rotatorIndex + 1) % rotatorItems.length;
        rotatorItems[rotatorIndex].classList.add('is-active');
      }, 3000);
    }
  }
  var wantsPlayback = !motion.matches;
  var visible = true;
  var loaded = false;
  var frame = 0;
  var start = 0;
  var distance = 1;
  var width = 0;
  var height = 0;

  function clamp(value) { return Math.max(0, Math.min(1, value)); }

  function paint() {
    frame = 0;
    var progress = motion.matches ? 0 : clamp((window.scrollY - start) / distance);
    var eased = progress * progress * (3 - 2 * progress);
    var opacity = 1 - clamp(progress / 0.48);
    hero.style.setProperty('--hero-inset-x', (eased * width * 0.20) + 'px');
    hero.style.setProperty('--hero-inset-y', (eased * height * 0.20) + 'px');
    hero.style.setProperty('--hero-radius', (eased * 24) + 'px');
    hero.style.setProperty('--hero-video-scale', 1 - eased * 0.08);
    hero.style.setProperty('--hero-copy-opacity', opacity);
    hero.style.setProperty('--hero-copy-y', (-progress * 80) + 'px');
    // Invisible controls must not remain in the keyboard focus order.
    copy.inert = opacity === 0;
    controls.inert = opacity === 0;

    if (sentence) {
      var bounds = sentence.getBoundingClientRect();
      // Start near the bottom of the viewport and finish while the whole
      // sentence is still comfortably in view. Scrolling back reverses it.
      var reveal = motion.matches ? 1 : clamp(
        (window.innerHeight * 0.82 - bounds.top) /
        (window.innerHeight * 0.40 + bounds.height * 0.35)
      );
      words.forEach(function (word, index) {
        word.classList.toggle('is-revealed', reveal >= (index + 1) / words.length);
      });
    }
  }

  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(paint);
  }

  function measure() {
    var banner = document.querySelector('.promo-banner');
    var bannerHeight = banner ? banner.offsetHeight : 0;
    hero.style.setProperty('--hero-height', 'calc(100svh - ' + bannerHeight + 'px)');
    start = hero.getBoundingClientRect().top + window.scrollY;
    width = hero.clientWidth;
    height = hero.querySelector('.video-hero__sticky').offsetHeight;
    distance = Math.max(1, hero.offsetHeight - height);
    schedule();
  }

  function syncButton() {
    toggle.classList.toggle('is-playing', !video.paused);
    toggle.setAttribute('aria-label', video.paused ? 'Play background video' : 'Pause background video');
  }

  function syncPlayback() {
    if (!wantsPlayback || !visible || document.hidden) {
      video.pause();
      return;
    }
    if (!loaded) {
      var source = video.querySelector('source');
      source.src = source.getAttribute('data-src');
      video.load();
      loaded = true;
    }
    video.play().catch(syncButton);
  }

  toggle.hidden = false;
  toggle.addEventListener('click', function () {
    wantsPlayback = video.paused;
    syncPlayback();
  });
  video.addEventListener('play', syncButton);
  video.addEventListener('pause', syncButton);
  video.addEventListener('error', function () { toggle.hidden = true; });
  video.querySelector('source').addEventListener('error', function () { toggle.hidden = true; });
  document.addEventListener('visibilitychange', syncPlayback);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      syncPlayback();
    }).observe(hero);
  }

  hero.classList.add('is-scroll-ready');
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('pageshow', measure);
  motion.addEventListener('change', function () {
    wantsPlayback = !motion.matches;
    measure();
    syncPlayback();
  });
  if ('ResizeObserver' in window) {
    var observer = new ResizeObserver(measure);
    observer.observe(hero);
    var banner = document.querySelector('.promo-banner');
    if (banner) observer.observe(banner);
    if (sentence) observer.observe(sentence);
  }
  measure();
  syncButton();
  syncPlayback();
})();
