import React from "react";
import _ from 'lodash';
import { Button, Row, Col, message } from 'antd';
import FolderBrowser from "./FolderBrowser.jsx";
import { DownloadOutlined } from '@ant-design/icons';

import JSZip from "jszip"
const MASTERFILE_NAME = 'master.json'

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsText(file);
  })
}

function buildFileSelector( multi = false, directory = false ){
  const fileSelector = document.createElement('input');
  fileSelector.setAttribute('type', 'file');
  if (multi) {
    fileSelector.setAttribute('multiple', 'multiple');
  }
  if (directory) {
    fileSelector.setAttribute('webkitdirectory', '');
  }
  return fileSelector;
}

class FileManager extends React.Component {

  componentDidMount = () => {
    this.collectionFolderSelector = buildFileSelector(false, true);
    this.collectionFolderSelector.addEventListener ('input', (e) => {
      if (e.target.files) {
        this.handleLocalFolderImportCollection(e.target.files)
      }
    })
  }


  convertToFolderNestedArray = (folderRawData) => {
    // Form the object tree based from the array of paths
    var fileTree = {};
    const mergePathsIntoFileTree = (fileItem) => {
      return (prevDir, currDir, i, filePath) => {
        if (i === filePath.length - 1) {
          prevDir[currDir] = { type: 'file', content: fileItem.content };
        }
        if (!prevDir.hasOwnProperty(currDir)) {
          prevDir[currDir] = {};
        }
        return prevDir[currDir];
      }
    }
    function parseFileItem(fileItem) {
      var fileLocation = fileItem.path.split('/');
      // If file is in root directory, eg 'index.js'
      if (fileLocation.length === 1) {
        return (fileTree[fileLocation[0]] = { type: 'file', content: fileItem.content });
      }
      fileLocation.reduce(mergePathsIntoFileTree(fileItem), fileTree);
    }
    folderRawData.forEach(parseFileItem);


    // Form the array from the object fileTree
    const processFileOrFolder = (inputItem, inputArray, prefix = '') => {

      const actionFileOrFolder = (fileOrFolderItem, extraInfo = {}) => {
        if (inputItem[fileOrFolderItem]) {
          if(inputItem[fileOrFolderItem].type === 'file') {
            inputArray.push({ key: (prefix ? (prefix + '/') : '') + fileOrFolderItem, title: fileOrFolderItem, isLeaf: true, extraInfo, content: inputItem[fileOrFolderItem].content })
          } else {
            var children = []
            processFileOrFolder(inputItem[fileOrFolderItem], children, (prefix ? (prefix + '/') : '') + fileOrFolderItem)
            inputArray.push({ key: (prefix ? (prefix + '/') : '') + fileOrFolderItem, title: fileOrFolderItem, extraInfo, children: children })
          }
        }
      }
      const actionFileRef = (name, refPath) => {
        const extraInfo = {
          type: 'fileRef',
          path: refPath
        }
        inputArray.push({ key: (prefix ? (prefix + '/') : '') + name, title: name, extraInfo, isLeaf: true})
      }
      // If master.json file exists in inputItem
      if (inputItem.hasOwnProperty(MASTERFILE_NAME)) {
        inputItem[MASTERFILE_NAME].content.order.forEach(orderItem => {
          if(orderItem.type === 'file' || orderItem.type === 'folder') {
            actionFileOrFolder(orderItem.name, { type: orderItem.type })
          } else if(orderItem.type === 'fileRef') {
            actionFileRef(orderItem.name, orderItem.path)
          }
        })
      } else {
        for (const fileOrFolderItem in inputItem) {
          actionFileOrFolder(fileOrFolderItem)
        }
      }
    }
    const treeDataArray = []
    processFileOrFolder(fileTree, treeDataArray)
    return treeDataArray
  }

  handleLocalFolderImportCollection = async (fileList) => {
    message.loading({ content: 'Reading the selected folder...', key: 'importFileProgress' });
    var importFolderRawData = []
    for (var i = 0; i < fileList.length; i++) {
      const file_to_read = fileList.item(i)
      if (file_to_read.name.endsWith('.json')) {
        const fileRead = new FileReader();
        try {
          const content = await readFileAsync(file_to_read)
          const fileContent = JSON.parse(content);
          importFolderRawData.push({
            name: file_to_read.name,
            path: file_to_read.webkitRelativePath,
            size: file_to_read.size,
            modified: file_to_read.lastModified,
            content: fileContent
          })
        } catch(err) {
          message.error({ content: err.message, key: 'importFileProgress', duration: 2 });
          break;
        }
      }
    }
    const folderData = this.convertToFolderNestedArray(importFolderRawData)
    this.props.onChange(folderData, [])
    this.forceUpdate()
    message.success({ content: 'Folder imported', key: 'importFileProgress', duration: 2 });
  }

  handleSelectionChanged = async (selectedFiles) => {
    this.props.onChange(this.props.folderData, selectedFiles)
  }

  handleOrderChange = async () => {
    this.props.onChange(this.props.folderData)
  }

  download = (content, fileName, contentType) => {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }

  handleExportFolder = async () => {
  
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

    const addFilesToZipHandler = (nodeChildren, zipHandler) => {
      // Add master file
      if (nodeChildren.length > 1) {
        const masterFileContent = generateMasterFile(nodeChildren)
        zipHandler.file(MASTERFILE_NAME, JSON.stringify(masterFileContent,null,2));
      }

      for (let i=0; i<nodeChildren.length; i++) {
        if (nodeChildren[i].isLeaf && nodeChildren[i].extraInfo.type === 'file') {
          const templateContent = nodeChildren[i].content;
          zipHandler.file(nodeChildren[i].title, JSON.stringify(templateContent,null,2));
        } else {
          if (nodeChildren[i].children) {
            const folderHandler = zipHandler.folder(nodeChildren[i].title);
            addFilesToZipHandler(nodeChildren[i].children, folderHandler)
          }
        }
      }
    }
  
    try {
      const zip = new JSZip();
      addFilesToZipHandler(this.props.folderData, zip)
      const content = await zip.generateAsync({type:"blob"})
      // Form a name for the file to download
      const downloadFileName = this.props.folderData.map(item => item.title).join('-') + '-' + (new Date().toISOString()) + '.zip'
      this.download(content, downloadFileName, 'application/zip')
    } catch(err){
      message.error({ content: err.message, key: 'importFileProgress', duration: 2 });
    }
  }

  render() {
    
    return (
      <>
        <Row>
          <Col>
            <Button
              type="primary"
              size="default"
              onClick={ e => {
                e.preventDefault();
                this.collectionFolderSelector.click();
              }}
            >
              Import Folder
            </Button>
            <Button
              type="primary"
              className="float-right"
              size="default"
              onClick={ e => {
                e.preventDefault();
                this.handleExportFolder()
              }}
            >
              Export as Zip file
            </Button>
          </Col>
        </Row>
        <Row>
          <Col>
            <FolderBrowser
              folderData={this.props.folderData}
              selectedFiles={this.props.selectedFiles}
              onSelect = {this.handleSelectionChanged}
              onOrderChange={this.handleOrderChange}
            />
          </Col>
        </Row>
      </>
    )
  }
}

export default FileManager;
