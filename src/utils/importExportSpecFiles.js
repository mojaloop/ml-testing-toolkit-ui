import getConfig from './getConfig'
import axios from 'axios'
import FileDownload from 'js-file-download'

const readFileAsync = (file, type) => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    switch (type) {
      case 'readAsArrayBuffer':
        reader.readAsArrayBuffer(file)
        break;
      default: 
        reader.readAsText(file)
    }
  })
}

const handleRuleFileExport = async (elements) => {
  const { apiBaseUrl } = getConfig()
  console.log(elements)
  const exportRulesResponse = await axios.get(apiBaseUrl + '/api/rules/export', {params: { elements }})
  const zipName = `${exportRulesResponse.data.body.namePrefix}_${new Date().toISOString()}.zip`
  const buffer = Buffer.from(exportRulesResponse.data.body.buffer.data)
  FileDownload(Buffer.from(buffer), zipName)
}

const handleRulesFileImport = async (file_to_read, readFileType) => {
  const { apiBaseUrl } = getConfig()
  await axios.post(apiBaseUrl + "/api/rules/import", 
      { buffer: Buffer.from(await readFileAsync(file_to_read, readFileType)) }, 
      { headers: { 'Content-Type': 'application/json' }})
}

const handleSettingsFileExport = async (data) => {
  const filename = `user_config_${new Date().toISOString()}.json`
  FileDownload(JSON.stringify(data, null, 2), filename)
}

const handleSettingsFileImport = async (file_to_read) => {
  const { apiBaseUrl } = getConfig()
  const settings = JSON.parse(await readFileAsync(file_to_read))
  await axios.put(apiBaseUrl + "/api/config/user", settings, { headers: { 'Content-Type': 'application/json' }})
  return settings
}

export default {
  handleRuleFileExport,
  handleRulesFileImport,
  handleSettingsFileExport,
  handleSettingsFileImport
}