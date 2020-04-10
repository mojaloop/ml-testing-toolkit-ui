import axios from 'axios'
import getConfig from '../../utils/getConfig'

class ResponseRulesService {
  async fetchResponseRulesFiles () {
    const { apiBaseUrl } = getConfig()
    const response = await axios.get(apiBaseUrl + "/api/rules/files/response")
    if(typeof response.data === 'object') {
      return response.data
    }
    return null
  }

  async fetchResponseRulesFileContent (ruleFile) {
    const { apiBaseUrl } = getConfig()
    const response = await axios.get(apiBaseUrl + "/api/rules/files/response/" + ruleFile)
    let curRules = []
    if (response.data && Array.isArray(response.data)) {
      curRules = response.data
    }
    return curRules
  }

  async updateResponseRulesFileContent (ruleFile, updatedRules) {
    const { apiBaseUrl } = getConfig()
    await axios.put(apiBaseUrl + "/api/rules/files/response/" + ruleFile, updatedRules, { headers: { 'Content-Type': 'application/json' } })
    return true
  }

}

export default ResponseRulesService
