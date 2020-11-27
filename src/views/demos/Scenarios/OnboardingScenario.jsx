/*!

=========================================================
* Argon Dashboard React - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";

import { Input, Button, Spin, Steps, Popover, Typography, Result, message, Row, Col, Card } from 'antd';
import { BulbTwoTone } from '@ant-design/icons';
import 'antd/dist/antd.css';

const { Text } = Typography;

const { Step } = Steps;

const sampleQuoteCurlRequest = `curl 'http://localhost:5000/quotes' -H 'content-type: application/vnd.interoperability.quotes+json;version=1.0' -H 'accept: application/vnd.interoperability.quotes+json;version=1.0' -H 'date: Thu, 22 Oct 2020 17:21:59 GMT' -H 'traceparent: 00-aabb514e74ace273a9eb5a041cb847a9-0123456789abcdef0-00' -H 'user-agent: axios/0.19.2' --data-binary '{"quoteId":"a43069ff-09f2-418d-9136-3a3a92d0285f","transactionId":"fad9d6cf-d367-4ae6-be8d-f7eacad6fe72","payer":{"partyIdInfo":{"partyIdType":"MSISDN","partyIdentifier":"44123456789","fspId":"testingtoolkitdfsp"},"personalInfo":{"complexName":{"firstName":"Firstname-Test","lastName":"Lastname-Test"},"dateOfBirth":"1984-01-01"}},"payee":{"partyIdInfo":{"partyIdType":"MSISDN","partyIdentifier":"27713803912","fspId":"testingtoolkitdfsp"}},"amountType":"SEND","amount":{"amount":"100","currency":"USD"},"transactionType":{"scenario":"TRANSFER","initiator":"PAYER","initiatorType":"CONSUMER"},"note":"test"}' --compressed`
const sampleErrorResponseJson = {
  "status": 400,
  "statusText": "Bad Request",
  "body": {
    "errorInformation": {
      "errorCode": "3100",
      "errorDescription": "should have required property 'fspiop-source'",
      "extensionList": [
        {
          "key": "keyword",
          "value": "required"
        },
        {
          "key": "dataPath",
          "value": ".header"
        },
        {
          "key": "missingProperty",
          "value": "fspiop-source"
        }
      ]
    }
  },
  "headers": {
    "content-type": "application/vnd.interoperability.quotes+json;version=1.0",
    "cache-control": "no-cache",
    "content-length": "250",
    "date": "Thu, 22 Oct 2020 17:36:35 GMT",
    "connection": "close"
  }
}

const steps = [
  {
    title: 'DFSP Id',
    content: (
      <>
      <Row className="mt-5">
        <Col className="text-center" span={24}>
          <span className="h3">Hi I am a DFSP. My id is <i>'testingtoolkit'</i>
          <br />
          <br />
          May I know your's? </span>
        </Col>
      </Row>
      <Row className="mt-5 mb-5">
        <Col className="text-center pl-5 pr-5" span={24}>
          <Input placeholder="Your DFSPID" />
        </Col>
      </Row>
      </>
    ),
  },
  {
    title: 'Callback Endpoint',
    content: (
      <>
      <Row className="mt-5">
        <Col className="text-center" span={24}>
          <span className="h3">I stay at IP <i>'localhost'</i>, Port <i>'5000'</i>.
          <br />
          <br />
          Where do you stay? </span>
        </Col>
      </Row>
      <Row className="mt-5 mb-5">
        <Col className="text-center pl-5" span={12}>
          <Input placeholder="Host / IP Address" />
        </Col>
        <Col className="text-center pl-2 pr-5">
          <Input placeholder="Port" span={12} />
        </Col>
      </Row>
      </>
    ),
  },
  {
    title: 'Inbound Transfer',
    content: (
      <>
      <Row className="mt-5">
        <Col className="text-center" span={24}>
          <span className="h3">Can you initiate a transfer of <i>'USD $10'</i> to me?</span>
        </Col>
      </Row>
      <Row className="mt-3 mb-3">
        <Col className="text-center" span={8}>
          <Button type='primary'>Sure</Button>
        </Col>
        <Col className="text-center" span={8}>
          <Popover content={(<p className="bg-dark text-white text-left">{sampleQuoteCurlRequest}</p>)} title="Send the following request to localhost:5000" trigger="hover">
            <Button>Show me how</Button>
          </Popover>

        </Col>
        <Col className="text-center" span={8}>
          <Button>I'm Sorry</Button>
        </Col>
      </Row>
      <Row className="mt-5 mb-5">
        <Col className="text-center" span={24}>
          <Spin size="large" />
        </Col>
      </Row>
      </>
    ),
  },
  {
    title: 'Error Case',
    content: (
      <>
      <Row className="mt-3 mb-3">
        <Col className="text-center" span={12}>
          <Result
            status="500"
            title="Whoops"
            subTitle="400 Bad Request"
          />
        </Col>
        <Col className="text-center" span={12}>
          <pre className="text-danger text-left">{JSON.stringify(sampleErrorResponseJson, null, 2)}</pre>
        </Col>
      </Row>
      <Row className="mt-2 mb-2">
        <Col className="text-center" span={24}>
          <span className="h3">Don't worry, <i>please try again?</i></span>
        </Col>
      </Row>
      <Row className="mt-2 mb-3">
        <Col className="text-center" span={24}>
          <Spin size="large" />
        </Col>
      </Row>
      </>
    ),
  },
  {
    title: 'Success Case',
    content: (
      <>
      <Row className="mt-3 mb-2">
        <Col className="text-center" span={24}>
          <Result
            status="success"
            title="Hurray, I got the amount 'USD $10'"
            subTitle="Thank you"
          />
        </Col>
      </Row>
      <Row className="mb-2">
        <Col className="text-center" span={24}>
          <span className="h3">Let me send it back</span>
        </Col>
      </Row>
      <Row className="m-5">
        <Col className="text-center" span={12}>
          <Button type='primary'>Sure</Button>
        </Col>
        <Col className="text-center" span={12}>
          <Button>Don't mind</Button>
        </Col>
      </Row>
      </>
    ),
  },
];


class OnboardingScenario extends React.Component {

  constructor() {
    super();
    this.state = {
      current: 0,
    };
  }

  componentDidMount() {

  }

  next() {
    const current = this.state.current + 1;
    this.setState({ current });
  }

  prev() {
    const current = this.state.current - 1;
    this.setState({ current });
  }

  onChange = current => {
    console.log('onChange:', current);
    this.setState({ current });
  }
  
  render() {
    const { current } = this.state;
    return (
      <>
          <Row>
            <Col span={24}>
              <Card title="Scenario">
                  <Steps current={current} onChange={this.onChange}>
                    {steps.map(item => (
                      <Step key={item.title} title={item.title} />
                    ))}
                  </Steps>
                  <div className="steps-content">{steps[current].content}</div>
                  <div className="steps-action">
                    {current < steps.length - 1 && (
                      <Button type="primary" onClick={() => this.next()}>
                        Next
                      </Button>
                    )}
                    {current === steps.length - 1 && (
                      <Button type="primary" onClick={() => message.success('Processing complete!')}>
                        Done
                      </Button>
                    )}
                    {current > 0 && (
                      <Button style={{ margin: '0 8px' }} onClick={() => this.prev()}>
                        Previous
                      </Button>
                    )}
                  </div>
              </Card>
            </Col>
          </Row>
      </>
    );
  }
}

export default OnboardingScenario;
