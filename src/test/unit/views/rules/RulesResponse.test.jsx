import React from 'react'
import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import RulesResponse from '../../../../views/rules/RulesResponse'
import { Menu, Icon } from 'antd'

import ResponseRulesService from '../../../../services/rules/response'

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

describe('RulesResponse', () => {
  describe('Rule Files and Rules population check', () => {
    const responseFileList = {
      activeRulesFile: 'default.json',
      files: [
        'default.json',
        'test.json'
      ]
    }
    const ruleFileContents = [
      {
        ruleId: 1,
        priority: 1,
        description: 'post /settlementWindows/{id}',
        apiVersion: {
          minorVersion: 0,
          majorVersion: 1,
          type: 'settlements',
          asynchronous: false
        },
        conditions: {
          all: [
            {
              fact: 'operationPath',
              operator: 'equal',
              value: '/settlementWindows/{id}'
            },
            {
              fact: 'method',
              operator: 'equal',
              value: 'post'
            }
          ]
        },
        event: {
          method: null,
          path: null,
          params: {
            body: {
              state: 'OPEN'
            },
            statusCode: '200'
          },
          delay: 0,
          type: 'MOCK_RESPONSE'
        }
      },
      {
        ruleId: 3,
        priority: 1,
        description: 'post /settlements',
        apiVersion: {
          minorVersion: 0,
          majorVersion: 1,
          type: 'settlements',
          asynchronous: false
        },
        conditions: {
          all: [
            {
              fact: 'operationPath',
              operator: 'equal',
              value: '/settlements'
            },
            {
              fact: 'method',
              operator: 'equal',
              value: 'post'
            }
          ]
        },
        event: {
          method: null,
          path: null,
          params: {
            body: {
              id: '123',
              state: 'PENDING_SETTLEMENT',
              settlementWindows: [
                [
                  {
                    id: 123,
                    createdDate: '1954-11-03',
                    state: 'PENDING_SETTLEMENT',
                    reason: 'do',
                    changedDate: '1954-11-03'
                  }
                ]
              ],
              participants: [
                {
                  id: -91450113,
                  accounts: [
                    {
                      id: 81795155,
                      reason: 'veniam est proident commodo aliqua',
                      state: 'PENDING_SETTLEMENT',
                      netSettlementAmount: {
                        amount: 100,
                        currency: 'USD'
                      }
                    }
                  ]
                }
              ]
            },
            statusCode: '200'
          },
          delay: 0,
          type: 'FIXED_RESPONSE'
        }
      }
    ]
    jest.spyOn(ResponseRulesService.prototype, 'fetchResponseRulesFiles').mockImplementation(() => Promise.resolve(responseFileList))
    jest.spyOn(ResponseRulesService.prototype, 'fetchResponseRulesFileContent').mockImplementation(() => Promise.resolve(ruleFileContents))
    jest.spyOn(ResponseRulesService.prototype, 'updateResponseRulesFileContent').mockImplementation(() => Promise.resolve(true))
    const wrapper = shallow(<RulesResponse />)
    it('Should fetch the response files and display them', async done => {
      await wrapper.instance().getResponseRulesFiles()
      expect(ResponseRulesService.prototype.fetchResponseRulesFiles).toHaveBeenCalledTimes(1)
      expect(wrapper.containsMatchingElement(<Menu.Item key='default.json'><Icon type="check" />default.json</Menu.Item>)).toEqual(true)
      expect(wrapper.containsMatchingElement(<Menu.Item key='test.json'>test.json</Menu.Item>)).toEqual(true)

      process.nextTick(() => {
        // expect(wrapper.state()).toEqual({
        //   // ... assert the set state
        // });
        ResponseRulesService.prototype.fetchResponseRulesFiles.mockClear()
        done()
      })
    })
    it('Should fetch the response rules in a file', async done => {
      await wrapper.instance().getResponseRulesFileContent('default.json')
      expect(ResponseRulesService.prototype.fetchResponseRulesFileContent).toHaveBeenCalledTimes(2)
      expect(wrapper.html()).toMatch(/post \/settlementWindows\/{id}/)
      expect(wrapper.html()).toMatch(/post \/settlements/)
      // console.log(wrapper.debug())
      process.nextTick(() => {
        ResponseRulesService.prototype.fetchResponseRulesFileContent.mockClear()
        done()
      })
    })
    it('Delete a rule', async done => {
      await wrapper.find({ header: 'post /settlements' }).find("Button[color='danger']").simulate('click')
      expect(ResponseRulesService.prototype.updateResponseRulesFileContent).toHaveBeenCalledTimes(1)
      expect(wrapper.html()).not.toMatch(/post \/settlements/)
      process.nextTick(() => {
        ResponseRulesService.prototype.updateResponseRulesFileContent.mockClear()
        done()
      })
    })
    it('Add a new rule', async done => {
      // console.log(wrapper.debug())
      // console.log(wrapper.find('.order-xl-1').find("Button[color='info'][href='#pablo']").debug())
      await wrapper.find('.order-xl-1').find("Button[color='info'][href='#pablo']").simulate('click')
      expect(wrapper.state()).toHaveProperty('editRule', {
        ruleId: 2,
        priority: 1
      })
      expect(wrapper.state()).toHaveProperty('mode', 'create')
      process.nextTick(() => {
        done()
      })
    })
  })
})
