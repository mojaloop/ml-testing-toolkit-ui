import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  it('should render a component', () => {
    const TestComponent = () => <div>Test Component</div>;
    render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
}); 