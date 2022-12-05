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

export class FetchUtils {
    static fetchAllApiData = async (apiType, version, asynchronous) => {
        const openApiDefinition = await this.getDefinition(apiType, version);
        let callbackMap = {};
        let responseMap = {};

        if(asynchronous) {
            try {
                callbackMap = await this.getCallbackMap(apiType, version);
            } catch (err) { }
        } else {
            try {
                responseMap = await this.getResponseMap(apiType, version);
            } catch (err) { }
        }
        return { openApiDefinition, callbackMap, responseMap };
    };


    static getDefinition = async (apiType, version) => {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(`${apiBaseUrl}/api/openapi/definition/${apiType}/${version}`);
        // console.log(response.data)
        return response.data;
        // this.setState(  { openApiDefinition: response.data } )
    };

    static getResponseMap = async (apiType, version) => {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(`${apiBaseUrl}/api/openapi/response_map/${apiType}/${version}`);
        return response.data;
        // this.setState(  { callbackMap: response.data } )
    };

    static getCallbackMap = async (apiType, version) => {
        const { apiBaseUrl } = getConfig();
        const response = await axios.get(`${apiBaseUrl}/api/openapi/callback_map/${apiType}/${version}`);
        return response.data;
        // this.setState(  { callbackMap: response.data } )
    };
}
