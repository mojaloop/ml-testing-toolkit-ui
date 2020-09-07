import React, {useEffect} from "react";
import _ from 'lodash';
import { FileTwoTone, TagTwoTone, FolderTwoTone, FolderOpenTwoTone } from '@ant-design/icons';
import { Button, Tree } from 'antd';

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
      treeDataArray: []
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
    if (this.state.treeDataArray !== this.props.folderData) {
      this.convertFolderData(this.props.folderData)
      this.state.treeDataArray = this.props.folderData
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


  render() {
    
    return (
      <>
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
      />
      </>
    )
  }
}

export default FolderBrowser;
