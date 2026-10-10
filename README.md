# Kurt McAuliffe: GIS Portfolio

A static one-page portfolio for GIS Technician roles. It also covers GIS Analyst and GIS teaching roles. It has no build step and no dependencies.

```
index.html                          page content
css/styles.css                      styles (light + dark, responsive)
js/main.js                          contour background, card thumbnails, nav, scroll reveal
assets/Kurt_McAuliffe_GIS_Resume.pdf  résumé served by the "Download résumé" button
assets/projects/                    put real project map images here
```

## Preview locally
Open `index.html` in a browser, or run `python3 -m http.server` and visit http://localhost:8000.

## Before sharing: add real projects
The **Selected work** cards in `index.html` currently describe coursework areas and use generated map
graphics. Replace them with 2–4 real projects (see the `TODO (Kurt)` comment). For each project:
1. Save a map image to `assets/projects/` and swap the card's `<div class="card__map …">` for an `<img>`.
2. Write one line each for the problem, the method and the result.
3. Link a StoryMap, web map, GitHub repo or PDF poster.

## Publish free on GitHub Pages
1. Push this repo to GitHub.
2. Go to Settings → Pages → Deploy from branch → `main` / root.
3. The site will be at `https://<username>.github.io/<repo>/`. Put that link on the résumé and LinkedIn.
