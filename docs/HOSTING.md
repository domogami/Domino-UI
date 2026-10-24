# Hosting the component notebook

The recommended destination is a separate Netlify project with a subdomain such as `ui.dominicklee.net`. That name is proposed, not configured. The component notebook and reusable library stay together in this repository; the portfolio remains its own application and deployment.

## Repository and application boundaries

| Purpose | Source | Build output |
| --- | --- | --- |
| Visual component notebook | `src/App.tsx`, `src/catalog/` | `dist/` |
| Reusable React components | `src/lib/` | `lib/` |
| Shared design contract | `tokens/system.json` | Generated tokens and native adapters |

The public showcase demonstrates the same components and tokens shipped by the library. Keeping it alongside them helps changes remain reviewable in one place. The main portfolio, Quartz garden, and Obsidian theme can adopt versioned outputs independently. A subdomain can point at a separate deployment; it does not require putting the showcase in the portfolio repository.

If this grows into several applications, `packages/ui` and `apps/docs` in a workspace would make the existing boundary explicit. That migration is not needed to host the current application.

## Deploy to Netlify

The root `netlify.toml` prepares these settings:

- Build command: `npm run build` (its prebuild generates shared tokens).
- Publish directory: `dist`.
- Node version: `24`, matching the portfolio's Netlify configuration.
- Base directory: repository root.

The showcase is a static Vite build and uses hash routes. It needs no application server, React Router adapter, or SPA rewrite. The library output and native adapter bundles are not published as website source by this deployment. [Netlify Vite setup](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/).

1. Commit and push the reviewed project to its configured repository, `domogami/Domino-UI`, when authorized. At preparation time this checkout has no commits and all project files are untracked.
2. Import that repository as a new Netlify project. Let Netlify install from the lockfile and use the committed build configuration.
3. Verify the assigned `netlify.app` preview, including component styles, fonts, drawing motion, and narrow layouts.
4. In the new project's **Domain management → Add a domain → Add a domain you already own**, add the chosen subdomain. [Domain assignment](https://docs.netlify.com/manage/domains/manage-domains/assign-a-domain-to-your-site-app/).
5. Verify HTTPS and the live component notebook on a phone before treating the deployment as complete.

On October 23, 2026, the portfolio's live response identified Netlify, and public nameservers followed Netlify's `dns1.p02.nsone.net` through `dns4.p02.nsone.net` pattern. This indicates Netlify DNS; account and team ownership have not been inspected. If the domain is managed in the same Netlify team's DNS, Netlify manages the added subdomain automatically. [Netlify nameservers](https://docs.netlify.com/manage/domains/configure-domains/netlify-name-servers/), [subdomain handling](https://docs.netlify.com/manage/domains/configure-domains/delegate-a-standalone-subdomain/).

If the domain instead requires external DNS configuration, first assign the chosen hostname in Netlify, then add a CNAME for that subdomain pointing at the new project's actual assigned `netlify.app` hostname. Use Netlify's displayed values. The portfolio's apex and `www` records stay as configured. [External DNS for a subdomain](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/#configure-a-subdomain).

No site, DNS record, deployment, commit, or push was created during this preparation. The configuration becomes active only when this repository is connected to a Netlify project and deployed.

## Verification and updates

Run `npm run check`, `npm test`, and `npm run test:production` before publishing a release. The production suite builds the shipped website and checks real rendered styles and motion in mobile Chrome and WebKit. A successful build alone does not establish that the live deployment is current; verify the deployed assets and URL after Netlify finishes.

The application can keep continuous deployment enabled in its own Netlify project. Changes to the library and examples then ship together without requiring a portfolio deployment.

The React package is private and local today. Future portfolio CI adoption should consume a versioned built package, tarball, or private registry release. The documented absolute local install path only serves local development; a naive Git dependency does not include the ignored build outputs. `npm pack` runs the existing `prepack` library build and can prepare a versioned artifact when packaging is requested.

## Local previews

`npm run dev` serves the live source on `127.0.0.1:5173`. `npm run preview -- --host <current-private-LAN-IP> --port 4173 --strictPort` serves the built `dist/` directory to the home network. Rebuild before sharing changed source through the latter.

Both previews depend on this Mac and its running server process. LAN addresses can change when switching between Ethernet and Wi-Fi. These previews are temporary development tools; the Netlify deployment supplies a stable HTTPS address independent of this Mac.
