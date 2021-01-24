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
import React, {useEffect} from "react";
import _ from 'lodash';
import { FileTwoTone, TagTwoTone, FolderTwoTone, FolderOpenTwoTone, DownOutlined } from '@ant-design/icons';
import { Button, Tree, message, Input, Menu, Modal, Row, Col } from 'antd';
import 'antd/dist/antd.css';


class FolderBrowser extends React.Component {
  constructor () {
    super()
    this.state = {
      files: [],
      expandedKeys: [],
      checkedKeys: [],
      selectedKeys: [],
      autoExpandParent: true,
      rootNodeKey: '',
      treeDataArray: [],
      rightClickNodeTreeItem: {},
      contextMenuVisible: false,
      inputDialogEnabled: false,
      inputDialogValue: '',
      inputDialogData: {
        title: '',
        key: '',
        extraData: {}
      },
      confirmDialogEnabled: false,
      confirmDialogData: {
        title: '',
        description: '',
        key: '',
        extraData: {}
      },
      copiedFile: null
    }
  }

  componentDidMount = () => {
    this.convertFolderData(this.props.folderData)
    this.state.treeDataArray = this.props.folderData
    this.state.rootNodeKey = this.state.treeDataArray[0] && this.state.treeDataArray[0].key
    this.setState({checkedKeys: this.props.selectedFiles, expandedKeys: [this.state.rootNodeKey]})
  }

  componentDidUpdate = () => {
    this.state.checkedKeys = this.props.selectedFiles
    if (this.state.treeDataArray != this.props.folderData) {
      this.convertFolderData(this.props.folderData)
      this.setState({treeDataArray: this.props.folderData})
    }
  }

  convertFolderData = (nodeChildren) => {
    for (let i=0; i<nodeChildren.length; i++) {
      if (nodeChildren[i].isLeaf) {
        if (nodeChildren[i].extraInfo && nodeChildren[i].extraInfo.type === 'file') {
          nodeChildren[i].icon = <FileTwoTone style={{ fontSize: '18px' }} />
        }
        if (nodeChildren[i].extraInfo && nodeChildren[i].extraInfo.type === 'fileRef') {
          nodeChildren[i].icon = <TagTwoTone twoToneColor="#f39f3f" style={{ fontSize: '18px' }}/>
        }
      } else {
        if (nodeChildren[i].children) {
          nodeChildren[i].icon = <FolderTwoTone style={{ fontSize: '18px' }} />
          this.convertFolderData(nodeChildren[i].children)
        }
      }
    }
  }

  onExpand = expandedKeys => {
    // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.
    this.setState({expandedKeys, autoExpandParent: false})
  };

  onCheck = checkedKeys => {
    const selectedFiles = checkedKeys
    this.props.onSelect(selectedFiles)
    this.setState({checkedKeys})
  };

  onSelect = (selectedKeys, info) => {
    this.setState({selectedKeys})
    // console.log('ON SELECT', info);

  };

  getLevelInfo = (posArray) => {
    let nodesInSameLevel = this.state.treeDataArray
    let levelPrefix = ''
    for (let i = 1; i < posArray.length - 1; i++) {
      levelPrefix = nodesInSameLevel[posArray[i]].key
      nodesInSameLevel = nodesInSameLevel[posArray[i]].children
    }
    return {
      nodesInSameLevel,
      levelPrefix
    }
  }

