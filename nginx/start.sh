# This script is not used directly in the Chainguard nginx image since it's distroless
# The functionality is now built into the image at build time
# Keeping this file for reference only

if [[ ! -z "${API_BASE_URL}" ]]; then
    find /usr/share/nginx/html -type f -name "*.*" -exec sed -i -e "s|TTK_API_BASE_URL|$API_BASE_URL|g" {} \;
fi
if [[ ! -z "${AUTH_ENABLED}" ]]; then
    find /usr/share/nginx/html -type f -name "*.*" -exec sed -i -e "s|TTK_AUTH_ENABLED|$AUTH_ENABLED|g" {} \;
fi
if [[ ! -z "${PAYER_SIM_BRAND_ICON}" ]]; then
    find /usr/share/nginx/html -type f -name "*.*" -exec sed -i -e "s|TTK_PAYER_SIM_BRAND_ICON|$PAYER_SIM_BRAND_ICON|g" {} \;
fi
if [[ ! -z "${PAYEE_SIM_BRAND_ICON}" ]]; then
    find /usr/share/nginx/html -type f -name "*.*" -exec sed -i -e "s|TTK_PAYEE_SIM_BRAND_ICON|$PAYEE_SIM_BRAND_ICON|g" {} \;
fi
nginx -g "daemon off;"