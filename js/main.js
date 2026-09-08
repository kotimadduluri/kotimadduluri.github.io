// Koti Madduluri — portfolio. Vanilla JS, no dependencies.
(function () {
  "use strict";

  var html = document.documentElement;
  html.classList.remove("no-js");

  // trigger hero entrance on the next frame, once styles are applied
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { html.classList.add("is-loaded"); });
  });

  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  /* ---------- theme toggle ---------- */
  var themeToggle = document.querySelector(".theme-toggle");

  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    html.setAttribute("data-theme", theme);
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#101210" : "#f5f4ef");
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    }
  }

  applyTheme(html.getAttribute("data-theme") || "light");

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", next); } catch (err) {}

      // circle-reveal the new theme from the toggle (state transition)
      var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!document.startViewTransition || reduce) {
        applyTheme(next);
        return;
      }
      var rect = themeToggle.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var radius = Math.hypot(
        Math.max(cx, window.innerWidth - cx),
        Math.max(cy, window.innerHeight - cy)
      );
      var transition = document.startViewTransition(function () { applyTheme(next); });
      transition.ready.then(function () {
        document.documentElement.animate(
          { clipPath: ["circle(0px at " + cx + "px " + cy + "px)", "circle(" + radius + "px at " + cx + "px " + cy + "px)"] },
          { duration: 450, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(function () {});
    });
  }


  /* ---------- mobile nav ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navMenu = document.getElementById("nav-menu");

  function closeMenu() {
    if (!navMenu || !navToggle) return;
    navMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var open = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    navMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navMenu.classList.contains("is-open")) {
        closeMenu();
        navToggle.focus();
      }
    });
  }

  /* ---------- scrolled nav state (rAF-throttled) ---------- */
  var navWrap = document.querySelector(".nav-wrap");
  if (navWrap) {
    var ticking = false;
    var updateNav = function () {
      navWrap.classList.toggle("is-scrolled", window.scrollY > 24);
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateNav);
      }
    }, { passive: true });
    updateNav();
  }

  /* ---------- scrollspy ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll("section[id]"));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-menu a[href^="#"]'));

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      if (link.getAttribute("href") === "#" + id) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if (hasIO && sections.length && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- reveal-on-scroll (.reveal and .code-card) ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal, .code-card"));

  if (reduceMotion || !hasIO) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else if (revealEls.length) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { revealer.observe(el); });
  }

  /* ---------- stat count-up ---------- */
  var stats = Array.prototype.slice.call(document.querySelectorAll(".stat-num[data-count], .fact-num[data-count]"));

  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1200;
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      el.textContent = prefix + Math.round(eased * target) + suffix;
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = prefix + target + suffix;
    }
    requestAnimationFrame(frame);
  }

  if (!reduceMotion && hasIO && stats.length) {
    var statObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          statObserver.unobserve(entry.target);
          countUp(entry.target);
        }
      });
    }, { threshold: 0.5 });
    stats.forEach(function (el) { statObserver.observe(el); });
  }
  // Reduced motion / no IO: leave the hardcoded fallback text untouched.

  /* ---------- contact form → mailto + printed receipt ---------- */
  var form = document.getElementById("contact-form");
  var receiptEl = document.getElementById("receipt");

  function receiptRow(label, value) {
    var row = document.createElement("div");
    row.className = "receipt-row";
    var l = document.createElement("span");
    l.textContent = label;
    var v = document.createElement("span");
    v.textContent = value;
    row.appendChild(l);
    row.appendChild(v);
    return row;
  }

  function printReceipt(name) {
    if (!receiptEl) return;
    receiptEl.textContent = "";
    var head = document.createElement("p");
    head.className = "receipt-center";
    head.textContent = "KM · London, UK";
    receiptEl.appendChild(head);
    receiptEl.appendChild(Object.assign(document.createElement("hr"), { className: "receipt-rule" }));
    receiptEl.appendChild(receiptRow("Item", "1 × message"));
    if (name) receiptEl.appendChild(receiptRow("From", name));
    var status = receiptRow("Status", "Approved");
    status.className += " receipt-status";
    receiptEl.appendChild(status);
    receiptEl.appendChild(receiptRow("Auth code", "KM-" + Date.now().toString(36).slice(-4)));
    receiptEl.appendChild(Object.assign(document.createElement("hr"), { className: "receipt-rule" }));
    var foot = document.createElement("p");
    foot.className = "receipt-center";
    foot.textContent = "Thank you · I reply within a day";
    receiptEl.appendChild(foot);
    receiptEl.closest(".receipt-slot").classList.add("is-printed");
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name ? form.elements.name.value.trim() : "";
      var subject = form.elements.subject ? form.elements.subject.value.trim() : "";
      var message = form.elements.message ? form.elements.message.value.trim() : "";
      var body = message + "\n\n- " + name;
      printReceipt(name);
      window.location.href =
        "mailto:kotimn@gmail.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------- masthead dot matrix (cursor-reactive, fine pointers) ---------- */
  var canvas = document.querySelector(".dot-grid");
  var finePointer = matchMedia("(pointer: fine)").matches;
  // shared flag: cursor effects idle whenever the masthead is off screen
  var mastOnScreen = true;

  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var masthead = canvas.parentElement;
    var dots = [];
    var mouse = { x: -9999, y: -9999 };
    var running = false;
    var rafId = null;
    var SPACING = 26;
    var RADIUS = 130;
    var gridW = 0, gridH = 0, cols = 0, rowsN = 0;
    var docLeft = 0, docTop = 0;
    var baseColor = "#96988c", accentColor = "#3ddc84";
    var staticLayer = null;

    function readColors() {
      var cs = getComputedStyle(document.documentElement);
      baseColor = cs.getPropertyValue("--muted").trim() || "#96988c";
      accentColor = cs.getPropertyValue("--green").trim() || "#3ddc84";
    }

    // the resting field is prerendered once; frames only redraw dots near the cursor
    function buildStatic() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      staticLayer = document.createElement("canvas");
      staticLayer.width = canvas.width;
      staticLayer.height = canvas.height;
      var sctx = staticLayer.getContext("2d");
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.globalAlpha = 0.16;
      sctx.fillStyle = baseColor;
      sctx.beginPath();
      for (var i = 0; i < dots.length; i++) {
        sctx.moveTo(dots[i].x + 1, dots[i].y);
        sctx.arc(dots[i].x, dots[i].y, 1, 0, Math.PI * 2);
      }
      sctx.fill();
    }

    function buildGrid() {
      var rect = masthead.getBoundingClientRect();
      docLeft = rect.left + window.scrollX;
      docTop = rect.top + window.scrollY;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      gridW = rect.width;
      gridH = rect.height;
      canvas.width = gridW * dpr;
      canvas.height = gridH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      cols = 0;
      rowsN = 0;
      for (var y = SPACING; y < gridH; y += SPACING) {
        rowsN++;
        var rowCount = 0;
        for (var x = SPACING; x < gridW; x += SPACING) {
          dots.push({ x: x, y: y });
          rowCount++;
        }
        cols = rowCount;
      }
      readColors();
      buildStatic();
    }

    var smx = -9999, smy = -9999;
    function draw() {
      ctx.clearRect(0, 0, gridW, gridH);
      if (staticLayer) ctx.drawImage(staticLayer, 0, 0, gridW, gridH);
      // damped pointer: the field trails the cursor instead of snapping to it
      if (smx < -5000) { smx = mouse.x; smy = mouse.y; }
      smx += (mouse.x - smx) * 0.18;
      smy += (mouse.y - smy) * 0.18;
      // touch only the grid window around the cursor, not all ~2000 dots
      var r0 = Math.max(0, Math.floor((smy - RADIUS) / SPACING) - 1);
      var r1 = Math.min(rowsN - 1, Math.ceil((smy + RADIUS) / SPACING));
      var c0 = Math.max(0, Math.floor((smx - RADIUS) / SPACING) - 1);
      var c1 = Math.min(cols - 1, Math.ceil((smx + RADIUS) / SPACING));
      for (var ry = r0; ry <= r1; ry++) {
        for (var cx = c0; cx <= c1; cx++) {
          var d = dots[ry * cols + cx];
          if (!d) continue;
          var dx = d.x - smx;
          var dy = d.y - smy;
          var dist = Math.hypot(dx, dy);
          var t = Math.max(0, 1 - dist / RADIUS);
          if (t <= 0.01) continue;
          var push = t * t * 10;
          var px = dist > 0 ? d.x + (dx / dist) * push : d.x;
          var py = dist > 0 ? d.y + (dy / dist) * push : d.y;
          ctx.globalAlpha = 0.16 + t * 0.7;
          ctx.fillStyle = t > 0.05 ? accentColor : baseColor;
          ctx.beginPath();
          ctx.arc(px, py, 1 + t * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      // once the field has caught up with the cursor, stop burning frames;
      // any pointermove starts the loop again
      var settled = Math.abs(mouse.x - smx) + Math.abs(mouse.y - smy) < 0.4;
      if (running && !settled) {
        rafId = requestAnimationFrame(draw);
      } else {
        running = false;
        rafId = null;
      }
    }

    function start() {
      if (!running) { running = true; rafId = requestAnimationFrame(draw); }
    }
    function stop() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    buildGrid();
    // draw one static frame even without pointer interaction
    draw();

    if (finePointer) {
      masthead.addEventListener("pointermove", function (e) {
        // cached document offsets: no layout flush per event
        mouse.x = e.clientX + window.scrollX - docLeft;
        mouse.y = e.clientY + window.scrollY - docTop;
        if (mastOnScreen) start();
      });
      masthead.addEventListener("pointerleave", function () {
        mouse.x = -9999;
        mouse.y = -9999;
        // the loop eases the field back out and stops itself once settled
        if (mastOnScreen) start();
      });
    }

    if (hasIO) {
      new IntersectionObserver(function (entries) {
        mastOnScreen = entries[entries.length - 1].isIntersecting;
        if (!mastOnScreen) stop();
      }, { rootMargin: "80px" }).observe(masthead);
    }

    // theme switches recolor the prerendered field
    new MutationObserver(function () {
      readColors();
      buildStatic();
      draw();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildGrid();
        draw();
      }, 150);
    });
  }

  /* ---------- security microprint behind the name ---------- */
  // Skills set as banknote-style microprint; the cursor acts like a UV lamp.
  var nameWrap = document.querySelector(".name-wrap");
  if (nameWrap) {
    var printLayers = Array.prototype.slice.call(nameWrap.querySelectorAll(".microprint"));
    var SKILLS = [
      "Kotlin", "Jetpack Compose", "KMP", "CMP", "Coroutines", "Flow",
      "MVVM", "Clean Architecture", "Hilt", "Koin", "Ktor", "Retrofit",
      "NFC", "BLE", "MQTT", "GitHub Actions", "React", "TypeScript",
      "Node.js", "PostgreSQL", "Firebase"
    ];

    var buildPrint = function () {
      var rows = Math.ceil((nameWrap.offsetHeight + 28) / 22) + 1;
      var markup = "";
      for (var i = 0; i < rows; i++) {
        var shift = (i * 5) % SKILLS.length;
        var line = SKILLS.slice(shift).concat(SKILLS.slice(0, shift)).join(" · ");
        markup += "<div>" + line + " · " + line + "</div>";
      }
      printLayers.forEach(function (layer) { layer.innerHTML = markup; });
    };
    buildPrint();

    // cache the wrap's document offsets so pointermove never forces layout
    var wrapLeft = 0, wrapTop = 0;
    var measureWrap = function () {
      var r = nameWrap.getBoundingClientRect();
      wrapLeft = r.left + window.scrollX;
      wrapTop = r.top + window.scrollY;
    };
    measureWrap();

    var printResizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(printResizeTimer);
      printResizeTimer = setTimeout(function () {
        buildPrint();
        measureWrap();
      }, 150);
    });

    if (finePointer) {
      var mast = nameWrap.closest(".masthead") || nameWrap;
      // damped UV lamp: the glow trails the cursor
      var uvTX = -999, uvTY = -999, uvX = -999, uvY = -999, uvRaf = null;
      function uvTick() {
        uvX += (uvTX - uvX) * 0.22;
        uvY += (uvTY - uvY) * 0.22;
        nameWrap.style.setProperty("--ux", uvX.toFixed(1) + "px");
        nameWrap.style.setProperty("--uy", uvY.toFixed(1) + "px");
        if (Math.abs(uvTX - uvX) + Math.abs(uvTY - uvY) > 0.5) {
          uvRaf = requestAnimationFrame(uvTick);
        } else {
          uvRaf = null;
        }
      }
      mast.addEventListener("pointermove", function (e) {
        if (!mastOnScreen) return;
        uvTX = e.clientX + window.scrollX - wrapLeft;
        uvTY = e.clientY + window.scrollY - wrapTop;
        if (uvX < -500) { uvX = uvTX; uvY = uvTY; }
        if (!uvRaf) uvRaf = requestAnimationFrame(uvTick);
      });
      mast.addEventListener("pointerleave", function () {
        if (uvRaf) { cancelAnimationFrame(uvRaf); uvRaf = null; }
        uvTX = uvX = -999; uvTY = uvY = -999;
        nameWrap.style.setProperty("--ux", "-999px");
        nameWrap.style.setProperty("--uy", "-999px");
      });
    }
  }

  /* ---------- experience tabs ---------- */
  var xpTabs = Array.prototype.slice.call(document.querySelectorAll(".xp-tab"));
  var xpPanels = Array.prototype.slice.call(document.querySelectorAll(".xp-panel"));

  function selectXp(idx, focusTab) {
    if (!xpTabs[idx]) return;
    xpTabs.forEach(function (tab, j) {
      var on = j === idx;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    xpPanels.forEach(function (panel, j) {
      panel.classList.toggle("is-active", j === idx);
      panel.classList.remove("panel-in");
    });
    // keyboard-driven tab changes never animate (rapid arrow cycling must feel instant)
    if (!reduceMotion && !focusTab && xpPanels[idx]) {
      void xpPanels[idx].offsetWidth;
      xpPanels[idx].classList.add("panel-in");
    }
    if (focusTab) xpTabs[idx].focus();
  }

  xpTabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectXp(i); });
  });

  var xpRail = document.querySelector(".xp-rail");
  if (xpRail) {
    xpRail.addEventListener("keydown", function (e) {
      var current = xpTabs.indexOf(document.activeElement);
      if (current === -1) return;
      var next = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next = Math.min(current + 1, xpTabs.length - 1);
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = Math.max(current - 1, 0);
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = xpTabs.length - 1;
      if (next !== null) {
        e.preventDefault();
        selectXp(next, true);
      }
    });
  }

  /* ---------- timeline: hover sync + click opens that company's tab ---------- */
  var tlLanes = Array.prototype.slice.call(document.querySelectorAll(".tl-lane"));

  if (tlLanes.length === 2) {
    var laneA = tlLanes[0].children, laneB = tlLanes[1].children;
    // lanes and the tab rail both run newest-first
    var tabForLane = function (i) { return i; };
    var setHot = function (i, on) {
      if (laneA[i]) laneA[i].classList.toggle("is-hot", on);
      if (laneB[i]) laneB[i].classList.toggle("is-hot", on);
      var tab = xpTabs[tabForLane(i)];
      if (tab) tab.classList.toggle("is-hot", on);
    };

    tlLanes.forEach(function (lane) {
      Array.prototype.forEach.call(lane.children, function (span, i) {
        if (finePointer) {
          span.addEventListener("pointerenter", function () { setHot(i, true); });
          span.addEventListener("pointerleave", function () { setHot(i, false); });
        }
        span.addEventListener("click", function () {
          selectXp(tabForLane(i));
          var tabs = document.querySelector(".xp-tabs");
          if (tabs) tabs.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
        });
      });
    });

    if (finePointer) {
      xpTabs.forEach(function (tab, j) {
        var laneIdx = j;
        tab.addEventListener("pointerenter", function () { setHot(laneIdx, true); });
        tab.addEventListener("pointerleave", function () { setHot(laneIdx, false); });
      });
    }
  }

  /* ---------- skills disclosure ---------- */
  var skillsTable = document.querySelector(".skills-table");
  var skillsMore = document.querySelector(".skills-more");
  if (skillsTable && skillsMore) {
    skillsTable.classList.add("is-collapsed");
    skillsMore.hidden = false;
    skillsMore.addEventListener("click", function () {
      var collapsed = skillsTable.classList.toggle("is-collapsed");
      skillsMore.setAttribute("aria-expanded", collapsed ? "false" : "true");
      skillsMore.firstChild.textContent = collapsed ? "Show the full stack " : "Show less ";
      skillsMore.querySelector(".skills-more-n").hidden = !collapsed;
      if (!collapsed) {
        var revealed = Array.prototype.slice.call(skillsTable.querySelectorAll(".skills-row")).slice(5);
        revealed.forEach(function (row, i) {
          row.classList.remove("row-in");
          void row.offsetWidth;
          row.style.setProperty("--i", i);
          row.classList.add("row-in");
        });
      }
    });
  }

  /* ---------- selected work filter tabs ---------- */
  var workTabs = Array.prototype.slice.call(document.querySelectorAll(".work-tab"));
  var workRows = Array.prototype.slice.call(document.querySelectorAll("#work .proj-row"));
  function selectWork(tab) {
    var track = tab.getAttribute("data-track");
    workTabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    var shown = 0;
    workRows.forEach(function (row) {
      var show = row.getAttribute("data-track") === track;
      if (show && row.hidden) {
        row.classList.remove("row-in");
        void row.offsetWidth;
        row.style.setProperty("--i", Math.min(shown, 4));
        row.classList.add("row-in");
      }
      if (show) shown++;
      row.hidden = !show;
    });
  }
  workTabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectWork(tab); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = workTabs[(i + 1) % workTabs.length];
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = workTabs[(i - 1 + workTabs.length) % workTabs.length];
      else if (e.key === "Home") next = workTabs[0];
      else if (e.key === "End") next = workTabs[workTabs.length - 1];
      if (next) {
        e.preventDefault();
        next.focus();
        selectWork(next);
      }
    });
  });
  if (workTabs.length) selectWork(workTabs[0]);

  /* ---------- in-copy ledger links: prose that jumps to the proof ---------- */
  var copyLinks = Array.prototype.slice.call(document.querySelectorAll("a.copy-link"));
  copyLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      var hash = link.getAttribute("href");
      if (!hash || hash.charAt(0) !== "#") return;
      var target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      // rows hidden behind the other work tab: switch tabs first
      if (target.classList.contains("proj-row") && target.hidden) {
        var track = target.getAttribute("data-track");
        var tab = workTabs.filter(function (t) {
          return t.getAttribute("data-track") === track;
        })[0];
        if (tab) selectWork(tab);
      }
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      // one-beat highlighter pass so the eye lands on the right row
      if (target.classList.contains("proj-row")) {
        target.classList.remove("is-flashed");
        void target.offsetWidth;
        target.classList.add("is-flashed");
        target.addEventListener("animationend", function onFlashEnd(ev) {
          if (ev.animationName !== "row-flash") return;
          target.classList.remove("is-flashed");
          target.removeEventListener("animationend", onFlashEnd);
        });
      }
    });
  });

  /* ---------- magnetic buttons (fine pointers) ---------- */
  if (finePointer && !reduceMotion) {
    var magnets = Array.prototype.slice.call(document.querySelectorAll(".btn"));
    magnets.forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var rect = btn.getBoundingClientRect();
        var relX = (e.clientX - rect.left) / rect.width - 0.5;
        var relY = (e.clientY - rect.top) / rect.height - 0.5;
        btn.style.setProperty("--mx", (relX * 6).toFixed(1) + "px");
        btn.style.setProperty("--my", (relY * 4).toFixed(1) + "px");
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.setProperty("--mx", "0px");
        btn.style.setProperty("--my", "0px");
      });
    });
  }

  /* ---------- command palette (⌘K / Ctrl+K) ---------- */
  var cmdk = document.getElementById("cmdk");
  var cmdkHint = document.querySelector(".cmdk-hint");

  if (cmdk) {
    var cmdkInput = cmdk.querySelector(".cmdk-input");
    var cmdkItems = Array.prototype.slice.call(cmdk.querySelectorAll(".cmdk-list li"));
    var cmdkPrevFocus = null;
    var activeIdx = 0;

    var visibleItems = function () {
      return cmdkItems.filter(function (li) { return !li.hidden; });
    };

    var setActive = function (li) {
      cmdkItems.forEach(function (el) { el.classList.toggle("is-active", el === li); });
      if (li) li.scrollIntoView({ block: "nearest" });
    };

    var openCmdk = function () {
      cmdkPrevFocus = document.activeElement;
      cmdk.hidden = false;
      cmdkInput.value = "";
      cmdkItems.forEach(function (li) { li.hidden = false; });
      setActive(cmdkItems[0]);
      cmdkInput.focus();
      document.documentElement.style.overflow = "hidden";
    };

    var closeCmdk = function () {
      cmdk.hidden = true;
      document.documentElement.style.overflow = "";
      if (cmdkPrevFocus && cmdkPrevFocus.focus) cmdkPrevFocus.focus();
    };

    var runCmd = function (li) {
      if (!li) return;
      var action = li.getAttribute("data-action");
      closeCmdk();
      if (action === "goto") {
        var target = document.querySelector(li.getAttribute("data-target"));
        if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      } else if (action === "cv") {
        var a = document.createElement("a");
        a.href = "assets/Koti_Madduluri_Senior_Android_Engineer_CV.pdf";
        a.download = "";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else if (action === "cvpage") {
        window.location.href = "cv/";
      } else if (action === "email") {
        if (navigator.clipboard) navigator.clipboard.writeText("kotimn@gmail.com").catch(function () {});
      } else if (action === "linkedin") {
        window.open("https://linkedin.com/in/koti-madduluri", "_blank", "noopener");
      } else if (action === "github") {
        window.open("https://github.com/kotimadduluri", "_blank", "noopener");
      } else if (action === "theme" && themeToggle) {
        themeToggle.click();
      }
    };

    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        cmdk.hidden ? openCmdk() : closeCmdk();
        return;
      }
      if (cmdk.hidden) return;
      var vis = visibleItems();
      var idx = vis.indexOf(cmdk.querySelector(".cmdk-list li.is-active"));
      if (e.key === "Escape") { e.preventDefault(); closeCmdk(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setActive(vis[Math.min(idx + 1, vis.length - 1)]); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(vis[Math.max(idx - 1, 0)]); }
      else if (e.key === "Enter") { e.preventDefault(); runCmd(vis[idx]); }
    });

    cmdkInput.addEventListener("input", function () {
      var q = cmdkInput.value.trim().toLowerCase();
      cmdkItems.forEach(function (li) {
        li.hidden = q !== "" && li.textContent.toLowerCase().indexOf(q) === -1;
      });
      setActive(visibleItems()[0] || null);
    });

    cmdk.addEventListener("click", function (e) {
      if (e.target.closest("[data-cmdk-close]")) { closeCmdk(); return; }
      var li = e.target.closest(".cmdk-list li");
      if (li) runCmd(li);
    });

    if (finePointer) {
      cmdk.addEventListener("pointermove", function (e) {
        var li = e.target.closest(".cmdk-list li");
        if (li && !li.classList.contains("is-active")) setActive(li);
      });
    }

    if (cmdkHint) cmdkHint.addEventListener("click", openCmdk);
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
