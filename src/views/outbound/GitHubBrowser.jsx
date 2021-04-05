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
import React from "react";
import { getConfig } from '../../utils/getConfig'
import GitHub from 'github-api';
import { FolderParser } from '@mojaloop/ml-testing-toolkit-shared-lib'

import { Row, Col, Table, Button, Typography, Tag, Progress } from 'antd';
import { FolderOutlined, FileOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getUserConfig } from '../../utils/getConfig'

const { Text, Title } = Typography

const gh = new GitHub();

class GitHubBrowser extends React.Component {
  apiBaseUrl = null

  constructor () {
    super()
    const { apiBaseUrl } = getConfig()
    this.apiBaseUrl = apiBaseUrl
  }

  state = {
    serverCollections: [],
    selectedCollections: [],
    isGettingFileList: false,
    currentFolder: '/',
    tempText: '',
    gitHubDownloadStatusCount: 0,
    gitHubDownloadStatusText: '',
    gitHubDownloadProgress: 0,
    gitHubDownloadTotalFiles: 0
  }

  folderData = []
  gitHubConfig = {}
  gitRepo = null

  componentDidMount = async () => {
    const userConfig = getUserConfig()
    
    this.gitHubConfig = userConfig && userConfig.GITHUB_CONFIG
    this.gitRepo = gh.getRepo(this.gitHubConfig.TEST_CASES_REPO_OWNER, this.gitHubConfig.TEST_CASES_REPO_NAME)
    
    this.state.currentFolder = this.gitHubConfig.TEST_CASES_REPO_BASE_PATH 
    await this.reloadFileList()
  }

  reloadFileList = async () => {
    if(this.gitRepo) {
      this.setState({isGettingFileList: true})
      const resp = await this.gitRepo.getContents(null, this.state.currentFolder)
      this.setState({serverCollections: resp.data, isGettingFileList: false})
    }
  }

  changeFolder = (item) => {
    this.resetDownloadStatus()
    this.state.currentFolder += '/' + item
    this.reloadFileList()
  }

  backToParentFolder = () => {
    this.resetDownloadStatus()
    const pathArr = this.state.currentFolder.split('/')
    if (pathArr.length > 1 && this.state.currentFolder !== this.gitHubConfig.TEST_CASES_REPO_BASE_PATH) {
      pathArr.pop()
      this.state.currentFolder = pathArr.join('/')
      this.reloadFileList()
    }
  }

  handleDownloadCollections = async () => {
    const selectedCollections = this.state.serverCollections.filter((item, index) => this.state.selectedCollections.includes(index))
    // console.log(selectedCollections)
    this.state.gitHubDownloadStatusCount = 0
    // Get the total number of files in the directories
    const totalFileCount = await this.getGitHubTreeFileCount(selectedCollections)
    this.setState({gitHubDownloadStatusCount: 0, gitHubDownloadProgress: 0, gitHubDownloadTotalFiles: totalFileCount})
    // await this.downloadGitHubObject(selectedCollections, this.folderData)
    this.folderData = await this.downloadGitHubTree(selectedCollections)
    this.setState({gitHubDownloadStatusText: '', gitHubDownloadProgress: 100})
  }

  getGitHubTreeFileCount = async (gObjects) => {
    let fileCount = 0
    for (let i = 0; i < gObjects.length; i++) {
      const resp = await this.gitRepo.getTree(gObjects[i].sha + '?recursive=true')
      const treeData = resp.data && resp.data.tree
      fileCount += treeData.filter(item => item.type === 'blob').length
    }
    return fileCount
  }

  resetDownloadStatus = () => {
    this.state.gitHubDownloadStatusCount = 0
    this.folderData = []
    this.setState({gitHubDownloadStatusCount: 0, gitHubDownloadProgress: 0, gitHubDownloadTotalFiles: 0, gitHubDownloadStatusText: ''})
  }

  handleImportToWorkspace = () => {
    if (this.folderData.length > 0) {
      this.props.onDownload(this.folderData)
    }
  }

  // TODO: The imported items are the sub items of the selected folder. But the folder name should be added.
  downloadGitHubTree = async (gObjects) => {
    var importFolderRawData = []
    for (let i = 0; i < gObjects.length; i++) {
      const folderName = gObjects[i].name
      const resp = await this.gitRepo.getTree(gObjects[i].sha + '?recursive=true')
      const treeData = resp.data && resp.data.tree
      const fileList = treeData.filter(item => item.type === 'blob')
      for (let j = 0; j < fileList.length; j++) {
        const fileObj = fileList[j]
        this.setState({gitHubDownloadStatusText: 'Downloading file ' + fileObj.path + '...'})

        const resp2 = await axios.get(fileObj.url)
        this.setState({gitHubDownloadStatusCount: this.state.gitHubDownloadStatusCount + 1})

        try {
          const fileContent = JSON.parse(atob(resp2.data.content))
          importFolderRawData.push({
            name: folderName + '/' + fileObj.path,
            path: folderName + '/' + fileObj.path,
            size: fileObj.size,
            modified: '',
            content: fileContent
          })
        } catch(err) {
          console.log(err.message)
        }
      }
    }
    importFolderRawData.sort((a, b) => a.path.localeCompare(b.path))
    return FolderParser.getFolderData(importFolderRawData)
  }

