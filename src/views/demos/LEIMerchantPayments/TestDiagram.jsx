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

 * Shuchita Prakash <skp.82603@gmail.com>
 --------------
 ******/
import React from 'react'

import { Row, Col } from 'antd'
import mermaid from 'mermaid'

class TestDiagram extends React.Component {
  newState = {
    logs: [],
    lastLogTime: null,
    sequenceItems: [],
    seqSteps: ''
  }

  constructor () {
    super()
    this.state = JSON.parse(JSON.stringify(this.newState))
    this.activeParticipants = new Set()
  }

  componentDidMount = async () => {
    this.resetWelcomeMessage()
    // Test basic Mermaid functionality
    this.testBasicMermaid()
  }

  testBasicMermaid = () => {
    setTimeout(() => {
      const testCode = `sequenceDiagram
    A->>B: Hello
    B->>A: World`
      console.log('Testing basic Mermaid:', testCode)

      try {
        mermaid.parse(testCode)
        console.log('Basic Mermaid syntax is valid')
      } catch (e) {
        console.error('Basic Mermaid test failed:', e)
        console.error('This indicates a Mermaid configuration or version issue')
      }
    }, 1000)
  }

  clearSequence = async (source, destination, message) => {
    this.state.seqSteps = ''
    this.activeParticipants.clear()
    this.refreshSequenceDiagram()
  }

  addSequence = async (source, destination, message, options = { dashed: false, erroneous: false, activation: { mode: null, peer: null } }) => {
    const dashedStyle = options.dashed ? '-' : ''
    // Sanitize components for Mermaid compatibility
    const sanitizedMessage = this.sanitizeMessage(message)
    const sanitizedSource = this.sanitizeParticipant(source)
    const sanitizedDestination = this.sanitizeParticipant(destination)

    this.state.seqSteps += `${sanitizedSource}-${dashedStyle}>>${sanitizedDestination}: ${sanitizedMessage}\n`

    // Handle activation more carefully to avoid mismatches
    if (options.activation && options.activation.mode && options.activation.peer && (options.activation.mode === 'activate' || options.activation.mode === 'deactivate')) {
      // Track active participants to avoid deactivation errors
      if (!this.activeParticipants) {
        this.activeParticipants = new Set()
      }

      if (options.activation.peer === 'source') {
        this.handleActivation(options.activation.mode, sanitizedSource)
      } else if (options.activation.peer === 'destination') {
        this.handleActivation(options.activation.mode, sanitizedDestination)
      } else if (options.activation.peer === 'both') {
        this.handleActivation(options.activation.mode, sanitizedSource)
        this.handleActivation(options.activation.mode, sanitizedDestination)
      }
    }
    this.refreshSequenceDiagram()
  }

  handleActivation = (mode, participant) => {
    if (mode === 'activate') {
      this.state.seqSteps += `${mode} ${participant}\n`
      this.activeParticipants.add(participant)
    } else if (mode === 'deactivate' && this.activeParticipants.has(participant)) {
      this.state.seqSteps += `${mode} ${participant}\n`
      this.activeParticipants.delete(participant)
    }
    // If trying to deactivate a participant that's not active, skip it
  }

  addNoteOver = async (source, destination, message) => {
    const sanitizedSource = this.sanitizeParticipant(source)
    const sanitizedDestination = this.sanitizeParticipant(destination)
    const sanitizedMessage = this.sanitizeMessage(message)
    this.state.seqSteps += `Note over ${sanitizedSource},${sanitizedDestination}: ${sanitizedMessage}\n`
    this.refreshSequenceDiagram()
  }

