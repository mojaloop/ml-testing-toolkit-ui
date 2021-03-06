if [[ ! -z "${API_BASE_URL}" ]]; then
    find /usr/share/nginx/html -type f -name "*.*" -exec sed -i -e "s|TTK_API_BASE_URL|$API_BASE_URL|g" {} \;
fi
if [[ ! -z "${AUTH_ENABLED}" ]]; then
    find /usr/share/nginx/html -type f -name "*.*" -exec sed -i -e "s|TTK_AUTH_ENABLED|$AUTH_ENABLED|g" {} \;
fi
nginx -g "daemon off;"