  // TODO: Handle master.json file properly to construct folderData array
  
  downloadGitHubObject = async (gObjects, folderData) => {
    // Iterate through all the github objects
    for (let i = 0; i < gObjects.length; i++) {
      const gObject = gObjects[i]
      // Create an object
      const newObj = {
        key: gObject.path,
        title: gObject.name
      }

      if(gObject.type === 'dir') {
        newObj.extraInfo = {
          type: 'folder'
        }
        newObj.children = []
        // Get objects in the directory
        this.setState({gitHubDownloadStatusText: 'Fetching directory ' + gObject.path + '...'})
        const resp = await this.gitRepo.getContents(null, gObject.path)
        await this.downloadGitHubObject(resp.data, newObj.children)        
      } else if(gObject.type === 'file') {
        this.setState({gitHubDownloadStatusCount: this.state.gitHubDownloadStatusCount + 1})
        newObj.extraInfo = {
          type: 'file'
        }
        newObj.isLeaf = true
        // Download the file with axios
        this.setState({gitHubDownloadStatusText: 'Downloading file ' + gObject.path + '...'})
        const resp = await axios.get(gObject.download_url)
        // Insert the content
        newObj.content = resp.data
      }
      folderData.push(newObj)
    }
  }


  componentWillUnmount = () => {
  }
  

  render() {
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        this.resetDownloadStatus()
        this.setState({selectedCollections: selectedRowKeys})
      },
      selectedRowKeys: this.state.selectedCollections
    }

    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (item) => {
          return (
            <>
            {
              item.type === 'dir'
              ? <FolderOutlined />
              : <FileOutlined />
            }
            <a className='ml-2' onClick={() => this.changeFolder(item.name)}>{item.name}</a>
            </>
          )
        },
      },
    ];

    const data = this.state.serverCollections.map((item, index) => {
      return {
        key: index,
        name: item,
      }
    })

    const getHeaderOptions = () => {
      if(this.state.currentFolder !== this.gitHubConfig.TEST_CASES_REPO_BASE_PATH) {
        return <Button onClick={this.backToParentFolder}>Back</Button>
      }
    }

    const getDownloadStatusColor = () => {
      if (this.state.gitHubDownloadProgress === 100) {
        return '#87d068'
      } else {
        return 'orange'
      }
    }
    const getDownloadStatusTag = () => {
      if(this.state.gitHubDownloadStatusCount > 0) {
        if(this.state.gitHubDownloadProgress === 100) {
          return <Tag color='#87d068'>{this.state.gitHubDownloadStatusCount} files Downloaded</Tag>
        } else {
          return (
            <>
            <Progress percent={this.state.gitHubDownloadStatusCount*100/this.state.gitHubDownloadTotalFiles} size="small" />
            <Tag color='orange'>{this.state.gitHubDownloadStatusCount + '/' + this.state.gitHubDownloadTotalFiles}</Tag>
            </>
          )
        }
      } else {
        return null
      }
    }

    return (
      <>
        {/* Page content */}
          <Row className="mt--7 mb-4">
            <Col span={24}>
              <Row className="mt-2">
                <Col span={24}>
                  <Table
                    rowSelection={{
                      type: 'checkbox',
                      ...rowSelection,
                    }}
                    columns={columns}
                    dataSource={data}
                    pagination={false}
                    loading={this.state.isGettingFileList}
                    showHeader={false}
                    title={() => getHeaderOptions()}
                  />
                </Col>
              </Row>
              <Row className="mt-2">
                <Col span={24}>
                  <Button
                    onClick={this.handleDownloadCollections}
                    disabled={this.state.selectedCollections.length === 0}
                  >
                    Download
                  </Button>
                  {
                    this.state.gitHubDownloadProgress === 100
                    ? (
                      <Button
                        className='ml-2'
                        onClick={this.handleImportToWorkspace}
                      >
                        Import to Workspace
                      </Button>
                    )
                    : null
                  }
                </Col>
              </Row>
              <Row className="mt-2">
                <Col span={24}>
                  {getDownloadStatusTag()}
                  <Text>{this.state.gitHubDownloadStatusText}</Text>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col span={24}>
                  <pre>{this.state.tempText}</pre>
                </Col>
              </Row>
            </Col>
          </Row>
      </>
    );
  }
}

export default GitHubBrowser;
