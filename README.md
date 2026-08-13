# Koti Madduluri — Portfolio

Personal portfolio site for **Koti Madduluri** — Senior Android Engineer (Kotlin, Jetpack Compose, KMP/CMP · Fintech, Payments & EPOS).

Live at: **https://kotimadduluri.github.io** · Live CV at **https://kotimadduluri.github.io/cv/**

## Stack

Plain HTML, CSS, and vanilla JavaScript — no framework, no build step. `index.html` lives at the repo root; the Actions workflow uploads the whole repo as the Pages artifact, so what you see locally is exactly what deploys.

Design: "Ledger After Dark" — a dark-first, hairline-ruled ledger system. Warm green-black base (`#101210`), a single Android-green accent (`#3ddc84`), Zodiak serif display over General Sans and JetBrains Mono, sharp corners throughout. The light theme is the same ledger on paper.

## Details

- Cursor-reactive dot-matrix hero with the skill set typeset as banknote-style security microprint behind the name (the cursor works like a UV lamp)
- Dual-lane career timeline (companies + domains) that navigates the tabbed experience section; current role marked with a live LED
- Command palette (`⌘K`): jump to sections, download CV, copy email, toggle theme
- Contact form prints a till receipt on submit ("STATUS: APPROVED")
- Light/dark theme with a View Transitions circle wipe, persisted in `localStorage`
- All animation respects `prefers-reduced-motion`; semantic HTML, keyboard-navigable tabs and palette
- SEO: OG/Twitter cards with a share image, JSON-LD (Person + WebSite), canonical URL, sitemap and robots.txt

## Structure

```
index.html              single-page site
cv/index.html           live HTML CV (print-friendly)
css/style.css           design tokens + all styles
js/main.js              vanilla JS: theme, tabs, palette, canvas, receipt
assets/                 CV PDF, favicon, OG image
.github/workflows/      GitHub Pages deploy
```

## Content

All career facts, numbers, and skills come from the CV — nothing is invented. Product context for Lopay and Terminal Pay comes from public sources (lopay.com, app store listings, press).
