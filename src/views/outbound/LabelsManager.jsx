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
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com> (Original Author)
 --------------
 ******/
import React from "react";
import { Select, Tag } from 'antd';
import 'antd/dist/antd.css';


class LabelsManager extends React.Component {
  constructor () {
    super()
    this.state = {
      labelsMapping: {},
      selectedFilesByLabel: []
    }
  }

  componentDidMount = () => {
    this.updateLabelsMapping()
  }

  componentDidUpdate = () => {
    this.updateLabelsMapping()
  }

  updateLabelsMapping = () => {
    if ((this.state.labelsMapping !== this.props.labelsMapping)) {
      this.setState({
        labelsMapping: this.props.labelsMapping
      })
      this.handleSelectionLabelsChanged({selectedLabels: this.props.selectedLabels})
    }
  }

  handleSelectionLabelsChanged = async (props) => {
    if (props.selectedLabels) {
      const selectedFilesByLabel = []
      for (let i = 0; i < props.selectedLabels.length; i++) {
        const label = props.selectedLabels[i]
        if (this.props.labelsMapping[label]) {
          selectedFilesByLabel.push(...this.props.labelsMapping[label])
        }
      }
      if (this.props.selectedFiles) {
        if (this.props.clearSelectedLabels) {
          this.state.selectedFilesByLabel = []
          props.clearSelectedLabels = false
        }
        props.selectedFiles = []
        if (selectedFilesByLabel.length > this.state.selectedFilesByLabel.length) {
          for (let i = 0; i < selectedFilesByLabel.length; i++) {
            if (!this.props.selectedFiles.includes(selectedFilesByLabel[i])) {
              props.selectedFiles.push(selectedFilesByLabel[i])
            }
          }
          props.selectedFiles.push(...this.props.selectedFiles)
        } else {
          for (let i = 0; i < this.props.selectedFiles.length; i++) {
            const selectedFile = this.props.selectedFiles[i]
            if (selectedFilesByLabel.includes(selectedFile) || !this.state.selectedFilesByLabel.includes(selectedFile)) {
              props.selectedFiles.push(selectedFile)
            }
          }
        }
      }
      
      this.setState({selectedFilesByLabel})
      this.props.onSelect(props)
    }
  }

  getLabelsOptions = (labels, selectedLabels) => {
    if (selectedLabels) {
      labels = labels.filter(label => !selectedLabels.includes(label.name))
    }

    return labels.map(label => { return {
      label: label.name + " - " + label.description,
      value: label.name
    }})
  }

  getLabelByName = (labelName => {
    return this.props.labels.filter(label => label.name === labelName)
  })


  render() {
    
    return (
      <Select 
          mode="multiple"
          placeholder="Select Labels"
          value={this.props.selectedLabels}
          tagRender={(props) => {
            const label = this.props.labels.find(label => label.name === props.value)
            if (label) {
              return (
                <Tag 
                  color={label.color}
                  onMouseDown={event => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  closable={props.closable}
                  onClose={props.onClose}
                  style={{ marginRight: 3 }}
                >
                  {label.name}
                </Tag>
              )
            }
          }}
          onChange={selectedLabels => {
            this.handleSelectionLabelsChanged({selectedLabels})
          }}
          options={this.getLabelsOptions(this.props.labels, this.props.selectedLabels)}
          style={{width:'100%'}}
        />
    )
  }
}

export default LabelsManager;