  onDragEnter = info => {
    // console.log('ON DRAG ENTER', info);
  };
  onDrop = info => {
    if (info.dropToGap) {
      const dropKey = info.node.props.eventKey;
      const dragKey = info.dragNode.props.eventKey;
      const dropPos = info.node.props.pos.split('-');
      const dragPos = info.dragNode.props.pos.split('-');
      // Check the drag node and drop node are in same level
      const parentDropPosition = dropPos.slice(0, -1).join('-')
      const parentDragPosition = dragPos.slice(0, -1).join('-')
      if (parentDropPosition === parentDragPosition ) {
        const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
        const dropIndex = Math.ceil((info.dropPosition + Number(dropPos[dropPos.length - 1]))/2);
        // console.log(dropKey, dragKey, dropPos, dropPosition, dropIndex)

        const levelInfo = this.getLevelInfo(dragPos)
        let nodesInSameLevel = levelInfo.nodesInSameLevel
        // Find the drag object index
        const dragObjectIndex = nodesInSameLevel.findIndex(item => item.key===info.dragNode.props.eventKey)
        // Store the drag object
        const dragObject = nodesInSameLevel[dragObjectIndex]
        // Remove that from the array
        nodesInSameLevel.splice(dragObjectIndex, 1)
        // Calculate the new drop position
        let newDropIndex = dropIndex
        if (dropIndex > dragObjectIndex) {
          newDropIndex = dropIndex - 1
        }
        // Add the object at the new drop position
        nodesInSameLevel.splice(newDropIndex, 0, dragObject)

        // Create a copy of treeDataArray and set the state because treeData need to have new reference value to be updated
        const newTreeDataArray = [...this.state.treeDataArray]
        this.setState({ treeDataArray: newTreeDataArray})
        this.props.onOrderChange()
      } else {
        const dropIndex = Math.ceil((info.dropPosition + Number(dropPos[dropPos.length - 1]))/2);
        const levelInfo = this.getLevelInfo(dropPos)
        // Some tweak to set the dropPos correctly
        const newDropPos = [...dropPos]
        newDropPos[newDropPos.length - 1] = dropIndex + ''
        this.setState({confirmDialogEnabled: true, confirmDialogData: { title: 'Please confirm', description: 'Do you want to move this file?', key: 'moveFile', extraData: { levelPrefix: levelInfo.levelPrefix, dragPos: dragPos.slice(1), dropPos: newDropPos.slice(1) }}})
      }
    } else {
      // If drop on a folder
      if (!info.node.isLeaf) {
        const dropKey = info.node.props.eventKey;
        const dragKey = info.dragNode.props.eventKey;
        const dropPos = info.node.props.pos.split('-');
        dropPos.push(0)
        const dragPos = info.dragNode.props.pos.split('-');
        const dropIndex = Math.ceil((info.dropPosition + Number(dropPos[dropPos.length - 1]))/2);
        const levelInfo = this.getLevelInfo(dropPos)
        // Some tweak to set the dropPos correctly
        const newDropPos = [...dropPos]
        newDropPos[newDropPos.length - 1] = dropIndex + ''
        this.setState({confirmDialogEnabled: true, confirmDialogData: { title: 'Please confirm', description: 'Do you want to move this file?', key: 'moveFile', extraData: { levelPrefix: levelInfo.levelPrefix, dragPos: dragPos.slice(1), dropPos: newDropPos.slice(1) }}})
      }
    }
  }

  handleTreeNodeRightClick = e => {
    this.setState({
      contextMenuVisible: true,
      rightClickNodeTreeItem: {
        pageX: e.event.pageX,
        pageY: e.event.pageY,
        nodeRef: e.node,
        categoryName: e.node.title,
      },
    });
  };

  hideContextMenu = () => {
    this.setState({
      contextMenuVisible: false
    })
  }

  inputDialogRef = null

