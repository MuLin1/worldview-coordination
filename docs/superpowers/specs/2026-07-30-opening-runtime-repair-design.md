# Opening Runtime Repair Design

## Goal

Restore the opening page so Vue mounts inside the Tavern regex iframe, the custom-race modal stays closed until clicked, and all startup assets resolve from the current `main` branch.

## Root causes

1. `regex-开局.json` fetches and writes remote HTML without a CDN `<base>`, so relative ES modules cannot resolve.
2. `build.html` uses `window.location.href` as a relative-URL base even when embedded in an `about:srcdoc` document.
3. `build.html` retains direct references to the removed `vielsaenSpecies` global.
4. `bg.png` is referenced but absent.
5. `start_equipment_shop.json` lives at the repository root while the page first requests it from `dist/V20260728`.
6. jsDelivr caches the `@main` branch alias independently of query parameters, so `?t=...` can still return an older commit.

## Design

- Resolve the current `main` SHA through the GitHub commits API on every load, then build an immutable jsDelivr URL from that returned SHA.
- Inject one `<base>` pointing to that resolved commit's `dist/V20260728/` directory before the fetched page is written.
- Use `document.baseURI` for URL resolution inside `build.html`.
- Build the Vielsaen camp-name lookup from the already imported `NORMAL_SPECIES` and `MYTHIC_SPECIES` dictionaries; do not restore the retired global.
- Point the background at an existing repository asset or remove the missing reference if no suitable asset exists.
- Request the equipment JSON from the repository root using `../../start_equipment_shop.json`, retaining the upstream fallback.

## Verification

- Static regression tests assert the loader dynamically resolves `main`, no unsafe `window.location.href` URL base remains, no direct `vielsaenSpecies` reference remains, and local assets exist at their resolved paths.
- A headless-browser test loads the same fetch-and-`document.write` path used by the regex and asserts Vue mounted, raw template bindings disappeared, and the custom-race modal is absent.
- Existing repository tests continue to pass.
