# CodeLap Hackathon 2026 — site

Static site (no build step).

| URL | File | What it is |
| --- | --- | --- |
| `/` | `index.html` | Teaser: countdown to the reveal, then the covered car glitches into the real one |
| `/supersecret` | `supersecret/index.html` | Sends Romanian browsers to `/supersecret/ro`, everyone else to `/supersecret/eng` |
| `/supersecret/ro` | `supersecret/ro/index.html` | Full website, Romanian |
| `/supersecret/eng` | `supersecret/eng/index.html` | Full website, English |
| `/supersecret/reveal` | `supersecret/reveal/index.html` | Teaser demo: 10-second countdown, then the reveal |

Shared files: `styles.css`, `main.js` (website), `teaser/teaser.css`, `teaser/teaser.js` (teaser + demo), `assets/`.
All pages link to them with absolute paths (`/styles.css`), so serve the folder from its root.

- When you change website content, edit **both** `supersecret/ro/index.html` and `supersecret/eng/index.html`.
- `supersecret/reveal/index.html` is a copy of `index.html` with `data-demo="10"` on `<body>`;
  if you change the teaser markup, change both.
- The `/supersecret` pages are hidden only by their address (and marked `noindex`). Anyone with the link can open them.

Run locally:

```sh
python3 -m http.server 8000   # then open http://localhost:8000/
```

Deploy:

```sh
firebase deploy --only hosting
```

## Dates

- Teaser reveal: `REVEAL_AT` at the top of `teaser/teaser.js` (26 Oct 2026, 20:00 Romania time).
- Website countdown and registration phases: top of `main.js`
  (`EVENT_START`, `EVENT_END`, `PROMO_START`, `REG_OPEN`, `REG_CLOSE`, `TEAMS_OUT`), Cluj-Napoca local time.

## Caching

Browsers re-check every file with the server on each visit (`no-cache`), so a deploy is picked up
immediately; images are kept for a day. If you replace an image, give it a new file name.
The `?v=5` on the CSS/JS links is a cache-buster; bump it when you change those files.
