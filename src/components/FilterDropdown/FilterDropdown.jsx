import React from 'react'
import { Menu, Dropdown, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';


const FilterDropdown = () => {
    const menu = (
        <Menu>
            <Menu.Item>
                <a target="_blank" rel="noopener noreferrer" href="http://www.alipay.com/">
                    1st menu item
            </a>
            </Menu.Item>
            <Menu.Item>
                <a target="_blank" rel="noopener noreferrer" href="http://www.taobao.com/">
                    2nd menu item
            </a>
            </Menu.Item>
            <Menu.Item>
                <a target="_blank" rel="noopener noreferrer" href="http://www.tmall.com/">
                    3rd menu item
            </a>
            </Menu.Item>
        </Menu>
    );

    return (
        <Dropdown overlay={menu}>
            <Button>
                PlaceholderDropdown <DownOutlined />
            </Button>
        </Dropdown>
    )
}

export default FilterDropdown
