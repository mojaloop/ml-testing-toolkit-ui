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

  * Pratap Pawar <iampratappawar@gmail.com> (Original Author)
 --------------
 ******/
import React from 'react';
import { Row, Col, Typography, Result } from 'antd';
const { Title } = Typography;
 
class PayeeMobile extends React.Component {
    state = {
        receivedAmount: null,
        payerName: null,
        stage: null,
    };
 
    componentDidMount() {
        window.addEventListener('message', this.handlePaymentSuccess);
    }
 
    componentWillUnmount() {
        window.removeEventListener('message', this.handlePaymentSuccess);
    }
 
    handlePaymentSuccess = event => {
        if(event.data && event.data.type === 'PAYMENT_SUCCESS') {
            console.log('Received payment success message:', event.data);
            this.setState({
                receivedAmount: event.data.amount,
                payerName: event.data.payerName,
                stage: 'paymentSuccess',
            });
        }
    };
 
    getStageData = () => {
        switch (this.state.stage) {
            case 'paymentSuccess':
                return (
                    <Row className='mt-2'>
                        <Col span={24} className='text-center'>
                            <Result
                                status='success'
                                title={<span style={{ fontSize: '20px' }}>Received Payment</span>}
                                subTitle={`Received ${this.state.receivedAmount.amount} ${this.state.receivedAmount.currency} from ${this.state.payerName}`}
                            />
                        </Col>
                    </Row>
                );
            default:
                return (
                    <Row className='mt-4'>
                        <Col span={24} className='text-center'>
                            <Title level={3}>Welcome</Title>
                        </Col>
                    </Row>
                );
        }
    };
 
    render() {
        return (
            <>
                <Row className='mt-4' />
                {this.getStageData()}
            </>
        );
    }
}
 
export default PayeeMobile;