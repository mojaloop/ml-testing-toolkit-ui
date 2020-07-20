import React from "react";

import {
  FormGroup,
  FormControl,
  Button
} from "react-bootstrap";

import { withRouter, Redirect } from "react-router-dom";
import { message } from 'antd';
import getConfig from '../../utils/getConfig'

import "./Auth.scss";

const axios = require('axios').default

class Login extends React.Component {
  
  constructor() {
    super()
    this.state = {
      username: '',
      password: ''
    }
  }

  validateForm = () => {
    return this.state.username.length > 0 && this.state.password.length > 0;
  }

  handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { apiBaseUrl } = getConfig()
      axios.defaults.withCredentials = true
      const res = await axios.post(apiBaseUrl + '/api/oauth2/login/', {
        username: this.state.username,
        password: this.state.password
      }, { headers: { 'Content-Type': 'application/json' } })
      if (res.status === 200) {
        this.props.handleLogin(e, res.data.token.payload)
        message.success({ content: 'login successful', key: 'login', duration: 1 });
        this.props.history.push("/admin/index")
        return
      }
    } catch (err) {}
    message.error({ content: 'login failed', key: 'login', duration: 3 });
  }

  render() {
    return (
      <div className="auth">
        <form className="auth__form" onSubmit={async e => {await this.handleSubmit(e)}}>
          <FormGroup className="auth__form__username" controlId="username" bsSize="large">
            <label>Username</label>
            <FormControl
              autoFocus
              type="text"
              value={this.state.username}
              onChange={e => this.setState({username: e.target.value})}
            />
          </FormGroup>
          <FormGroup className="auth__form__password"  controlId="password" bsSize="large">
            <label>Password</label>
            <FormControl
              value={this.state.password}
              onChange={e => this.setState({password: e.target.value})}
              type="password"
            />
          </FormGroup>
          <Button className="auth__form__submit__btn" block bsSize="large" disabled={!this.validateForm()} type='submit'>
            Login
          </Button>
        </form>
      </div>
    )
  }
}

export default withRouter(Login)


// class Login extends React.Component {
//   render() {
//     return (
//       <>
//         <Col lg="5" md="7">
//           <Card className="bg-secondary shadow border-0">
//             <CardHeader className="bg-transparent pb-5">
//               <div className="text-muted text-center mt-2 mb-3">
//                 <small>Sign in with</small>
//               </div>
//               <div className="btn-wrapper text-center">
//                 <Button
//                   className="btn-neutral btn-icon"
//                   color="default"
//                   href="#pablo"
//                   onClick={e => e.preventDefault()}
//                 >
//                   <span className="btn-inner--icon">
//                     <img
//                       alt="..."
//                       src={require("assets/img/icons/common/github.svg")}
//                     />
//                   </span>
//                   <span className="btn-inner--text">Github</span>
//                 </Button>
//                 <Button
//                   className="btn-neutral btn-icon"
//                   color="default"
//                   href="#pablo"
//                   onClick={e => e.preventDefault()}
//                 >
//                   <span className="btn-inner--icon">
//                     <img
//                       alt="..."
//                       src={require("assets/img/icons/common/google.svg")}
//                     />
//                   </span>
//                   <span className="btn-inner--text">Google</span>
//                 </Button>
//               </div>
//             </CardHeader>
//             <CardBody className="px-lg-5 py-lg-5">
//               <div className="text-center text-muted mb-4">
//                 <small>Or sign in with credentials</small>
//               </div>
//               <Form role="form">
//                 <FormGroup className="mb-3">
//                   <InputGroup className="input-group-alternative">
//                     <InputGroupAddon addonType="prepend">
//                       <InputGroupText>
//                         <i className="ni ni-email-83" />
//                       </InputGroupText>
//                     </InputGroupAddon>
//                     <Input placeholder="Email" type="email" />
//                   </InputGroup>
//                 </FormGroup>
//                 <FormGroup>
//                   <InputGroup className="input-group-alternative">
//                     <InputGroupAddon addonType="prepend">
//                       <InputGroupText>
//                         <i className="ni ni-lock-circle-open" />
//                       </InputGroupText>
//                     </InputGroupAddon>
//                     <Input placeholder="Password" type="password" />
//                   </InputGroup>
//                 </FormGroup>
//                 <div className="custom-control custom-control-alternative custom-checkbox">
//                   <input
//                     className="custom-control-input"
//                     id=" customCheckLogin"
//                     type="checkbox"
//                   />
//                   <label
//                     className="custom-control-label"
//                     htmlFor=" customCheckLogin"
//                   >
//                     <span className="text-muted">Remember me</span>
//                   </label>
//                 </div>
//                 <div className="text-center">
//                   <Button className="my-4" color="primary" type="button">
//                     Sign in
//                   </Button>
//                 </div>
//               </Form>
//             </CardBody>
//           </Card>
//           <Row className="mt-3">
//             <Col xs="6">
//               <a
//                 className="text-light"
//                 href="#pablo"
//                 onClick={e => e.preventDefault()}
//               >
//                 <small>Forgot password?</small>
//               </a>
//             </Col>
//             <Col className="text-right" xs="6">
//               <a
//                 className="text-light"
//                 href="#pablo"
//                 onClick={e => e.preventDefault()}
//               >
//                 <small>Create new account</small>
//               </a>
//             </Col>
//           </Row>
//         </Col>
//       </>
//     );
//   }
// }
// export default Login;