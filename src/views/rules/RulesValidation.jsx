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
  Badge,
  Card,
  CardHeader,
  CardFooter,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  DropdownToggle,
  Media,
  Container,
  Row,
  UncontrolledTooltip,
  Button
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

class RulesValidation extends React.Component {

  constructor() {
    super();
    this.state = {
      origJson: [],
      curJson: {}
    }
  }

  componentWillMount() {
    this.getData()
  }

  getData = async () => {
    const response = await axios.get("http://localhost:5050/api/rules/validation")
      this.setState(  { origJson: [ ...response.data ] } )
      this.refs.editor.jsonEditor.update(this.state.origJson)
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
    axios.put("http://localhost:5050/api/rules/validation", newJson, { headers: { 'Content-Type': 'application/json' } })
  }

  render() {
    return (
      <>
        <Header />
        {/* Page content */}
        <Container className="mt--7"  fluid>
          <Editor
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
          </Button>
        </Container>

      </>
    );
  }
}

export default RulesValidation;
