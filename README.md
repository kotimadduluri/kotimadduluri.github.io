# Koti Madduluri — Portfolio

Interactive engineering portfolio for **Koti Madduluri** — "I build software that moves money" (Android, payments, EPOS, backend, cross-platform).

Live at: **https://kotimadduluri.github.io**

## Stack

Plain HTML, CSS, and vanilla JavaScript — no framework, no build step. `index.html` lives at the repo root, which is the simplest layout for GitHub Pages: the Actions workflow uploads the whole repo as the Pages artifact, so what you see locally is exactly what deploys.

Design: precision-minimal dark-first system — cool neutral base, single money-green accent, Geist + Geist Mono type, inline SVG icon sprite (no icon fonts). Storytelling through system diagrams instead of CV lists: an animated transaction path in the hero (terminal → app → SDK → backend → customer), flow-diagram case studies, expandable "Systems I've built" architecture cards, and an interactive career timeline.

- Light/dark mode: auto-detects system preference, manual toggle persists in `localStorage`
- Responsive (mobile / tablet / desktop), semantic HTML, keyboard-navigable, ⌘K command palette
- Transaction-path animation, scroll reveals and stat count-ups that respect `prefers-reduced-motion`
- SEO: meta description, Open Graph/Twitter tags, JSON-LD, canonical URL, SVG favicon

## Structure

```
index.html                  # single-page site (includes inline SVG icon sprite)
css/style.css               # all styles (theme via [data-theme] on <html>)
js/main.js                  # theme, nav, reveals, transaction animation, accordions, timeline, cmdk, mailto form
assets/                     # favicon + CV PDF (Koti_Madduluri_Senior_Android_Engineer_CV.pdf)
.github/workflows/deploy.yml# deploys to GitHub Pages on push to main
```

## Run locally

No build step — open `index.html` directly, or serve it (nicer for testing):

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deployment

Every push to `main` triggers `.github/workflows/deploy.yml`, which uploads the repo as a Pages artifact and deploys it via `actions/deploy-pages`. No branch gymnastics, no `gh-pages` branch.

One-time setup after creating the repo:

1. **GitHub UI:** repo → Settings → Pages → *Build and deployment* → Source: **GitHub Actions**
2. **Or gh CLI:**
   ```sh
   gh api -X POST repos/kotimadduluri/kotimadduluri.github.io/pages \
     -f build_type=workflow
   ```

## Updating the CV

Replace `assets/Koti_Madduluri_Senior_Android_Engineer_CV.pdf` (exact name — the Download CV button links to it), commit, and push.

## Custom domain (optional — not required)

If you later buy a domain:

1. Create a `CNAME` file at the repo root containing just the domain, e.g. `www.example.com`
2. At your DNS provider, add a `CNAME` record pointing `www` → `kotimadduluri.github.io`
   (for an apex domain, add `A` records to GitHub Pages IPs: 185.199.108.153, .109.153, .110.153, .111.153)
3. Repo → Settings → Pages → Custom domain → enter the domain, enable **Enforce HTTPS**
4. Update the `og:url` / canonical URLs in `index.html` to the new domain
