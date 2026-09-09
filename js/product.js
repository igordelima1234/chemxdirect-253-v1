/* ==========================================================================
   ChemX Direct — Product page (PDP)
   Gallery, variant/price logic, the dose calculator, the sticky section bar
   and the phone buy bar. Chrome behaviour (nav, mega menu, quiz, accordions)
   stays in main.js — this file only runs what the PDP adds.
   Written in the same ES5-ish style as main.js, no build step.
   ========================================================================== */

// ---------------------------------------------------------------------------
// Gallery — crossfade between the shots, thumbnails drive it
// ---------------------------------------------------------------------------
(function () {
  var gallery = document.querySelector("[data-gallery]");
  if (!gallery) return;

  var images = Array.prototype.slice.call(gallery.querySelectorAll("[data-gallery-img]"));
  var thumbs = Array.prototype.slice.call(gallery.querySelectorAll("[data-gallery-thumb]"));

  function show(index) {
    images.forEach(function (img, i) {
      img.classList.toggle("is-active", i === index);
    });
    thumbs.forEach(function (btn, i) {
      btn.classList.toggle("is-active", i === index);
      btn.setAttribute("aria-current", i === index ? "true" : "false");
    });
  }

  thumbs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      show(Number(btn.getAttribute("data-gallery-thumb")));
    });
  });
})();

// ---------------------------------------------------------------------------
// Buy block — size, plan and quantity all feed one price
// ---------------------------------------------------------------------------
(function () {
  var sizes = Array.prototype.slice.call(document.querySelectorAll("[data-size]"));
  var plans = Array.prototype.slice.call(document.querySelectorAll("[data-plan]"));
  var qtyInput = document.querySelector("[data-qty]");
  if (!sizes.length || !qtyInput) return;

  var totalEl = document.querySelector("[data-total]");
  var wasEl = document.querySelector("[data-was]");
  var unitEl = document.querySelector("[data-unit]");
  var hintEl = document.querySelector("[data-size-hint]");
  var barPrice = document.querySelector("[data-bar-price]");
  var barPriceMobile = document.querySelector("[data-bar-price-mobile]");
  var barMeta = document.querySelector("[data-bar-meta]");

  function money(value) {
    return "$" + Math.round(value).toLocaleString("en-US");
  }

  function checked(list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].checked) return list[i];
    }
    return list[0];
  }

  function update() {
    var size = checked(sizes);
    var plan = checked(plans);
    var qty = Math.max(1, Math.min(99, Number(qtyInput.value) || 1));
    qtyInput.value = qty;

    var base = Number(size.getAttribute("data-price"));
    var gallons = Number(size.getAttribute("data-gal"));
    var label = size.getAttribute("data-label");
    var discount = plan ? Number(plan.getAttribute("data-discount")) : 0;

    var each = base * (1 - discount);
    var total = each * qty;
    var perGallon = (each / gallons).toFixed(2);

    if (totalEl) totalEl.textContent = money(total);
    if (wasEl) {
      wasEl.hidden = discount === 0;
      wasEl.textContent = money(base * qty);
    }
    if (unitEl) unitEl.textContent = label + " · $" + perGallon + "/gal";
    if (hintEl) hintEl.textContent = "$" + perGallon + " per gallon";
    if (barPrice) barPrice.textContent = money(total);
    if (barPriceMobile) barPriceMobile.textContent = money(total);
    if (barMeta) barMeta.textContent = "CWT 5000 · " + label;
  }

  sizes.concat(plans).forEach(function (input) {
    input.addEventListener("change", update);
  });

  qtyInput.addEventListener("input", update);

  function step(delta) {
    qtyInput.value = Math.max(1, Math.min(99, (Number(qtyInput.value) || 1) + delta));
    update();
  }

  var down = document.querySelector("[data-qty-down]");
  var up = document.querySelector("[data-qty-up]");
  if (down) down.addEventListener("click", function () { step(-1); });
  if (up) up.addEventListener("click", function () { step(1); });

  update();
})();

// ---------------------------------------------------------------------------
// Add to cart — no cart in the prototype, so the button confirms and resets
// ---------------------------------------------------------------------------
(function () {
  document.querySelectorAll("[data-add-to-cart]").forEach(function (btn) {
    var original = btn.textContent;
    var timer;

    btn.addEventListener("click", function () {
      clearTimeout(timer);
      btn.textContent = "Added ✓";
      timer = setTimeout(function () {
        btn.textContent = original;
      }, 1600);
    });
  });
})();

