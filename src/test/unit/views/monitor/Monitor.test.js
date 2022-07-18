import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { act } from 'react-dom/test-utils'

import Tables from '../../../../views/monitor/Monitor'

let container = null
beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  // cleanup on exiting
  unmountComponentAtNode(container)
  container.remove()
  container = null
})

it('renders a Tables component from Monitor', () => {
  act(() => {
    render(<Tables />, container)
  })
  expect(container.textContent).toMatch(/Monitoring\.\.\./)
})
