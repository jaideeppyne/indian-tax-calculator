# Cloudflare Pages Deployment

This project can be deployed on Cloudflare Pages Free as a static Vite app.

## Dashboard setup

- Framework preset: `React (Vite)`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `indian-tax-calculator` if deploying from the parent workspace

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
