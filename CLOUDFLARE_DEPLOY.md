# Cloudflare Pages Deployment

This project can be deployed on Cloudflare Pages Free as a static Vite app.

## Dashboard setup

- Framework preset: `React (Vite)`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `indian-tax-calculator` if deploying from the parent workspace
- Deploy command: leave this blank for a normal Cloudflare Pages project.

Do not set the deploy command to `npx wrangler deploy` for Pages. That command is for Cloudflare Workers and will fail with `Missing entry-point to Worker script or to assets directory` for this static Vite app.

If your Cloudflare screen requires a deploy command, use:

```bash
npx wrangler pages deploy dist --project-name=indian-tax-calculator
```

## Direct upload with Wrangler

```bash
npm run deploy:cloudflare
```

Wrangler will ask you to log in if you are not already authenticated. In CI, set:

```bash
CLOUDFLARE_ACCOUNT_ID=<account-id>
CLOUDFLARE_API_TOKEN=<pages-edit-token>
```

Then run:

```bash
npm run build
npx wrangler pages deploy dist --project-name=indian-tax-calculator
```

## Workers Static Assets alternative

Only use this if you intentionally created a Cloudflare Workers project instead of a Cloudflare Pages project. In that case, replace the deploy command with:

```bash
npx wrangler deploy --assets=./dist
```

For the Pages Free static-site setup, prefer the dashboard settings above.
