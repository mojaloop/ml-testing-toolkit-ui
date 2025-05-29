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

 * ModusBox
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import React from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import AdminNavbar from '../components/Navbars/AdminNavbar.jsx';
import AdminFooter from '../components/Footers/AdminFooter.jsx';
import Sidebar from '../components/Sidebar/Sidebar.jsx';

 
import routes from '../routes.jsx';
import { getConfig, fetchServerConfig } from '../utils/getConfig';
import { Layout, Card, Spin, Result, Row, Col } from 'antd';
import mojaLoopLogo from '../assets/img/mojaloop.png';

const { Header, Content } = Layout;

const Admin = () => {
    const isAuthEnabled = getConfig().isAuthEnabled;
    const location = useLocation();
    const [state, setState] = React.useState({
        isLoading: true,
        isConnectionError: false,
        connectionErrorMessage: '',
    });

    React.useEffect(() => {
        fetchConfiguration();
    }, []);

    React.useEffect(() => {
        if(isAuthEnabled && !localStorage.getItem('JWT_COOKIE_EXP_AT')) {
            return;
        }
        document.documentElement.scrollTop = 0;
        document.scrollingElement.scrollTop = 0;
    }, [location, isAuthEnabled]);

    const fetchConfiguration = async () => {
        try {
            await fetchServerConfig();
            setState({ ...state, isLoading: false });
        } catch (err) {
            setState({ 
                isConnectionError: true, 
                connectionErrorMessage: err.message, 
                isLoading: false, 
            });
        }
    };

    const getRoutes = routes => {
        return routes.map((prop, key) => {
            if(prop.layout === '/admin') {
                return (
                    <Route
                        path={prop.path}
                        element={<prop.component />}
                        key={key}
                    />
                );
            } else {
                return null;
            }
        });
    };

    const getBrandText = path => {
        for(let i = 0; i < routes.length; i++) {
            if(
                path.indexOf(
                    routes[i].layout + routes[i].path,
                ) !== -1
            ) {
                return routes[i].name;
            }
        }
        return 'Brand';
    };

    if(isAuthEnabled && !localStorage.getItem('JWT_COOKIE_EXP_AT')) {
        return <Navigate to="/login" replace />;
    }

    return (
        <>
            {
                state.isLoading
                    ? (
                        <Spin tip='Loading...' size='large'>
                            <Row>
                                <Col span={24} style={{ height: '600px' }} />
                            </Row>
                        </Spin>
                    )
                    : state.isConnectionError
                        ? (
                            <Result
                                status='500'
                                title='500'
                                subTitle={state.connectionErrorMessage}
                            />
                        )
                        : (
                            <Layout style={{ backgroundColor: '#fafafa' }}>
                                <Sidebar
                                    routes={routes}
                                    logo={{
                                        innerLink: '/admin/index',
                                        imgSrc: mojaLoopLogo,
                                        imgAlt: '...',
                                    }}
                                />
                                <Layout>
                                    <AdminNavbar
                                        brandText={getBrandText(location.pathname)}
                                    />
                                    <Content>
                                        <Header
                                            style={{
                                                height: '3vh',
                                                background: '#293e5d',
                                            }}
                                        />
                                        <Card className='shadow ml-4 mr-4 mt-n5'>
                                            <Routes>
                                                {getRoutes(routes)}
                                                <Route path="" element={<Navigate to="index" replace />} />
                                                <Route path="*" element={<Navigate to="index" replace />} />
                                            </Routes>
                                        </Card>
                                    </Content>
                                    <AdminFooter />
                                </Layout>
                            </Layout>
                        )
            }
        </>
    );
};

export default Admin;
