import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

// Mock AuthContext
export const mockAuthContext = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  clearError: vi.fn(),
  refreshToken: vi.fn(),
  getCurrentUser: vi.fn(),
  isTokenExpired: vi.fn(),
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
}

// Create a test QueryClient
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// Mock user data
export const mockUser = {
  id: '123',
  email: 'admin@zentraqms.com',
  first_name: 'Admin',
  last_name: 'User',
  is_verified: true,
  is_active: true,
  is_staff: true,
  department: 'IT',
  position: 'Administrator',
  phone_number: '',
  identification: '',
  last_login: null,
  date_joined: '2024-01-01T00:00:00Z',
  roles: [],
  permissions: [],
}

// Mock login response
export const mockLoginResponse = {
  success: true,
  message: 'Login exitoso.',
  data: {
    access: 'mock-access-token',
    refresh: 'mock-refresh-token',
    user: mockUser,
  },
}

// Mock localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Mock axios
export const mockAxios = {
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  create: vi.fn(() => mockAxios),
  interceptors: {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn(),
    },
  },
}