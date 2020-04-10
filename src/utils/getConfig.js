const getConfig = () => {
  const { API_BASE_URL, AUTH_ENABLED } = process.env
  const { protocol, hostname } = window.location

  // Using the same protocol as we've been loaded from to avoid Mixed Content error.
  const apiBaseUrl = API_BASE_URL ? API_BASE_URL : `${protocol}//${hostname}:5050`
  const isAuthEnabled = AUTH_ENABLED ? AUTH_ENABLED !== 'FALSE' : false

  return { apiBaseUrl, isAuthEnabled }
}

export default getConfig
