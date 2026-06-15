# assets — drop your Logo A art here

The app is themed to **Logo A** (Jabber Jawbreaker) and already ships a brand SVG icon
(`/favicon.svg`, the red glove). To use the full raster logo, add these files to this
folder and commit them — the app wires them up automatically (no code change needed):

| File | Used for | Recommended |
|------|----------|-------------|
| `logo.png` | the **start-menu hero** (`#hero` in app.mjs) | the full Logo A, transparent PNG, ~720–1080px wide |
| `og.png` | social/link-preview image (`og:image`) | 1200×630 PNG (logo on a navy `#0c1020` field) |
| `icon-512.png` *(optional)* | a PWA/store icon if you add a manifest | 512×512, the **glove cropped** (single focal — per the logo tournament) |

Behavior:
- If `logo.png` is present, it shows as the hero and the text wordmark hides itself.
- If it's absent, the styled **JABBER JAWBREAKER** wordmark shows instead — so the menu
  never looks broken.

Tip: a transparent-background `logo.png` sits best on the dark theme. If your Logo A has a
white background, trim it to transparent first (or export it on `#0c1020`).

#LLM-generated
