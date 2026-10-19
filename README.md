# CodeLap Hackathon 2026 — site

Static site (no build step), in two languages:

- `ro/index.html` — Romanian, served at `/ro`
- `eng/index.html` — English, served at `/eng`
- `index.html` — redirects `/` to `/ro` for Romanian browsers, `/eng` for everyone else
- `styles.css`, `main.js`, `assets/` — shared by both pages

When you change content, edit **both** `ro/index.html` and `eng/index.html`.

Run locally:

```sh
python3 -m http.server 8000   # then open http://localhost:8000/ro/
```

Deploy:

```sh
firebase deploy --only hosting
```

## Dates

Countdown and registration phases are at the top of `main.js`
(`EVENT_START`, `EVENT_END`, `PROMO_START`, `REG_OPEN`, `REG_CLOSE`, `TEAMS_OUT`),
all in Cluj-Napoca local time. Countdown/phase texts for both languages are in the `T` object there.

## Caching

Browsers re-check every file with the server on each visit (`no-cache`), so a deploy is picked up
immediately; images are kept for a day. If you replace an image, give it a new file name.
The `?v=4` on the CSS/JS links is a cache-buster; bump it if you ever raise the cache times again.
