# CosmicTouch

Explore space through sight, sound and discovery. Poke the planets, hear them read aloud, compare two worlds, take the quiz.

Made by **team Ruby** for our science fair.

## What's inside

- **Explore**: a bubble field of planets you can poke, pop (they grow back) and drop with a gravity switch, a tappable grid of all eight planets, and an orrery of the whole family with a speed control.
- **Planet pages**: facts, diameter, year, distance and temperature with comparison bars, a "how old would you be here?" slider, read aloud, favorites, and arrow keys to flip between planets.
- **Compare**: pick any two planets, see them side by side to scale, and compare every number.
- **Quiz**: ten questions, a streak counter, and a jar that fills with bubbles as you get answers right.
- **Favorites**: saved on your device.
- **Accessibility**: larger text, high contrast, night mode, calm motion (stops all movement), sound effects on or off. Your choices are remembered.

## Run it

It's a plain static site: no build step, no dependencies.

```
python -m http.server 8000
```

then open <http://localhost:8000>. Opening `index.html` directly in a browser also works.

## Deploy

GitHub Pages serves static files only, which is exactly what this is. Settings, Pages, deploy from the `main` branch, root folder. All paths are relative, so it works under `/Cosmictouch-/`.

## Design

The look follows the Gumdrop design language: cream cards, thick ink outlines, hard offset shadows, one lime action colour, a yellow marker on a headline phrase, glossy bubbles, everything leaning a little off-kilter. Fonts (Bricolage Grotesque and Space Grotesk, both SIL Open Font License) are bundled in `assets/fonts`, so the site works offline.

## Files

| File | What it does |
| --- | --- |
| `index.html` | page skeleton and meta tags |
| `assets/styles.css` | tokens, components, themes, motion rules |
| `assets/data.js` | planet facts and quiz questions |
| `assets/art.js` | planets, sun, logo and icons drawn as inline SVG |
| `assets/fx.js` | sound effects, confetti, bubble physics, toasts |
| `assets/app.js` | routing, views, quiz, settings |
