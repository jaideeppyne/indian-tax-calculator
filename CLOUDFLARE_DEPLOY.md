# Cloudflare Pages Deployment

This project can be deployed on Cloudflare Pages Free as a static Vite app.

## Dashboard setup

- Framework preset: `React (Vite)`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `indian-tax-calculator` if deploying from the parent workspace
- Deploy command: leave this blank for a normal Cloudflare Pages project.

The repository also includes a `wrangler.jsonc` file with a Workers Static Assets config, so `npx wrangler deploy` can work if the Cloudflare project was created as a Workers project instead of Pages.

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

Use this if you created a Cloudflare Workers project instead of a Cloudflare Pages project. The repository `wrangler.jsonc` points Workers Static Assets at `./dist`, so this command is valid after `npm run build`:

```bash
npx wrangler deploy
```

For the Pages Free static-site setup, prefer the dashboard settings above.
