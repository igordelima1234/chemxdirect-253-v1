/* Loads the section video only when it nears the viewport and plays it
   only while visible. Reduced-motion visitors see the poster until they
   press play. */
(function () {
  var section = document.querySelector('[data-video-feature]');
  if (!section) return;

  var video = section.querySelector('video');
  var toggle = section.querySelector('[data-video-feature-toggle]');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var wantsPlayback = !motion.matches;
  var visible = false;
  var loaded = false;

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
  syncButton();
})();
