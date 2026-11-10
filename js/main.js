/* v2 mock behaviour. No dependencies: IntersectionObserver for reveals and the active nav,
   View Transitions for the work filter where supported, one scramble word in the contact line. */
(function () {
  "use strict";
  var d = document.documentElement;
  // First thing: reveal and collapse CSS keys off this class, so if this file never runs, nothing stays hidden.
  d.classList.add("js-ready");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)");
  var hasIO = "IntersectionObserver" in window;

  /* ---------- theme (same `theme` key as the live site) ---------- */
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  document.querySelector(".theme-btn").addEventListener("click", function () {
    var t = d.getAttribute("data-theme") === "dark" ? "light" : "dark";
    d.setAttribute("data-theme", t);
    themeMeta.setAttribute("content", t === "dark" ? "#0d0d0c" : "#fafaf9");
    try { localStorage.setItem("theme", t); } catch (e) { /* storage blocked: theme still applies this visit */ }
  });

  /* ---------- reveals ---------- */
  var revealEls = document.querySelectorAll("[data-reveal], [data-lines], .iso");
  if (hasIO) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        revealer.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealEls.forEach(function (el) { revealer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- header state ---------- */
  var hdr = document.getElementById("hdr");
  var sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none";
  document.body.prepend(sentinel);
  if (hasIO) {
    new IntersectionObserver(function (entries) {
      hdr.classList.toggle("scrolled", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ---------- active nav + phone menu ---------- */
  var menu = document.getElementById("nav-menu");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("#nav-menu a, .hdr-end a[href^='#']"));
  navLinks.forEach(function (a) {
    a.addEventListener("click", function () {
      if (menu.hidePopover && menu.matches(":popover-open")) menu.hidePopover();
    });
  });
  if (hasIO) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute("href") === "#" + e.target.id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    // The hero has no link, so reaching it clears aria-current.
    ["#top", "#work", "#career", "#skills", "#contact"].forEach(function (id) {
      var s = document.querySelector(id);
      if (s) spy.observe(s);
    });
  }

  /* ---------- work filter ---------- */
  var tiles = Array.prototype.slice.call(document.querySelectorAll("#tiles .tile"));
  var chips = Array.prototype.slice.call(document.querySelectorAll(".filters .chip-btn"));
  var status = document.getElementById("tiles-status");
  tiles.forEach(function (t, i) { t.style.viewTransitionName = "tile-" + i; });

  function applyFilter(f, label) {
    var shown = 0;
    tiles.forEach(function (t) {
      var match = f === "all" || t.getAttribute("data-tags").split(" ").indexOf(f) !== -1;
      t.hidden = !match;
      if (match) shown++;
    });
    chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-f") === f)); });
    status.textContent = f === "all"
      ? "Showing all " + shown + " projects"
      : "Showing " + shown + (shown === 1 ? " project" : " projects") + " in " + label;
  }
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var f = c.getAttribute("data-f");
      var run = function () { applyFilter(f, c.textContent); };
      if (document.startViewTransition && !reduce.matches) document.startViewTransition(run);
      else run();
    });
  });

  /* ---------- stack disclosure ---------- */
  var stack = document.getElementById("stack");
  var more = document.querySelector(".stack-more");
  more.hidden = false;
  more.addEventListener("click", function () {
    var open = stack.classList.toggle("open");
    more.setAttribute("aria-expanded", String(open));
    more.textContent = open ? "Show less" : "Show the full stack";
  });

  /* ---------- contact word: scramble to the next word, only while seen ---------- */
  var cycle = document.getElementById("cycle");
  var words = ["hire", "Android app", "product"];
  var glyphs = "abcdeghknopqrsuvxyz"; // no m or w: random frames stay inside the held width
  var wi = 0, timer = null, seen = false;

  // Fix the box at the widest word so a swap or a scramble frame never moves the line.
  function holdWidth() {
    var w = 0, was = cycle.textContent;
    cycle.style.width = "auto";
    words.forEach(function (word) { cycle.textContent = word; w = Math.max(w, cycle.getBoundingClientRect().width); });
    cycle.textContent = was;
    cycle.style.width = Math.ceil(w) + "px";
  }
  holdWidth();
  if (document.fonts) document.fonts.ready.then(holdWidth);
  addEventListener("resize", holdWidth);

  function scrambleTo(to) {
    var start = performance.now(), dur = 500, last = -1;
    function frame(now) {
      var p = Math.min(1, (now - start) / dur);
      var step = Math.floor((now - start) / 70); // new random letters every 70ms, not every frame
      if (p < 1 && step !== last) {
        last = step;
        var out = "";
        for (var i = 0; i < to.length; i++) {
          var c = to.charAt(i);
          out += c === " " || i / to.length < p ? c : glyphs.charAt((Math.random() * glyphs.length) | 0);
        }
        cycle.textContent = out;
      }
      if (p < 1) requestAnimationFrame(frame);
      else cycle.textContent = to;
    }
    requestAnimationFrame(frame);
  }
  function syncCycle() {
    var run = seen && !document.hidden && !reduce.matches;
    if (run && !timer) {
      timer = setInterval(function () { wi = (wi + 1) % words.length; scrambleTo(words[wi]); }, 4500);
    } else if (!run && timer) {
      clearInterval(timer); timer = null;
    }
  }
  if (hasIO) {
    new IntersectionObserver(function (entries) { seen = entries[0].isIntersecting; syncCycle(); }).observe(cycle);
  }
  document.addEventListener("visibilitychange", syncCycle);
  reduce.addEventListener("change", syncCycle);

  /* ---------- copy email ---------- */
  var copyBtn = document.querySelector(".copy-btn");
  var copyNote = document.getElementById("copy-note");
  if (navigator.clipboard) {
    copyBtn.hidden = false;
    copyBtn.addEventListener("click", function () {
      navigator.clipboard.writeText("kotimn@gmail.com").then(function () {
        copyBtn.textContent = "Copied";
        copyNote.textContent = "Email address copied.";
        setTimeout(function () { copyBtn.textContent = "Copy email"; copyNote.textContent = ""; }, 2400);
      }, function () {
        copyNote.textContent = "Could not copy. The address is kotimn@gmail.com.";
      });
    });
  }

  /* ---------- hero parallax (fine pointer, motion allowed, at most 2deg) ---------- */
  var plane = document.getElementById("iso-plane");
  var hero = document.getElementById("top");
  function resetTilt() {
    plane.style.setProperty("--px", "0");
    plane.style.setProperty("--py", "0");
  }
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var raf = 0, px = 0, py = 0, rect = null;
    function measure() { rect = hero.getBoundingClientRect(); }
    hero.addEventListener("pointerenter", measure);
    addEventListener("resize", function () { rect = null; });
    addEventListener("scroll", function () { rect = null; }, { passive: true });
    hero.addEventListener("pointermove", function (e) {
      if (reduce.matches) return;
      if (!rect) measure();
      px = (e.clientX - rect.left) / rect.width * 2 - 1;
      py = (e.clientY - rect.top) / rect.height * 2 - 1;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        plane.style.setProperty("--px", px.toFixed(3));
        plane.style.setProperty("--py", py.toFixed(3));
      });
    });
    hero.addEventListener("pointerleave", resetTilt);
  }
  reduce.addEventListener("change", function () { if (reduce.matches) resetTilt(); });

  /* ---------- contact form: builds a mailto link, as js/main.js does ---------- */
  var form = document.getElementById("contact-form");
  var note = document.getElementById("form-note");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.elements.name ? form.elements.name.value.trim() : "";
    var subject = form.elements.subject ? form.elements.subject.value.trim() : "";
    var message = form.elements.message ? form.elements.message.value.trim() : "";
    var body = message + "\n\n- " + name;
    note.textContent = "Your email app should open with this message ready. If it does not, write to kotimn@gmail.com.";
    window.location.href =
      "mailto:kotimn@gmail.com" +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  });

  /* ---------- footer: year and UK clock ---------- */
  document.getElementById("year").textContent = String(new Date().getFullYear());
  var clock = document.getElementById("clock");
  var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" });
  function tick() {
    var t = fmt.format(new Date());
    clock.textContent = t;
    clock.setAttribute("datetime", t);
  }
  tick();
  setInterval(tick, 10000);
})();
