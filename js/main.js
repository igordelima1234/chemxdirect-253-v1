// ChemX Direct — shared interactions

// Some test names in product-test-equipment-map.json already end in "Test"
// (e.g. "pH Test", "SO3 Test"), so only append the word when it's missing.
// Shared by the product rail and the Shop mega menu — they build the same
// tag string and must agree for the menu's filtering to match.
function chemxTestTag(name) {
  return /\btest$/i.test(name) ? name : name + " test";
}

// Mobile nav toggle
(function () {
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  function closeMenu() {
    nav.classList.remove("is-open");
    toggle.classList.remove("is-active");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }

  function openMenu() {
    nav.classList.add("is-open");
    toggle.classList.add("is-active");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  }

  toggle.addEventListener("click", function () {
    if (nav.classList.contains("is-open")) closeMenu();
    else openMenu();
  });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 640) closeMenu();
  });
})();

// ---------------------------------------------------------------------------
// Hero carousel — crossfading slides driven by the hexagon dial.
//
// The three hexagons sit on one orbit, 120° apart, and the ring element
// carries the rotation. Each node counter-rotates by the same amount over the
// same curve so the photos stay upright while the constellation turns. Slot
// angles run counter-clockwise (0/-120/-240), which puts the *next* slide at
// the lower left — so autoplay always spins the ring clockwise, and clicking
// the other hexagon takes the short way round in the opposite direction.
// ---------------------------------------------------------------------------
(function () {
  var hero = document.querySelector("[data-hero]");
  var dial = document.querySelector("[data-hero-dial]");
  if (!hero || !dial) return;

  var AUTOPLAY = 7000;
  var STEP = 120; // degrees between adjacent hexagons

  var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
  var layers = Array.prototype.slice.call(
    document.querySelectorAll(".hero-bg__layer")
  );
  var labels = Array.prototype.slice.call(
    dial.querySelectorAll(".hero-dial__label")
  );
  var tabs = Array.prototype.slice.call(dial.querySelectorAll("[data-hero-tab]"));
  var ring = dial.querySelector("[data-hero-ring]");
  if (slides.length < 2 || tabs.length !== slides.length) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var index = 0;
  var rotation = 0; // unbounded, so the ring keeps turning the short way
  var timer = null;
  var startedAt = 0;
  var remaining = AUTOPLAY;
  var hovering = false;
  var focusing = false;

  dial.style.setProperty("--autoplay", AUTOPLAY + "ms");

  function setActive(list, i) {
    list.forEach(function (el, n) {
      el.classList.toggle("is-active", n === i);
    });
  }

  // Which label the dial is showing. Anything other than the current slide is
  // a preview — hovering a hexagon tells you where it goes before you commit.
  function showLabel(n) {
    labels.forEach(function (el, i) {
      var preview = n !== index && i === n;
      el.classList.toggle("is-preview", preview);
      el.classList.toggle("is-active", !preview && i === n);
    });
  }

  // Shortest signed rotation from where the ring is now to the angle that
  // parks slide `i` at the top of the orbit.
  function deltaTo(i) {
    var d = (i * STEP - rotation) % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  }

  function go(i) {
    i = ((i % slides.length) + slides.length) % slides.length;
    if (i === index) {
      play();
      return;
    }

    rotation += deltaTo(i);
    index = i;

    ring.style.setProperty("--rot", rotation + "deg");
    setActive(slides, i);
    setActive(layers, i);
    setActive(tabs, i);
    showLabel(i);

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
    dial.classList.remove("is-playing", "is-paused");
    void dial.offsetWidth;
    dial.classList.add("is-playing");
    if (held()) {
      dial.classList.add("is-paused");
      return;
    }
    schedule(AUTOPLAY);
  }

  // The arc and the timer pause and resume together, so what the sweep shows
  // is always the time actually left on the slide.
  function pause() {
    if (timer) {
      remaining = Math.max(0, remaining - (Date.now() - startedAt));
      stop();
    }
    dial.classList.add("is-paused");
  }

  function resume() {
    if (timer || held() || reduceMotion.matches) return;
    dial.classList.remove("is-paused");
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

  // Arrow keys walk the tablist, matching the usual tabs pattern
  ring.addEventListener("keydown", function (e) {
    var next;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = index + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = slides.length - 1;
    else return;

    e.preventDefault();
    go(next);
    var target = tabs[((next % tabs.length) + tabs.length) % tabs.length];
    if (target) target.focus();
  });

  // Autoplay is a nudge, not a hijack. Hovering the dial means someone is
  // aiming at it, so it waits — hovering the hero at large doesn't, since the
  // hero covers most of the window and a parked cursor would stall it forever.
  dial.addEventListener("mouseenter", function () {
    hovering = true;
    pause();
  });

  dial.addEventListener("mouseleave", function () {
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

  // The photo drifts slower than the page scrolls, which reads as depth. The
  // type doesn't move — only the picture behind it.
  var frame = document.querySelector("[data-hero-parallax]");
  var MAX_DRIFT = 80; // matches the slack built into .hero-bg__inner
  var queued = false;

  function drift() {
    queued = false;
    if (!frame || reduceMotion.matches) return;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var shift = Math.min(y * 0.18, MAX_DRIFT);
    frame.style.transform = "translate3d(0," + shift.toFixed(1) + "px,0)";
  }

  window.addEventListener(
    "scroll",
    function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(drift);
    },
    { passive: true }
  );

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
      dial.classList.remove("is-playing");
    } else {
      play();
    }
  });

  intro();
  drift();
  play();
})();

