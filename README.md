# Toly

Public website for Toly, an early-stage technology studio preparing careful digital tools, systems, and experiences.

Live site: https://em-eshy.github.io/toly-website/

## Public Repository Scope

This repository is intentionally limited to the public side of Toly:

- `index.html` - the complete public website
- `README.md` - public documentation for the repository

Private pages, draft product areas, scripts, notes, data files, publishing workflows, strategy documents, and internal planning material should stay outside the public commit history.

## Website Positioning

Toly does not have public products yet. The site should therefore sound calm, serious, and accurate rather than promotional.

The public tone should:

- acknowledge that Toly is still in preparation
- avoid implying that products are already available
- explain restraint as a sign of care
- keep claims specific, modest, and easy to verify
- make future updates feel credible rather than urgent

## Code Structure

The public website is currently a single dependency-free HTML file. CSS is kept inline so GitHub Pages can serve the site directly without a build step.

Recommended structure while the public footprint is small:

```text
.
├── index.html
└── README.md
```

If the website grows, add new public files only when they are meant to be visible on GitHub Pages. Keep internal work in a private repository or a local ignored directory.

## Release Notes

The current version presents Toly as an early-stage studio with:

- a clear first screen
- honest no-product-yet messaging
- operating principles
- a readiness section for future public releases
- accessible navigation and responsive layout

## Publishing

Commit and publish only the public files listed above. Before pushing, verify the tracked file list:

```bash
git ls-files
```

Expected output:

```text
README.md
index.html
```
