import React, {useEffect} from "react";
import _ from 'lodash';
import { FileTwoTone, TagTwoTone, FolderTwoTone, FolderOpenTwoTone, DownOutlined } from '@ant-design/icons';
import { Button, Tree, Popconfirm, Input, Menu, Modal, Row, Col } from 'antd';
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
      }
    }
  }

  componentDidMount = () => {
    this.convertFolderData(this.props.folderData)
    this.state.treeDataArray = this.props.folderData
    this.state.rootNodeKey = this.state.treeDataArray[0] && this.state.treeDataArray[0].key
    this.setState({checkedKeys: this.props.selectedFiles, expandedKeys: [this.state.rootNodeKey]})
  }

  componentWillUpdate = () => {
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
      if (dragPos.length === dropPos.length ) {
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
          if(this.state.rightClickNodeTreeItem.nodeRef.isLeaf()) {
            levelPrefix = levelInfo.levelPrefix
          }
          await this.setState({inputDialogEnabled: true, inputDialogData: { title: 'Enter a file / folder name to create', key:e.key, extraData: { levelPrefix }}})
          this.inputDialogRef.focus()
          break
        }
      case "rename":
        {
          const fileKey = this.state.rightClickNodeTreeItem.nodeRef.props.eventKey
          await this.setState({inputDialogEnabled: true, inputDialogData: { title: 'Enter new file / folder name', key:e.key, extraData: { fileKey, levelPrefix: levelInfo.levelPrefix }}})
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
    }
  }

  handleInputDialogOk = async (e) => {
    const inputValue = this.state.inputDialogValue
    // The following line should be await for updating the tree with new changes
    await this.setState({inputDialogEnabled: false, inputDialogValue: ''})
    switch(this.state.inputDialogData.key) {
      case 'newFile':
        this.props.onAddFileOrFolder(this.state.inputDialogData.extraData.levelPrefix, inputValue, false)
        break
      case 'newFolder':
        this.props.onAddFileOrFolder(this.state.inputDialogData.extraData.levelPrefix, inputValue, true)
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
