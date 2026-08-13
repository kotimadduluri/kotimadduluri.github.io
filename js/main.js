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

  function applyTheme(theme) {
    html.setAttribute("data-theme", theme);
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

  // Follow the system preference live, unless the user chose manually.
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
    var stored = null;
    try { stored = localStorage.getItem("theme"); } catch (err) {}
    if (!stored) applyTheme(e.matches ? "dark" : "light");
  });

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
      var body = message + "\n\n— " + name;
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

  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var masthead = canvas.parentElement;
    var dots = [];
    var mouse = { x: -9999, y: -9999 };
    var running = false;
    var rafId = null;
    var SPACING = 26;
    var RADIUS = 130;

    function buildGrid() {
      var rect = masthead.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (var y = SPACING; y < rect.height; y += SPACING) {
        for (var x = SPACING; x < rect.width; x += SPACING) {
          dots.push({ x: x, y: y });
        }
      }
    }

    function greenColor(alpha) {
      var g = getComputedStyle(document.documentElement).getPropertyValue("--green").trim();
      return g ? g : "#3ddc84";
    }

    function draw() {
      var w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      var base = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#96988c";
      var green = greenColor();
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var dx = d.x - mouse.x;
        var dy = d.y - mouse.y;
        var dist = Math.hypot(dx, dy);
        var t = Math.max(0, 1 - dist / RADIUS);
        var push = t * t * 10;
        var px = dist > 0 ? d.x + (dx / dist) * push : d.x;
        var py = dist > 0 ? d.y + (dy / dist) * push : d.y;
        var r = 1 + t * 1.6;
        ctx.globalAlpha = 0.16 + t * 0.7;
        ctx.fillStyle = t > 0.05 ? green : base;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = running ? requestAnimationFrame(draw) : null;
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
    running = true; draw(); stop();

    if (finePointer) {
      masthead.addEventListener("pointermove", function (e) {
        var rect = masthead.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        start();
      });
      masthead.addEventListener("pointerleave", function () {
        mouse.x = -9999; mouse.y = -9999;
        // let the field settle to static, then stop the loop
        setTimeout(function () { running = true; draw(); stop(); }, 60);
      });
    }

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildGrid();
        running = true; draw(); stop();
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

    var printResizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(printResizeTimer);
      printResizeTimer = setTimeout(buildPrint, 150);
    });

    if (finePointer) {
      var mast = nameWrap.closest(".masthead") || nameWrap;
      mast.addEventListener("pointermove", function (e) {
        var rect = nameWrap.getBoundingClientRect();
        nameWrap.style.setProperty("--ux", (e.clientX - rect.left).toFixed(0) + "px");
        nameWrap.style.setProperty("--uy", (e.clientY - rect.top).toFixed(0) + "px");
      });
      mast.addEventListener("pointerleave", function () {
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
    if (!reduceMotion && xpPanels[idx]) {
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
    // lanes run oldest-first, the tab rail newest-first
    var tabForLane = function (i) { return xpTabs.length - 1 - i; };
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
        var laneIdx = xpTabs.length - 1 - j;
        tab.addEventListener("pointerenter", function () { setHot(laneIdx, true); });
        tab.addEventListener("pointerleave", function () { setHot(laneIdx, false); });
      });
    }
  }

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
      } else if (action === "email") {
        if (navigator.clipboard) navigator.clipboard.writeText("kotimn@gmail.com").catch(function () {});
      } else if (action === "linkedin") {
        window.open("https://linkedin.com/in/koti-madduluri", "_blank", "noopener");
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
