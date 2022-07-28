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
const optionsRegex = /(--[a-zA-Z\-]+ '.*?')|(--[a-zA-Z\-]+)|(-[a-zA-Z\-]+? '.+?')|('?[a-z]+:\/\/.*?'+?)|("?[a-z]+:\/\/.*?"+?)/g; // eslint-disable-line
const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/; // eslint-disable-line

// const contentTypeHeader = 'content-type';
// const jsonMimeType = 'application/json';

const isMatchingOption = (headers, str) => {
    for(let i = 0; i < headers.length; i += 1) {
        if(str.startsWith(headers[i])) {
            return true;
        }
    }
    return false;
};

const isAHeaderOption = str => isMatchingOption(['-H ', '--headers ', '--header '], str);
const isDataOption = str => isMatchingOption(['--data ', '--data-ascii ', '-d ', '--data-raw ', '--data-urlencode ', '--data-binary '], str);

const removeLeadingTrailingQuotes = str => {
    const quotes = ['\'', '"'];
    let newStr = str.trim();
    if(quotes.includes(newStr[0])) {
        newStr = newStr.substr(1, newStr.length - 1);
    }
    if(quotes.includes(newStr[newStr.length - 1])) {
        newStr = newStr.substr(0, newStr.length - 1);
    }
    return newStr;
};

const subStrFrom = (val, startFromVal) => {
    const dataPosition = val.indexOf(startFromVal);
    return val.substr(dataPosition);
};

// const isJsonRequest = parsedCommand => (parsedCommand.headers[contentTypeHeader] &&
//   parsedCommand.headers[contentTypeHeader].indexOf(jsonMimeType) !== -1);

const parseBodyByContentType = parsedCommand => {
    const { body } = parsedCommand;
    // if (body && isJsonRequest(parsedCommand)) {
    if(body) {
        try {
            const cleanedBodyData = body.replace('\\"', '"').replace('\\\'', '\'');
            return JSON.parse(cleanedBodyData);
        } catch (ex) {
            // ignore json conversion error..
      console.log('Cannot parse JSON Data ' + ex.message); // eslint-disable-line
        }
    }
    return body;
};

const parseOptionValue = val => {
    const headerSplit = subStrFrom(val, ' ').split(':');
    return {
        key: removeLeadingTrailingQuotes(headerSplit[0]).trim(),
        value: removeLeadingTrailingQuotes(headerSplit[1]).trim(),
    };
};

const parseQueryStrings = url => {
    const paramPosition = url.indexOf('?');
    const queryStrings = {};
    if(paramPosition !== -1) {
    // const splitUrl = parsedCommand.url.substr(0, paramPosition);
        const paramsString = url.substr(paramPosition + 1);
        const params = paramsString.split('&') || [];

        params.forEach(param => {
          const splitParam = param.split('='); // eslint-disable-line
          queryStrings[splitParam[0]] = splitParam[1]; // eslint-disable-line
        });
    }
    return queryStrings;
};

const parseUrlOption = val => {
    const urlMatches = val.match(urlRegex) || [];
    if(urlMatches.length) {
    const url = urlMatches[0]; // eslint-disable-line
        return {
            url,
            queryStrings: parseQueryStrings(url),
        };
    }
    return { url: '', queryStrings: {} };
};

const parseBody = val => removeLeadingTrailingQuotes(subStrFrom(val, ' '));

const isACurlCommand = val => val.trim().startsWith('curl ');
const isAUrlOption = val => {
    const matches = val.match(urlRegex) || [];
    return !!matches.length;
};

/*
 * Parse cUrl command to a JSON structure
 * params:
 * command - cUrl command as a string.
 * return JSON object
*/
export function parse(command) {
    if(!command) { return ''; }

    const parsedCommand = {
        url: '',
    };

    // quit if the command does not starts with curl
    if(isACurlCommand(command)) {
    // let cleanCommand = command.replace('\\\\n', '');
        let cleanCommand = command;
        cleanCommand = cleanCommand.replace(/(\\\r\n|\\\n|\\\r)/gm, ' ');
        cleanCommand = cleanCommand.replace(/(\r\n|\n|\r)/gm, ' ');

        const matches = cleanCommand.match(optionsRegex);
        matches.forEach(val => {
            // const option = removeLeadingTrailingQuotes(val);
            const option = val;
            if(isAUrlOption(option)) {
                const { url, queryStrings } = parseUrlOption(option);
                parsedCommand.url = url;
                parsedCommand.queryStrings = queryStrings;
            } else if(isAHeaderOption(option)) {
                const { key, value } = parseOptionValue(option);
                parsedCommand.headers = parsedCommand.headers || {};
                parsedCommand.headers[key] = value;
            } else if(isDataOption(option)) {
                parsedCommand.body = parseBody(option);
            } else {
        console.log(`Skipped Header ${val}`); // eslint-disable-line
            }
        }); // parse over matches ends

        // should be checked after all the options are analyzed
        // so that we guarentee that we have content-type header
        parsedCommand.body = parseBodyByContentType(parsedCommand);
    }
    return parsedCommand;
}

export default parse;
