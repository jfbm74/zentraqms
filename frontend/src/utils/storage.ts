/**
 * Storage Utilities for ZentraQMS Frontend
 * 
 * This module provides secure and type-safe utilities for managing
 * localStorage and sessionStorage, with encryption support for sensitive data.
 */

import { User } from '../types/user.types';
import { TokenPair, StorageKeys } from '../types/auth.types';

/**
 * Storage configuration interface
 */
interface StorageConfig {
  encrypt?: boolean;
  useSessionStorage?: boolean;
  prefix?: string;
}

/**
 * Default storage configuration
 */
const DEFAULT_CONFIG: StorageConfig = {
  encrypt: false, // Will be enabled in Phase 2 with proper encryption
  useSessionStorage: false,
  prefix: 'zentra_',
};

/**
 * Storage utility class with type safety and error handling
 */
class StorageService {
  private config: StorageConfig;

  constructor(config: StorageConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the appropriate storage mechanism
   */
  private getStorage(): Storage {
    return this.config.useSessionStorage ? sessionStorage : localStorage;
  }

  /**
   * Generate prefixed key
   */
  private getPrefixedKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  /**
   * Safely stringify data
   */
  private stringify(data: unknown): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('[Storage] Failed to stringify data:', error);
      throw new Error('Failed to serialize data for storage');
    }
  }

  /**
   * Safely parse data
   */
  private parse<T>(data: string): T | null {
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('[Storage] Failed to parse data:', error);
      return null;
    }
  }

  /**
   * Encrypt data (placeholder for Phase 2)
   */
  private encrypt(data: string): string {
    // TODO: Implement proper encryption in Phase 2
    // For now, just return the data as-is
    if (this.config.encrypt) {
      console.warn('[Storage] Encryption not yet implemented');
    }
    return data;
  }

  /**
   * Decrypt data (placeholder for Phase 2)
   */
  private decrypt(data: string): string {
    // TODO: Implement proper decryption in Phase 2
    // For now, just return the data as-is
    if (this.config.encrypt) {
      console.warn('[Storage] Decryption not yet implemented');
    }
    return data;
  }

  /**
   * Store data in storage
   */
  setItem<T>(key: string, value: T): boolean {
    try {
      const storage = this.getStorage();
      const prefixedKey = this.getPrefixedKey(key);
      const serializedValue = this.stringify(value);
      const finalValue = this.config.encrypt ? this.encrypt(serializedValue) : serializedValue;
      
      storage.setItem(prefixedKey, finalValue);
      return true;
    } catch (error) {
      console.error(`[Storage] Failed to store item ${key}:`, error);
      return false;
    }
  }

  /**
   * Get data from storage
   */
  getItem<T>(key: string): T | null {
    try {
      const storage = this.getStorage();
      const prefixedKey = this.getPrefixedKey(key);
      const storedValue = storage.getItem(prefixedKey);
      
      if (!storedValue) {
        return null;
      }

      const decryptedValue = this.config.encrypt ? this.decrypt(storedValue) : storedValue;
      return this.parse<T>(decryptedValue);
    } catch (error) {
      console.error(`[Storage] Failed to retrieve item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): boolean {
    try {
      const storage = this.getStorage();
      const prefixedKey = this.getPrefixedKey(key);
      storage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error(`[Storage] Failed to remove item ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if item exists in storage
   */
  hasItem(key: string): boolean {
    try {
      const storage = this.getStorage();
      const prefixedKey = this.getPrefixedKey(key);
      return storage.getItem(prefixedKey) !== null;
    } catch (error) {
      console.error(`[Storage] Failed to check item ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all items with prefix
   */
  clear(): void {
    try {
      const storage = this.getStorage();
      const keysToRemove: string[] = [];
      
      // Find all keys with our prefix
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.config.prefix!)) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all matching keys
      keysToRemove.forEach(key => storage.removeItem(key));
    } catch (error) {
      console.error('[Storage] Failed to clear storage:', error);
    }
  }

  /**
   * Get storage size (approximate)
   */
  getSize(): number {
    try {
      const storage = this.getStorage();
      let size = 0;
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.config.prefix!)) {
          const value = storage.getItem(key);
          if (value) {
            size += key.length + value.length;
          }
        }
      }
      
      return size;
    } catch (error) {
      console.error('[Storage] Failed to calculate storage size:', error);
      return 0;
    }
  }
}

/**
 * Create storage instances for different use cases
 */
export const storage = new StorageService();
export const secureStorage = new StorageService({ encrypt: true });
export const sessionStorage = new StorageService({ useSessionStorage: true });

/**
 * Authentication-specific storage utilities
 */
export class AuthStorage {
  /**
   * Store authentication tokens
   */
  static setTokens(tokens: TokenPair): boolean {
    const accessStored = storage.setItem(StorageKeys.ACCESS_TOKEN, tokens.access);
    const refreshStored = storage.setItem(StorageKeys.REFRESH_TOKEN, tokens.refresh);
    return accessStored && refreshStored;
  }

  /**
   * Get authentication tokens
   */
  static getTokens(): TokenPair | null {
    const access = storage.getItem<string>(StorageKeys.ACCESS_TOKEN);
    const refresh = storage.getItem<string>(StorageKeys.REFRESH_TOKEN);
    
    if (!access || !refresh) {
      return null;
    }
    
    return { access, refresh };
  }

  /**
   * Store access token only
   */
  static setAccessToken(token: string): boolean {
    return storage.setItem(StorageKeys.ACCESS_TOKEN, token);
  }

  /**
   * Get access token
   */
  static getAccessToken(): string | null {
    return storage.getItem<string>(StorageKeys.ACCESS_TOKEN);
  }

  /**
   * Store refresh token only
   */
  static setRefreshToken(token: string): boolean {
    return storage.setItem(StorageKeys.REFRESH_TOKEN, token);
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    return storage.getItem<string>(StorageKeys.REFRESH_TOKEN);
  }

  /**
   * Store user data
   */
  static setUser(user: User): boolean {
    return storage.setItem(StorageKeys.USER_DATA, user);
  }

  /**
   * Get user data
   */
  static getUser(): User | null {
    return storage.getItem<User>(StorageKeys.USER_DATA);
  }

  /**
   * Store remember me preference
   */
  static setRememberMe(remember: boolean): boolean {
    return storage.setItem(StorageKeys.REMEMBER_ME, remember);
  }

  /**
   * Get remember me preference
   */
  static getRememberMe(): boolean {
    return storage.getItem<boolean>(StorageKeys.REMEMBER_ME) || false;
  }

  /**
   * Clear all authentication data
   */
  static clearAuth(): void {
    storage.removeItem(StorageKeys.ACCESS_TOKEN);
    storage.removeItem(StorageKeys.REFRESH_TOKEN);
    storage.removeItem(StorageKeys.USER_DATA);
    storage.removeItem(StorageKeys.REMEMBER_ME);
  }

  /**
   * Check if user is logged in (has valid tokens)
   */
  static isLoggedIn(): boolean {
    const tokens = this.getTokens();
    return tokens !== null && tokens.access.length > 0;
  }

  /**
   * Get all auth data at once
   */
  static getAuthData(): {
    tokens: TokenPair | null;
    user: User | null;
    rememberMe: boolean;
  } {
    return {
      tokens: this.getTokens(),
      user: this.getUser(),
      rememberMe: this.getRememberMe(),
    };
  }

  /**
   * Store complete auth data
   */
  static setAuthData(data: {
    tokens: TokenPair;
    user: User;
    rememberMe?: boolean;
  }): boolean {
    const tokensStored = this.setTokens(data.tokens);
    const userStored = this.setUser(data.user);
    
    let rememberStored = true;
    if (data.rememberMe !== undefined) {
      rememberStored = this.setRememberMe(data.rememberMe);
    }
    
    return tokensStored && userStored && rememberStored;
  }
}

/**
 * Storage event utilities
 */
export class StorageEvents {
  /**
   * Listen for storage changes
   */
  static onStorageChange(callback: (event: StorageEvent) => void): () => void {
    const handleStorageChange = (event: StorageEvent) => {
      // Only handle events for our prefixed keys
      if (event.key && event.key.startsWith(DEFAULT_CONFIG.prefix!)) {
        callback(event);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }

  /**
   * Listen for auth data changes specifically
   */
  static onAuthChange(callback: () => void): () => void {
    return this.onStorageChange((event) => {
      const authKeys = Object.values(StorageKeys).map(key => DEFAULT_CONFIG.prefix + key);
      if (event.key && authKeys.includes(event.key)) {
        callback();
      }
    });
  }

  /**
   * Dispatch custom storage event
   */
  static dispatchStorageEvent(key: string, oldValue: unknown, newValue: unknown): void {
    const event = new StorageEvent('storage', {
      key: DEFAULT_CONFIG.prefix + key,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      url: window.location.href,
      storageArea: localStorage,
    });

    window.dispatchEvent(event);
  }
}

/**
 * Storage quota utilities
 */
export class StorageQuota {
  /**
   * Check if storage is available
   */
  static isAvailable(type: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean {
    try {
      const storage = window[type];
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  static getUsage(): { used: number; available: number; percentage: number } {
    if (!this.isAvailable()) {
      return { used: 0, available: 0, percentage: 0 };
    }

    try {
      // Estimate storage usage
      let used = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Typical localStorage limit is 5-10MB, we'll assume 5MB
      const available = 5 * 1024 * 1024; // 5MB in bytes
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch (error) {
      console.error('[Storage] Failed to calculate usage:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Check if storage is almost full (>80%)
   */
  static isAlmostFull(): boolean {
    const usage = this.getUsage();
    return usage.percentage > 80;
  }
}

/**
 * Export default storage instance
 */
export default storage;