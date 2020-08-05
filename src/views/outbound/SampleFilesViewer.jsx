import React from "react";
import _ from 'lodash';
import './react-keyed-file-browser.css'
// core components
// import axios from 'axios';
import { FileTwoTone, FileImageTwoTone, FilePdfTwoTone, EditTwoTone, FolderTwoTone, FolderOpenTwoTone, DeleteTwoTone, LoadingOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';

import Moment from 'moment'
import FileBrowser from 'react-keyed-file-browser'

const parseCurl = require('../../utils/curlParser').default

String.prototype.removePrefix = function (prefix) {
  const hasPrefix = this.indexOf(prefix) === 0;
  return hasPrefix ? this.substr(prefix.length) : this.toString();
}

// const { Option } = Select;
// const { TextArea } = Input


class SampleFilesViewer extends React.Component {
  // state = {
  //   files: [
  //     {
  //       key: 'photos/animals/cat in a hat.png',
  //       modified: +Moment().subtract(1, 'hours'),
  //       size: 1.5 * 1024 * 1024,
  //     }
  //   ],
  // }
  constructor () {
    super()
    this.state = {
      files: []
    }
  }

  componentDidMount = () => {

    this.setState({ files: this.props.files.map( ({key, ...remainingProps}) => {
      if (this.props.prefix && key.startsWith(this.props.prefix)) {
        return {
          key: key.removePrefix(this.props.prefix),
          ...remainingProps
        }
      } else {
        return {key, ...remainingProps}
      }
    }) })
  }

  render() {
    return (
      <FileBrowser
        ref="fileBrowser"
        files={this.state.files}
        icons={{
          File: <FileTwoTone style={{ fontSize: "20px", "padding-right": "5px" }} />,
          Image: <FileImageTwoTone style={{ fontSize: "20px", "padding-right": "5px" }} />,
          PDF: <FilePdfTwoTone style={{ fontSize: "20px", "padding-right": "5px" }} />,
          Rename: <EditTwoTone style={{ fontSize: "20px", "padding-right": "5px" }} />,
          Folder: <FolderTwoTone style={{ fontSize: "20px", "padding-right": "5px" }} />,
          FolderOpen: <FolderOpenTwoTone style={{ fontSize: "20px", "padding-right": "5px" }} />,
          Delete: <DeleteTwoTone style={{ fontSize: "20px", "padding-right": "5px" }} />,
          Loading: <LoadingOutlined style={{ fontSize: "20px", "padding-right": "5px" }} />,
        }}
        detailRenderer={() => null}
        showFoldersOnFilter={false}
        onSelectFile = {() => {
          if (this.refs.fileBrowser.ref.current.state.selection.length > 0) {
            this.props.onChange(this.refs.fileBrowser.ref.current.state.selection.map(item => {
              if(this.props.prefix) {
                return this.props.prefix + item
              } else {
                return item
              }
            }))
          }
        }}
      />
    )
  }
}

export default SampleFilesViewer;
