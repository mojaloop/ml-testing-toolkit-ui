/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation

 * ModusBox
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import axios from 'axios';
import { getConfig } from '../../utils/getConfig';

class ResponseRulesService {
    async fetchResponseRulesFiles() {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(apiBaseUrl + '/api/rules/files/response');
        if(typeof response.data === 'object') {
            return response.data;
        }
        return null;
    }

    async fetchResponseRulesFileContent(ruleFile) {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(apiBaseUrl + '/api/rules/files/response/' + ruleFile);
        let curRules = [];
        if(response.data && Array.isArray(response.data)) {
            curRules = response.data;
        }
        return curRules;
    }

    async updateResponseRulesFileContent(ruleFile, updatedRules) {
        const { apiBaseUrl } = getConfig();
        await axios.put(apiBaseUrl + '/api/rules/files/response/' + ruleFile, updatedRules, { headers: { 'Content-Type': 'application/json' } });
        return true;
    }
}

export default ResponseRulesService;
