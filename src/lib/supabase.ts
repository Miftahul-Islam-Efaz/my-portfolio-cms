import { createClient } from '@supabase/supabase-js';

// Default project fallback credentials matching your portfolio config
const DEFAULT_SUPABASE_URL = 'https://ofilalrcacqemfftmmwo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9maWxhbHJjYWNxZW1mZnRtbXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzU2OTEsImV4cCI6MjA5NTgxMTY5MX0.7i2pGgVQNokmLSD4Q740INMEBRezaujhZPEHtDr-Gzo';

// Support VITE_ prefix for environment variable injection in hosting panels
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Custom auth helper. Takes the 4-digit passcode, validates it,
 * and signs in with a fixed admin user account. If the user doesn't
 * exist yet, it automatically signs up to initialize database RLS access.
 */
export async function authenticateWithPasscode(passcode: string) {
  if (passcode !== '4203') {
    throw new Error('Incorrect passcode. Access Denied.');
  }

  const email = (import.meta as any).env.VITE_ADMIN_EMAIL;
  const password = (import.meta as any).env.VITE_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Admin credentials are not configured in environment variables (VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD).');
  }

  // 1. Try to log in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // 2. If credentials don't exist, sign up
    if (signInError.message.toLowerCase().includes('invalid login credentials')) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw new Error(`Self-registration failed: ${signUpError.message}`);
      }

      // If signed up successfully, return session data
      if (signUpData.session) {
        return signUpData;
      }
      
      // If email confirmation is enabled, we'll try to sign in again or prompt
      throw new Error('Admin account created! Please try entering the passcode again to complete login.');
    }

    throw signInError;
  }

  return signInData;
}
