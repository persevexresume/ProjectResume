import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Vite env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

const GLOBAL_SUPABASE_CLIENT_KEY = '__persevexSupabaseClient__';
const globalScope = typeof globalThis !== 'undefined' ? globalThis : window;
const existingSupabaseClient = globalScope[GLOBAL_SUPABASE_CLIENT_KEY];

// Reuse a single Supabase client across hot reloads to avoid duplicate GoTrue clients.
export const supabase = existingSupabaseClient || createClient(supabaseUrl, supabaseAnonKey);

if (!existingSupabaseClient) {
  globalScope[GLOBAL_SUPABASE_CLIENT_KEY] = supabase;
}

// Flag to indicate if Supabase is in mock/fallback mode
export const isMock = supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key');

const SUPABASE_NETWORK_BACKOFF_MS = 30000;
let lastNetworkFailureAt = 0;

function markSupabaseNetworkFailure() {
  lastNetworkFailureAt = Date.now();
}

function isSupabaseTemporarilyUnavailable() {
  return Date.now() - lastNetworkFailureAt < SUPABASE_NETWORK_BACKOFF_MS;
}

const NETWORK_ERROR_PATTERNS = [
  'failed to fetch',
  'fetch failed',
  'networkerror',
  'err_name_not_resolved',
  'dns',
  'network request failed',
  'load failed'
];

function isSupabaseNetworkError(error) {
  const rawMessage = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ').toLowerCase();
  return NETWORK_ERROR_PATTERNS.some((token) => rawMessage.includes(token));
}

function getSupabaseConnectionErrorMessage() {
  let host = supabaseUrl;
  try {
    host = new URL(supabaseUrl).host;
  } catch {
    // Keep the raw value if URL parsing fails.
  }

  return `Cannot reach Supabase host (${host}). Update VITE_SUPABASE_URL in client/.env to a valid, active Supabase project URL.`;
}

// Authentication service
export const auth = {
  /**
   * Sign in with email and password
   * Supports both students and admins tables
   */
  async signIn(emailOrId, password) {
    try {
      if (isSupabaseTemporarilyUnavailable()) {
        return {
          success: false,
          error: `Recent Supabase connection failure detected. ${getSupabaseConnectionErrorMessage()}`,
          user: null,
          userType: null
        };
      }

      // Check if input is an email
      const isEmail = emailOrId.includes('@');

      let user = null;
      let userType = null;

      if (isEmail) {
        // Try student table first
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('email', emailOrId)
          .maybeSingle()
          .retry(false);

        if (studentError && isSupabaseNetworkError(studentError)) {
          markSupabaseNetworkFailure();
          return {
            success: false,
            error: getSupabaseConnectionErrorMessage(),
            user: null,
            userType: null
          };
        }

        if (student && student.password === password) {
          user = student;
          userType = 'student';
        } else {
          // Try admin table
          const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('email', emailOrId)
            .maybeSingle()
            .retry(false);

          if (adminError && isSupabaseNetworkError(adminError)) {
            markSupabaseNetworkFailure();
            return {
              success: false,
              error: getSupabaseConnectionErrorMessage(),
              user: null,
              userType: null
            };
          }

          if (admin && admin.password === password) {
            user = admin;
            userType = 'admin';
          }
        }
      } else {
        // Try student table with ID
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', emailOrId)
          .maybeSingle()
          .retry(false);

        if (studentError && isSupabaseNetworkError(studentError)) {
          markSupabaseNetworkFailure();
          return {
            success: false,
            error: getSupabaseConnectionErrorMessage(),
            user: null,
            userType: null
          };
        }

        if (student && student.password === password) {
          user = student;
          userType = 'student';
        } else {
          // Try admin table with ID
          const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', emailOrId)
            .maybeSingle()
            .retry(false);

          if (adminError && isSupabaseNetworkError(adminError)) {
            markSupabaseNetworkFailure();
            return {
              success: false,
              error: getSupabaseConnectionErrorMessage(),
              user: null,
              userType: null
            };
          }

          if (admin && admin.password === password) {
            user = admin;
            userType = 'admin';
          }
        }
      }

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials',
          user: null,
          userType: null
        };
      }

      // Check if student account has expired
      if (userType === 'student' && user.expires_at) {
        const expiryDate = new Date(user.expires_at);
        if (new Date() > expiryDate) {
          return {
            success: false,
            error: 'Your account has expired. Please contact support.',
            user: null,
            userType: null
          };
        }
      }

      return {
        success: true,
        error: null,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || user.id,
          role: userType
        },
        userType
      };
    } catch (error) {
      console.error('Sign in error:', error);

      if (isSupabaseNetworkError(error)) {
        markSupabaseNetworkFailure();
      }

      const message = isSupabaseNetworkError(error)
        ? getSupabaseConnectionErrorMessage()
        : error.message;

      return {
        success: false,
        error: message,
        user: null,
        userType: null
      };
    }
  },

  /**
   * Sign out user
   */
  signOut() {
    try {
      localStorage.removeItem('persevex_user');
      localStorage.removeItem('persevex_resume');
      return { success: true, error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create a new student account
   */
  async signUpStudent(email, password, name) {
    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        return {
          success: false,
          error: 'Email already registered',
          user: null
        };
      }

      // Create new student
      const userId = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 2);

      const { data: newStudent, error } = await supabase
        .from('students')
        .insert([
          {
            id: userId,
            email,
            password,
            name: name || email.split('@')[0],
            expires_at: expiryDate.toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
          user: null
        };
      }

      return {
        success: true,
        error: null,
        user: {
          id: newStudent.id,
          email: newStudent.email,
          name: newStudent.name,
          role: 'student'
        }
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.message,
        user: null
      };
    }
  },

  /**
   * Get current session from localStorage
   */
  getSession() {
    try {
      const userStr = localStorage.getItem('persevex_user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
};

// Resume service
export const resumeService = {
  /**
   * Save or update a resume
   */
  async saveResume(userId, resumeData, customization, templateId, title = 'Untitled Resume') {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .upsert(
          {
            user_id: userId,
            title,
            data: resumeData,
            customization,
            template: templateId,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('Save resume error:', error);
      return { success: false, error: error.message, data: null };
    }
  },

  /**
   * Get all resumes for a user
   */
  async getUserResumes(userId) {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message, data: [] };
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('Get resumes error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Get a specific resume
   */
  async getResume(resumeId) {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .single();

      if (error) {
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('Get resume error:', error);
      return { success: false, error: error.message, data: null };
    }
  },

  /**
   * Delete a resume
   */
  async deleteResume(resumeId) {
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Delete resume error:', error);
      return { success: false, error: error.message };
    }
  }
};
