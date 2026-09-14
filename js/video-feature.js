/* The reverse of the hero: the video grows from an inset frame to full
   bleed while the section is pinned, then the copy fades in. The video
   loads only near the viewport and plays only while visible; reduced-motion
   visitors get the full-size frame and a poster until they press play. */
(function () {
  var section = document.querySelector('[data-video-feature]');
  if (!section) return;

  var sticky = section.querySelector('.video-feature__sticky');
  var copy = section.querySelector('[data-video-feature-copy]');
  var video = section.querySelector('video');
  var toggle = section.querySelector('[data-video-feature-toggle]');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var wantsPlayback = !motion.matches;
  var visible = false;
  var loaded = false;
  var frame = 0;
  var start = 0;
  var distance = 1;
  var width = 0;
  var height = 0;

  function clamp(value) { return Math.max(0, Math.min(1, value)); }

  function paint() {
    frame = 0;
    var progress = motion.matches ? 1 : clamp((window.scrollY - start) / distance);
    var eased = progress * progress * (3 - 2 * progress);
    var shrink = 1 - eased;
    var opacity = clamp((progress - 0.55) / 0.35);
    section.style.setProperty('--feature-inset-x', (shrink * width * 0.20) + 'px');
    section.style.setProperty('--feature-inset-y', (shrink * height * 0.20) + 'px');
    section.style.setProperty('--feature-radius', (shrink * 24) + 'px');
    section.style.setProperty('--feature-video-scale', 1 - shrink * 0.08);
    section.style.setProperty('--feature-copy-opacity', opacity);
    section.style.setProperty('--feature-copy-y', ((1 - opacity) * 40) + 'px');
    // Keep the invisible CTA out of the keyboard focus order.
    copy.inert = opacity === 0;
  }

  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(paint);
  }

  function measure() {
    start = section.getBoundingClientRect().top + window.scrollY;
    width = sticky.clientWidth;
    height = sticky.offsetHeight;
    distance = Math.max(1, section.offsetHeight - height);
    schedule();
  }

  function syncButton() {
    toggle.classList.toggle('is-playing', !video.paused);
    toggle.setAttribute('aria-label', video.paused ? 'Play background video' : 'Pause background video');
  }

  function sync() {
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
    sync();
  });
  video.addEventListener('play', syncButton);
  video.addEventListener('pause', syncButton);
  video.addEventListener('error', function () { toggle.hidden = true; });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', function () {
    wantsPlayback = !motion.matches;
    measure();
    sync();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      sync();
    }, { rootMargin: '200px 0px' }).observe(section);
  } else {
    visible = true;
    sync();
  }

  section.classList.add('is-scroll-ready');
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('pageshow', measure);
  if ('ResizeObserver' in window) {
    // Sections above (the hero, the ring) change height as they load.
    new ResizeObserver(measure).observe(document.body);
  }
  measure();
  syncButton();
})();
