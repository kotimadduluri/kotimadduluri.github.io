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
    });
  }

  /* ---------- selected work filter tabs ---------- */
  var workTabs = Array.prototype.slice.call(document.querySelectorAll(".work-tab"));
  var workRows = Array.prototype.slice.call(document.querySelectorAll("#work .proj-band"));
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
      if (target.classList.contains("proj-band") && target.hidden) {
        var track = target.getAttribute("data-track");
        var tab = workTabs.filter(function (t) {
          return t.getAttribute("data-track") === track;
        })[0];
        if (tab) selectWork(tab);
      }
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      // one-beat highlighter pass so the eye lands on the right row
      if (target.classList.contains("proj-band")) {
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
