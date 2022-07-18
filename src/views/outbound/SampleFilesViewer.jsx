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
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com>
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react'
import _ from 'lodash'
import './react-keyed-file-browser.css'
// core components
// import axios from 'axios';
import { FileTwoTone, FileImageTwoTone, FilePdfTwoTone, EditTwoTone, FolderTwoTone, FolderOpenTwoTone, DeleteTwoTone, LoadingOutlined } from '@ant-design/icons'
import 'antd/dist/antd.css'

import Moment from 'moment'
import FileBrowser from 'react-keyed-file-browser'

const parseCurl = require('../../utils/curlParser').default

String.prototype.removePrefix = function (prefix) {
  const hasPrefix = this.indexOf(prefix) === 0
  return hasPrefix ? this.substr(prefix.length) : this.toString()
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
    this.setState({
      files: this.props.files.map(({ key, ...remainingProps }) => {
        if (this.props.prefix && key.startsWith(this.props.prefix)) {
          return {
            key: key.removePrefix(this.props.prefix),
            ...remainingProps
          }
        } else {
          return { key, ...remainingProps }
        }
      })
    })
  }

  render () {
    return (
      <FileBrowser
        ref='fileBrowser'
        files={this.state.files}
        icons={{
          File: <FileTwoTone style={{ fontSize: '20px', 'padding-right': '5px' }} />,
          Image: <FileImageTwoTone style={{ fontSize: '20px', 'padding-right': '5px' }} />,
          PDF: <FilePdfTwoTone style={{ fontSize: '20px', 'padding-right': '5px' }} />,
          Rename: <EditTwoTone style={{ fontSize: '20px', 'padding-right': '5px' }} />,
          Folder: <FolderTwoTone style={{ fontSize: '20px', 'padding-right': '5px' }} />,
          FolderOpen: <FolderOpenTwoTone style={{ fontSize: '20px', 'padding-right': '5px' }} />,
          Delete: <DeleteTwoTone style={{ fontSize: '20px', 'padding-right': '5px' }} />,
          Loading: <LoadingOutlined style={{ fontSize: '20px', 'padding-right': '5px' }} />
        }}
        detailRenderer={() => null}
        showFoldersOnFilter={false}
        onSelect={() => {
          const selectedFiles = this.refs.fileBrowser.ref.current.state.selection.filter(item => item.endsWith('.json'))
          this.props.onChange(selectedFiles.map(item => {
            if (this.props.prefix) {
              return this.props.prefix + item
            } else {
              return item
            }
          }))
        }}
      />
    )
  }
}

export default SampleFilesViewer
