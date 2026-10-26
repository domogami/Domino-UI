# Deploying the living notebook

The production target is **`ui.dominicklee.net`**, served by a separate Netlify project for Domino UI in the existing `domogami` team. The component library and visual notebook stay in this repository. The personal website keeps its own application and Netlify project.

This document records the verified deployment and release procedure. A configured domain or a successful local build does not by itself establish a working public deployment; check the published revision, DNS, HTTPS, and actual website on each release.

## Verified release — October 24, 2026

| Item                        | Verified value                                                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Public notebook             | [ui.dominicklee.net](https://ui.dominicklee.net/)                                                                                   |
| Netlify project             | [domino-ui](https://app.netlify.com/projects/domino-ui) in the `domogami` team                                                      |
| Project ID                  | `c5800493-f930-4a0c-ae14-a157a751f953`                                                                                              |
| UI code revision            | [`66dd14289a57d08749368fbbb6614bb2d206ff6a`](https://github.com/domogami/Domino-UI/commit/66dd14289a57d08749368fbbb6614bb2d206ff6a) |
| Published code deploy       | `6add0c758d7fd629a8fb536d`, published 19:52:37 UTC                                                                                  |
| Continuous deployment       | GitHub `domogami/Domino-UI`, production branch `main`; verified by the matching automatically published commit                      |
| DNS                         | Netlify-managed `NETLIFY` and `NETLIFYv6` records for `ui`, pointing to `domino-ui.netlify.app`                                     |
| HTTPS                       | Valid certificate covering the hostname; HTTPS enforcement enabled and HTTP redirects verified                                      |
| Canonical token fingerprint | `397198c3b7bf`                                                                                                                      |

The public JavaScript, CSS, cover, favicon, Caveat font, and notebook sketch were fetched and compared byte-for-byte with the local production build. The portfolio's apex and `www` records still point to its existing `domogami` project.

Validation for this UI code revision: 105 development browser cases, 26 compiled mobile Chrome/WebKit cases, four system tests, and the isolated package consumer checks (types, SSR, nested base path, fonts, licenses, and asset copying). Live public-browser acceptance covers paper layers, native switch targets, and page transitions in both mobile engines. These are browser tests; physical phone haptic output remains device acceptance.

Subsequent documentation-only commits can publish another deploy with the same UI assets. Use Netlify's latest published commit when checking the current head; this table identifies the tested UI code release.

## Netlify branding

The **Powered by Netlify badge** is disabled for the Domino UI project. Netlify injects it at the edge when enabled, so control it through **Project configuration → General → Powered by Netlify badge → Off → Save**. The project setting takes effect on the next request and persists across deployments. It requires no plan upgrade or site redeploy. [Netlify’s badge documentation](https://docs.netlify.com/manage/projects/powered-by-netlify-badge/).

## One source, independent applications

| Responsibility                | Source or output                                                | Deployment owner                              |
| ----------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| React components and behavior | `src/lib/` → `lib/`                                             | Versioned dependency adopted by each consumer |
| Canonical design values       | `tokens/system.json` → generated CSS, JSON, and native adapters | Shared build in this repository               |
| Visual component notebook     | `src/App.tsx`, `src/catalog/`, guide pages → `dist/`            | Dedicated Domino UI Netlify project           |
| Personal website              | Its existing repository and application                         | Existing portfolio Netlify project            |
| Quartz and Obsidian           | Their native applications with reviewed adapters                | Their own publishing and installation flows   |

The subdomain supplies a stable address for the component examples without moving the notebook into the portfolio codebase. It also keeps the notebook's build, previews, releases, and rollbacks independent of the main website. The examples still use the actual shared components and generated tokens, so there is one design authority rather than a second visual implementation.

The current repository already separates the reusable library from the Vite application. A future workspace with `packages/ui` and `apps/docs` could make that arrangement explicit; it is not required to host this application. See [shared system ownership](SHARED-SYSTEM.md) and [consumer adoption](ADOPTION.md).

## Netlify build contract

The checked-in [`netlify.toml`](../netlify.toml) defines:

| Setting                    | Value                |
| -------------------------- | -------------------- |
| Repository                 | `domogami/Domino-UI` |
| Intended production branch | `main`               |
| Base directory             | Repository root      |
| Node version               | `24`                 |
| Build command              | `npm run build`      |
| Publish directory          | `dist`               |

The build's `prebuild` step regenerates the shared system. TypeScript checking and Vite then produce the static notebook. The `lib/` package build and generated `platforms/` adapters serve consumers; publishing the notebook does not publish those folders as an npm package or install them into another project. These build and publish values match [Netlify's Vite integration](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/).

For a fresh local release check:

```sh
npm ci
npm run check
npm run test:system
npm test
npm run test:production
npm run test:package
```

Use `npm run build` to produce `dist/` for inspection or an explicitly selected manual upload. A local test result should be recorded with the source revision; it does not prove that Netlify serves that revision.

The intended steady-state release is a reviewed commit on `main`, followed by a successful Netlify build and publication. Confirm the linked repository, production branch, and automatic publishing in the Domino UI project. An initial manual deployment is compatible with this architecture, but does not establish continuous deployment by itself.

## Domain and routing

Assign **only `ui.dominicklee.net`** to the dedicated Domino UI project. The existing apex domain is managed through the team's Netlify DNS zone. Netlify can manage a subdomain automatically when its parent domain already uses Netlify DNS; a second registrar delegation is unnecessary in that arrangement. Follow the project's displayed domain setup rather than inventing record values. [Domain assignment](https://docs.netlify.com/manage/domains/manage-domains/assign-a-domain-to-your-site-app/), [Netlify subdomain handling](https://docs.netlify.com/manage/domains/configure-domains/delegate-a-standalone-subdomain/).

Domain assignment can create Netlify-managed records for the hostname. Verify the resulting `ui` mapping in the existing zone and the project's HTTPS status. Keep the portfolio's apex, `www`, and unrelated records associated with their existing destinations. [Netlify DNS record management](https://docs.netlify.com/manage/domains/manage-domains/manage-dns-records/).

The notebook uses hash routes such as `/#layers`, `/#sketchbook`, and `/#component/popover`. The browser receives the root document and resolves the fragment locally; the fragment is not a server path. These routes therefore do not need a catch-all SPA rewrite. A shared link or a refresh at a hash route should load the same notebook entry. Moving to path-based routes later would require a separate hosting/routing review.

## Verify the published release

Inspect the dedicated project's deploy result and unique deploy URL first, then the custom HTTPS hostname. Check that the served document references the expected build assets and that those assets, fonts, and reusable sketch files resolve. Verify the three themes, a component detail link, the sketchbook, layers, and route navigation in the deployed application. Exercise keyboard interaction, narrow layout, and reduced motion where those behaviors changed.

Record the source commit, published deploy permalink, canonical token fingerprint, verification time, and any remaining device-specific acceptance. Public DNS resolution and a valid TLS connection are separate checks from a successful Netlify build. A browser-emulated WebKit test is also separate from trying the live site on an actual phone.

| Address type                               | What it proves                                                | Dependency                                               |
| ------------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- |
| `127.0.0.1:5173`                           | Local development source is running                           | This computer and its Vite process                       |
| Current private LAN address on port `4173` | A built preview is reachable from the home network            | This computer, the preview process, and the same network |
| Unique Netlify deploy URL                  | One uploaded or built deploy is available                     | That specific Netlify deploy                             |
| Custom HTTPS hostname                      | The configured production address serves the published deploy | Public DNS, TLS, domain assignment, and publication      |

A public Netlify deployment remains available independently of this Mac's development processes and home Wi-Fi address. A LAN link is a temporary development convenience, not a public deployment address.

## Roll back website content

Use the Domino UI project's deploy history to select a previously successful deploy and **Publish Deploy**. This republishes the previous atomic artifact without rebuilding it. Normal content rollback does not require changing DNS or redeploying the personal website. [Netlify rollback documentation](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/#rollbacks).

If automatic publishing is enabled, a later production build can replace the rollback. Lock publishing temporarily when the rollback must remain in place, then fix or revert the source through the repository's normal release process and unlock when the replacement is verified. Keep the previous deploy available until the replacement is accepted.

## Library updates are a separate release decision

Publishing a new visual notebook does not change dependencies already installed in another application. Consumers should install a reviewed full Git commit SHA, keep their dependency lockfile, verify their own build and runtime, and record the adopted token fingerprint. A production site should not silently track a moving `main` dependency.

```sh
# In a consuming project; replace the placeholder with a reviewed full SHA.
npm install 'git+https://github.com/domogami/Domino-UI.git#<FULL_COMMIT_SHA>'
```

Git installation runs the library's `prepare` build. Quartz and Obsidian adopt the native outputs deliberately rather than loading the documentation website as their theme. Roll back a consumer by restoring its previously reviewed package or adapter revision; rolling back the notebook alone does not roll back a consumer. See [the adoption guide](ADOPTION.md), [Quartz](QUARTZ.md), and [Obsidian](OBSIDIAN.md).
