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

// reactstrap components
import {
  Card,
  CardBody,
  FormGroup,
  CardHeader,
  Form,
  Input,
  Container,
  Row,
  Button,
  Col
} from "reactstrap";
// core components
import Header from "components/Headers/Header.jsx";
import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import ace from 'brace';
import 'brace/mode/json';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night_blue';
import axios from 'axios';
import './fixAce.css';
import ConditionBuilder from './ConditionBuilder'
import EventBuilder from './EventBuilder'


class RulesCallback extends React.Component {

  constructor() {
    super();
    this.state = {
      origJson: [],
      curJson: {},
      rule: {},
      conditions: {},
      event: {}
    };
  }

  componentWillMount() {
    // this.getData()
  }

  getRule = () => {
    const rule = {
      conditions: this.state.conditions,
      event: this.state.event
    }
    return JSON.stringify(rule, null, 2)
  }

  handleConditionsChange = (conditions) => {
    this.setState({conditions});
  };

  handleEventChange = (event) => {
    this.setState({event});
  };

  getData = async () => {
    const response = await axios.get("http://localhost:5050/api/rules/callback")
      this.setState(  { origJson: [ ...response.data ] } )
      // this.refs.editor.jsonEditor.update(this.state.origJson)
  }

  // handleChange = (json) => {
  //   // this.setState( { curJson: json } )
  // }
  // handleError = (error) => {
  //   console.log(error)
  // }
  handleSave = () => {
    const newJson = this.refs.editor.jsonEditor.get()
    // this.setState( { curJson: [ ...newJson ]} )
    axios.put("http://localhost:5050/api/rules/callback", newJson, { headers: { 'Content-Type': 'application/json' } })
  }

  logrule = (rule) => {
    console.log(rule)
  }

  render() {
    return (
      <>
        <Header />
        {/* Page content */}
        <Container className="mt--7"  fluid>
          {/* <Editor
            ref="editor"
            value={ this.state.origJson }
            ace={ace}
            theme="ace/theme/tomorrow_night_blue"
            mode="code"
            search={false}
            statusBar={false}
            navigationBar={false}
            // onChange={this.handleChange}
            // onError={this.handleError}
            
          />
          <Button
            className="mt-2" 
            color="info"
            href="#pablo"
            onClick={this.handleSave}
          >
            Save
          </Button>  */}
        </Container>
        <Container className="mt--7" fluid>
          <Row>
            <Col className="order-xl-2 mb-5 mb-xl-0" xl="6">
              <Card className="card-profile shadow">
                <CardHeader className="text-center border-0 pt-8 pt-md-4 pb-0 pb-md-4">
                  <div className="d-flex justify-content-between">
                    <Button
                      className="mr-4"
                      color="info"
                      href="#pablo"
                      onClick={e => e.preventDefault()}
                      size="sm"
                    >
                      Validate
                    </Button>
                    <Button
                      className="float-right"
                      color="default"
                      href="#pablo"
                      onClick={e => e.preventDefault()}
                      size="sm"
                    >
                      Save
                    </Button>
                  </div>
                </CardHeader>
                <CardBody className="pt-0 pt-md-4">
                  <div className="text-left">
                    <pre>{this.getRule()}</pre>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col className="order-xl-1" xl="6">
              <Card className="bg-secondary shadow">
                <CardHeader className="bg-white border-0">
                  <Row className="align-items-center">
                    <Col xs="8">
                      <h3 className="mb-0">Rule #1</h3>
                    </Col>
                    <Col className="text-right" xs="4">
                      <Button
                        color="danger"
                        href="#pablo"
                        onClick={e => e.preventDefault()}
                        size="sm"
                      >
                        Reset
                      </Button>
                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  <Form>
                    <h6 className="heading-small text-muted mb-4">
                      Conditions
                    </h6>
                    <div className="pl-lg-4">
                    {/* <ruleBuilder className="mt-7" fields={this.fields} onruleChange={this.logrule}
                      controlElements = {
                        {
                          combinatorSelector: (props) => <Input type='select'  />,
                          addRuleAction: Button,
                          addGroupAction: Button,
                          valueEditor: Input
                        }
                        
                      }
                    />    */}
                    <ConditionBuilder onChange={this.handleConditionsChange} />

                      {/* <Row>
                        <Col lg="6">
                          <FormGroup>
                         
                            <label
                              className="form-control-label"
                              htmlFor="input-username"
                            >
                              Username
                            </label>
                            <Input
                              className="form-control-alternative"
                              defaultValue="lucky.jesse"
                              id="input-username"
                              placeholder="Username"
                              type="text"
                            />
                          </FormGroup>
                        </Col>
                        <Col lg="6">
                          <FormGroup>
                            <label
                              className="form-control-label"
                              htmlFor="input-email"
                            >
                              Email address
                            </label>
                            <Input
                              className="form-control-alternative"
                              id="input-email"
                              placeholder="jesse@example.com"
                              type="email"
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col lg="6">
                          <FormGroup>
                            <label
                              className="form-control-label"
                              htmlFor="input-first-name"
                            >
                              First name
                            </label>
                            <Input
                              className="form-control-alternative"
                              defaultValue="Lucky"
                              id="input-first-name"
                              placeholder="First name"
                              type="text"
                            />
                          </FormGroup>
                        </Col>
                        <Col lg="6">
                          <FormGroup>
                            <label
                              className="form-control-label"
                              htmlFor="input-last-name"
                            >
                              Last name
                            </label>
                            <Input
                              className="form-control-alternative"
                              defaultValue="Jesse"
                              id="input-last-name"
                              placeholder="Last name"
                              type="text"
                            />
                          </FormGroup>
                        </Col>
                      </Row> */}
                    </div>
                    <hr className="my-4" />
                    {/* Address */}
                    <h6 className="heading-small text-muted mb-4">
                      Event
                    </h6>
                    <EventBuilder onChange={this.handleEventChange} />
                    <hr className="my-4" />
                    {/* Description */}
                    <h6 className="heading-small text-muted mb-4">Rule Details</h6>
                    <div className="pl-lg-4">
                      <FormGroup>
                        <label>Rule Description</label>
                        <Input
                          className="form-control-alternative"
                          placeholder="A few words about the rule ..."
                          rows="4"
                          defaultValue="This is sample description about this rule"
                          type="textarea"
                        />
                      </FormGroup>
                    </div>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </>
    );
  }
}

export default RulesCallback;
