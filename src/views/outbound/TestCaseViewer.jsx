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
import _ from 'lodash';
 
// reactstrap components
import {
  Card,
  CardBody,
  CardHeader,
  Button,
} from "reactstrap";
// core components

import { Row, Col, Steps, Tag, Icon } from 'antd';

const { Step } = Steps;


class TestCaseViewer extends React.Component {

  constructor() {
    super();
    this.state = {
      addNewRequestDialogVisible: false,
      newRequestDescription: '',
    };
  }

  componentWillUnmount = () => {
  }
  
  componentDidMount = () => {

  }


  // getTestCaseDetailItems = () => {
  //   if (this.props.testCase.requests) {
  //     return this.props.testCase.requests.map(item => {
  //       const testStatus = item.status && item.tests && item.status.testResult ? item.status.testResult.passedCount + ' / ' + item.tests.assertions.length : ''
  //       const testStatusColor = item.status && item.tests && item.status.testResult && item.status.testResult.passedCount===item.tests.assertions.length ? '#87d068' : '#f50'
  //       return (
  //         <Col span={24 / (this.props.testCase.requests.length ? this.props.testCase.requests.length : 1)} className='text-left'>
  //           {
  //             item.status && (item.status.state === 'finish' || item.status.state === 'error')
  //             ? (
  //               <Tag color={testStatusColor} className='pl-3 pr-3 pt-1 pb-1 ml-6'>
  //                 {testStatus}
  //               </Tag>
  //             )
  //             : null
  //           }

  //         </Col>
  //       )
  //     })
  //   } else {
  //     return null
  //   }
  // }

  // getStepItems = () => {
  //   if (this.props.testCase.requests) {
  //     const stepItems = this.props.testCase.requests.map(item => {
  //       return (
  //         <Step status={item.status? item.status.state : null} title={item.method} subTitle={item.operationPath} description={item.description} />
  //       )
  //     })
  //     const spanCol = stepItems.length < 3 ? stepItems.length * 8 : 24
  //     return (
  //       <Row>
  //         <Col span={spanCol}>
  //           <Steps current={-1} type="navigation" size="default">
  //             {stepItems}
  //           </Steps>
  //         </Col>
  //       </Row>
  //     )
      
  //   } else {
  //     return null
  //   }
  // }

  getTestCaseItems = () => {
    if (this.props.testCase.requests) {
      const requestRows = this.props.testCase.requests.map(item => {
        const testStatus = item.status && item.tests && item.status.testResult ? item.status.testResult.passedCount + ' / ' + item.tests.assertions.length : ''
        const testStatusColor = item.status && item.tests && item.status.testResult && item.status.testResult.passedCount===item.tests.assertions.length ? '#87d068' : '#f50'
        return (
            <tr>
              <td className="align-text-top" width='25px'>
                  <Icon type="double-right" style={{ fontSize: '20px', color: '#08c' }}></Icon>
              </td>
              <td>
                <h3>{item.method.toUpperCase()+' '+item.operationPath}</h3> <p>{item.description}</p>
              </td>
              <td className='text-right align-top'>
                {
                  item.status && (item.status.state === 'finish' || item.status.state === 'error')
                  ? (
                    <Tag color={testStatusColor} className='ml-2'>
                      {testStatus}
                    </Tag>
                  )
                  : null
                }
              </td>
            </tr>
        )
      })
      return (
        <table width='100%' cellPadding="5px">
          <tbody>
            {requestRows}
          </tbody>
        </table>
      )
    } else {
      return null
    }
  }


  render() {

    return (
      <>
        <Row className="mb-2">
          <Col span={24}>
          <Card className="card-profile shadow">
            <CardHeader>
              {this.props.testCase.name}
            </CardHeader>
            <CardBody>
              {this.getTestCaseItems()}
              {/* {this.getStepItems()}
              {this.getTestCaseDetailItems()} */}
            </CardBody>
          </Card>
          </Col>
        </Row>
      </>
    );
  }
}

export default TestCaseViewer;