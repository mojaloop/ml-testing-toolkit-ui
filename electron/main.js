// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog, ipcMain} = require('electron')
const path = require('path')
const fs = require('fs')
const { files } = require('node-dir')
const { promisify } = require('util')
const { FolderParser } = require('ml-testing-toolkit-shared-lib')
const readRecursiveAsync = promisify(files)
const readFileAsync = promisify(fs.readFile)
const fileStatAsync = promisify(fs.stat)

// const writeFileAsync = promisify(fs.writeFile)
const MASTERFILE_NAME = 'master.json'
var globalFilePath = null
var mainWindow

ipcMain.on('asynchronous-message', (event, arg) => {
  console.log(arg) // prints "ping"
  event.reply('asynchronous-reply', 'pong')
})

ipcMain.on('incomingFolderData', (event, arg) => {  
  if (globalFilePath) {
    const pathArray = globalFilePath.split('/')
    const parentFolder = pathArray.slice(0, -1).join('/')
    saveFolder(parentFolder, JSON.parse(arg))
  } else {
    console.log('ERROR: No folder selected')
  }
})

var folderOpenActionEventSender = null

ipcMain.on('incomingActions', (event, actionDataJSON) => {
  const actionData = JSON.parse(actionDataJSON)
  if (actionData.action === 'openFolder') {
    folderOpenActionEventSender = event.sender
    openFileDialog()
  }
  // fileOpenActionEventSender.send('outgoingFolderData', 'asdf')
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
        console.log(result)
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
  mainWindow.loadURL('http://localhost:3000/admin/outbound_request')

  let contents = mainWindow.webContents
  // console.log(contents)
  // contents.executeJavaScript('localStorage.getItem("folderData")', true)
  // .then((result) => {
  //   saveFolder(JSON.parse(result))
  // })
  // Open the DevTools.
  mainWindow.webContents.openDevTools()
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
  // const folderData = FolderParser.getFolderData(folderRawData)
  // console.log(folderData)
  folderOpenActionEventSender.send('outgoingFolderData', JSON.stringify(folderRawData))
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
const saveFolder = async (rootFolder, folderData) => {
  
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

  const writeFileToFolder = (folderName, fileName, fileContent) => {
    fs.writeFileSync(folderName + '/' + fileName, fileContent);
  }

  const addFilesToFolder = (nodeChildren, currentFolder) => {
    // Create the folder
    fs.mkdirSync(currentFolder, { recursive: true });
    // Add master file
    if (nodeChildren.length > 1) {
      const masterFileContent = generateMasterFile(nodeChildren)
      writeFileToFolder(currentFolder, MASTERFILE_NAME, JSON.stringify(masterFileContent,null,2));
    }

    for (let i=0; i<nodeChildren.length; i++) {
      if (nodeChildren[i].isLeaf && nodeChildren[i].extraInfo.type === 'file') {
        const templateContent = nodeChildren[i].content;
        writeFileToFolder(currentFolder, nodeChildren[i].title, JSON.stringify(templateContent,null,2));
      } else {
        if (nodeChildren[i].children) {
          const folderHandler = currentFolder + '/' + nodeChildren[i].title
          addFilesToFolder(nodeChildren[i].children, folderHandler)
        }
      }
    }
  }

  try {
    // const rootFolder = 'some_folder';
    // const rootFolder = folderData.map(item => item.title).join('-') + '-' + (new Date().toISOString())
    addFilesToFolder(folderData, rootFolder)
  } catch(err){
    console.log(err.message)
  }
}