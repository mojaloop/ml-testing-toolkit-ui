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
import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { Layout, Row, Col, Menu, Typography } from 'antd';
import * as AntIcons from '@ant-design/icons';
import mojaLoopLogo from '../../assets/img/mojaloop.png';

const { Title } = Typography;
const { Sider } = Layout;

const Sidebar = ({ routes, logo }) => {
    const [collapseOpen, setCollapseOpen] = useState(false);
    const location = useLocation();

    // verifies if routeName is the one active (in browser input)
    const activeRoute = routeName => {
        return location.pathname.indexOf(routeName) > -1 ? 'active' : '';
    };

    // toggles collapse between opened and closed (true/false)
    const toggleCollapse = () => {
        setCollapseOpen(!collapseOpen);
    };

    // closes the collapse
    const closeCollapse = () => {
        setCollapseOpen(false);
    };

    // Render icon from iconType string
    const renderIcon = iconType => {
        if(!iconType) return null;
        
        const IconComponent = AntIcons[iconType];
        if(IconComponent) {
            return <IconComponent />;
        }
        return null;
    };

    // creates menu items for the Ant Design Menu
    const menuItems = useMemo(() => {
        return routes.map((prop, key) => {
            const fullPath = prop.layout + prop.path;
            return {
                key: fullPath,
                icon: renderIcon(prop.iconType),
                label: (
                    <Link
                        to={fullPath}
                        style={{ display: 'block', width: '100%' }}
                    >
                        {prop.name}
                        {prop.subTitle && <div>{prop.subTitle}</div>}
                    </Link>
                ),
            };
        });
    }, [routes]);

    // Find the active route key based on the current location path
    const findActiveRouteKey = () => {
        const pathname = location.pathname;
        const route = routes.find(route => 
            pathname.startsWith(route.layout + route.path),
        );
        return route ? route.layout + route.path : '/admin/index';
    };

    return (
        <Sider
            width={250}
            style={{
                height: '100vh',
                background: '#fff',
            }}
        >
            <Row className='pt-0'>
                <Col span={4} />
                <Col span={16} className='text-center'>
                    <img
                        alt='Mojaloop'
                        className='img-fluid'
                        src={logo.imgSrc || mojaLoopLogo}
                    />
                </Col>
                <Col span={4} />
            </Row>
            <Row>
                <Col span={24} className='text-center'>
                    <Title level={4} style={{ color: '#293e5d' }}>Testing Toolkit</Title>
                </Col>
            </Row>
            <Menu
                className='mt-4'
                mode='inline'
                selectedKeys={[findActiveRouteKey()]}
                defaultSelectedKeys={['/admin/index']}
                items={menuItems}
            />
        </Sider>
    );
};

export default Sidebar;
