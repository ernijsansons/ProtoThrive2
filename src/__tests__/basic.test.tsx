import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../pages/index';

describe('Basic App Tests', () => {
  it('renders the home page without crashing', () => {
    render(<Home />);
    expect(screen.getByText('ProtoThrive Thermonuclear')).toBeInTheDocument();
  });

  it('displays the thrive score', () => {
    render(<Home />);
    expect(screen.getByText('Thrive Score')).toBeInTheDocument();
  });

  it('shows the toggle mode button', () => {
    render(<Home />);
    expect(screen.getByText(/Toggle Mode/)).toBeInTheDocument();
  });
});