// ---------------------------------------------------------------------------
// Dose calculator — one set of maths drives both the readout and the
// reference chart below it, so the two can't disagree.
//
// Rule of thumb this models: charge to ~100 ppm product (1 gal per 1,000 gal
// of system water), then feed what blowdown carries away. Blowdown falls as
// cycles of concentration rise, hence the per-cycle factor.
// ---------------------------------------------------------------------------
(function () {
  var calc = document.querySelector("[data-calc]");
  var chartBody = document.querySelector("[data-chart-body]");
  if (!calc && !chartBody) return;

  var CHARGE_PER_1000 = 1.0;               // gallons of product
  var DAILY_PER_1000 = { 2: 0.6, 3: 0.35, 4: 0.26, 5: 0.21 };
  var DRUM = 55;                            // gallons in the largest container
  var SIZES = [
    { gallons: 5, label: "5-gal pail" },
    { gallons: 15, label: "15-gal keg" },
    { gallons: 55, label: "55-gal drum" },
  ];
  var CHART_VOLUMES = [500, 1000, 2500, 5000, 10000];

  var volumeInput = calc && calc.querySelector("[data-calc-volume]");
  var rangeInput = calc && calc.querySelector("[data-calc-range]");
  var cycleBtns = calc
    ? Array.prototype.slice.call(calc.querySelectorAll("[data-cycles]"))
    : [];
  var outCharge = document.querySelector("[data-out-charge]");
  var outDaily = document.querySelector("[data-out-daily]");
  var outLife = document.querySelector("[data-out-life]");
  var outRec = document.querySelector("[data-out-rec]");
  var chartCaption = document.querySelector("[data-chart] caption");

  var cycles = 3;

  function dose(volume, cyclesValue) {
    var daily = (volume / 1000) * DAILY_PER_1000[cyclesValue];
    return {
      charge: (volume / 1000) * CHARGE_PER_1000,
      daily: daily,
      weeks: daily > 0 ? DRUM / daily / 7 : 0,
    };
  }

  // Gallons read as ounces below a gallon — nobody sets a pump in "0.4 gal"
  function volume(gallons) {
    if (gallons < 1) return Math.round(gallons * 128) + " oz";
    return (Math.round(gallons * 10) / 10).toLocaleString("en-US") + " gal";
  }

  function weeks(value) {
    if (value >= 52) return "over a year";
    if (value >= 8) return Math.round(value) + " wks";
    return Math.round(value * 7) + " days";
  }

  function recommend(daily) {
    for (var i = 0; i < SIZES.length; i++) {
      if (SIZES[i].gallons / daily / 7 >= 8) return SIZES[i];
    }
    return null;
  }

  function renderCalc() {
    if (!calc) return;

    var vol = Math.max(100, Math.min(50000, Number(volumeInput.value) || 100));
    var d = dose(vol, cycles);

    outCharge.textContent = volume(d.charge);
    outDaily.innerHTML = volume(d.daily) + "<small>per day</small>";
    outLife.textContent = weeks(d.weeks);

    var pick = recommend(d.daily);
    if (pick) {
      var lasts = pick.gallons / d.daily / 7;
      outRec.innerHTML =
        "<strong>Buy the " + pick.label + ".</strong> At " +
        vol.toLocaleString("en-US") + " gallons and " + cycles +
        " cycles it covers about " + weeks(lasts) + " of feed, plus the " +
        volume(d.charge) + " initial charge.";
    } else {
      outRec.innerHTML =
        "<strong>You'll go through more than a drum every two months.</strong> " +
        "Message us about tote pricing before you order pails.";
    }
  }

  function renderChart() {
    if (!chartBody) return;

    var current = calc ? Number(volumeInput.value) || 0 : 0;
    var nearest = CHART_VOLUMES.reduce(function (best, v) {
      return Math.abs(v - current) < Math.abs(best - current) ? v : best;
    }, CHART_VOLUMES[0]);

    chartBody.innerHTML = CHART_VOLUMES.map(function (vol) {
      var d = dose(vol, cycles);
      var match = calc && vol === nearest ? ' class="is-match"' : "";
      return (
        "<tr" + match + ">" +
        "<th scope=\"row\">" + vol.toLocaleString("en-US") + " gal</th>" +
        "<td>" + volume(d.charge) + "</td>" +
        "<td>" + volume(d.daily) + " / day</td>" +
        "<td>" + weeks(d.weeks) + "</td>" +
        "<td>90–110 ppb</td>" +
        "</tr>"
      );
    }).join("");

    if (chartCaption) {
      chartCaption.textContent =
        "Starting points at " + cycles + " cycles of concentration";
    }
  }

  function render() {
    renderCalc();
    renderChart();
  }

  if (calc) {
    volumeInput.addEventListener("input", function () {
      if (rangeInput && Number(volumeInput.value) <= Number(rangeInput.max)) {
        rangeInput.value = volumeInput.value;
      }
      render();
    });

    if (rangeInput) {
      rangeInput.addEventListener("input", function () {
        volumeInput.value = rangeInput.value;
        render();
      });
    }

    cycleBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        cycles = Number(btn.getAttribute("data-cycles"));
        cycleBtns.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        render();
      });
    });
  }

  render();
})();

// ---------------------------------------------------------------------------
// Sticky section bar — highlights the section you're in, and reveals the
// buy controls once the real ones have scrolled away
// ---------------------------------------------------------------------------
(function () {
  var bar = document.querySelector("[data-pdp-bar]");
  var buybar = document.querySelector("[data-buybar]");
  var cartRow = document.querySelector(".cart-row");
  if (!bar) return;

  var links = Array.prototype.slice.call(bar.querySelectorAll("[data-spy]"));
  var sections = links
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  // Reveal the compact buy controls once the real cart row is off screen
  if (cartRow && "IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        var gone = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
        bar.classList.toggle("is-stuck", gone);
        if (buybar) buybar.classList.toggle("is-visible", gone);
      },
      { threshold: 0 }
    ).observe(cartRow);
  }

  if (!sections.length || !("IntersectionObserver" in window)) return;

  var visible = {};

  var spy = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting;
      });

      // The topmost section still in view wins, so the label matches what
      // the reader is actually looking at
      var activeId = null;
      for (var i = 0; i < sections.length; i++) {
        if (visible[sections[i].id]) {
          activeId = sections[i].id;
          break;
        }
      }

      links.forEach(function (link) {
        link.classList.toggle(
          "is-active",
          activeId !== null && link.getAttribute("href") === "#" + activeId
        );
      });
    },
    { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
  );

  sections.forEach(function (section) {
    spy.observe(section);
  });
})();
