import React from "react";

import { Card, Tag, Icon, Button, Steps } from 'antd';

const {Step} = Steps
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
        <Steps direction="vertical" current={1}>
          <Step status="finish" title={resource.method.toUpperCase()+' '+resource.path} icon={<Icon type="double-right"></Icon>}/>
          {
            conditions.length > 0
            ? (
              <Step status="finish" title="Conditions" icon={<Icon type="question"></Icon>} description={conditionItems} />
            )
            : null
          }
          <Step status="finish" title="Event" icon={<Icon type="double-left"></Icon>} description={
                Object.entries(inputRule.event.params).length > 0
                ? (
                  <Card size="small" className="mt-4" title={inputRule.event.type}>
                    <pre>{JSON.stringify(inputRule.event.params, null, 2)}</pre>
                  </Card>
                )
                : inputRule.event.type
          } />
        </Steps>
      </>
    )
  }
}

export default RuleViewer;