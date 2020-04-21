import React from 'react'
import {
  Card,
  CardTitle,
  CardBody,
  Container,
  Button,
} from "reactstrap";

import { Typography, Row, Col } from 'antd';

import { Link } from "react-router-dom";

import Header from "../../components/Headers/Header.jsx";

import "./Welcome.css"



const Welcome = () => {
  return (
    <>
      <Header />
      <Container className="mt--7" fluid>
        <Row>
          <Col span={12} offset={6}>
            <Card className="custom-card">
              <CardBody>
                <Row align="middle">
                  <Col>
                    <Typography.Title level={4}>
                      Welcome to Mojaloop Training Lab
                  </Typography.Title>
                  </Col>
                  <Col offset={9}>
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
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Welcome
