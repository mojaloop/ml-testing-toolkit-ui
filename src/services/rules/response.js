import axios from 'axios'

class ResponseRulesService {
  async fetchResponseRulesFiles () {
    const response = await axios.get("http://localhost:5050/api/rules/files/response")
    if(typeof response.data === 'object') {
      return response.data
    }
    return null
  }

  async fetchResponseRulesFileContent (ruleFile) {
    const response = await axios.get("http://localhost:5050/api/rules/files/response/" + ruleFile)
    let curRules = []
    if (response.data && Array.isArray(response.data)) {
      curRules = response.data
    }
    return curRules
  }

  async updateResponseRulesFileContent (ruleFile, updatedRules) {
    await axios.put("http://localhost:5050/api/rules/files/response/" + ruleFile, updatedRules, { headers: { 'Content-Type': 'application/json' } })
    return true
  }

}

export default ResponseRulesService
