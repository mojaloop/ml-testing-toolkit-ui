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
import React from 'react'
import _ from 'lodash'

// core components

import { Row, Col, Typography, Tag } from 'antd'

import AceEditor from 'react-ace'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/theme-monokai'

const { Text, Paragraph } = Typography

class JsonEditor extends React.Component {
  constructor () {
    super()
    this.state = {
      editorText: '',
      errors: []
    }
  }

  componentDidMount () {
    this.setState({ errors: [], editorText: JSON.stringify(this.props.value, null, 2) })
  }

  handleChange = (newText) => {
    this.setState({ editorText: newText })
    // Validate the JSON
    try {
      const newJsonObject = JSON.parse(newText)
      this.setState({ errors: [] })
      this.props.onChange(newJsonObject)
    } catch (err) {
      const errors = []
      errors.push(err.message)
      this.setState({ errors })
    }
  }

  jsonEditor = {
    update: (newContent = null) => {
      if (!newContent) {
        newContent = this.props.value
      }
      this.setState({ errors: [], editorText: JSON.stringify(newContent, null, 2) })
    }
  }

  render () {
    const getErrorMessages = (errors) => {
      return errors.map(error => {
        return (
          <Text mark>{error}</Text>
        )
      })
    }

    return (
      <>
        <Row>
          <Col span={24}>
            <AceEditor
              ref='preReqScriptAceEditor'
              mode='json'
              theme='monokai'
              width='100%'
              value={this.state.editorText}
              onChange={this.handleChange}
              name='UNIQUE_ID_OF_DIV'
              wrapEnabled
              showPrintMargin
              showGutter
              tabSize={2}
              enableBasicAutocompletion
              enableLiveAutocompletion
            />
          </Col>
        </Row>
        <Row className='mt-2'>
          <Col span={24}>
            {
          this.state.errors.length > 0
            ? (
              <>
                <Row>
                  <Col span={24}>
                    <Tag color='red'>Changes are not saved</Tag>
                  </Col>
                </Row>
                <Row className='mt-1'>
                  <Col span={24}>
                    {getErrorMessages(this.state.errors)}
                  </Col>
                </Row>
              </>
              )
            : null
        }
          </Col>
        </Row>
      </>
    )
  }
}

export default JsonEditor
