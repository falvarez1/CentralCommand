/**
 * Secure Cookie Management Utility
 * Handles CSRF tokens and session management
 */

// CSRF token management
let csrfToken: string | null = null;

/**
 * Get CSRF token from meta tag or storage
 */
export function getCsrfToken(): string | null {
  // Try to get from memory first
  if (csrfToken) {
    return csrfToken;
  }

  // Try to get from meta tag (set by server)
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    csrfToken = metaTag.getAttribute('content');
    return csrfToken;
  }

  // Try to get from response header storage
  const stored = sessionStorage.getItem('X-CSRF-Token');
  if (stored) {
    csrfToken = stored;
    return csrfToken;
  }

  return null;
}

/**
 * Set CSRF token from response header
 */
export function setCsrfToken(token: string): void {
  csrfToken = token;
  sessionStorage.setItem('X-CSRF-Token', token);

  // Update or create meta tag
  let metaTag = document.querySelector('meta[name="csrf-token"]');
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute('name', 'csrf-token');
    document.head.appendChild(metaTag);
  }
  metaTag.setAttribute('content', token);
}

/**
 * Clear CSRF token
 */
export function clearCsrfToken(): void {
  csrfToken = null;
  sessionStorage.removeItem('X-CSRF-Token');

  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    metaTag.setAttribute('content', '');
  }
}

/**
 * Password validation utilities
 */
export const passwordValidation = {
  minLength: 8,
  minUniqueChars: 4,

  requirements: [
    { regex: /.{8,}/, message: 'At least 8 characters', id: 'length' },
    { regex: /[A-Z]/, message: 'At least 1 uppercase letter', id: 'uppercase' },
    { regex: /[a-z]/, message: 'At least 1 lowercase letter', id: 'lowercase' },
    { regex: /\d/, message: 'At least 1 digit', id: 'digit' },
    { regex: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, message: 'At least 1 special character', id: 'special' }
  ],

  /**
   * Validate password against all requirements
   */
  validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check each requirement
    for (const req of this.requirements) {
      if (!req.regex.test(password)) {
        errors.push(req.message);
      }
    }

    // Check unique characters
    const uniqueChars = new Set(password).size;
    if (uniqueChars < this.minUniqueChars) {
      errors.push(`At least ${this.minUniqueChars} unique characters`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Get password strength score (0-100)
   */
  getStrength(password: string): number {
    if (!password) return 0;

    let score = 0;
    const maxScore = this.requirements.length + 1; // +1 for unique chars

    // Check each requirement
    for (const req of this.requirements) {
      if (req.regex.test(password)) {
        score++;
      }
    }

    // Check unique characters
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= this.minUniqueChars) {
      score++;
    }

    return Math.round((score / maxScore) * 100);
  },

  /**
   * Get password strength label
   */
  getStrengthLabel(strength: number): string {
    if (strength <= 20) return 'Very Weak';
    if (strength <= 40) return 'Weak';
    if (strength <= 60) return 'Fair';
    if (strength <= 80) return 'Good';
    return 'Strong';
  },

  /**
   * Get password strength color class
   */
  getStrengthColor(strength: number): string {
    if (strength <= 20) return 'bg-destructive';
    if (strength <= 40) return 'bg-orange-500';
    if (strength <= 60) return 'bg-yellow-500';
    if (strength <= 80) return 'bg-blue-500';
    return 'bg-green-500';
  }
};

/**
 * Session timeout management
 */
export const sessionManager = {
  warningTime: 5 * 60 * 1000, // 5 minutes before expiry

  /**
   * Check if session is about to expire
   */
  isSessionExpiringSoon(expiryTime: number): boolean {
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    return timeUntilExpiry > 0 && timeUntilExpiry <= this.warningTime;
  },

  /**
   * Get formatted time until expiry
   */
  getTimeUntilExpiry(expiryTime: number): string {
    const now = Date.now();
    const timeUntilExpiry = Math.max(0, expiryTime - now);

    const minutes = Math.floor(timeUntilExpiry / 60000);
    const seconds = Math.floor((timeUntilExpiry % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
};

/**
 * Clear all sensitive data from browser storage
 */
export function clearSensitiveData(): void {
  // Clear CSRF token
  clearCsrfToken();

  // Clear any form data from sessionStorage
  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('form') || key.includes('password') || key.includes('token'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => sessionStorage.removeItem(key));

  // Clear any sensitive data from localStorage (except theme and UI preferences)
  const localKeysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !key.includes('theme') && !key.includes('ui-') && !key.includes('preference')) {
      localKeysToRemove.push(key);
    }
  }
  localKeysToRemove.forEach(key => localStorage.removeItem(key));
}