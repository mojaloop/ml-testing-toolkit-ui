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
import { NavLink as NavLinkRRD, Link } from "react-router-dom";

import { Layout, Row, Col, Menu, Typography } from 'antd'
import logo from '../../assets/img/mojaloop.png';

const { Text, Title } = Typography;
const { Sider } = Layout;


var ps;

class Sidebar extends React.Component {
  state = {
    collapseOpen: false
  };
  constructor(props) {
    super(props);
    this.activeRoute.bind(this);
  }
  // verifies if routeName is the one active (in browser input)
  activeRoute(routeName) {
    return this.props.location.pathname.indexOf(routeName) > -1 ? "active" : "";
  }
  // toggles collapse between opened and closed (true/false)
  toggleCollapse = () => {
    this.setState({
      collapseOpen: !this.state.collapseOpen
    });
  };
  // closes the collapse
  closeCollapse = () => {
    this.setState({
      collapseOpen: false
    });
  };
  // creates the links that appear in the left menu / Sidebar
  createLinks = routes => {
    return routes.map((prop, key) => {
      return (
        <Menu.Item key={key} icon={prop.icon}>
          <Link
            className="text-uppercase d-none d-lg-inline-block"
            to={prop.layout + prop.path}
          >
            {prop.name}<br /> {prop.subTitle}
          </Link>
        </Menu.Item>
      );
    });
  };
  render() {
    const { routes } = this.props;

    return (
      <Sider
        width={250}
        style={{
          height: '100vh',
          background: '#fff'
        }}
      >
        <Row className="pt-0">
          <Col span={4}></Col>
          <Col span={16} className="text-center">
          <img
            alt="Mojaloop"
            className="img-fluid"
            src={logo}
          />
          </Col>
          <Col span={4}></Col>
        </Row>
        <Row>
          <Col span={24} className="text-center">
            <Title level={4} className="font-weight-light">Testing Toolkit</Title>
          </Col>
        </Row>
        <Menu className="mt-4" mode="inline"
          selectedKeys={[this.state.current]}
        >
          {this.createLinks(routes)}
        </Menu>
      </Sider>
    );
  }
}

export default Sidebar;
