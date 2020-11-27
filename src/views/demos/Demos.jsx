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
import React from "react";
import { Button, Row, Col, Modal } from 'antd';
import MobileSimulator from "./MobileSimulator/MobileSimulator.jsx";
import OnboardingScenario from "./Scenarios/OnboardingScenario.jsx";


class Demos extends React.Component {
  state = {
    demoSelected: null
  }

  componentDidMount = async () => {
  }

  getDemo = () => {
    switch(this.state.demoSelected) {
      case 'mobileSimulator':
        return <MobileSimulator />
      case 'onboardingScenario':
        return <OnboardingScenario />
      default:
        return null
    }
  }

  render() {
    return (
      <>
      <Modal
        style={{ top: 10 }}
        bodyStyle={{ height: '92vh', overflow: "auto", padding: 0 }}
        destroyOnClose
        forceRender
        width='100%'
        title="Demo"
        visible={this.state.demoSelected? true : false}
        footer={null}
        onCancel={() => { this.setState({demoSelected: null})}}
      >
        {this.getDemo()}
      </Modal>
      <Row className='my-4'>
        <Col span={24} className='text-center'>
          <Button className='mx-auto' type='primary'
            onClick={() => {
              this.setState({demoSelected: 'onboardingScenario'})
            }}
          >
            Onboarding Scenario
          </Button>
          <Button className='ml-4' type='primary'
            onClick={() => {
              this.setState({demoSelected: 'mobileSimulator'})
            }}
          >
            Mobile Simulator
          </Button>
        </Col>
      </Row>
      </>
    );
  }
}

export default Demos;
