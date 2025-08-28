import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockApiResponse } from '../utils/test-utils';
import AdminLogin from '../pages/admin-login';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AdminLogin Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    render(<AdminLogin />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/router'), 'useRouter').mockReturnValue({
      push: mockPush,
      query: {},
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockApiResponse({
        success: true,
        token: 'mock-token',
        user: { id: 'admin-001', email: 'admin@protothrive.com', role: 'super_admin' }
      })
    );

    render(<AdminLogin />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@protothrive.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('handles login error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockApiResponse({ error: 'Invalid credentials' }, 401)
    );

    render(<AdminLogin />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'wrong@email.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
