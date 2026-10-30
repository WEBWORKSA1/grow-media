# Grow.Media

Free growth tools, in-depth playbooks and community programs for creators and small businesses. Static site, hosted on GitHub Pages.

- **24** original guides (~30k words) · **14** free calculators · curated video academy · 70-term glossary
- Lead engine: 6-step Free Growth Plan wizard plus site-wide capture
- Monetization: Google AdSense (Auto Ads), sponsorships, support contributions, contests, talent network
- Full legal set: privacy (AdSense disclosures), cookies, terms, disclaimer, trademark & copyright, editorial, accessibility

## Structure
```
index.html, *.html        top-level pages (generated)
guides/, tools/           generated guide and tool pages
assets/css|js|img         design system, interactions, tools, images
content/guides/*.md       guide sources (Markdown + front matter)
content/glossary.yaml     glossary source
scripts/                  build system (Python 3: pip install markdown pyyaml)
PROMPT.md                 phase-wise master build prompt
```

## Rebuild after editing content
```bash
pip install markdown pyyaml
cd scripts && python3 build.py
```
Commit the regenerated HTML. GitHub Pages serves the `main` branch root as-is (`.nojekyll` included).

## Configuration
- **Payment buttons:** add URLs in `assets/js/config.js` (hidden until set).
- **Forms:** all forms post to a private inbox through FormSubmit. Activate it once by submitting any form and clicking the confirmation link FormSubmit emails.
- **Custom domain:** Settings → Pages → Custom domain `grow.media`; point DNS A records to GitHub Pages IPs. Canonicals and the sitemap already use `https://grow.media/`.

## Trademark notice
Grow.Media is an independent publication and is not affiliated with any company or product named "Grow", "Grow Media" or "GrowMedia". See `trademark.html`.

© Grow.Media. All rights reserved.
