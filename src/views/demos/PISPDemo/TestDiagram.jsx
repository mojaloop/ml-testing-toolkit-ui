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

  * Pratap Pawar <iampratappawar@gmail.com> (Original Author)
 --------------
 ******/
 import React from 'react';
 import { Row, Col } from 'antd';
 import mermaid from 'mermaid';
 
 class TestDiagram extends React.Component {
     constructor() {
         super();
         this.state = {
             logs: [],
             lastLogTime: null,
             sequenceItems: [],
             seqSteps: '',
         };
         this.seqDiagContainer = React.createRef();
     }
 
     componentDidMount = async () => {
         this.resetWelcomeMessage();
     };
 
     clearSequence = async () => {
         this.setState({ seqSteps: '' }, this.refreshSequenceDiagram);
     };
 
     addSequence = async (source, destination, message, options = { dashed: false, erroneous: false, activation: { mode: null, peer: null } }) => {
         const dashedStyle = options.dashed ? '-' : '';
         let newSeqSteps = `${this.state.seqSteps}${source}-${dashedStyle}>>${destination}: ${message}\n`;
 
         if (options.activation && options.activation.mode && options.activation.peer && (options.activation.mode === 'activate' || options.activation.mode === 'deactivate')) {
             if (options.activation.peer === 'source') {
                 newSeqSteps += `${options.activation.mode} ${source}\n`;
             } else if (options.activation.peer === 'destination') {
                 newSeqSteps += `${options.activation.mode} ${destination}\n`;
             } else if (options.activation.peer === 'both') {
                 newSeqSteps += `${options.activation.mode} ${source}\n`;
                 newSeqSteps += `${options.activation.mode} ${destination}\n`;
             }
         }
 
         this.setState({ seqSteps: newSeqSteps }, this.refreshSequenceDiagram);
     };
 
     addNoteOver = async (source, destination, message) => {
         const newSeqSteps = `${this.state.seqSteps}Note over ${source},${destination}: ${message}\n`;
         this.setState({ seqSteps: newSeqSteps }, this.refreshSequenceDiagram);
     };
 
     addCustomSequence = async (seqText) => {
         const newSeqSteps = `${this.state.seqSteps}${seqText}\n`;
         this.setState({ seqSteps: newSeqSteps }, this.refreshSequenceDiagram);
     };
 
     refreshSequenceDiagram = async () => {
         const container = this.seqDiagContainer.current;
         if (container) {
             container.removeAttribute('data-processed');
             const code = 'sequenceDiagram\n' + this.state.seqSteps;
             try {
                 mermaid.parse(code);
                 container.innerHTML = code;
                 mermaid.init(undefined, container);
             } catch (e) {
                 console.error('Diagram generation error', e.str || e.message);
             }
         }
     };
 
     handleClearLogs = () => {
         this.setState({ sequenceItems: [], seqSteps: '' }, this.resetWelcomeMessage);
     };
 
     resetWelcomeMessage = () => {
         const container = this.seqDiagContainer.current;
         if (container) {
             container.innerHTML = '';
         }
     };
 
     render() {
         return (
             <>
                 <Row style={{ minHeight: '200px' }}>
                     <Col className="text-center" span={24}>
                         <div
                             ref={this.seqDiagContainer}
                         />
                     </Col>
                 </Row>
             </>
         );
     }
 }
 
 export default TestDiagram;
 