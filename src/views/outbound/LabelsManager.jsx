/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * ModusBox
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react';
import { Select, Tag } from 'antd';

class LabelsManager extends React.Component {
    constructor() {
        super();
        this.state = {
            labelsMapping: null,
        };
    }

    componentDidMount = () => {
        this.updateLabelsMapping();
    };

    componentDidUpdate = () => {
        this.updateLabelsMapping();
    };

    updateLabelsMapping = () => {
        if(this.props.selectedFiles && (JSON.stringify(this.state.labelsMapping || {}) !== JSON.stringify(this.props.labelsManager.mapping || {}))) {
            this.setState({
                labelsMapping: this.props.labelsManager.mapping,
            });
            this.handleSelectionLabelsChanged({ selectedLabels: this.props.labelsManager.selectedLabels });
        }
    };

    handleSelectionLabelsChanged = async props => {
        if(props.selectedLabels) {
            if(this.props.selectedFiles) {
                const selectedFilesByLabel = [];
                for(let i = 0; i < props.selectedLabels.length; i++) {
                    const label = props.selectedLabels[i];
                    if(this.props.labelsManager.mapping[label]) {
                        selectedFilesByLabel.push(...this.props.labelsManager.mapping[label]);
                    }
                }
                const selectedFiles = [];
                if(selectedFilesByLabel.length > this.props.labelsManager.selectedFiles.length) {
                    for(let i = 0; i < selectedFilesByLabel.length; i++) {
                        if(!this.props.selectedFiles.includes(selectedFilesByLabel[i])) {
                            selectedFiles.push(selectedFilesByLabel[i]);
                        }
                    }
                    selectedFiles.push(...this.props.selectedFiles);
                } else {
                    for(let i = 0; i < this.props.selectedFiles.length; i++) {
                        const selectedFile = this.props.selectedFiles[i];
                        if(selectedFilesByLabel.includes(selectedFile) || !this.props.labelsManager.selectedFiles.includes(selectedFile)) {
                            selectedFiles.push(selectedFile);
                        }
                    }
                }
                props.selectedFiles = selectedFiles;
                this.props.labelsManager.selectedFiles = selectedFilesByLabel;
            }
        }
        this.props.onSelect(props);
    };

    getLabelsOptions = (labels, selectedLabels) => {
        if(selectedLabels) {
            labels = labels.filter(label => !selectedLabels.includes(label.name));
        }

        return labels.map(label => {
            return {
                label: label.name + ' - ' + label.description,
                value: label.name,
            };
        });
    };

    getLabelByName = labelName => {
        return this.props.labelsManager.labels.filter(label => label.name === labelName);
    };

    render() {
        return (
            <Select
                mode='multiple'
                placeholder='Select Labels'
                value={this.props.labelsManager.selectedLabels}
                tagRender={props => {
                    const label = this.props.labelsManager.labels.find(label => label.name === props.value);
                    if(label) {
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
                        );
                    }
                }}
                onChange={selectedLabels => {
                    this.handleSelectionLabelsChanged({ selectedLabels });
                }}
                options={this.getLabelsOptions([...this.props.labelsManager.labels], this.props.labelsManager.selectedLabels)}
                style={{ width: '100%' }}
            />
        );
    }
}

export default LabelsManager;
