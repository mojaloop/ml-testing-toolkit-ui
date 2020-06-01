import axios from 'axios';

const getConfig = () => {
  const { AUTH_ENABLED } = process.env
  const { protocol, hostname } = window.location

  // Using the same protocol as we've been loaded from to avoid Mixed Content error.
  let apiBaseUrl = 'TTK_API_BASE_URL'
  if (!apiBaseUrl.startsWith('http')) {
    apiBaseUrl = `${protocol}//${hostname}:5050`
  }
  const isAuthEnabled = AUTH_ENABLED ? AUTH_ENABLED !== 'FALSE' : false

  return { apiBaseUrl, isAuthEnabled }
}

export const getServerConfig = async () => {
  const { apiBaseUrl } = getConfig()
  const response = await axios.get(apiBaseUrl + "/api/config/user")
  const userConfigRuntime = response.data.runtime
  const userConfigStored = response.data.stored

  return { userConfigRuntime, userConfigStored }
}

export default getConfig
