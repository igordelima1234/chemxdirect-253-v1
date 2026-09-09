// ---------------------------------------------------------------------------
// Homepage v2 hero — split stage carousel driven by the hexagon rail.
//
// Same contract as the v1 dial: slides and photo layers are stacked in one
// grid cell and crossfaded, the rail's active hexagon carries the autoplay
// countdown as a sky outline drawing itself around the shape, and the
// countdown pauses and resumes with the timer so what it shows is always the
// time actually left on the slide.
//
// This page loads main.js too. That file's hero module looks for [data-hero]
// and bails here, so the two never fight over the same markup — but it also
// means the CTAs that filter the product rail are wired up in this file.
// ---------------------------------------------------------------------------
(function () {
  var hero = document.querySelector("[data-hero2]");
  var rail = document.querySelector("[data-hero2-rail]");
  if (!hero || !rail) return;

  var AUTOPLAY = 7000;

  var slides = Array.prototype.slice.call(
    hero.querySelectorAll(".hero-v2-slide")
  );
  var layers = Array.prototype.slice.call(
    hero.querySelectorAll(".hero-v2__layer")
  );
  var labels = Array.prototype.slice.call(
    rail.querySelectorAll(".hex-rail__label")
  );
  var tabs = Array.prototype.slice.call(rail.querySelectorAll("[data-hero2-tab]"));
  var counter = rail.querySelector("[data-hero2-num]");
  var stack = rail.querySelector("[data-hero2-tabs]");
  var labelBox = rail.querySelector(".hex-rail__labels");
  if (slides.length < 2 || tabs.length !== slides.length) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var index = 0;
  var timer = null;
  var startedAt = 0;
  var remaining = AUTOPLAY;
  var hovering = false;
  var focusing = false;

  // Above this width the rail is vertical and the label sits beside it —
  // that's the only case where the label has to be moved to a given hexagon.
  var vertical = window.matchMedia("(min-width: 901px)");

  rail.style.setProperty("--autoplay", AUTOPLAY + "ms");

  // Park the label level with the hexagon it names. Reading offsetTop gives
  // the node's settled position, and the label eases across on the same curve
  // as the stack, so the two arrive together.
  function placeLabel(n) {
    if (!labelBox) return;
    if (!vertical.matches) {
      labelBox.style.top = "";
      return;
    }
    var tab = tabs[n];
    if (!tab) return;
    labelBox.style.top = tab.offsetTop + tab.offsetHeight / 2 + "px";
  }

  function setActive(list, i) {
    list.forEach(function (el, n) {
      el.classList.toggle("is-active", n === i);
    });
  }

  // Which label the rail is showing. Anything other than the current slide is
  // a preview — hovering a hexagon tells you where it goes before you commit.
  function showLabel(n) {
    labels.forEach(function (el, i) {
      var preview = n !== index && i === n;
      el.classList.toggle("is-preview", preview);
      el.classList.toggle("is-active", !preview && i === n);
    });
    placeLabel(n);
  }

  function go(i) {
    i = ((i % slides.length) + slides.length) % slides.length;
    if (i === index) {
      play();
      return;
    }

    index = i;

    setActive(slides, i);
    setActive(layers, i);
    setActive(tabs, i);
    showLabel(i);

    if (counter) counter.textContent = ("0" + (i + 1)).slice(-2);

    tabs.forEach(function (tab, n) {
      tab.setAttribute("aria-selected", n === i ? "true" : "false");
      tab.tabIndex = n === i ? 0 : -1;
    });

    play();
  }

  // Anything that means "someone is reading this" holds the countdown
  function held() {
    return hovering || focusing || document.hidden;
  }

  function stop() {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
  }

  function schedule(ms) {
    stop();
    startedAt = Date.now();
    remaining = ms;
    timer = window.setTimeout(function () {
      go(index + 1);
    }, ms);
  }

  // Restart the countdown from the top. Replaying the sweep means tearing the
  // animation down and forcing a reflow — CSS won't replay an identical
  // animation otherwise.
  function play() {
    stop();
    remaining = AUTOPLAY;
    if (reduceMotion.matches) return;
    rail.classList.remove("is-playing", "is-paused");
    void rail.offsetWidth;
    rail.classList.add("is-playing");
    if (held()) {
      rail.classList.add("is-paused");
      return;
    }
    schedule(AUTOPLAY);
  }

  function pause() {
    if (timer) {
      remaining = Math.max(0, remaining - (Date.now() - startedAt));
      stop();
    }
    rail.classList.add("is-paused");
  }

  function resume() {
    if (timer || held() || reduceMotion.matches) return;
    rail.classList.remove("is-paused");
    schedule(remaining > 0 ? remaining : AUTOPLAY);
  }

  tabs.forEach(function (tab, n) {
    tab.addEventListener("click", function () {
      go(n);
      tab.focus();
    });

    tab.addEventListener("mouseenter", function () {
      showLabel(n);
    });

    tab.addEventListener("mouseleave", function () {
      showLabel(index);
    });
  });

  // Arrow keys walk the tablist, matching the usual tabs pattern. The rail is
  // vertical on desktop and horizontal on phones, so both axes move it.
  stack.addEventListener("keydown", function (e) {
    var next;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = index + 1;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = slides.length - 1;
    else return;

    e.preventDefault();
    go(next);
    var target = tabs[((next % tabs.length) + tabs.length) % tabs.length];
    if (target) target.focus();
  });

  // Autoplay is a nudge, not a hijack. Hovering the rail means someone is
  // aiming at it, so it waits — hovering the hero at large doesn't, since the
  // hero covers most of the window and a parked cursor would stall it forever.
  rail.addEventListener("mouseenter", function () {
    hovering = true;
    pause();
  });

  rail.addEventListener("mouseleave", function () {
    hovering = false;
    resume();
  });

  hero.addEventListener("focusin", function (e) {
    // Only a keyboard user landing here should hold the carousel; a click that
    // happens to focus a button shouldn't freeze the countdown mid-sweep.
    var keyboard = true;
    try {
      keyboard = e.target.matches(":focus-visible");
    } catch (err) {
      /* older engine — treat any focus as keyboard focus */
    }
    if (!keyboard) return;
    focusing = true;
    pause();
  });

  hero.addEventListener("focusout", function (e) {
    if (hero.contains(e.relatedTarget)) return;
    focusing = false;
    resume();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause();
    else resume();
  });

  // Swipe on touch — horizontal only, so vertical scrolling still wins
  var startX = null;
  var startY = null;

  hero.addEventListener(
    "touchstart",
    function (e) {
      var t = e.changedTouches[0];
      startX = t.clientX;
      startY = t.clientY;
    },
    { passive: true }
  );

  hero.addEventListener(
    "touchend",
    function (e) {
      if (startX === null) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;
      startX = startY = null;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
      go(dx < 0 ? index + 1 : index - 1);
    },
    { passive: true }
  );

  // Slide CTAs that jump straight into a filtered product rail
  hero.querySelectorAll("[data-hero-cat]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.dispatchEvent(
        new CustomEvent("chemx:filter", {
          detail: { category: btn.getAttribute("data-hero-cat"), subcategory: null },
        })
      );
      var section = document.getElementById("products");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // The first slide ships pre-activated so the hero still reads with JS off.
  // Replay that activation once on load to get the entrance animation and the
  // opening zoom, which the markup's static state would otherwise skip.
  function intro() {
    if (reduceMotion.matches) return;
    [slides[0], layers[0], labels[0]].forEach(function (el) {
      if (!el) return;
      el.classList.remove("is-active");
      void el.offsetWidth;
      el.classList.add("is-active");
    });
  }

  reduceMotion.addEventListener("change", function () {
    if (reduceMotion.matches) {
      stop();
      rail.classList.remove("is-playing");
    } else {
      play();
    }
  });

  vertical.addEventListener("change", function () {
    placeLabel(index);
  });

  window.addEventListener("resize", function () {
    placeLabel(index);
  });

  intro();
  placeLabel(0);
  play();
})();
