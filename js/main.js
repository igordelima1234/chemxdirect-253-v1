// ChemX Direct — shared interactions

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
          tag: test.name + " test",
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

    CATEGORIES.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill-tab" + (cat === active ? " is-active" : "");
      btn.textContent = cat;
      btn.setAttribute("aria-pressed", cat === active ? "true" : "false");
      btn.addEventListener("click", function () {
        active = cat;
        tabsEl.querySelectorAll(".pill-tab").forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        render();
      });
      tabsEl.appendChild(btn);
    });

    function render() {
      var visible = items.filter(function (item) {
        return active === "All" || item.category === active;
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
