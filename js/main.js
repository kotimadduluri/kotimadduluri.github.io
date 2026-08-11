// Koti Madduluri — portfolio. Vanilla JS, no dependencies.
(function () {
  "use strict";

  var html = document.documentElement;
  html.classList.remove("no-js");

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
      applyTheme(next);
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
  var stats = Array.prototype.slice.call(document.querySelectorAll(".stat-num[data-count]"));

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

  /* ---------- contact form → mailto ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name ? form.elements.name.value.trim() : "";
      var subject = form.elements.subject ? form.elements.subject.value.trim() : "";
      var message = form.elements.message ? form.elements.message.value.trim() : "";
      var body = message + "\n\n— " + name;
      window.location.href =
        "mailto:kotimn@gmail.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------- premium micro-interactions (fine pointers only) ---------- */
  var finePointer = matchMedia("(pointer: fine)").matches;

  if (finePointer && !reduceMotion) {
    // cursor-tracked spotlight on cards
    var spotCards = Array.prototype.slice.call(document.querySelectorAll(
      ".skill-card, .project-card, .t-card, .stats li, .contact-links .glass"
    ));
    spotCards.forEach(function (card) {
      card.classList.add("spotlight-target");
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - rect.left) + "px");
        card.style.setProperty("--my", (e.clientY - rect.top) + "px");
      });
      card.addEventListener("pointerenter", function () { card.classList.add("is-spot"); });
      card.addEventListener("pointerleave", function () { card.classList.remove("is-spot"); });
    });

    // subtle 3D tilt on the hero code card
    var heroVisual = document.querySelector(".hero-visual");
    var codeCard = document.querySelector(".code-card");
    if (heroVisual && codeCard) {
      var MAX_TILT = 5; // degrees
      heroVisual.addEventListener("pointermove", function (e) {
        var rect = heroVisual.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        codeCard.style.setProperty("--ry", (px * MAX_TILT * 2).toFixed(2) + "deg");
        codeCard.style.setProperty("--rx", (-py * MAX_TILT * 2).toFixed(2) + "deg");
      });
      heroVisual.addEventListener("pointerleave", function () {
        codeCard.style.setProperty("--rx", "0deg");
        codeCard.style.setProperty("--ry", "0deg");
      });
    }
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
