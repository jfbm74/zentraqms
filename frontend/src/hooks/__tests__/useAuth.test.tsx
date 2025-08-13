import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAuth, useAuthWithLoading, useUserProfile, useRoleAccess } from '../useAuth'
import { mockUser } from '../../test/utils'
import { AuthError, AuthErrorType } from '../../types/auth.types'

// Mock AuthContext
const mockAuthContext = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  getCurrentUser: vi.fn(),
  clearError: vi.fn(),
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  isTokenExpired: vi.fn(),
}

vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: () => mockAuthContext
}))

// Mock console.error
const mockConsoleError = vi.fn()
Object.defineProperty(console, 'error', { value: mockConsoleError })

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock context to defaults
    Object.assign(mockAuthContext, {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      getCurrentUser: vi.fn(),
      clearError: vi.fn(),
      getAccessToken: vi.fn(),
      getRefreshToken: vi.fn(),
      isTokenExpired: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic functionality', () => {
    it('should return auth state from context', () => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.isLoading = false
      mockAuthContext.user = mockUser
      mockAuthContext.error = null

      const { result } = renderHook(() => useAuth())

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.error).toBeNull()
    })

    it('should provide auth actions from context', () => {
      const { result } = renderHook(() => useAuth())

      expect(typeof result.current.login).toBe('function')
      expect(typeof result.current.logout).toBe('function')
      expect(typeof result.current.refreshToken).toBe('function')
      expect(typeof result.current.getCurrentUser).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
    })
  })

  describe('User utility methods', () => {
    describe('getUserFullName', () => {
      it('should return full name when user has first and last name', () => {
        mockAuthContext.user = mockUser

        const { result } = renderHook(() => useAuth())

        expect(result.current.getUserFullName()).toBe('Admin User')
      })

      it('should return email when user has no names', () => {
        mockAuthContext.user = { ...mockUser, first_name: '', last_name: '' }

        const { result } = renderHook(() => useAuth())

        expect(result.current.getUserFullName()).toBe(mockUser.email)
      })

      it('should return empty string when no user', () => {
        mockAuthContext.user = null

        const { result } = renderHook(() => useAuth())

        expect(result.current.getUserFullName()).toBe('')
      })

      it('should handle partial names correctly', () => {
        mockAuthContext.user = { ...mockUser, first_name: 'Admin', last_name: '' }

        const { result } = renderHook(() => useAuth())

        expect(result.current.getUserFullName()).toBe('Admin')
      })
    })

    describe('getUserInitials', () => {
      it('should return initials from first and last name', () => {
        mockAuthContext.user = mockUser

        const { result } = renderHook(() => useAuth())

        expect(result.current.getUserInitials()).toBe('AU')
      })

      it('should return first letter of email when no names', () => {
        mockAuthContext.user = { ...mockUser, first_name: '', last_name: '' }

        const { result } = renderHook(() => useAuth())

        expect(result.current.getUserInitials()).toBe('A')
      })

      it('should return empty string when no user', () => {
        mockAuthContext.user = null

        const { result } = renderHook(() => useAuth())

        expect(result.current.getUserInitials()).toBe('')
      })

      it('should handle partial names correctly', () => {
        mockAuthContext.user = { ...mockUser, first_name: 'Admin', last_name: '' }

        const { result } = renderHook(() => useAuth())

        expect(result.current.getUserInitials()).toBe('A')
      })
    })

    describe('getUserDisplayName', () => {
      it('should return full name when different from email', () => {
        mockAuthContext.user = mockUser

        const { result } = renderHook(() => useAuth())

        expect(result.current.getUserDisplayName()).toBe('Admin User')
      })

      it('should return email when no names available', () => {
        mockAuthContext.user = { ...mockUser, first_name: '', last_name: '' }

        const { result } = renderHook(() => useAuth())

        expect(result.current.getUserDisplayName()).toBe(mockUser.email)
      })

      it('should return empty string when no user', () => {
        mockAuthContext.user = null

        const { result } = renderHook(() => useAuth())

        expect(result.current.getUserDisplayName()).toBe('')
      })
    })

    describe('isUserActive', () => {
      it('should return true when user is active and verified', () => {
        mockAuthContext.user = { ...mockUser, is_active: true, is_verified: true }

        const { result } = renderHook(() => useAuth())

        expect(result.current.isUserActive()).toBe(true)
      })

      it('should return false when user is not active', () => {
        mockAuthContext.user = { ...mockUser, is_active: false, is_verified: true }

        const { result } = renderHook(() => useAuth())

        expect(result.current.isUserActive()).toBe(false)
      })

      it('should return false when user is not verified', () => {
        mockAuthContext.user = { ...mockUser, is_active: true, is_verified: false }

        const { result } = renderHook(() => useAuth())

        expect(result.current.isUserActive()).toBe(false)
      })

      it('should return false when no user', () => {
        mockAuthContext.user = null

        const { result } = renderHook(() => useAuth())

        expect(result.current.isUserActive()).toBe(false)
      })
    })

    describe('isUserStaff', () => {
      it('should return true when user is staff', () => {
        mockAuthContext.user = { ...mockUser, is_staff: true }

        const { result } = renderHook(() => useAuth())

        expect(result.current.isUserStaff()).toBe(true)
      })

      it('should return false when user is not staff', () => {
        mockAuthContext.user = { ...mockUser, is_staff: false }

        const { result } = renderHook(() => useAuth())

        expect(result.current.isUserStaff()).toBe(false)
      })

      it('should return false when no user', () => {
        mockAuthContext.user = null

        const { result } = renderHook(() => useAuth())

        expect(result.current.isUserStaff()).toBe(false)
      })
    })
  })

  describe('Role and permission methods', () => {
    const userWithRoles = {
      ...mockUser,
      roles: ['admin', 'editor'],
      permissions: ['read_posts', 'write_posts', 'delete_posts']
    }

    describe('hasRole', () => {
      it('should return true when user has the role', () => {
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasRole('admin')).toBe(true)
        expect(result.current.hasRole('editor')).toBe(true)
      })

      it('should return false when user does not have the role', () => {
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasRole('superuser')).toBe(false)
      })

      it('should return false when no user', () => {
        mockAuthContext.user = null

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasRole('admin')).toBe(false)
      })

      it('should return false when user has no roles', () => {
        mockAuthContext.user = { ...mockUser, roles: [] }

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasRole('admin')).toBe(false)
      })
    })

    describe('hasPermission', () => {
      it('should return true when user has the permission', () => {
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasPermission('read_posts')).toBe(true)
        expect(result.current.hasPermission('write_posts')).toBe(true)
      })

      it('should return false when user does not have the permission', () => {
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasPermission('admin_panel')).toBe(false)
      })

      it('should return false when no user', () => {
        mockAuthContext.user = null

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasPermission('read_posts')).toBe(false)
      })

      it('should return false when user has no permissions', () => {
        mockAuthContext.user = { ...mockUser, permissions: [] }

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasPermission('read_posts')).toBe(false)
      })
    })

    describe('hasAnyRole', () => {
      it('should return true when user has any of the roles', () => {
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasAnyRole(['admin', 'superuser'])).toBe(true)
        expect(result.current.hasAnyRole(['editor', 'moderator'])).toBe(true)
      })

      it('should return false when user has none of the roles', () => {
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasAnyRole(['superuser', 'moderator'])).toBe(false)
      })

      it('should return false when roles array is empty', () => {
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasAnyRole([])).toBe(false)
      })

      it('should return false when no user', () => {
        mockAuthContext.user = null

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasAnyRole(['admin'])).toBe(false)
      })
    })

    describe('hasAnyPermission', () => {
      it('should return true when user has any of the permissions', () => {
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasAnyPermission(['read_posts', 'admin_panel'])).toBe(true)
        expect(result.current.hasAnyPermission(['write_posts', 'moderate_posts'])).toBe(true)
      })

      it('should return false when user has none of the permissions', () => {
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasAnyPermission(['admin_panel', 'moderate_posts'])).toBe(false)
      })

      it('should return false when permissions array is empty', () => {
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasAnyPermission([])).toBe(false)
      })

      it('should return false when no user', () => {
        mockAuthContext.user = null

        const { result } = renderHook(() => useAuth())

        expect(result.current.hasAnyPermission(['read_posts'])).toBe(false)
      })
    })
  })

  describe('Access control methods', () => {
    const userWithRoles = {
      ...mockUser,
      roles: ['admin', 'editor'],
      permissions: ['read_posts', 'write_posts'],
      is_staff: true
    }

    describe('canAccess', () => {
      it('should return true when authenticated and no requirements', () => {
        mockAuthContext.isAuthenticated = true
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.canAccess()).toBe(true)
      })

      it('should return false when not authenticated', () => {
        mockAuthContext.isAuthenticated = false
        mockAuthContext.user = null

        const { result } = renderHook(() => useAuth())

        expect(result.current.canAccess(['admin'])).toBe(false)
      })

      it('should return true when user has all required roles', () => {
        mockAuthContext.isAuthenticated = true
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.canAccess(['admin'])).toBe(true)
        expect(result.current.canAccess(['admin', 'editor'])).toBe(true)
      })

      it('should return false when user does not have all required roles', () => {
        mockAuthContext.isAuthenticated = true
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.canAccess(['admin', 'superuser'])).toBe(false)
      })

      it('should return true when user has all required permissions', () => {
        mockAuthContext.isAuthenticated = true
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.canAccess(undefined, ['read_posts'])).toBe(true)
        expect(result.current.canAccess(undefined, ['read_posts', 'write_posts'])).toBe(true)
      })

      it('should return false when user does not have all required permissions', () => {
        mockAuthContext.isAuthenticated = true
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.canAccess(undefined, ['read_posts', 'admin_panel'])).toBe(false)
      })

      it('should return true when user has both required roles and permissions', () => {
        mockAuthContext.isAuthenticated = true
        mockAuthContext.user = userWithRoles

        const { result } = renderHook(() => useAuth())

        expect(result.current.canAccess(['admin'], ['read_posts'])).toBe(true)
      })
    })

    describe('isAdmin', () => {
      it('should return true when user is staff', () => {
        mockAuthContext.user = { ...userWithRoles, is_staff: true }

        const { result } = renderHook(() => useAuth())

        expect(result.current.isAdmin()).toBe(true)
      })

      it('should return true when user has admin role', () => {
        mockAuthContext.user = { ...userWithRoles, is_staff: false, roles: ['admin'] }

        const { result } = renderHook(() => useAuth())

        expect(result.current.isAdmin()).toBe(true)
      })

      it('should return true when user has administrator role', () => {
        mockAuthContext.user = { ...userWithRoles, is_staff: false, roles: ['administrator'] }

        const { result } = renderHook(() => useAuth())

        expect(result.current.isAdmin()).toBe(true)
      })

      it('should return false when user is not admin', () => {
        mockAuthContext.user = { ...userWithRoles, is_staff: false, roles: ['editor'] }

        const { result } = renderHook(() => useAuth())

        expect(result.current.isAdmin()).toBe(false)
      })

      it('should return false when no user', () => {
        mockAuthContext.user = null

        const { result } = renderHook(() => useAuth())

        expect(result.current.isAdmin()).toBe(false)
      })
    })

    describe('isSuperUser', () => {
      it('should return true when user has superuser role', () => {
        mockAuthContext.user = { ...userWithRoles, roles: ['superuser'] }

        const { result } = renderHook(() => useAuth())

        expect(result.current.isSuperUser()).toBe(true)
      })

      it('should return true when user has super_admin role', () => {
        mockAuthContext.user = { ...userWithRoles, roles: ['super_admin'] }

        const { result } = renderHook(() => useAuth())

        expect(result.current.isSuperUser()).toBe(true)
      })

      it('should return false when user does not have superuser role', () => {
        mockAuthContext.user = { ...userWithRoles, roles: ['admin'] }

        const { result } = renderHook(() => useAuth())

        expect(result.current.isSuperUser()).toBe(false)
      })

      it('should return false when no user', () => {
        mockAuthContext.user = null

        const { result } = renderHook(() => useAuth())

        expect(result.current.isSuperUser()).toBe(false)
      })
    })
  })

  describe('Login and logout', () => {
    it('should call login from context', async () => {
      const credentials = { email: 'test@test.com', password: 'password' }
      mockAuthContext.login.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.login(credentials)
      })

      expect(mockAuthContext.login).toHaveBeenCalledWith(credentials)
    })

    it('should handle login errors', async () => {
      const credentials = { email: 'test@test.com', password: 'password' }
      const authError: AuthError = {
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: 'Invalid credentials'
      }
      mockAuthContext.login.mockRejectedValue(authError)

      const { result } = renderHook(() => useAuth())

      await expect(act(async () => {
        await result.current.login(credentials)
      })).rejects.toEqual(authError)

      expect(mockConsoleError).toHaveBeenCalledWith('[useAuth] Login failed:', authError)
    })

    it('should call logout from context', async () => {
      mockAuthContext.logout.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.logout()
      })

      expect(mockAuthContext.logout).toHaveBeenCalled()
    })

    it('should handle logout errors gracefully', async () => {
      const logoutError = new Error('Logout failed')
      mockAuthContext.logout.mockRejectedValue(logoutError)

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.logout()
      })

      expect(mockConsoleError).toHaveBeenCalledWith('[useAuth] Logout failed:', logoutError)
    })
  })

  describe('Token methods', () => {
    it('should return access token from context', () => {
      mockAuthContext.getAccessToken.mockReturnValue('mock-access-token')

      const { result } = renderHook(() => useAuth())

      expect(result.current.getAccessToken()).toBe('mock-access-token')
    })

    it('should return refresh token from context', () => {
      mockAuthContext.getRefreshToken.mockReturnValue('mock-refresh-token')

      const { result } = renderHook(() => useAuth())

      expect(result.current.getRefreshToken()).toBe('mock-refresh-token')
    })

    it('should check if token is expired', () => {
      mockAuthContext.isTokenExpired.mockReturnValue(false)

      const { result } = renderHook(() => useAuth())

      expect(result.current.isTokenExpired('token')).toBe(false)
      expect(mockAuthContext.isTokenExpired).toHaveBeenCalledWith('token')
    })
  })
})