// ---------------------------------------------------------------------------
// Category tabs — six auto-rotating product categories.
//
// Same contract as the hero carousel: panels stacked in one grid cell, a sky
// countdown that pauses and resumes with the timer, and autoplay that yields
// to anyone reading. It also stays still until the section is actually on
// screen, so it isn't cycling through tabs nobody is looking at.
// ---------------------------------------------------------------------------
(function () {
  var root = document.querySelector("[data-cats]");
  if (!root) return;

  var AUTOPLAY = 6000;
  var tabsEl = root.querySelector("[data-cats-tabs]");
  var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-cat-tab]"));
  var panels = Array.prototype.slice.call(root.querySelectorAll(".cat-panel"));
  if (!tabsEl || tabs.length < 2 || tabs.length !== panels.length) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var index = 0;
  var hovering = false;
  var focusing = false;
  var inView = !("IntersectionObserver" in window);

  root.style.setProperty("--autoplay", AUTOPLAY + "ms");

  function held() {
    return hovering || focusing || document.hidden || !inView;
  }

  // The sweep is the clock. The bar crossing the tab is what hands over to the
  // next one, so what you see and what the code does can't drift apart —
  // whatever happens, the bar always reaches the end before the tab changes.
  function play() {
    if (reduceMotion.matches) return;
    root.classList.remove("is-playing", "is-paused");
    void root.offsetWidth;
    root.classList.add("is-playing");
    if (held()) root.classList.add("is-paused");
  }

  function pause() {
    root.classList.add("is-paused");
  }

  function resume() {
    if (held() || reduceMotion.matches) return;
    root.classList.remove("is-paused");
  }

  // Bubbles up from the active tab's bar
  tabsEl.addEventListener("animationend", function (e) {
    if (e.animationName === "catSweep") go(index + 1);
  });

  // Once the strip scrolls, keep the active tab where it can be seen. Scrolling
  // the strip itself rather than the element avoids dragging the page with it.
  function revealTab(el) {
    if (tabsEl.scrollWidth <= tabsEl.clientWidth + 1) return;
    var left = el.offsetLeft - (tabsEl.clientWidth - el.offsetWidth) / 2;
    if (tabsEl.scrollTo) {
      tabsEl.scrollTo({
        left: left,
        behavior: reduceMotion.matches ? "auto" : "smooth",
      });
    } else {
      tabsEl.scrollLeft = left;
    }
  }

  function go(i) {
    i = ((i % tabs.length) + tabs.length) % tabs.length;
    if (i === index) {
      play();
      return;
    }

    index = i;

    tabs.forEach(function (tab, n) {
      var on = n === i;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
    });

    panels.forEach(function (panel, n) {
      panel.classList.toggle("is-active", n === i);
    });

    revealTab(tabs[i]);
    play();
  }

  tabs.forEach(function (tab, n) {
    tab.addEventListener("click", function () {
      go(n);
      tab.focus();
    });
  });

  tabsEl.addEventListener("keydown", function (e) {
    var next;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = index + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;

    e.preventDefault();
    go(next);
    var target = tabs[((next % tabs.length) + tabs.length) % tabs.length];
    if (target) target.focus();
  });

  // Only the strip holds the sweep. Hovering the panel to read it shouldn't
  // freeze the bar half-way across a tab.
  tabsEl.addEventListener("mouseenter", function () {
    hovering = true;
    pause();
  });

  tabsEl.addEventListener("mouseleave", function () {
    hovering = false;
    resume();
  });

  root.addEventListener("focusin", function (e) {
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

  root.addEventListener("focusout", function (e) {
    if (root.contains(e.relatedTarget)) return;
    focusing = false;
    resume();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause();
    else resume();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) resume();
        else pause();
      },
      { threshold: 0.25 }
    ).observe(root);
  }

  reduceMotion.addEventListener("change", function () {
    if (reduceMotion.matches) root.classList.remove("is-playing");
    else play();
  });

  play();
})();

