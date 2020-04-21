import React from 'react'
import {
  Card,
  CardTitle,
  CardBody,
  Container,
  Button,
} from "reactstrap";

import { Row, Col } from 'antd';

import { Link } from "react-router-dom";


const Welcome = () => {
  return (
    <Container className="mt--7" fluid>
      <Row>
        <Col span={24}>
          <Card>
            <CardBody>
              <CardTitle>Welcome to Mojaloop Training Lab</CardTitle>
              <Link to="/demo">
                <Button
                  className="m-1"
                  color="default"
                  size="sm"
                // onClick={handleClick}
                >
                  Start Here
                </Button>
              </Link>

            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Welcome