describe('useAuthWithLoading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(mockAuthContext, {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
    })
  })

  it('should return isInitializing true when loading and not authenticated', () => {
    mockAuthContext.isLoading = true
    mockAuthContext.isAuthenticated = false
    mockAuthContext.error = null

    const { result } = renderHook(() => useAuthWithLoading())

    expect(result.current.isInitializing).toBe(true)
    expect(result.current.isLoginRequired).toBe(false)
  })

  it('should return isLoginRequired true when not loading and not authenticated', () => {
    mockAuthContext.isLoading = false
    mockAuthContext.isAuthenticated = false
    mockAuthContext.error = null

    const { result } = renderHook(() => useAuthWithLoading())

    expect(result.current.isInitializing).toBe(false)
    expect(result.current.isLoginRequired).toBe(true)
  })

  it('should return both false when authenticated', () => {
    mockAuthContext.isLoading = false
    mockAuthContext.isAuthenticated = true
    mockAuthContext.error = null

    const { result } = renderHook(() => useAuthWithLoading())

    expect(result.current.isInitializing).toBe(false)
    expect(result.current.isLoginRequired).toBe(false)
  })
})

describe('useUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(mockAuthContext, {
      user: null,
      getCurrentUser: vi.fn(),
      isLoading: false,
      error: null,
    })
  })

  it('should return user profile data', () => {
    mockAuthContext.user = mockUser

    const { result } = renderHook(() => useUserProfile())

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isProfileComplete).toBe(true)
  })

  it('should return isProfileComplete false when profile is incomplete', () => {
    mockAuthContext.user = { ...mockUser, first_name: '', department: '' }

    const { result } = renderHook(() => useUserProfile())

    expect(result.current.isProfileComplete).toBe(false)
  })

  it('should refresh profile', async () => {
    mockAuthContext.getCurrentUser.mockResolvedValue(undefined)

    const { result } = renderHook(() => useUserProfile())

    await act(async () => {
      await result.current.refreshProfile()
    })

    expect(mockAuthContext.getCurrentUser).toHaveBeenCalled()
  })

  it('should handle refresh profile errors', async () => {
    const error = new Error('Refresh failed')
    mockAuthContext.getCurrentUser.mockRejectedValue(error)

    const { result } = renderHook(() => useUserProfile())

    await expect(act(async () => {
      await result.current.refreshProfile()
    })).rejects.toThrow('Refresh failed')
  })
})