// ---------------------------------------------------------------------------
// How it works — reveals the four columns in sequence once the grid is in
// view. One-shot: it stops observing after the first reveal, so scrolling back
// past it doesn't replay the animation.
// ---------------------------------------------------------------------------
(function () {
  var grid = document.querySelector("[data-how-grid]");
  if (!grid) return;

  // Without an observer, or when motion is unwelcome, leave the columns alone —
  // they are already visible, and only opting in here hides them.
  if (
    !("IntersectionObserver" in window) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  grid.classList.add("is-animated");

  function reveal() {
    grid.classList.add("is-revealed");
    observer.disconnect();
    window.clearTimeout(failsafe);
  }

  var observer = new IntersectionObserver(
    function (entries) {
      if (entries[0].isIntersecting) reveal();
    },
    { threshold: 0.2 }
  );

  observer.observe(grid);

  // Belt and braces: if the observer never reports, show the columns anyway
  var failsafe = window.setTimeout(reveal, 3000);
})();

// Accordion toggle
document.querySelectorAll(".accordion__trigger").forEach(function (trigger) {
  trigger.addEventListener("click", function () {
    var item = trigger.closest(".accordion__item");
    var isOpen = item.classList.toggle("is-open");
    trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
});

// ---------------------------------------------------------------------------
// Product rail — renders the homepage catalog from the reference data files
// (decision-tree.json + product-test-equipment-map.json), per brand-styleguide.
// Prices and descriptions are SAMPLE DATA for the prototype — no real pricing
// exists in the source files yet.
// ---------------------------------------------------------------------------
(function () {
  var rail = document.querySelector("[data-product-rail]");
  var tabsEl = document.querySelector("[data-product-tabs]");
  if (!rail || !tabsEl) return;

  var CATEGORIES = [
    "All",
    "Boilers",
    "Cooling Towers",
    "Closed Loop Systems",
    "Feed Equipment",
    "Test Equipment",
  ];

  var CATEGORY_IMAGES = {
    "Boilers": "images/product-drum.png",
    "Cooling Towers": "images/product-drum.png",
    "Closed Loop Systems": "images/product-drum.png",
    "Feed Equipment": "images/product-equipment.svg",
    "Test Equipment": "images/product-test.svg",
  };

  // Plain-language one-liners keyed by subcategory (chemicals)
  var SUBCATEGORY_DESC = {
    "Oxygen Scavenger": "Removes dissolved oxygen before it can corrode boiler steel.",
    "Boiler Water Dispersant": "Keeps scale-forming minerals in suspension so blowdown carries them out.",
    "Steam Treatment": "Protects steam and condensate lines from acidic attack.",
    "All-in-one Boiler": "One product covering oxygen, scale, and condensate protection.",
    "Soft Water": "Scale and corrosion control for towers on softened makeup water.",
    "Hard Water": "Scale and corrosion control for towers running hard makeup water.",
    "Biocide - Oxidizing": "Fast-acting control for algae and bacteria in open systems.",
    "Biocide - Non-oxidizing": "Slower-acting biocide for rotation or stubborn growth.",
    "Nitrite (Trace)": "Set-and-forget corrosion protection for closed loops.",
  };

  // SAMPLE pricing by subcategory (chemicals) — placeholder until real SKUs
  var SUBCATEGORY_PRICE = {
    "Oxygen Scavenger": ["$189", "50-lb pail"],
    "Boiler Water Dispersant": ["$219", "5-gal pail"],
    "Steam Treatment": ["$199", "5-gal pail"],
    "All-in-one Boiler": ["$259", "5-gal pail"],
    "Soft Water": ["$249", "5-gal pail"],
    "Hard Water": ["$249", "5-gal pail"],
    "Biocide - Oxidizing": ["$164", "25-lb bucket"],
    "Biocide - Non-oxidizing": ["$178", "5-gal pail"],
    "Nitrite (Trace)": ["$189", "5-gal pail"],
  };

  // SAMPLE details for equipment/test items, keyed by handle placeholder
  var ITEM_DETAILS = {
    "advantage-controls-30-gpd-feed-pump": ["$349", "each", "Meters chemical into your system at a set rate."],
    "stainless-steel-injector": ["$29", "each", "Injection fitting for high-temperature lines."],
    "plastic-injector": ["$19", "each", "Injection fitting for standard lines."],
    "foot-valve": ["$24", "each", "Keeps the suction line primed inside the drum."],
    "suction-discharge-tubing-3-8": ["$18", "20-ft roll", "Connects pump, drum, and injection point."],
    "chemical-feed-pump-rebuild-kit": ["$89", "kit", "Wear parts to bring a tired feed pump back."],
    "brominator": ["$199", "each", "Slow-dissolves biocide tablets into cooling water."],
    "5-gallon-pot-feeder": ["$249", "each", "Shot-feeds chemical into closed loops."],
    "industrial-water-softener": ["$1,850", "each", "Removes hardness before it reaches your system."],
    "industrial-ro": ["$2,400", "each", "High-purity makeup water via reverse osmosis."],
    "filter-bags": ["$12", "5-pack", "Catches solids before they settle in your loop."],
    "meter-4p": ["$295", "each", "Handheld meter for conductivity readings."],
    "meter-sp380": ["$385", "each", "Reads PTSA / fluorescein tracer levels."],
    "hardness-buffer-solution": ["$14", "bottle", "Buffer for the total hardness drop test."],
    "hardness-titrating-solution": ["$16", "bottle", "Titrant for the total hardness drop test."],
    "cresol-red-indicator-solution": ["$14", "bottle", "Indicator for the pH slide test."],
    "ph-test-tube": ["$9", "each", "Sample tube for the pH slide test."],
    "ph-slide-viewer": ["$12", "each", "Color comparator for reading pH."],
    "eye-drop-dispenser": ["$8", "each", "Dispenses reagent one drop at a time."],
    "phenolphthalein-indicator": ["$16", "bottle", "Indicator for the sulfite (SO3) test."],
    "starch-acid-indicator": ["$18", "bottle", "Indicator for the sulfite (SO3) test."],
    "potassium-iodide-iodate": ["$19", "bottle", "Titrant for the sulfite (SO3) test."],
    "chlorine-color-cube": ["$39", "each", "Color comparator for total chlorine."],
    "dpd-total-chlorine-powder-pillows": ["$18", "100-pack", "Reagent pillows for the chlorine test."],
  };

  function fetchJSON(path) {
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error(path + ": " + res.status);
      return res.json();
    });
  }

  Promise.all([
    fetchJSON("data/decision-tree.json"),
    fetchJSON("data/product-test-equipment-map.json"),
  ])
    .then(function (results) {
      init(buildCatalog(results[0], results[1]));
    })
    .catch(function (err) {
      rail.innerHTML =
        '<p class="text-muted">Product data could not be loaded. ' +
        "If you opened this file directly, run it from a local server instead " +
        "(e.g. <code>python3 -m http.server</code>).</p>";
      console.error(err);
    });

  function buildCatalog(tree, map) {
    var items = [];

    // Chemicals from the decision tree
    Object.keys(tree.products).forEach(function (key) {
      var p = tree.products[key];
      var price = SUBCATEGORY_PRICE[p.subcategory] || ["$—", ""];
      items.push({
        name: p.name,
        category: p.category,
        tag: p.subcategory,
        desc: SUBCATEGORY_DESC[p.subcategory] || "",
        price: price[0],
        unit: price[1],
        image: CATEGORY_IMAGES[p.category],
        refill: false,
      });
    });

    // Test kit components
    Object.keys(map.tests).forEach(function (key) {
      var test = map.tests[key];
      test.components.forEach(function (c) {
        var d = ITEM_DETAILS[c.handle_placeholder] || ["$—", "", ""];
        items.push({
          name: c.name,
          category: "Test Equipment",
          tag: chemxTestTag(test.name),
          desc: d[2],
          price: d[0],
          unit: d[1],
          image: CATEGORY_IMAGES["Test Equipment"],
          refill: !!c.refill,
        });
      });
    });

    // Feed / dosing equipment
    map.equipment.items.forEach(function (item) {
      var d = ITEM_DETAILS[item.handle_placeholder] || ["$—", "", ""];
      items.push({
        name: item.name,
        category: "Feed Equipment",
        tag: "Dosing hardware",
        desc: d[2],
        price: d[0],
        unit: d[1],
        image: CATEGORY_IMAGES["Feed Equipment"],
        refill: false,
      });
    });

    return items;
  }

  function init(items) {
    var active = "All";
    var activeSub = null; // set by the Shop mega menu, cleared by the pills

    CATEGORIES.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill-tab" + (cat === active ? " is-active" : "");
      btn.textContent = cat;
      btn.setAttribute("data-pill", cat);
      btn.setAttribute("aria-pressed", cat === active ? "true" : "false");
      btn.addEventListener("click", function () {
        activeSub = null;
        setActive(cat);
      });
      tabsEl.appendChild(btn);
    });

    function setActive(cat) {
      active = cat;
      tabsEl.querySelectorAll(".pill-tab").forEach(function (b) {
        var on = b.getAttribute("data-pill") === cat;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      render();
    }

    // The Shop mega menu asks the rail to filter itself
    document.addEventListener("chemx:filter", function (e) {
      var d = e.detail || {};
      activeSub = d.subcategory || null;
      setActive(d.category || "All");
    });

    function render() {
      var visible = items.filter(function (item) {
        if (active !== "All" && item.category !== active) return false;
        if (activeSub && item.tag !== activeSub) return false;
        return true;
      });
      rail.innerHTML = visible.map(cardHTML).join("");
      rail.scrollTo({ left: 0, behavior: "instant" });
      updateArrows();
    }

    function cardHTML(item) {
      var tags =
        '<span class="badge">' + item.category + "</span>" +
        '<span class="badge">' + item.tag + "</span>" +
        (item.refill ? '<span class="badge badge--success">Refill item</span>' : "");
      return (
        '<article class="product-card">' +
        '<div class="product-card__media"><img src="' + item.image + '" alt="" loading="lazy"></div>' +
        '<div class="product-card__body">' +
        '<div class="product-card__tags">' + tags + "</div>" +
        "<h3>" + item.name + "</h3>" +
        '<p class="product-card__desc">' + item.desc + "</p>" +
        '<div class="product-card__price-row">' +
        '<span class="product-card__price">' + item.price + "</span>" +
        '<span class="product-card__unit">' + item.unit + "</span>" +
        "</div>" +
        '<div class="product-card__actions">' +
        '<button class="btn btn--primary" type="button">Add to cart</button>' +
        '<a class="product-card__link" href="#">Learn more</a>' +
        "</div>" +
        "</div>" +
        "</article>"
      );
    }

    // Arrow buttons scroll by one card + gap
    var prevBtn = document.querySelector("[data-rail-prev]");
    var nextBtn = document.querySelector("[data-rail-next]");

    function step() {
      var card = rail.firstElementChild;
      return card ? card.getBoundingClientRect().width + 16 : 320;
    }

    function updateArrows() {
      var max = rail.scrollWidth - rail.clientWidth - 1;
      prevBtn.disabled = rail.scrollLeft <= 0;
      nextBtn.disabled = rail.scrollLeft >= max;
    }

    prevBtn.addEventListener("click", function () {
      rail.scrollBy({ left: -step() * 2, behavior: "smooth" });
    });
    nextBtn.addEventListener("click", function () {
      rail.scrollBy({ left: step() * 2, behavior: "smooth" });
    });
    rail.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);

    render();
  }
})();