  handleContextMenuClick = async (e) => {
    // this.state.rightClickNodeTreeItem.nodeRef.props.eventKey
    // console.log(this.state.rightClickNodeTreeItem.nodeRef.isLeaf())
    const nodePos = this.state.rightClickNodeTreeItem.nodeRef.props.pos.split('-');
    const levelInfo = this.getLevelInfo(nodePos)
    switch(e.key) {
      case "newFile":
      case "newFolder":
        {
          let levelPrefix = this.state.rightClickNodeTreeItem.nodeRef.props.eventKey
          let keysInSameLevel = []
          if(this.state.rightClickNodeTreeItem.nodeRef.isLeaf) {
            if(this.state.rightClickNodeTreeItem.nodeRef.props.extraInfo  && this.state.rightClickNodeTreeItem.nodeRef.props.extraInfo.type !== 'folder') {
              levelPrefix = levelInfo.levelPrefix
              keysInSameLevel = levelInfo.nodesInSameLevel.map(item => item.key)
            } else {
              keysInSameLevel = this.state.rightClickNodeTreeItem.nodeRef.props.data.children.map(item => item.key)
            }
          } else {
            keysInSameLevel = this.state.rightClickNodeTreeItem.nodeRef.props.data.children.map(item => item.key)
          }
          await this.setState({inputDialogEnabled: true, inputDialogData: { title: 'Enter a file / folder name to create', key:e.key, extraData: { levelPrefix, keysInSameLevel }}})
          this.inputDialogRef.focus()
          break
        }
      case "rename":
        {
          const fileKey = this.state.rightClickNodeTreeItem.nodeRef.props.eventKey
          const fileKeyArr = fileKey.split('/')
          await this.setState({inputDialogEnabled: true, inputDialogValue: fileKeyArr[fileKeyArr.length - 1], inputDialogData: { title: 'Enter new file / folder name', key:e.key, extraData: { fileKey, levelPrefix: levelInfo.levelPrefix }}})
          this.inputDialogRef.focus()
          break
        }
      case "delete":
        {
          const fileKey = this.state.rightClickNodeTreeItem.nodeRef.props.eventKey
          this.setState({confirmDialogEnabled: true, confirmDialogData: { title: 'Please confirm', description: 'Do you want to delte this file?', key: 'deleteFile', extraData: { fileKey }}})
          break
        }
      case "duplicate":
        {
          const fileKey = this.state.rightClickNodeTreeItem.nodeRef.props.eventKey
          this.props.onDuplicateFileOrFolder(fileKey, levelInfo.levelPrefix)
          this.hideContextMenu()
          break
        }
      case "copy":
        {
          const fileKey = this.state.rightClickNodeTreeItem.nodeRef.props.eventKey
          const fileTitle = this.state.rightClickNodeTreeItem.nodeRef.props.title
          message.info('Copied file')
          this.setState({copiedFile: { key: fileKey, title: fileTitle, extraInfo: this.state.rightClickNodeTreeItem.nodeRef.props.extraInfo }})
          this.hideContextMenu()
          break
        }
      case "paste":
      case "pasteRef":
        {
          let levelPrefix = this.state.rightClickNodeTreeItem.nodeRef.props.eventKey
          let keysInSameLevel = []
          if(this.state.rightClickNodeTreeItem.nodeRef.isLeaf) {
            if(this.state.rightClickNodeTreeItem.nodeRef.props.extraInfo  && this.state.rightClickNodeTreeItem.nodeRef.props.extraInfo.type !== 'folder') {
              levelPrefix = levelInfo.levelPrefix
              keysInSameLevel = levelInfo.nodesInSameLevel.map(item => item.key)
            } else {
              keysInSameLevel = this.state.rightClickNodeTreeItem.nodeRef.props.data.children.map(item => item.key)
            }
          } else {
            keysInSameLevel = this.state.rightClickNodeTreeItem.nodeRef.props.data.children.map(item => item.key)
          }
          if(keysInSameLevel.includes(levelPrefix + '/' + this.state.copiedFile.title)) {
            message.error('ERROR: An item with same name exists in this folder');
          } else {
            if(e.key === 'pasteRef') {
              this.props.onPasteReference(this.state.copiedFile.key, this.state.copiedFile.title, levelPrefix)
            } else {
              this.props.onPaste(this.state.copiedFile.key, levelPrefix)
            }
          }
          this.hideContextMenu()
          break
        }
    }
  }

  handleInputDialogOk = async (e) => {
    const inputValue = this.state.inputDialogValue
    // The following line should be await for updating the tree with new changes
    await this.setState({inputDialogEnabled: false, inputDialogValue: ''})
    switch(this.state.inputDialogData.key) {
      case 'newFile':        
        if(this.state.inputDialogData.extraData.keysInSameLevel.includes(this.state.inputDialogData.extraData.levelPrefix + '/' + inputValue)) {
          message.error('ERROR: Filename exists');
        } else {
          this.props.onAddFileOrFolder(this.state.inputDialogData.extraData.levelPrefix, inputValue, false)
        }
        break
      case 'newFolder':
        if(this.state.inputDialogData.extraData.keysInSameLevel.includes(this.state.inputDialogData.extraData.levelPrefix + '/' + inputValue)) {
          message.error('ERROR: Filename exists');
        } else {
          this.props.onAddFileOrFolder(this.state.inputDialogData.extraData.levelPrefix, inputValue, true)
        }
        break
      case 'rename':
        this.props.onRenameFileOrFolder(this.state.inputDialogData.extraData.fileKey, inputValue, this.state.inputDialogData.extraData.levelPrefix)
        break
    }
  }

