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
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import AdminNavbar from '../components/Navbars/AdminNavbar.jsx';
import AdminFooter from '../components/Footers/AdminFooter.jsx';
import Sidebar from '../components/Sidebar/Sidebar.jsx';

// eslint-disable-next-line import/extensions
import routes from '../routes.js';
import { getConfig, fetchServerConfig } from '../utils/getConfig';
import { Layout, Card, Spin, Result, Row, Col } from 'antd';

const { Header, Content } = Layout;

class Admin extends React.Component {
    isAuthEnabled = getConfig().isAuthEnabled;

    constructor() {
        super();
        this.state = {
            isLoading: true,
            isConnectionError: false,
            connectionErrorMessage: '',
        };
    }

    async componentDidMount() {
        await this.fetchConfiguration();
    }

    componentDidUpdate(e) {
        if(this.isAuthEnabled && !localStorage.getItem('JWT_COOKIE_EXP_AT')) {
            return;
        }
        document.documentElement.scrollTop = 0;
        document.scrollingElement.scrollTop = 0;
        if(this.refs.mainContent) {
            this.refs.mainContent.scrollTop = 0;
        }
    }

    fetchConfiguration = async () => {
        try {
            await fetchServerConfig();
            this.setState({ isLoading: false });
        } catch (err) {
            this.setState({ isConnectionError: true, connectionErrorMessage: err.message, isLoading: false });
        }
    };

    getRoutes = routes => {
        return routes.map((prop, key) => {
            if(prop.layout === '/admin') {
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
        for(let i = 0; i < routes.length; i++) {
            if(
                this.props.location.pathname.indexOf(
                    routes[i].layout + routes[i].path,
                ) !== -1
            ) {
                return routes[i].name;
            }
        }
        return 'Brand';
    };

    render() {
        if(localStorage.getItem('JWT_COOKIE_EXP_AT') || !this.isAuthEnabled) {
            return (
                <>
                    {
                        this.state.isLoading
                            ? (
                                <Spin tip='Loading...' size='large'>
                                    <Row>
                                        <Col span={24} style={{ height: '600px' }} />
                                    </Row>
                                </Spin>
                            )
                            : this.state.isConnectionError
                                ? (
                                    <Result
                                        status='500'
                                        title='500'
                                        subTitle={this.state.connectionErrorMessage}
                                    />
                                )
                                : (
                                    <Layout style={{ backgroundColor: '#fafafa' }}>
                                        <Sidebar
                                            {...this.props}
                                            routes={routes}
                                            logo={{
                                                innerLink: '/admin/index',
                                                imgSrc: require('../assets/img/mojaloop.png'),
                                                imgAlt: '...',
                                            }}
                                        />
                                        <Layout>
                                            <AdminNavbar
                                                {...this.props}
                                                brandText={this.getBrandText(this.props.location.pathname)}
                                            />
                                            <Content>
                                                <Header
                                                    style={{
                                                        height: '3vh',
                                                        background: '#293e5d',
                                                    }}
                                                />
                                                <Card className='shadow ml-4 mr-4 mt-n5'>
                                                    <Switch>{this.getRoutes(routes)}</Switch>
                                                </Card>
                                            </Content>
                                            <AdminFooter />
                                        </Layout>
                                    </Layout>
                                )
                    }
                </>
            );
        } else {
            return (
                <>{this.props.history.push('/login')}</>
            );
        }
    }
}

export default Admin;