  addCustomSequence = async seqText => {
    // Sanitize custom sequence text to avoid Mermaid syntax errors
    if (!seqText) return

    const sanitizedText = seqText.toString()
      .replace(/rect\s+rgb\([^)]+\)/g, '') // Remove rect rgb() syntax
      .replace(/["'`]/g, '') // Remove quotes
      .replace(/end/g, '') // Remove 'end' keywords
      .trim()

    if (sanitizedText) {
      this.state.seqSteps += sanitizedText + '\n'
      this.refreshSequenceDiagram()
    }
  }

  refreshSequenceDiagram = async () => {
    if (!this.seqDiagContainer) return

    // Clear previous content
    this.seqDiagContainer.removeAttribute('data-processed')
    this.seqDiagContainer.innerHTML = ''

    const code = 'sequenceDiagram\n' + this.state.seqSteps

    // Debug: Log the generated Mermaid code
    console.log('=== MERMAID DEBUG ===')
    console.log('Generated code:', code)
    console.log('Raw seqSteps:', this.state.seqSteps)
    console.log('Code length:', code.length)
    console.log('=====================')

    try {
      // Test parsing first
      mermaid.parse(code)
      console.log('✅ Mermaid parse successful')

      // Initialize mermaid with safe config
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        sequence: {
          diagramMarginX: 50,
          diagramMarginY: 10,
          actorMargin: 50,
          width: 150,
          height: 65
        }
      })

      // Create a unique ID for this diagram
      const diagramId = 'mermaid-' + Date.now()

      // Use render method instead of init
      try {
        const { svg } = await mermaid.render(diagramId, code)
        this.seqDiagContainer.innerHTML = svg
        console.log('✅ Mermaid render successful')
      } catch (renderError) {
        console.log('⚠️ Render method failed, trying init method...')
        // Fallback to init method
        this.seqDiagContainer.innerHTML = code
        await mermaid.init(undefined, this.seqDiagContainer)
        console.log('✅ Mermaid init successful')
      }
    } catch (e) {
      console.error('❌ Mermaid error:', e)
      console.error('❌ Error type:', typeof e)
      console.error('❌ Error message:', e.message)
      console.error('❌ Error string:', e.str)
      console.error('❌ Full error object:', e)

      // Show the error and problematic code
      this.seqDiagContainer.innerHTML =
                '<div style="padding: 15px; border: 2px solid red; background: #ffebee; margin: 10px 0;">' +
                    '<h4 style="color: red; margin: 0 0 10px 0;">⚠️ Mermaid Syntax Error</h4>' +
                    '<div><strong>Error:</strong> ' + (e.message || e.str || 'Unknown error') + '</div>' +
                    '<details style="margin-top: 10px;">' +
                        '<summary>Show generated code</summary>' +
                        '<pre style="background: #f5f5f5; padding: 10px; overflow: auto;">' + code + '</pre>' +
                    '</details>' +
                '</div>'
    }
  }

  handleClearLogs = () => {
    this.state.sequenceItems = []
    this.refreshSequenceDiagram()
    this.resetWelcomeMessage()
    this.forceUpdate()
  }

  resetWelcomeMessage = () => {
    this.seqDiagContainer.innerHTML = ''
  }

  sanitizeParticipant = (text) => {
    // Sanitize participant names - must be valid Mermaid identifiers (no spaces)
    if (!text) return 'Unknown'

    let sanitized = text.toString()
      .replace(/[\n\r]/g, '') // Remove newlines
      .replace(/["']/g, '') // Remove quotes that can break syntax
      .replace(/[{}]/g, '') // Remove curly brackets
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[:;]/g, '') // Remove colons/semicolons
      .replace(/[()]/g, '') // Remove parentheses
      .replace(/[|\\]/g, '') // Remove pipes and backslashes
      .replace(/[#$%^&*+=~]/g, '') // Remove special characters that can break Mermaid
      .replace(/\s+/g, '_') // Replace spaces with underscores for participant names
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .trim() // Trim whitespace

    // Ensure we have a valid identifier
    if (!sanitized || sanitized.length === 0) {
      return 'Unknown'
    }

    // Ensure it starts with a letter or underscore (valid Mermaid participant name)
    if (!/^[a-zA-Z_]/.test(sanitized)) {
      sanitized = 'P_' + sanitized
    }

    return sanitized
  }

  sanitizeMessage = (text) => {
    // Sanitize messages - can have spaces but not special Mermaid syntax characters
    if (!text) return 'Unknown'

    return text.toString()
      .replace(/[\n\r]/g, ' ') // Replace newlines with spaces
      .replace(/["']/g, '') // Remove quotes that can break syntax
      .replace(/[{}]/g, '') // Remove curly brackets
      .replace(/[|\\]/g, '') // Remove pipes and backslashes
      .replace(/[#]/g, '') // Remove hash characters
      .replace(/--/g, '-') // Replace double dashes with single (can break Mermaid arrows)
      .replace(/>>/g, '&gt;&gt;') // Escape >> to prevent arrow syntax issues
      .replace(/->/g, '&rarr;') // Escape -> to prevent arrow syntax issues
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim() || // Trim whitespace
            'Unknown' // Fallback if empty
  }

  render () {
    return (
      <>
        {/* <Row>
          <Col span={24}>
          {
            this.state.sequenceItems.length > 0
            ? (
              <Button
                className="float-end"
                type="primary"
                danger
                onClick={this.handleClearLogs}
              >
                Clear
              </Button>
            )
            : null
          }
          </Col>
        </Row> */}
        <Row style={{ minHeight: '200px' }}>
          <Col className='text-center' span={24}>
            <div
              ref={div => {
                this.seqDiagContainer = div
              }}
            />
          </Col>
        </Row>
      </>
    )
  }
}

export default TestDiagram
