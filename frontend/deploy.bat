@echo off
wrangler logout
set CLOUDFLARE_ACCOUNT_ID=d2897bdebfa128919bd89b265e6a712e
set CLOUDFLARE_API_TOKEN=Z5Jo1dY_yYcKhXd_QgHj1H0qGgAIhB84W-OOOgHV
npx wrangler pages deploy out --project-name protothrive-frontend --commit-dirty=true