describe('useRoleAccess', () => {
  const userWithRoles = {
    ...mockUser,
    roles: ['admin', 'editor'],
    permissions: ['read_posts', 'write_posts']
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(mockAuthContext, {
      isAuthenticated: true,
      user: userWithRoles,
    })
  })

  it('should return access control information', () => {
    const { result } = renderHook(() => useRoleAccess(['admin'], ['read_posts']))

    expect(result.current.hasAccess).toBe(true)
    expect(result.current.hasAllRoles).toBe(true)
    expect(result.current.hasAllPermissions).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should return false when user does not have required roles', () => {
    const { result } = renderHook(() => useRoleAccess(['superuser'], ['read_posts']))

    expect(result.current.hasAccess).toBe(false)
    expect(result.current.hasAllRoles).toBe(false)
    expect(result.current.hasAllPermissions).toBe(true)
  })

  it('should return false when user does not have required permissions', () => {
    const { result } = renderHook(() => useRoleAccess(['admin'], ['admin_panel']))

    expect(result.current.hasAccess).toBe(false)
    expect(result.current.hasAllRoles).toBe(true)
    expect(result.current.hasAllPermissions).toBe(false)
  })

  it('should provide hasAnyRole and hasAnyPermission functions', () => {
    const { result } = renderHook(() => useRoleAccess())

    expect(result.current.hasAnyRole(['admin', 'superuser'])).toBe(true)
    expect(result.current.hasAnyRole(['superuser', 'moderator'])).toBe(false)
    expect(result.current.hasAnyPermission(['read_posts', 'admin_panel'])).toBe(true)
    expect(result.current.hasAnyPermission(['admin_panel', 'moderate_posts'])).toBe(false)
  })
})