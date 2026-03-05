import bcrypt from 'bcryptjs';
import { get } from 'svelte/store';
import { t } from 'svelte-i18n';
import { getDatabase } from '$lib/db/database';
import { sessionStore, type User } from '$lib/stores/session-store';
import { createLogger } from '$lib/logger';

const log = createLogger('auth-service');
const SALT_ROUNDS = 10;

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  error?: string;
}

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Attempt to log in with email (username) and password.
 * Returns a generic error message to prevent account enumeration.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  log.debug({ email }, 'Login attempt');

  try {
    const db = getDatabase();

    // Find user by username (email)
    const result = db.exec(
      'SELECT id, username, password_hash, display_name, is_admin FROM users WHERE username = ?',
      [email]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      // User not found - return generic error
      log.debug({ email }, 'Login failed: user not found');
      return { success: false, error: get(t)('auth.loginErrorInvalid') };
    }

    const row = result[0].values[0];
    const userId = Number(row[0]);
    const username = String(row[1]);
    const passwordHash = String(row[2]);
    const displayName = row[3] ? String(row[3]) : null;
    const isAdmin = Boolean(row[4]);

    // Verify password
    const isValid = await verifyPassword(password, passwordHash);
    if (!isValid) {
      // Wrong password - return generic error
      log.debug({ email }, 'Login failed: invalid password');
      return { success: false, error: get(t)('auth.loginErrorInvalid') };
    }

    // Create session
    const user: User = {
      id: userId,
      username,
      displayName,
      isAdmin,
    };

    sessionStore.setUser(user);

    log.info({ userId, username, isAdmin }, 'Login successful');
    return { success: true };
  } catch (err) {
    log.error({ err, email }, 'Login error');
    return { success: false, error: get(t)('auth.loginErrorGeneric') };
  }
}

/**
 * Log out the current user.
 * Clears session and sensitive data.
 */
export function logout(): void {
  log.info('User logged out');
  sessionStore.clear();
}

/**
 * Get the current authenticated user.
 */
export function getCurrentUser(): User | null {
  let user: User | null = null;
  sessionStore.subscribe((state) => {
    user = state.user;
  })();
  return user;
}

/**
 * Check if there is an active session.
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

const MIN_PASSWORD_LENGTH = 14;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format.
 */
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Register a new user with invitation code.
 * Validates all inputs and creates the account if valid.
 */
export async function register(
  email: string,
  password: string,
  invitationCode: string
): Promise<RegisterResult> {
  log.debug({ email }, 'Registration attempt');

  try {
    // Validate email format
    if (!isValidEmail(email)) {
      log.debug({ email }, 'Registration failed: invalid email format');
      return { success: false, error: get(t)('auth.errorInvalidEmail') };
    }

    // Validate password length (SEC.05: minimum 14 characters)
    if (password.length < MIN_PASSWORD_LENGTH) {
      log.debug({ email }, 'Registration failed: password too short');
      return { success: false, error: get(t)('auth.errorPasswordMinLength', { values: { min: MIN_PASSWORD_LENGTH } }) };
    }

    const db = getDatabase();

    // Check if email is already registered
    const existingUser = db.exec(
      'SELECT id FROM users WHERE username = ?',
      [email]
    );
    if (existingUser.length > 0 && existingUser[0].values.length > 0) {
      log.debug({ email }, 'Registration failed: email already registered');
      return { success: false, error: get(t)('auth.errorEmailTaken') };
    }

    // Validate invitation code (SEC.04: timing-attack resistant)
    // Always query to prevent timing differences
    const codeResult = db.exec(
      'SELECT id, is_used FROM invitation_codes WHERE code = ?',
      [invitationCode.trim()]
    );

    // Perform constant-time-ish validation
    const codeExists = codeResult.length > 0 && codeResult[0].values.length > 0;
    const codeIsUsed = codeExists ? Boolean(codeResult[0].values[0][1]) : false;
    const codeId = codeExists ? Number(codeResult[0].values[0][0]) : null;

    if (!codeExists || codeIsUsed) {
      // Generic error to prevent code enumeration
      log.debug({ email }, 'Registration failed: invalid or used invitation code');
      return { success: false, error: get(t)('auth.errorInvalidInvitation') };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user account
    db.run(
      'INSERT INTO users (username, password_hash, display_name, is_admin) VALUES (?, ?, ?, ?)',
      [email, passwordHash, null, 0]
    );

    // Get the new user's ID
    const newUserResult = db.exec('SELECT last_insert_rowid()');
    const newUserId = Number(newUserResult[0].values[0][0]);

    // Mark invitation code as used (SEC.04: single-use)
    db.run(
      'UPDATE invitation_codes SET is_used = 1, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newUserId, codeId]
    );

    log.info({ userId: newUserId, email }, 'Registration successful');
    return { success: true };
  } catch (err) {
    log.error({ err, email }, 'Registration error');
    return { success: false, error: get(t)('auth.errorRegistration') };
  }
}