// ---------------------------------------------------------------------------
// Guided selector — slide-out quiz modal walking data/decision-tree.json,
// with results cross-referenced against data/product-test-equipment-map.json
// for the tests each product needs. Prices/descriptions are SAMPLE DATA,
// matching the placeholders used in the product rail above.
// ---------------------------------------------------------------------------
(function () {
  var modal = document.querySelector("[data-quiz-modal]");
  var body = document.querySelector("[data-quiz-body]");
  var openBtns = document.querySelectorAll("[data-open-quiz]");
  var closeEls = document.querySelectorAll("[data-quiz-close]");
  if (!modal || !body || !openBtns.length) return;

  var CATEGORY_IMAGES = {
    "Boilers": "images/product-drum.png",
    "Cooling Towers": "images/product-drum.png",
    "Closed Loop Systems": "images/product-drum.png",
  };

  var SUBCATEGORY_DESC = {
    "Oxygen Scavenger": "Removes dissolved oxygen before it can corrode boiler steel.",
    "Boiler Water Dispersant": "Keeps scale-forming minerals in suspension so blowdown carries them out.",
    "Steam Treatment": "Protects steam and condensate lines from acidic attack.",
    "All-in-one Boiler": "One product covering oxygen, scale, and condensate protection.",
    "Soft Water": "Scale and corrosion control for towers on softened makeup water.",
    "Hard Water": "Scale and corrosion control for towers running hard makeup water.",
    "Biocide - Oxidizing": "Fast-acting control for algae and bacteria in open systems.",
    "Biocide - Non-oxidizing": "Slower-acting biocide for rotation or stubborn growth.",
    "Nitrite (Trace)": "Set-and-forget corrosion protection for closed loops.",
  };

  var SUBCATEGORY_PRICE = {
    "Oxygen Scavenger": ["$189", "50-lb pail"],
    "Boiler Water Dispersant": ["$219", "5-gal pail"],
    "Steam Treatment": ["$199", "5-gal pail"],
    "All-in-one Boiler": ["$259", "5-gal pail"],
    "Soft Water": ["$249", "5-gal pail"],
    "Hard Water": ["$249", "5-gal pail"],
    "Biocide - Oxidizing": ["$164", "25-lb bucket"],
    "Biocide - Non-oxidizing": ["$178", "5-gal pail"],
    "Nitrite (Trace)": ["$189", "5-gal pail"],
  };

  var tree = null;
  var testMap = null;
  var loadError = null;
  var history = []; // [{ nodeKey, label }]
  var currentKey = null;
  var lastFocused = null;

  fetch("data/decision-tree.json")
    .then(function (res) {
      return res.json();
    })
    .then(function (json) {
      tree = json;
    })
    .catch(function (err) {
      loadError = err;
      console.error(err);
    });

  fetch("data/product-test-equipment-map.json")
    .then(function (res) {
      return res.json();
    })
    .then(function (json) {
      testMap = json;
    })
    .catch(function (err) {
      loadError = err;
      console.error(err);
    });

  function openModal() {
    lastFocused = document.activeElement;
    history = [];
    currentKey = tree ? tree.start : null;
    render();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var closeBtn = modal.querySelector(".quiz-modal__close");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  openBtns.forEach(function (btn) {
    btn.addEventListener("click", openModal);
  });

  closeEls.forEach(function (el) {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  function render() {
    if (loadError) {
      body.innerHTML =
        '<p class="text-muted">The selector couldn\'t load its question data. ' +
        "If you opened this file directly, run it from a local server instead " +
        "(e.g. <code>python3 -m http.server</code>).</p>";
      return;
    }

    if (!tree || !testMap) {
      body.innerHTML = '<p class="text-muted">Loading…</p>';
      return;
    }

    var node = tree.nodes[currentKey];
    if (node) renderQuestion(node);
    else renderResult(currentKey);
  }

  function renderQuestion(node) {
    var backHTML = history.length
      ? '<button class="quiz-back" type="button" data-quiz-back>' +
        '<span aria-hidden="true">←</span> Back</button>'
      : "";

    var trailHTML = history.length
      ? '<div class="quiz-trail">' +
        history
          .map(function (step) {
            return '<span class="quiz-trail__item">' + step.label + "</span>";
          })
          .join("") +
        "</div>"
      : "";

    body.innerHTML =
      backHTML +
      trailHTML +
      '<p class="quiz-step__label">Step ' + (history.length + 1) + "</p>" +
      '<h3 class="quiz-question">' + node.question + "</h3>" +
      '<div class="quiz-options">' +
      node.options
        .map(function (opt, i) {
          return (
            '<button class="quiz-option" type="button" data-quiz-option="' +
            i +
            '">' +
            opt.label +
            "</button>"
          );
        })
        .join("") +
      "</div>";

    body.querySelectorAll("[data-quiz-option]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var opt = node.options[Number(btn.getAttribute("data-quiz-option"))];
        history.push({ nodeKey: currentKey, label: opt.label });
        currentKey = opt.next || opt.result;
        render();
        body.scrollTop = 0;
      });
    });

    var backBtn = body.querySelector("[data-quiz-back]");
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        var prev = history.pop();
        currentKey = prev.nodeKey;
        render();
        body.scrollTop = 0;
      });
    }
  }

  function renderResult(code) {
    var product = tree.products[code];

    var backHTML =
      '<button class="quiz-back" type="button" data-quiz-back>' +
      '<span aria-hidden="true">←</span> Back</button>';

    var trailHTML =
      '<div class="quiz-trail">' +
      history
        .map(function (step) {
          return '<span class="quiz-trail__item">' + step.label + "</span>";
        })
        .join("") +
      "</div>";

    var price = SUBCATEGORY_PRICE[product.subcategory] || ["$—", ""];
    var desc = SUBCATEGORY_DESC[product.subcategory] || "";
    var image = CATEGORY_IMAGES[product.category] || "images/product-drum.png";

    var testsHTML = product.tests.length
      ? '<p class="quiz-result__section-title">Testing equipment you\'ll need</p>' +
        '<div class="quiz-test-list">' +
        product.tests
          .map(function (testKey) {
            var test = testMap.tests[testKey];
            if (!test) return "";
            var components = test.components.map(function (c) {
              return c.name;
            }).join(", ");
            return (
              '<div class="quiz-test">' +
              '<p class="quiz-test__name">' + test.name + "</p>" +
              '<p class="text-small quiz-test__components">' + components + "</p>" +
              "</div>"
            );
          })
          .join("") +
        "</div>"
      : "";

    body.innerHTML =
      backHTML +
      trailHTML +
      '<div class="quiz-result__badges">' +
      '<span class="badge">' + product.category + "</span>" +
      '<span class="badge">' + product.subcategory + "</span>" +
      "</div>" +
      '<div class="quiz-result__media"><img src="' + image + '" alt="" /></div>' +
      "<h3>" + product.name + "</h3>" +
      '<p class="quiz-result__desc">' + desc + "</p>" +
      '<div class="quiz-result__price-row">' +
      '<span class="quiz-result__price">' + price[0] + "</span>" +
      '<span class="quiz-result__unit">' + price[1] + "</span>" +
      "</div>" +
      '<div class="quiz-result__actions">' +
      '<button class="btn btn--primary" type="button">Add to cart</button>' +
      '<a class="btn btn--secondary" href="#">View product page</a>' +
      "</div>" +
      testsHTML +
      '<div class="quiz-restart">' +
      '<button class="quiz-back" type="button" data-quiz-restart>Start over</button>' +
      "</div>";

    var backBtn = body.querySelector("[data-quiz-back]");
    backBtn.addEventListener("click", function () {
      var prev = history.pop();
      currentKey = prev.nodeKey;
      render();
      body.scrollTop = 0;
    });

    body.querySelector("[data-quiz-restart]").addEventListener("click", function () {
      history = [];
      currentKey = tree.start;
      render();
      body.scrollTop = 0;
    });
  }
})();

