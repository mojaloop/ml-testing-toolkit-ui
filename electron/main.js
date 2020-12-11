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

// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog, ipcMain} = require('electron')
const path = require('path')
const fs = require('fs')
const { files } = require('node-dir')
const { promisify } = require('util')
const readRecursiveAsync = promisify(files)
const readFileAsync = promisify(fs.readFile)
const fileStatAsync = promisify(fs.stat)
const writeFileAsync = promisify(fs.writeFile)
const renameFileAsync = promisify(fs.rename)
const mkdirAsync = promisify(fs.mkdir)

const WEB_URL = 'http://localhost:3000/admin/outbound_request'
const MASTERFILE_NAME = 'master.json'
var globalFilePath = null
var mainWindow

var actionEventSender = null

ipcMain.on('mainAction', (event, actionDataJSON) => {
  actionEventSender = event.sender
  const actionData = JSON.parse(actionDataJSON)
  if (actionData.action === 'ping') {
    event.reply('rendererAction', 'pong')
  } else if (actionData.action === 'openFolder') {
    openFileDialog()
  } else if (actionData.action === 'saveFolderData') {
    let saveFilePath = null
    if (globalFilePath) {
      saveFilePath = globalFilePath
    } else if (actionData.nativeFilePath) {
      saveFilePath = actionData.nativeFilePath
    }
    if (saveFilePath) {
      actionEventSender.send('rendererAction', { action: 'savingStatusStart' })
      saveFolder(saveFilePath, actionData.data)
    } else {
      actionEventSender.send('rendererAction', { action: 'savingStatusError', message: 'Can not save files' })
      console.log('ERROR: No folder selected')
    }
  }
})

function openFileDialog () {
  // Open file dialog
  // multiSelections
  let dialogProperties = [ 'openFile' ] 
  if (process.platform === 'darwin') { // For MacOS
    dialogProperties = [ 'openFile', 'openDirectory' ]
  }
  const fileNames = dialog.showOpenDialog(mainWindow, { properties: dialogProperties}).then(
    result => {
      if (!result.canceled) {
        globalFilePath = result.filePaths[0].toString()
        handleLocalFileOrFolderOpen(globalFilePath)
      }
    }
  )
}


function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1200,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  // mainWindow.loadFile('index.html')
  mainWindow.loadURL(WEB_URL)

  // Script execution on renderer
  // let contents = mainWindow.webContents
  // contents.executeJavaScript('localStorage.getItem("folderData")', true)
  // .then((result) => {
  //   console.og(result)
  // })
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// File Reading Functions
handleLocalFileOrFolderOpen = async (filePath) => {
  const folderRawData = await getFolderRawData(filePath)
  actionEventSender.send('rendererAction', { action: 'importFolderData' , data: folderRawData, nativeFilePath: globalFilePath })
}

const getFileData = async (fileToRead, fileStat, rootFolder) => {
  try {
    const pathArray = rootFolder.split('/')
    const selectedFolderName = pathArray[pathArray.length-1]
    const absolutePathPrefix = pathArray.slice(0, -1).join('/')
    const fileFullName = fileToRead.replace(absolutePathPrefix+'/', '')

    const content = await readFileAsync(fileToRead, 'utf8')
    const fileContent = JSON.parse(content)
    return {
      name: fileFullName,
      path: fileFullName,
      size: fileStat.size,
      modified: '' + fileStat.mtime,
      content: fileContent
    }
  } catch (err) {
    console.log(err.message)
    return null
  }
}
const getFolderRawData = async (folderItem) => {
  var importFolderRawData = []
  const stat = await fileStatAsync(folderItem)
  if (stat.isFile() && folderItem.endsWith('.json')) {
    const fileItemData = await getFileData(folderItem, stat, folderItem)
    if (fileItemData) {
      importFolderRawData.push(fileItemData)
    }
  } else if (stat.isDirectory()) {
    const fileList = await readRecursiveAsync(folderItem)
    for (var j = 0; j < fileList.length; j++) {
      const fileItemData = await getFileData(fileList[j], stat, folderItem)
      if (fileItemData) {
        importFolderRawData.push(fileItemData)
      }
    }
  }
  importFolderRawData.sort((a, b) => a.path.localeCompare(b.path))
  return importFolderRawData
}

// File Writing Functions
const saveFolder = async (saveFilePath, folderData) => {
  
  const pathArray = saveFilePath.split('/')
  const parentFolder = pathArray.slice(0, -1).join('/')

  const generateMasterFile = (nodesArray) => {
    const nodesOrder = nodesArray.map(item => {
      return {
        name: item.title,
        ...item.extraInfo
      }
    })
    return {
      order: nodesOrder
    }
  }

  const writeFileToFolder = async (folderName, fileName, fileContent) => {
    await writeFileAsync(folderName + '/' + fileName, fileContent);
  }

  const addFilesToFolder = async (nodeChildren, currentFolder) => {
    // Create the folder
    await mkdirAsync(currentFolder, { recursive: true });
    // Add master file
    if (nodeChildren.length > 1) {
      const masterFileContent = generateMasterFile(nodeChildren)
      await writeFileToFolder(currentFolder, MASTERFILE_NAME, JSON.stringify(masterFileContent,null,2));
    }

    for (let i=0; i<nodeChildren.length; i++) {
      if (nodeChildren[i].isLeaf && nodeChildren[i].extraInfo.type === 'file') {
        const templateContent = nodeChildren[i].content;
        await writeFileToFolder(currentFolder, nodeChildren[i].title, JSON.stringify(templateContent,null,2));
      } else {
        if (nodeChildren[i].children) {
          const folderHandler = currentFolder + '/' + nodeChildren[i].title
          await addFilesToFolder(nodeChildren[i].children, folderHandler)
        }
      }
    }
  }

  try {

    // Backup the folder just incase
    const backupFolderName = saveFilePath + '_electron-backup-' + (new Date().toISOString())
    await renameFileAsync(saveFilePath, backupFolderName);
    await mkdirAsync(saveFilePath, { recursive: true });
    // Replace the files
    await addFilesToFolder(folderData, parentFolder)
    actionEventSender.send('rendererAction', { action: 'savingStatusSuccess' })
  } catch(err){
    console.log(err.message)
    actionEventSender.send('rendererAction', { action: 'savingStatusError', message: err.message })
  }
}