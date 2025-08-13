import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderWithProviders, mockAuthContext } from '../../../test/utils'
import LoginPage from '../LoginPage'

// Mock the useAuth hook
const mockLogin = vi.fn()
const mockClearError = vi.fn()
const mockNavigate = vi.fn()
const mockUseLocation = vi.fn()

// Mock all dependencies
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(() => mockNavigate),
    useLocation: vi.fn(() => mockUseLocation()),
    Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>
  }
})

// Mock images
vi.mock('../../../assets/images/logo-light.png', () => ({
  default: 'logo-light.png'
}))

vi.mock('../../../assets/images/auth-one-bg.jpg', () => ({
  default: 'auth-one-bg.jpg'
}))

// Import the useAuth mock after setting up the mock
const { useAuth } = await import('../../../hooks/useAuth')
const mockedUseAuth = vi.mocked(useAuth)

describe('LoginPage', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    document.title = ''
    
    // Default mock return value
    mockedUseAuth.mockReturnValue({
      ...mockAuthContext,
      login: mockLogin,
      clearError: mockClearError,
    } as any)
    
    // Default location mock
    mockUseLocation.mockReturnValue({
      state: null,
      pathname: '/auth/login'
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the login form with all elements', () => {
      renderWithProviders(<LoginPage />)

      expect(screen.getByText('¡Bienvenido de Vuelta!')).toBeInTheDocument()
      expect(screen.getByText('Inicia sesión para continuar en ZentraQMS')).toBeInTheDocument()
      expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument()
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
      expect(screen.getByLabelText('Recordarme')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /acceso de demostración/i })).toBeInTheDocument()
    })

    it('sets the correct page title', () => {
      renderWithProviders(<LoginPage />)
      expect(document.title).toBe('Iniciar Sesión | ZentraQMS - Sistema de Gestión de Calidad')
    })

    it('renders copyright footer with current year', () => {
      renderWithProviders(<LoginPage />)
      const currentYear = new Date().getFullYear()
      expect(screen.getByText(new RegExp(`© ${currentYear} ZentraQMS`))).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('shows validation errors for empty fields', async () => {
      renderWithProviders(<LoginPage />)
      
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('El correo electrónico es requerido')).toBeInTheDocument()
        expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument()
      })
    })

    it('shows validation error for invalid email format', async () => {
      renderWithProviders(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Correo Electrónico')
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Ingrese un correo electrónico válido')).toBeInTheDocument()
      })
    })

    it('shows validation error for short password', async () => {
      renderWithProviders(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Correo Electrónico')
      const passwordInput = screen.getByLabelText('Contraseña')
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, '123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument()
      })
    })

    it('clears errors when user starts typing', async () => {
      mockedUseAuth.mockReturnValue({
        ...mockAuthContext,
        error: 'Credenciales inválidas',
        login: mockLogin,
        clearError: mockClearError,
      } as any)

      renderWithProviders(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Correo Electrónico')
      await user.type(emailInput, 'test@example.com')

      expect(mockClearError).toHaveBeenCalled()
    })
  })

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when eye icon is clicked', async () => {
      renderWithProviders(<LoginPage />)
      
      const passwordInput = screen.getByLabelText('Contraseña')
      const toggleButtons = screen.getAllByRole('button')
      const toggleButton = toggleButtons.find(btn => btn.querySelector('i[class*="ri-eye"]'))

      expect(passwordInput).toHaveAttribute('type', 'password')

      if (toggleButton) {
        await user.click(toggleButton)
        expect(passwordInput).toHaveAttribute('type', 'text')

        await user.click(toggleButton)
        expect(passwordInput).toHaveAttribute('type', 'password')
      }
    })
  })

  describe('Form Submission', () => {
    it('calls login function with correct credentials on form submission', async () => {
      mockLogin.mockResolvedValue(undefined)
      
      renderWithProviders(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Correo Electrónico')
      const passwordInput = screen.getByLabelText('Contraseña')
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    })

    it('shows loading state during form submission', async () => {
      mockedUseAuth.mockReturnValue({
        ...mockAuthContext,
        isLoading: true,
        login: mockLogin,
        clearError: mockClearError,
      } as any)

      renderWithProviders(<LoginPage />)
      
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      
      expect(submitButton).toBeDisabled()
      expect(screen.getByText('Cargando...')).toBeInTheDocument()
    })

    it('calls clearError before attempting login', async () => {
      renderWithProviders(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Correo Electrónico')
      const passwordInput = screen.getByLabelText('Contraseña')
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled()
      })
    })
  })

  describe('Demo Login', () => {
    it('fills form with demo credentials and submits when demo button is clicked', async () => {
      mockLogin.mockResolvedValue(undefined)
      
      renderWithProviders(<LoginPage />)
      
      const demoButton = screen.getByRole('button', { name: /acceso de demostración/i })
      await user.click(demoButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'admin@zentraqms.com',
          password: '123456'
        })
      })

      const emailInput = screen.getByLabelText('Correo Electrónico')
      const passwordInput = screen.getByLabelText('Contraseña')
      
      expect(emailInput).toHaveValue('admin@zentraqms.com')
      expect(passwordInput).toHaveValue('123456')
    })

    it('disables demo button during loading', async () => {
      mockedUseAuth.mockReturnValue({
        ...mockAuthContext,
        isLoading: true,
        login: mockLogin,
        clearError: mockClearError,
      } as any)

      renderWithProviders(<LoginPage />)
      
      const demoButton = screen.getByRole('button', { name: /acceso de demostración/i })
      expect(demoButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when login fails', () => {
      mockedUseAuth.mockReturnValue({
        ...mockAuthContext,
        error: 'Credenciales inválidas',
        login: mockLogin,
        clearError: mockClearError,
      } as any)

      renderWithProviders(<LoginPage />)
      
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('does not display error message when there is no error', () => {
      renderWithProviders(<LoginPage />)
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('navigates to dashboard when already authenticated', () => {
      mockedUseAuth.mockReturnValue({
        ...mockAuthContext,
        isAuthenticated: true,
        login: mockLogin,
        clearError: mockClearError,
      } as any)

      renderWithProviders(<LoginPage />)
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })

    it('navigates to redirect URL from location state when authenticated', () => {
      mockUseLocation.mockReturnValue({
        state: { from: { pathname: '/profile' } },
        pathname: '/auth/login'
      })

      mockedUseAuth.mockReturnValue({
        ...mockAuthContext,
        isAuthenticated: true,
        login: mockLogin,
        clearError: mockClearError,
      } as any)

      renderWithProviders(<LoginPage />)
      
      expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true })
    })
  })

  describe('Remember Me Checkbox', () => {
    it('allows user to check and uncheck remember me option', async () => {
      renderWithProviders(<LoginPage />)
      
      const rememberCheckbox = screen.getByLabelText('Recordarme')
      
      expect(rememberCheckbox).not.toBeChecked()
      
      await user.click(rememberCheckbox)
      expect(rememberCheckbox).toBeChecked()
      
      await user.click(rememberCheckbox)
      expect(rememberCheckbox).not.toBeChecked()
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels and accessibility attributes', () => {
      renderWithProviders(<LoginPage />)
      
      const emailInput = screen.getByLabelText('Correo Electrónico')
      const passwordInput = screen.getByLabelText('Contraseña')
      
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('autoComplete', 'email')
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
      
      // Check that inputs have proper IDs for accessibility
      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
    })

    it('provides proper ARIA labels and roles', () => {
      mockedUseAuth.mockReturnValue({
        ...mockAuthContext,
        error: 'Credenciales inválidas',
        login: mockLogin,
        clearError: mockClearError,
      } as any)

      renderWithProviders(<LoginPage />)
      
      const errorAlert = screen.getByRole('alert')
      expect(errorAlert).toBeInTheDocument()
    })
  })

  describe('Cleanup', () => {
    it('calls clearError on component unmount', () => {
      const { unmount } = renderWithProviders(<LoginPage />)
      
      unmount()
      
      expect(mockClearError).toHaveBeenCalled()
    })
  })
})