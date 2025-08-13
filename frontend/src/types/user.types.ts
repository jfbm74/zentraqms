/**
 * User Types for ZentraQMS Frontend
 * 
 * This module defines all TypeScript types and interfaces related to
 * user data, profiles, roles, and permissions.
 */

/**
 * Main User interface matching backend model
 */
export interface User {
  id: string; // UUID from backend
  email: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  department: string;
  position: string;
  phone_number?: string;
  identification?: string;
  last_login?: string; // ISO date string
  date_joined: string; // ISO date string
  
  // RBAC fields (Phase 5 - Populated from backend)
  roles: string[]; // Role codes: ["admin", "coordinador"]
  permissions: string[]; // Permission codes: ["documents.create", "users.read"]
  
  // Optional profile fields
  profile_picture?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  language?: string;
}

/**
 * User profile update interface
 */
export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  department?: string;
  position?: string;
  phone_number?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  language?: string;
}

/**
 * User creation interface (for admin functionality)
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  department: string;
  position: string;
  phone_number?: string;
  identification?: string;
  is_staff?: boolean;
  roles?: string[];
}

/**
 * User list response interface
 */
export interface UserListResponse {
  success: boolean;
  data: {
    results: User[];
    count: number;
    next: string | null;
    previous: string | null;
  };
}

/**
 * User detail response interface
 */
export interface UserDetailResponse {
  success: boolean;
  data: User;
}

/**
 * User update response interface
 */
export interface UserUpdateResponse {
  success: boolean;
  message: string;
  data: User;
}

/**
 * Department interface
 */
export interface Department {
  id: string;
  name: string;
  description?: string;
  manager?: User;
  employees_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Position/Role interface (organizational structure)
 */
export interface Position {
  id: string;
  title: string;
  description?: string;
  department: Department;
  level: PositionLevel;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Position levels enum
 */
export enum PositionLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  SENIOR = 'senior',
  LEAD = 'lead',
  MANAGER = 'manager',
  DIRECTOR = 'director',
  EXECUTIVE = 'executive',
}

/**
 * User activity log interface
 */
export interface UserActivity {
  id: string;
  user: User;
  action: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
  notifications: {
    email: boolean;
    desktop: boolean;
    mobile: boolean;
  };
  dashboard: {
    default_view: string;
    widgets: string[];
  };
}

/**
 * User statistics interface
 */
export interface UserStats {
  login_count: number;
  last_login: string;
  processes_created: number;
  audits_conducted: number;
  documents_uploaded: number;
  average_session_duration: number;
}

/**
 * User filter interface for listing
 */
export interface UserFilters {
  department?: string;
  position?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_verified?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

/**
 * User status enum
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}

/**
 * Password change request interface
 */
export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * Password reset request interface
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirm interface
 */
export interface PasswordResetConfirm {
  token: string;
  new_password: string;
  confirm_password: string;
}

// RBAC interfaces moved to rbac.types.ts for better organization
// Import from: import { Permission, Role } from './rbac.types';

/**
 * User session interface
 */
export interface UserSession {
  id: string;
  user: User;
  session_key: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  is_active: boolean;
}

/**
 * Utility type for user display name
 */
export type UserDisplayName = Pick<User, 'first_name' | 'last_name' | 'email'>;

/**
 * Utility type for user basic info
 */
export type UserBasicInfo = Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'is_active'>;

/**
 * Utility functions for user data
 */
export const getUserFullName = (user: User): string => {
  return `${user.first_name} ${user.last_name}`.trim() || user.email;
};

export const getUserInitials = (user: User): string => {
  const firstInitial = user.first_name?.[0] || '';
  const lastInitial = user.last_name?.[0] || '';
  return (firstInitial + lastInitial).toUpperCase() || user.email[0].toUpperCase();
};

export const getUserDisplayName = (user: User): string => {
  const fullName = getUserFullName(user);
  return fullName !== user.email ? fullName : user.email;
};

export const isUserActive = (user: User): boolean => {
  return user.is_active && user.is_verified;
};

export const isUserStaff = (user: User): boolean => {
  return user.is_staff;
};

/**
 * User avatar placeholder colors based on initials
 */
export const getUserAvatarColor = (user: User): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#FF6348', '#2ED573', '#3742FA', '#F368E0', '#FFA502',
  ];
  
  const initials = getUserInitials(user);
  const charCode = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  return colors[charCode % colors.length];
};

/**
 * Type guards
 */
export const isUser = (obj: unknown): obj is User => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.first_name === 'string' &&
    typeof obj.last_name === 'string' &&
    typeof obj.is_active === 'boolean'
  );
};

export const isUserListResponse = (response: unknown): response is UserListResponse => {
  return (
    response &&
    response.success === true &&
    response.data &&
    Array.isArray(response.data.results)
  );
};