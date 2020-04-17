import React from 'react'
import { Select } from 'antd';

const FilterSelect = () => {
    const onChange = (value) => {
        console.log(`selected ${value}`);
    }

    const onBlur = () => {
        console.log('blur');
    }

    const onFocus = () => {
        console.log('focus');
    }

    const onSearch = (val) => {
        console.log('search:', val);
    }

    return (
        <Select
            showSearch
            style={{ width: 200 }}
            placeholder="Select a Test Case"
            optionFilterProp="children"
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onSearch={onSearch}
            filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
        >
            <Select.Option value="jack">Jack</Select.Option>
            <Select.Option value="lucy">Lucy</Select.Option>
            <Select.Option value="tom">Tom</Select.Option>
        </Select>
    )
}

export default FilterSelect