// ---------------------------------------------------------------------------
// Shop mega menu — built from the same catalog data as the product rail, so
// the taxonomy and counts can never drift from what's actually in stock.
// Clicking any entry filters the rail below and scrolls to it.
// ---------------------------------------------------------------------------
(function () {
  var item = document.querySelector("[data-mega-item]");
  var toggle = document.querySelector("[data-mega-toggle]");
  var mega = document.querySelector("[data-mega]");
  if (!item || !toggle || !mega) return;

  // Which categories share a column. Presentation only — the entries
  // themselves come from the data files.
  var COLUMNS = [
    ["Boilers"],
    ["Cooling Towers"],
    ["Closed Loop Systems", "Feed Equipment"],
    ["Test Equipment"],
  ];

  var desktop = window.matchMedia("(min-width: 641px)");

  Promise.all([
    fetch("data/decision-tree.json").then(function (r) { return r.json(); }),
    fetch("data/product-test-equipment-map.json").then(function (r) { return r.json(); }),
  ])
    .then(function (res) {
      render(groupCatalog(res[0], res[1]));
    })
    .catch(function (err) {
      console.error(err);
    });

  // category -> { total, subs: [{ name, count }] }
  function groupCatalog(tree, map) {
    var groups = {};

    function add(category, sub) {
      var g = (groups[category] = groups[category] || { total: 0, subs: [], index: {} });
      g.total++;
      if (g.index[sub] === undefined) {
        g.index[sub] = g.subs.length;
        g.subs.push({ name: sub, count: 0 });
      }
      g.subs[g.index[sub]].count++;
    }

    Object.keys(tree.products).forEach(function (key) {
      var p = tree.products[key];
      add(p.category, p.subcategory);
    });

    // Tags here must match the ones buildCatalog assigns, so the rail's
    // subcategory filter lines up with what the menu links request.
    Object.keys(map.tests).forEach(function (key) {
      var t = map.tests[key];
      t.components.forEach(function () {
        add("Test Equipment", chemxTestTag(t.name));
      });
    });

    map.equipment.items.forEach(function () {
      add("Feed Equipment", "Dosing hardware");
    });

    return groups;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function render(groups) {
    var columns = COLUMNS.map(function (cats) {
      var blocks = cats
        .filter(function (cat) { return groups[cat]; })
        .map(function (cat) {
          var g = groups[cat];
          var subs = g.subs
            .map(function (s) {
              return (
                "<li>" +
                '<button class="mega__link" type="button" data-cat="' + esc(cat) + '"' +
                ' data-sub="' + esc(s.name) + '">' +
                "<span>" + esc(s.name) + "</span>" +
                '<span class="mega__count">' + s.count + "</span>" +
                "</button></li>"
              );
            })
            .join("");
          return (
            '<div class="mega__group">' +
            '<button class="mega__cat" type="button" data-cat="' + esc(cat) + '">' +
            "<span>" + esc(cat) + "</span>" +
            '<span class="mega__count">' + g.total + "</span>" +
            "</button>" +
            '<ul class="mega__list">' + subs + "</ul>" +
            "</div>"
          );
        })
        .join("");
      return "<div>" + blocks + "</div>";
    }).join("");

    mega.innerHTML =
      '<div class="container"><div class="mega__grid">' +
      columns +
      '<div class="mega__promo">' +
      '<p class="pill-outline">Not sure?</p>' +
      "<h3>Let us match your system</h3>" +
      "<p>Answer a few questions about what you're treating and we'll point you to the right product — plus the test kit for it.</p>" +
      '<button class="btn btn--primary btn--arrow" type="button" data-open-quiz>Find your product</button>' +
      '<button class="mega__promo-link" type="button" data-cat="All">Browse all products <span aria-hidden="true">→</span></button>' +
      "</div>" +
      "</div></div>";

    mega.querySelectorAll("[data-cat]").forEach(function (el) {
      el.addEventListener("click", function () {
        document.dispatchEvent(
          new CustomEvent("chemx:filter", {
            detail: {
              category: el.getAttribute("data-cat"),
              subcategory: el.getAttribute("data-sub") || null,
            },
          })
        );
        close();
        closeMobileNav();
        var section = document.getElementById("products");
        if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // The quiz module bound its listeners before this markup existed, so
    // wire the promo's CTA up to the same modal by hand.
    var quizBtn = mega.querySelector("[data-open-quiz]");
    if (quizBtn) {
      quizBtn.addEventListener("click", function () {
        close();
        closeMobileNav();
        var hero = document.querySelector(".hero [data-open-quiz]");
        if (hero) hero.click();
      });
    }
  }

  // On phones the menu lives inside the hamburger overlay, which would
  // otherwise stay open covering the results the user just filtered to.
  // Reuse the nav's own toggle so its button/ARIA state stays in sync.
  function closeMobileNav() {
    var nav = document.getElementById("site-nav");
    var navToggle = document.querySelector("[data-nav-toggle]");
    if (nav && navToggle && nav.classList.contains("is-open")) navToggle.click();
  }

  // Opened by click ("pinned") stays put until dismissed deliberately;
  // opened by hover closes again when the pointer leaves.
  var pinned = false;

  function open() {
    item.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
  }

  function close() {
    pinned = false;
    item.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  function isOpen() {
    return item.classList.contains("is-open");
  }

  toggle.addEventListener("click", function () {
    if (isOpen() && pinned) {
      close();
    } else {
      pinned = true;
      open();
    }
  });

  // Hover intent on pointer devices only — the delay keeps the panel from
  // flashing open when the cursor just passes over Shop on its way elsewhere.
  var openTimer, closeTimer;

  item.addEventListener("mouseenter", function () {
    if (!desktop.matches) return;
    clearTimeout(closeTimer);
    openTimer = setTimeout(open, 120);
  });

  item.addEventListener("mouseleave", function () {
    if (!desktop.matches || pinned) return;
    clearTimeout(openTimer);
    closeTimer = setTimeout(close, 180);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen()) {
      close();
      toggle.focus();
    }
  });

  // Click outside / tab away
  document.addEventListener("click", function (e) {
    if (isOpen() && !item.contains(e.target)) close();
  });

  // Tabbing to something outside dismisses it. Ignore focus landing on
  // <body>, which happens incidentally and isn't the user navigating away.
  document.addEventListener("focusin", function (e) {
    if (isOpen() && e.target !== document.body && !item.contains(e.target)) {
      close();
    }
  });

  desktop.addEventListener("change", close);
})();
