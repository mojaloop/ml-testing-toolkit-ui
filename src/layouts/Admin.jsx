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
import { Route, Switch } from "react-router-dom";
// reactstrap components
import { Container } from "reactstrap";
// core components
import AdminNavbar from "../components/Navbars/AdminNavbar.jsx";
import AdminFooter from "../components/Footers/AdminFooter.jsx";
import Sidebar from "../components/Sidebar/Sidebar.jsx";

import routes from "../routes.js";
import getConfig from '../utils/getConfig'


class Admin extends React.Component {

  isAuthEnabled = getConfig().isAuthEnabled

  componentDidUpdate(e) {
    if (this.isAuthEnabled && !localStorage.getItem('JWT_COOKIE_EXP_AT')){
      return
    }
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    this.refs.mainContent.scrollTop = 0;
  }

  getRoutes = routes => {
    return routes.map((prop, key) => {
      if (prop.layout === "/admin") {
        return (
          <Route
            path={prop.layout + prop.path}
            component={prop.component}
            key={key}
          />
        );
      } else {
        return null;
      }
    });
  };
  getBrandText = path => {
    for (let i = 0; i < routes.length; i++) {
      if (
        this.props.location.pathname.indexOf(
          routes[i].layout + routes[i].path
        ) !== -1
      ) {
        return routes[i].name;
      }
    }
    return "Brand";
  };

  render() {
    if (localStorage.getItem('JWT_COOKIE_EXP_AT') || !this.isAuthEnabled) {
      return (
        <>
          <Sidebar
            {...this.props}
            routes={routes}
            logo={{
              innerLink: "/admin/index",
              imgSrc: require("../assets/img/brand/mojaloop.png"),
              imgAlt: "..."
            }}
          />
          <div className="main-content" ref="mainContent">
            <AdminNavbar
              {...this.props}
              brandText={this.getBrandText(this.props.location.pathname)}
            />
            <Switch>{this.getRoutes(routes)}</Switch>
            <Container fluid>
              <AdminFooter />
            </Container>
          </div>
        </>
      );
    } else {
      return (
        <>{this.props.history.push("/login")}</>
      )
    }
  }
}

export default Admin;