  handleInputDialogCancel = () => {
    this.setState({inputDialogEnabled: false})
  }

  handleConfirmDialogOk = async (e) => {
    // The following line should be await for updating the tree with new changes
    await this.setState({confirmDialogEnabled: false})
    switch(this.state.confirmDialogData.key) {
      case 'deleteFile':
        this.props.onDeleteFileOrFolder(this.state.confirmDialogData.extraData.fileKey)
        break
      case 'moveFile':
        this.props.onMoveFileOrFolder(this.state.confirmDialogData.extraData.dragPos, this.state.confirmDialogData.extraData.dropPos, this.state.confirmDialogData.extraData.levelPrefix)
        break
    }
  }

  handleConfirmDialogCancel = () => {
    this.setState({confirmDialogEnabled: false})
  }

  getNodeTreeRightClickMenu = () => {
    const { pageX, pageY, id } = { ...this.state.rightClickNodeTreeItem };
    const tmpStyle = {
      position: 'absolute',
      left: `${pageX}px`,
      top: `${pageY - 130}px`,
      display: this.state.contextMenuVisible? 'block' : 'none',
      background:'white',
      width:'150px',
      border:'1px solid #D7D7D7'
    };
    const menu = (
      <div style={tmpStyle} onMouseLeave={this.hideContextMenu}>
        <Menu onClick={this.handleContextMenuClick}>
          <Menu.Item key='newFile'>New File</Menu.Item>
          <Menu.Item key='newFolder'>New Folder</Menu.Item>
          <Menu.Item key='rename'>Rename</Menu.Item>
          <Menu.Item key='delete'>Delete</Menu.Item>
          <Menu.Item key='duplicate'>Duplicate</Menu.Item>
          <Menu.Item key='copy'>Copy</Menu.Item>
          {
            this.state.copiedFile
            ? (
              <Menu.Item key='paste'>Paste</Menu.Item>
            ) : null
          }
          {
            this.state.copiedFile && this.state.copiedFile.extraInfo.type === 'file'
            ? (
              <Menu.Item key='pasteRef'>Paste Reference</Menu.Item>
            ) : null
          }
        </Menu>
      </div>
    );
    return this.state.rightClickNodeTreeItem.pageX=="" ? '' : menu;
  };

  render() {
    
    return (
      <>
      <Modal
        title={this.state.inputDialogData.title}
        visible={this.state.inputDialogEnabled}
        onOk={this.handleInputDialogOk}
        onCancel={this.handleInputDialogCancel}
      >
        <Input
          value={this.state.inputDialogValue}
          onChange={(e) => this.setState({inputDialogValue: e.target.value})}
          ref={input => {
            this.inputDialogRef = input
          }}
        />
      </Modal>
      <Modal
        title={this.state.confirmDialogData.title}
        visible={this.state.confirmDialogEnabled}
        onOk={this.handleConfirmDialogOk}
        onCancel={this.handleConfirmDialogCancel}
      >
        {this.state.confirmDialogData.description}
      </Modal>
      <Tree
        showIcon
        checkable
        onExpand={this.onExpand}
        expandedKeys={this.state.expandedKeys}
        autoExpandParent={this.state.autoExpandParent}
        onCheck={this.onCheck}
        checkedKeys={this.state.checkedKeys}
        onSelect={this.onSelect}
        selectedKeys={this.state.selectedKeys}
        treeData={this.state.treeDataArray}
        draggable
        onDragEnter={this.onDragEnter}
        onDrop={this.onDrop}
        onRightClick={this.handleTreeNodeRightClick}
      />
      {this.getNodeTreeRightClickMenu()}
      </>
    )
  }
}

export default FolderBrowser;
