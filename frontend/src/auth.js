// VALIS Authentication Implementation
// Integrates with Supabase Auth API

// Configuration
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_API_KEY = 'YOUR_SUPABASE_API_KEY'; // Public anon key

// Auth class for managing authentication
class VALISAuth {
  constructor() {
    this.accessToken = localStorage.getItem('access_token') || null;
    this.refreshToken = localStorage.getItem('refresh_token') || null;
    this.user = null;
    
    // Check if token exists and validate on init
    if (this.accessToken) {
      this.getCurrentUser().catch(() => this.logout());
    }
    
    // Set up token refresh functionality
    this._setupTokenRefresh();
  }
  
  // Load current user from API
  async getCurrentUser() {
    if (!this.accessToken) return null;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: this._getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to get user');
      
      const userData = await response.json();
      this.user = userData;
      return userData;
    } catch (error) {
      console.error('Error fetching user:', error);
      // Token may be invalid - clear it
      if (error.message.includes('401')) {
        this.logout();
      }
      throw error;
    }
  }
  
  // Login with email and password
  async login(email, password) {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_API_KEY
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error_description || 'Login failed');
      }
      
      this._handleAuthResponse(data);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  // Register new user
  async register(email, password) {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_API_KEY
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error_description || 'Registration failed');
      }
      
      // If auto-confirm is enabled, we'll get tokens
      if (data.access_token) {
        this._handleAuthResponse(data);
      }
      
      return {
        user: data.user || data,
        session: data.access_token ? {
          access_token: data.access_token,
          refresh_token: data.refresh_token
        } : null
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  // Password recovery request
  async resetPassword(email) {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_API_KEY
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error_description || 'Password reset failed');
      }
      
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }
  
  // Sign in with Google OAuth
  signInWithGoogle() {
    const redirectUrl = encodeURIComponent(`${window.location.origin}/auth/callback`);
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&scopes=email profile&redirect_to=${redirectUrl}`;
  }
  
  // Verify one-time token (for email confirmation, password reset, etc)
  async verifyOTP(params) {
    const { email, token, type = 'signup' } = params;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_API_KEY
        },
        body: JSON.stringify({ email, token, type })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error_description || 'Verification failed');
      }
      
      // Store tokens if returned
      if (data.access_token) {
        this._handleAuthResponse(data);
      }
      
      return data;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  }
  
  // Resend verification code
  async resendVerificationCode(email, type = 'signup') {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_API_KEY
        },
        body: JSON.stringify({ email, type })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error_description || 'Resend failed');
      }
      
      return true;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }
  
  // Update user profile
  async updateProfile(userData) {
    if (!this.accessToken) throw new Error('Not authenticated');
    
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: this._getAuthHeaders(),
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error_description || 'Update failed');
      }
      
      const updatedUser = await response.json();
      this.user = updatedUser;
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
  
  // Logout
  async logout() {
    try {
      if (this.accessToken) {
        // Optional: Call logout endpoint to invalidate token on server
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: this._getAuthHeaders()
        }).catch(e => console.error('Logout API error:', e));
      }
      
      // Clear local storage regardless of API response
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token'); 
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage on error
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      
      throw error;
    }
  }
  
  // Check if user is authenticated
  isAuthenticated() {
    return !!this.accessToken;
  }
  
  // Handle OAuth callbacks
  handleAuthCallback() {
    // Check URL for access_token in fragment
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return { success: true, accessToken, refreshToken };
    }
    
    // Check for error
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      return { success: false, error, errorDescription };
    }
    
    return { success: false };
  }
  
  // Private methods
  _handleAuthResponse(data) {
    if (data.access_token) {
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      if (data.user) {
        this.user = data.user;
      } else if (data.access_token) {
        // Fetch user data if not included
        this.getCurrentUser().catch(err => console.error('Error fetching user after auth:', err));
      }
    }
  }
  
  _getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'apikey': SUPABASE_API_KEY,
      'Content-Type': 'application/json'
    };
  }
  
  // Set up token refresh
  _setupTokenRefresh() {
    // If we have tokens and can decode JWT, set up refresh timer
    if (this.accessToken && this.refreshToken) {
      try {
        // Decode the token to get expiry
        const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
        const expiresAt = payload.exp * 1000; // Convert to milliseconds
        
        // Set refresh to happen 5 minutes before expiry
        const refreshTime = expiresAt - Date.now() - (5 * 60 * 1000);
        
        if (refreshTime > 0) {
          setTimeout(() => this._refreshToken(), refreshTime);
        } else {
          // Token already expired or about to expire, refresh now
          this._refreshToken();
        }
      } catch (error) {
        console.error('Error setting up token refresh:', error);
      }
    }
  }
  
  // Refresh access token
  async _refreshToken() {
    if (!this.refreshToken) return null;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_API_KEY
        },
        body: JSON.stringify({ refresh_token: this.refreshToken })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error_description || 'Token refresh failed');
      }
      
      this._handleAuthResponse(data);
      this._setupTokenRefresh(); // Set up the next refresh
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, log user out
      this.logout();
      throw error;
    }
  }
}

// Create and export auth instance
const auth = new VALISAuth();

// Validation utilities
const validators = {
  email: (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  },
  
  password: (password) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    return {
      valid: strength >= 3,
      strength, // 0-4
      reasons: [
        password.length < 8 ? 'length' : null,
        !(/[a-z]/.test(password) && /[A-Z]/.test(password)) ? 'characters' : null,
        !/[0-9]/.test(password) ? 'characters' : null,
        !/[^a-zA-Z0-9]/.test(password) ? 'characters' : null
      ].filter(Boolean)
    };
  }
};

// Export both the auth instance and validators
export { auth, validators };

// Initialize auth callback handler on page load if needed
document.addEventListener('DOMContentLoaded', () => {
  // If we're on a callback page
  if (window.location.pathname.includes('/auth/callback') || 
      window.location.hash.includes('access_token') ||
      window.location.search.includes('error')) {
    
    const result = auth.handleAuthCallback();
    
    if (result.success) {
      // Redirect to dashboard/home
      window.location.href = '/dashboard';
    } else if (result.error) {
      // Handle error - possibly redirect to login with error
      window.location.href = `/login?error=${encodeURIComponent(result.error)}&message=${encodeURIComponent(result.errorDescription || 'Authentication failed')}`;
    }
  }
});
