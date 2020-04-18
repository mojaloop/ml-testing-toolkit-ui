import React, { useState, useEffect } from 'react'
import { Select } from 'antd';

const FilterSelect = ({ testCases, onChangeFilterSelect }) => {

    // const onChange = (value) => {
    //     console.log(`selected ${value}`);
    // }

    const onBlur = () => {
        console.log('blur');
    }

    const onFocus = () => {
        console.log('focus');
    }

    const onSearch = (val) => {
        console.log('search:', val);
    }

    const onFilterOption = (input, option) => {
        return option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
    }

    return (
        <Select
            showSearch
            style={{ width: 350 }}
            placeholder="Select a Test Case"
            optionFilterProp="children"
            onChange={onChangeFilterSelect}
            onFocus={onFocus}
            onBlur={onBlur}
            onSearch={onSearch}
            filterOption={onFilterOption}
        >
            {
                testCases && testCases.map((item, key) => {
                    return (
                        <Select.Option value={item.id} key={'Select.Option' + key}>
                            {item.name}
                        </Select.Option>
                    )
                })
            }
        </Select >
    )
}

export default FilterSelect
