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
  var finePointer = matchMedia("(pointer: fine)").matches;

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

  applyTheme(html.getAttribute("data-theme") || "dark");

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

  /* ---------- reveal-on-scroll ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

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

  /* ---------- footprint count-up ---------- */
  var stats = Array.prototype.slice.call(document.querySelectorAll(".fp-num[data-count]"));

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

  /* ---------- hero: transaction path animation ---------- */
  // A pulse travels terminal → app → SDK → backend → customer, narrating
  // each hop in the status line. Loops while visible; replay on demand.
  var txn = document.querySelector(".txn");

  if (txn) {
    var txnNodes = Array.prototype.slice.call(txn.querySelectorAll(".txn-node"));
    var txnSpark = txn.querySelector(".txn-spark");
    var txnStatus = txn.querySelector(".txn-status");
    var txnReplay = txn.querySelector(".txn-replay");
    var txnPath = txn.querySelector(".txn-path");
    var txnTimers = [];
    var txnVisible = true;
    var txnRunning = false;

    var clearTxnTimers = function () {
      txnTimers.forEach(clearTimeout);
      txnTimers = [];
    };

    var sparkTopFor = function (node) {
      // center the 7px spark on the node's 8px dot (dot top sits 16px into the node)
      return node.offsetTop + txnPath.offsetTop + 16.5 + "px";
    };

    var setStep = function (i) {
      txnNodes.forEach(function (node, j) {
        node.classList.toggle("is-done", j < i);
        node.classList.toggle("is-active", j === i);
      });
      if (txnSpark) {
        txnSpark.style.top = sparkTopFor(txnNodes[i]);
        txnSpark.classList.add("is-on");
      }
      if (txnStatus) txnStatus.textContent = txnNodes[i].getAttribute("data-status") || "";
    };

    var finishTxn = function () {
      txnNodes.forEach(function (node) {
        node.classList.add("is-done");
        node.classList.remove("is-active");
      });
      if (txnSpark) txnSpark.classList.remove("is-on");
    };

    var runTxn = function () {
      if (txnRunning) return;
      txnRunning = true;
      clearTxnTimers();
      var stepMs = 950;
      txnNodes.forEach(function (node, i) {
        txnTimers.push(setTimeout(function () { setStep(i); }, i * stepMs));
      });
      txnTimers.push(setTimeout(function () {
        finishTxn();
        txnRunning = false;
        // idle, then loop while still on screen
        txnTimers.push(setTimeout(function () {
          if (txnVisible && !document.hidden) runTxn();
        }, 4200));
      }, txnNodes.length * stepMs + 400));
    };

    if (reduceMotion) {
      // static end-state; CSS already paints all dots as done
      if (txnStatus) txnStatus.textContent = txnNodes[txnNodes.length - 1].getAttribute("data-status") || "";
    } else {
      if (hasIO) {
        var txnObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            txnVisible = entry.isIntersecting;
            if (txnVisible && !txnRunning) runTxn();
            if (!txnVisible) { clearTxnTimers(); txnRunning = false; }
          });
        }, { threshold: 0.3 });
        txnObserver.observe(txn);
      } else {
        runTxn();
      }

      if (txnReplay) {
        txnReplay.addEventListener("click", function () {
          clearTxnTimers();
          txnRunning = false;
          runTxn();
        });
      }
    }
  }

  /* ---------- hero: technology evidence readout ---------- */
  var readout = document.querySelector(".hero-readout");

  if (readout) {
    var defaultReadout = readout.getAttribute("data-default") || "";
    var infoChips = Array.prototype.slice.call(document.querySelectorAll(".txn-chips button[data-info]"));

    var showInfo = function (text) {
      readout.textContent = text;
      readout.classList.add("is-live");
    };
    var resetInfo = function () {
      readout.textContent = defaultReadout;
      readout.classList.remove("is-live");
    };

    infoChips.forEach(function (chip) {
      var info = chip.getAttribute("data-info");
      chip.addEventListener("pointerenter", function () { showInfo(info); });
      chip.addEventListener("pointerleave", resetInfo);
      chip.addEventListener("focus", function () { showInfo(info); });
      chip.addEventListener("blur", resetInfo);
      // touch: tapping toggles the readout
      chip.addEventListener("click", function () { showInfo(info); });
    });
  }

  /* ---------- systems accordions ---------- */
  var sysHeads = Array.prototype.slice.call(document.querySelectorAll(".sys-head"));

  sysHeads.forEach(function (head) {
    head.addEventListener("click", function () {
      var sys = head.closest(".sys");
      var open = sys.classList.toggle("is-open");
      head.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- timeline: hover sync, era readout, click-through ---------- */
  var tlLanes = Array.prototype.slice.call(document.querySelectorAll(".tl-lane"));
  var xpItems = Array.prototype.slice.call(document.querySelectorAll(".xp-ledger .xp"));
  var tlReadout = document.querySelector(".tl-readout");

  // oldest-first, matching the lanes
  var TL_ERAS = [
    "2015 · Mobile and web: travel, realtime chat, payment gateways",
    "2017 · Enterprise and EdTech: Java to Kotlin migrations",
    "2020 · Smart city IoT: on-device ML at Sensen",
    "2021 · US digital banking on Backbase",
    "2023 · Payments and loyalty on live terminal hardware",
    "2026 · EPOS, payments, KMP and full stack at Lopay"
  ];
  var tlDefault = TL_ERAS[TL_ERAS.length - 1];

  if (tlLanes.length === 2) {
    var laneA = tlLanes[0].children, laneB = tlLanes[1].children;
    var setHot = function (i, on) {
      if (laneA[i]) laneA[i].classList.toggle("is-hot", on);
      if (laneB[i]) laneB[i].classList.toggle("is-hot", on);
      if (tlReadout) tlReadout.textContent = on ? (TL_ERAS[i] || tlDefault) : tlDefault;
    };
    // lanes run oldest-first, the ledger newest-first
    var xpForLane = function (i) { return xpItems[xpItems.length - 1 - i]; };

    tlLanes.forEach(function (lane) {
      Array.prototype.forEach.call(lane.children, function (span, i) {
        if (finePointer) {
          span.addEventListener("pointerenter", function () { setHot(i, true); });
          span.addEventListener("pointerleave", function () { setHot(i, false); });
        }
        span.addEventListener("click", function () {
          var xp = xpForLane(i);
          if (!xp) return;
          xp.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
          xp.classList.remove("xp-hit");
          void xp.offsetWidth; // restart the flash animation
          xp.classList.add("xp-hit");
        });
      });
    });

    if (finePointer) {
      xpItems.forEach(function (xp, j) {
        var laneIdx = xpItems.length - 1 - j;
        xp.addEventListener("pointerenter", function () { setHot(laneIdx, true); });
        xp.addEventListener("pointerleave", function () { setHot(laneIdx, false); });
      });
    }
  }

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

  /* ---------- command palette (⌘K / Ctrl+K) ---------- */
  var cmdk = document.getElementById("cmdk");
  var cmdkHint = document.querySelector(".cmdk-hint");

  if (cmdk) {
    var cmdkInput = cmdk.querySelector(".cmdk-input");
    var cmdkItems = Array.prototype.slice.call(cmdk.querySelectorAll(".cmdk-list li"));
    var cmdkPrevFocus = null;

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
