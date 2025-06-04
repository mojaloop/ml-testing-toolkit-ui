#!/bin/sh
# This script is used during the Docker build to substitute environment variables

# Default values if not provided
API_BASE_URL=${API_BASE_URL:-http://localhost:5050}
echo "Applying API_BASE_URL: ${API_BASE_URL}"
AUTH_ENABLED=${AUTH_ENABLED:-FALSE}
PAYER_SIM_BRAND_ICON=${PAYER_SIM_BRAND_ICON:-}
PAYEE_SIM_BRAND_ICON=${PAYEE_SIM_BRAND_ICON:-}

# Substitute environment variables in all HTML and JS files
find /usr/share/nginx/html -type f -name "*.html" -o -name "*.js" | xargs sed -i "s|TTK_API_BASE_URL|$API_BASE_URL|g"
find /usr/share/nginx/html -type f -name "*.html" -o -name "*.js" | xargs sed -i "s|TTK_AUTH_ENABLED|$AUTH_ENABLED|g"

# Only substitute these if they're set
if [ ! -z "$PAYER_SIM_BRAND_ICON" ]; then
    find /usr/share/nginx/html -type f -name "*.html" -o -name "*.js" | xargs sed -i "s|TTK_PAYER_SIM_BRAND_ICON|$PAYER_SIM_BRAND_ICON|g"
fi

if [ ! -z "$PAYEE_SIM_BRAND_ICON" ]; then
    find /usr/share/nginx/html -type f -name "*.html" -o -name "*.js" | xargs sed -i "s|TTK_PAYEE_SIM_BRAND_ICON|$PAYEE_SIM_BRAND_ICON|g"
fi 