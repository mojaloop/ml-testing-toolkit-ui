import React from "react";
import _ from 'lodash';
// core components
// import axios from 'axios';
// import { FileTwoTone, FileImageTwoTone, FilePdfTwoTone, EditTwoTone, FolderTwoTone, FolderOpenTwoTone, DeleteTwoTone, LoadingOutlined } from '@ant-design/icons';
import { Button, Tree } from 'antd';

import 'antd/dist/antd.css';

const { DirectoryTree } = Tree;


class FolderBrowser extends React.Component {
  constructor () {
    super()
    this.state = {
      files: [],
      expandedKeys: [],
      checkedKeys: [],
      selectedKeys: [],
      autoExpandParent: true,
      rootNodeKey: ''
    }
  }

  componentDidMount = () => {
    this.setState({checkedKeys: this.props.selectedFiles, expandedKeys: [this.state.rootNodeKey]})
  }

  componentWillUpdate = () => {
    this.state.checkedKeys = this.props.selectedFiles
  }

  onExpand = expandedKeys => {
    // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.
    this.setState({expandedKeys, autoExpandParent: false})
  };

  onCheck = checkedKeys => {
    const selectedFiles = checkedKeys.filter(item => item.endsWith('.json'))
    this.props.onSelect(selectedFiles)
    this.setState({checkedKeys})
  };

  onSelect = (selectedKeys, info) => {
    this.setState({selectedKeys})
  };

  generateTreeData = () => {
    // Form the object tree based from the array of paths
    var fileTree = {};
    function mergePathsIntoFileTree(prevDir, currDir, i, filePath) {
      if (i === filePath.length - 1) {
        prevDir[currDir] = 'file';
      }
      if (!prevDir.hasOwnProperty(currDir)) {
        prevDir[currDir] = {};
      }
      return prevDir[currDir];
    }
    function parseFilePath(filePath) {
      var fileLocation = filePath.split('/');
      // If file is in root directory, eg 'index.js'
      if (fileLocation.length === 1) {
        return (fileTree[fileLocation[0]] = 'file');
      }
      fileLocation.reduce(mergePathsIntoFileTree, fileTree);
    }
    this.props.folderData.map(item => item.path).forEach(parseFilePath);

    // Form the array from the object fileTree
    function processFileOrFolder(inputItem, inputArray, prefix = '') {
      for (const fileOrFolderItem in inputItem) {
        if(inputItem[fileOrFolderItem] === 'file') {
          inputArray.push({ key: (prefix ? (prefix + '/') : '') + fileOrFolderItem, title: fileOrFolderItem, isLeaf: true })
        } else {
          var children = []
          processFileOrFolder(inputItem[fileOrFolderItem], children, (prefix ? (prefix + '/') : '') + fileOrFolderItem)
          inputArray.push({ key: (prefix ? (prefix + '/') : '') + fileOrFolderItem, title: fileOrFolderItem, children: children })
        }
      }
    }
    let treeDataArray = []
    processFileOrFolder(fileTree, treeDataArray)
    this.state.rootNodeKey = treeDataArray[0] && treeDataArray[0].key
    return treeDataArray;

  }


  render() {
    
    return (
      <>
      <Tree
        checkable
        onExpand={this.onExpand}
        expandedKeys={this.state.expandedKeys}
        autoExpandParent={this.state.autoExpandParent}
        onCheck={this.onCheck}
        checkedKeys={this.state.checkedKeys}
        onSelect={this.onSelect}
        selectedKeys={this.state.selectedKeys}
        treeData={this.generateTreeData()}
      />
      </>
    )
  }
}

export default FolderBrowser;
