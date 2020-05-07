import React from 'react'
import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import { ConfigurableParameter, OperatorSelector, FactSelector, AssertionEditorSimple, TestAssertions } from '../../../../views/outbound/TestAssertions'

import { Select, Input, Button, CollapsePanel } from 'antd'
const { Option } = Select

Enzyme.configure({ adapter: new Adapter() })
Enzyme.configure({ disableLifecycleMethods: true })

const { shallow, render, mount } =Enzyme


// Mock the Json Editor third party component used
jest.mock('jsoneditor-react', () => {
  return function DummyJsonEditor(props) {
    return (
      <div>
       Dummy JSON Editor 
      </div>
    )
  }
})


describe('TestAssertions', () => {
  describe('ConfigurableParameter', () => {
    const rootParameters = {}
    const resourceDefinition = {}
    const inputValues = {
      test: 'test'
    }
    const mockOnChangeHandler = jest.fn()
    const wrapper = shallow(<ConfigurableParameter rootParameters={rootParameters} resourceDefinition={resourceDefinition} inputValues={inputValues} onChange={mockOnChangeHandler} />)
    it('Should consists of options Input Values and Request', async done => {
      expect(wrapper.containsMatchingElement(<Option>Input Values</Option>)).toEqual(true)
      expect(wrapper.containsMatchingElement(<Option>Request</Option>)).toEqual(true)
      process.nextTick(() => {
        done()
      })
    })
    it('Should consists of a select with options from Input Values', async done => {
      wrapper.instance().handleParamTypeChange(0)
      expect(wrapper.containsMatchingElement(<Option>test</Option>)).toEqual(true)
      process.nextTick(() => {
        done()
      })
    })
    it('Should call onChange when selecting an input value', async done => {
      wrapper.instance().handleParamSelect('{$inputs.test}')
      expect(mockOnChangeHandler).toHaveBeenCalledWith('{$inputs.test}')
      process.nextTick(() => {
        done()
      })
    })
  })

  describe('OperatorSelector', () => {
    const mockOnChangeHandler = jest.fn()
    const wrapper = shallow(<OperatorSelector onChange={mockOnChangeHandler} />)
    it('Should consists of options with different operators', async done => {
      expect(wrapper.containsMatchingElement(<Option>Equal to</Option>)).toEqual(true)
      expect(wrapper.containsMatchingElement(<Option>Not Equal to</Option>)).toEqual(true)
      expect(wrapper.containsMatchingElement(<Option>Have Property</Option>)).toEqual(true)
      expect(wrapper.containsMatchingElement(<Option>Not to have property</Option>)).toEqual(true)
      process.nextTick(() => {
        done()
      })
    })
    it('Should call onChange when selecting an operator value', async done => {
      await wrapper.instance().handleOperatorChange(0)
      expect(mockOnChangeHandler).toHaveBeenCalledWith('to.equal')
      await wrapper.instance().handleOperatorChange(1)
      expect(mockOnChangeHandler).toHaveBeenCalledWith('to.not.equal')
      await wrapper.instance().handleOperatorChange(2)
      expect(mockOnChangeHandler).toHaveBeenCalledWith('to.have.property')
      await wrapper.instance().handleOperatorChange(3)
      expect(mockOnChangeHandler).toHaveBeenCalledWith('to.not.have.property')
      process.nextTick(() => {
        done()
      })
    })
  })

  describe('FactSelector', () => {
    const resourceDefinition = {}
    const successCallbackDefinition = {}
    const errorCallbackDefinition = {
      test: 'test'
    }
    const successCallbackRootParameters = {}
    const errorCallbackRootParameters = {}
    const mockOnChangeHandler = jest.fn()
    const wrapper = shallow(
      <FactSelector
        resourceDefinition={resourceDefinition}
        successCallbackDefinition={successCallbackDefinition}
        errorCallbackDefinition={errorCallbackDefinition}
        successCallbackRootParameters={successCallbackRootParameters}
        errorCallbackRootParameters={errorCallbackRootParameters}
        onChange={mockOnChangeHandler}
      />
    )
    it('Should consists of proper options', async done => {
      expect(wrapper.containsMatchingElement(<Option>Response</Option>)).toEqual(true)
      expect(wrapper.containsMatchingElement(<Option>Callback</Option>)).toEqual(true)
      process.nextTick(() => {
        done()
      })
    })
    // it('Should set state factType on selecting a fact type', async done => {
    //   await wrapper.instance().handleFactTypeChange(0)
    //   expect(wrapper.state().factType).toEqual(0)
    //   expect(wrapper.state().factData).not.toBeNull()
    //   // expect(mockOnChangeHandler).toHaveBeenCalledWith('{$inputs.test}')
    //   process.nextTick(() => {
    //     done()
    //   })
    // })
    // it('Should call onChange when selecting response status', async done => {
    //   await wrapper.instance().handleFactSelect('status')
    //   expect(wrapper.state().selectedFact).toEqual('status')
    //   expect(mockOnChangeHandler).toHaveBeenCalledWith('response.status')
    //   process.nextTick(() => {
    //     done()
    //   })
    // })
  })

  describe('AssertionEditorSimple', () => {
    const resourceDefinition = {}
    const successCallbackDefinition = {}
    const errorCallbackDefinition = {
      test: 'test'
    }
    const successCallbackRootParameters = {}
    const errorCallbackRootParameters = {}
    const mockOnSaveHandler = jest.fn()
    const wrapper = shallow(
      <AssertionEditorSimple
        resourceDefinition={resourceDefinition}
        successCallbackDefinition={successCallbackDefinition}
        errorCallbackDefinition={errorCallbackDefinition}
        successCallbackRootParameters={successCallbackRootParameters}
        errorCallbackRootParameters={errorCallbackRootParameters}
        onSave={mockOnSaveHandler}
      />
    )
    it('Should consists of proper components', async done => {
      expect(wrapper.containsMatchingElement(<FactSelector />)).toEqual(true)
      expect(wrapper.containsMatchingElement(<OperatorSelector />)).toEqual(true)
      expect(wrapper.containsMatchingElement(<Input />)).toEqual(true)
      process.nextTick(() => {
        done()
      })
    })
    it('Should set state fact on selecting a fact', async done => {
      await wrapper.instance().handleFactChange('response.status')
      expect(wrapper.state().fact).toEqual('response.status')
      process.nextTick(() => {
        done()
      })
    })
    it('Should set state fact on selecting an operator', async done => {
      await wrapper.instance().handleOperatorChange('to.equal')
      expect(wrapper.state().operator).toEqual('to.equal')
      process.nextTick(() => {
        done()
      })
    })
    it('Should set state fact on selecting a value', async done => {
      await wrapper.instance().handleValueChange('202')
      expect(wrapper.state().value).toEqual('202')
      process.nextTick(() => {
        done()
      })
    })
    it('Should call onSave', async done => {
      await wrapper.instance().handleOnSave()
      const { fact, operator, value} = wrapper.state()
      const assertionLine = 'expect(' + fact + ').' + operator + '(' + value + ')'
      expect(mockOnSaveHandler).toHaveBeenCalledWith(assertionLine)
      process.nextTick(() => {
        done()
      })
    })
  })

  describe('TestAssertions', () => {
    const request={
      tests: {
        assertions: [
          {
            id: 1,
            description: 'assertion1',
            exec: [
              'expect(true).to.be(true)'
            ]
          }
        ]
      },
      status: {
        testResult: {
          results: {
            1: {
              status: 'FAILED'
            }
          }
        }
      }
    }
    const allRequests={}
    const inputValues={}

    const mockOnChangeHandler = jest.fn()
    const mockOnDeleteHandler = jest.fn()
    const wrapper = shallow(
      <TestAssertions
        request={request}
        allRequests={allRequests}
        inputValues={inputValues}
        onChange={mockOnChangeHandler}
        onDelete={mockOnDeleteHandler}
      />
    )
    it('Should consists of a list of assertions', async done => {
      expect(wrapper.find('CollapsePanel').props().header).toEqual('assertion1')
      process.nextTick(() => {
        done()
      })
    })

    it('Should call onChange upon changing the assertion', async done => {
      await wrapper.instance().handleAssertionChange(0, 'expect(false).to.be(false)')
      expect(mockOnChangeHandler).toHaveBeenCalled()
      process.nextTick(() => {
        done()
      })
    })
    it('Should call onChange upon delete assertion', async done => {
      await wrapper.instance().handleDeleteAssertionClick(0)
      expect(mockOnChangeHandler).toHaveBeenCalled()
      process.nextTick(() => {
        done()
      })
    })
  })
})
