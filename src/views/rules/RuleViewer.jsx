import React from "react";

import { Card, Tag, Icon, Button, Row, Col } from 'antd';

class RuleViewer extends React.Component {

  render () {
    const inputRule = this.props.rule
    let resource = {}
    let conditions = []
    try {
      const pathCondition = inputRule.conditions.all.find(item => {
        if(item.fact === 'operationPath') {
          return true
        } else {
          return false
        }
      })
      if(pathCondition) {
        resource.path = pathCondition.value
      }
      const methodCondition = inputRule.conditions.all.find(item => {
        if(item.fact === 'method') {
          return true
        } else {
          return false
        }
      })
      if(methodCondition) {
        resource.method = methodCondition.value
      }

      conditions = inputRule.conditions.all.filter(item => {
        if(item.fact === 'method' || item.fact === 'operationPath') {
          return false
        } else {
          return true
        }
      })
    } catch(err){}

    const conditionItems = conditions.map(item => {
      return (
        <>
        <Card size="small" className="mt-1" >
          <Tag color="cyan">{item.fact}.{item.path}</Tag>
          <Tag>{item.operator}</Tag>
          <Tag color="blue">{item.value}</Tag>
          </Card>
        </>
      )
    })

    return (
      <>
        <table width='100%' cellPadding="5px">
          <tbody>
            <tr>
              <td className="align-text-top" width='25px'>
                  <Icon type="double-right" style={{ fontSize: '20px', color: '#08c' }}></Icon>
              </td>
              <td>
                <h3>{resource.method.toUpperCase()+' '+resource.path}</h3>
              </td>
            </tr>
            {
              conditions.length > 0
              ? (
                <tr>
                  <td className="align-text-top">
                    <Icon type="question" style={{ fontSize: '20px', color: '#08c' }}></Icon>
                  </td>
                  <td>
                    <h3>Conditions</h3>
                    {conditionItems}
                  </td>
                </tr>
              )
              : null
            }
            <tr>
              <td className="align-text-top">
                <Icon type="double-left" style={{ fontSize: '20px', color: '#08c' }}></Icon>
              </td>
              <td>
                <h3>Event</h3>
                {
                  Object.entries(inputRule.event.params).length > 0
                  ? (
                    <Card size="small" className="mt-4" title={inputRule.event.type}>
                      <pre>{JSON.stringify(inputRule.event.params, null, 2)}</pre>
                    </Card>
                  )
                  : inputRule.event.type
                }
              </td>
            </tr>
          </tbody>
        </table>
      </>
    )
  }
}

export default RuleViewer;