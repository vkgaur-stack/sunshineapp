#!/bin/bash
# One-command deployment packager for Sunshine Social Foundation.
#
# Builds the frontend and assembles ONE folder — deploy_package/ — that
# contains everything ready to upload: the static site files at the top
# level, plus the api/ folder alongside them. Upload deploy_package/'s
# CONTENTS to your hosting; nothing else needs combining by hand.
#
# USAGE:
#   ./deploy.sh <your-domain> [subfolder]
#
# EXAMPLES:
#   ./deploy.sh sunshinesocial.org
#     -> deploys to your domain root: https://sunshinesocial.org/
#
#   ./deploy.sh sunshinesocial.org New_Portal
#     -> deploys to a subfolder:     https://sunshinesocial.org/New_Portal/

set -e

DOMAIN="$1"
SUBFOLDER="$2"

if [ -z "$DOMAIN" ]; then
  echo "Usage: ./deploy.sh <your-domain> [subfolder]"
  echo "Example: ./deploy.sh sunshinesocial.org New_Portal"
  exit 1
fi

if [ -n "$SUBFOLDER" ]; then
  BASE_PATH="/$SUBFOLDER"
  SITE_URL="https://$DOMAIN/$SUBFOLDER"
else
  BASE_PATH=""
  SITE_URL="https://$DOMAIN"
fi

API_URL="$SITE_URL/api"

echo "Building for: $SITE_URL"
echo "API will be at: $API_URL"
echo ""

cd "$(dirname "$0")/frontend"
npm install --no-audit --no-fund
rm -rf out .next

NEXT_BASE_PATH="$BASE_PATH" NEXT_PUBLIC_API_BASE_URL="$API_URL" npm run build

cd ..
rm -rf deploy_package
mkdir deploy_package

# Frontend static files go at the top level of deploy_package/
cp -r frontend/out/. deploy_package/

# The whole api/ folder goes alongside them
cp -r api deploy_package/api

# .env is never committed/built — remind the user to create it on the server
rm -f deploy_package/api/.env

echo ""
echo "============================================================"
echo "  Done. deploy_package/ is ready to upload."
echo "============================================================"
echo ""
echo "Next steps:"
echo "  1. Upload the CONTENTS of deploy_package/ to your hosting"
echo "     (e.g. public_html/$SUBFOLDER/ or public_html/ for domain root)"
echo "  2. On the server, inside the api/ folder: copy .env.example to"
echo "     .env and fill in your real database/Razorpay credentials"
echo "  3. Import api/schema.sql via phpMyAdmin"
echo "  4. Run api/scripts/seed.php once (see DEPLOYMENT.md Section 3.3)"
echo "  5. Visit $SITE_URL"
echo ""
echo "Full details: DEPLOYMENT.md"
