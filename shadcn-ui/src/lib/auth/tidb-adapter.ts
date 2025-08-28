import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from "@auth/core/adapters";
import type { RowDataPacket } from 'mysql2/promise';
import { db } from '../tidb';

interface DBUser extends AdapterUser, RowDataPacket {}
interface DBAccount extends AdapterAccount, RowDataPacket {}
interface DBSession extends AdapterSession, RowDataPacket {}
interface DBVerificationToken extends VerificationToken, RowDataPacket {}

// Schema for auth tables
const AUTH_SCHEMA = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      email_verified TIMESTAMP NULL,
      image VARCHAR(255),
      role ENUM('admin', 'doctor', 'nurse', 'staff') NOT NULL DEFAULT 'staff',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `,
  accounts: `
    CREATE TABLE IF NOT EXISTS accounts (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      type VARCHAR(255) NOT NULL,
      provider VARCHAR(255) NOT NULL,
      provider_account_id VARCHAR(255) NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at BIGINT,
      token_type VARCHAR(255),
      scope VARCHAR(255),
      id_token TEXT,
      session_state VARCHAR(255),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY provider_unique (provider, provider_account_id)
    )
  `,
  sessions: `
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      expires TIMESTAMP NOT NULL,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  verification_tokens: `
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires TIMESTAMP NOT NULL,
      UNIQUE KEY token_unique (identifier, token)
    )
  `
};

// Initialize auth tables
export async function initializeAuthTables() {
  for (const [table, schema] of Object.entries(AUTH_SCHEMA)) {
    await db.query(schema);
    console.log(`Created auth table: ${table}`);
  }
}

export function TiDBAdapter(): Adapter {
  return {
    async createUser(user): Promise<AdapterUser> {
      const userId = user.id || `user-${Date.now()}`;
      await db.query(
        `INSERT INTO users (id, name, email, email_verified, image)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          user.name,
          user.email,
          user.emailVerified,
          user.image
        ]
      );
      const [createdUser] = await db.query<DBUser[]>(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      return createdUser;
    },

  async getUser(id): Promise<AdapterUser | null> {
    try {
      const users = await db.query<DBUser[]>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  async getUserByEmail(email): Promise<AdapterUser | null> {
    try {
      const users = await db.query<DBUser[]>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  },

  async getUserByAccount({ providerAccountId, provider }): Promise<AdapterUser | null> {
    try {
      const users = await db.query<DBUser[]>(
        `SELECT users.* FROM users 
         JOIN accounts ON accounts.userId = users.id 
         WHERE accounts.providerAccountId = ? 
         AND accounts.provider = ?`,
        [providerAccountId, provider]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error getting user by account:', error);
      return null;
    }
  },

  async updateUser(user): Promise<AdapterUser> {
    try {
      await db.query(
        `UPDATE users 
         SET name = COALESCE(?, name),
             email = COALESCE(?, email),
             email_verified = COALESCE(?, email_verified),
             image = COALESCE(?, image)
         WHERE id = ?`,
        [user.name, user.email, user.emailVerified, user.image, user.id]
      );
      const [updatedUser] = await db.query<DBUser[]>(
        'SELECT * FROM users WHERE id = ?',
        [user.id]
      );
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(userId: string) {
    try {
      // Delete user's accounts and sessions first
      await db.query('DELETE FROM accounts WHERE user_id = ?', [userId]);
      await db.query('DELETE FROM sessions WHERE user_id = ?', [userId]);
      // Then delete the user
      await db.query('DELETE FROM users WHERE id = ?', [userId]);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async linkAccount(account: AdapterAccount) {
    try {
      await db.query(
        `INSERT INTO accounts (
          user_id, type, provider, provider_account_id,
          refresh_token, access_token, expires_at,
          token_type, scope, id_token, session_state
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          account.userId,
          account.type,
          account.provider,
          account.providerAccountId,
          account.refresh_token,
          account.access_token,
          account.expires_at,
          account.token_type,
          account.scope,
          account.id_token,
          account.session_state
        ]
      );
    } catch (error) {
      console.error('Error linking account:', error);
      throw error;
    }
  },

  async unlinkAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
    try {
      await db.query(
        'DELETE FROM accounts WHERE provider = ? AND provider_account_id = ?',
        [provider, providerAccountId]
      );
    } catch (error) {
      console.error('Error unlinking account:', error);
      throw error;
    }
  },

  async createSession(session: { sessionToken: string; userId: string; expires: Date }): Promise<AdapterSession> {
    try {
      await db.query(
        `INSERT INTO sessions (user_id, expires, session_token)
         VALUES (?, ?, ?)`,
        [session.userId, session.expires, session.sessionToken]
      );
      const [createdSession] = await db.query<DBSession[]>(
        'SELECT * FROM sessions WHERE session_token = ?',
        [session.sessionToken]
      );
      return createdSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
    try {
      const [session] = await db.query<DBSession[]>(
        'SELECT * FROM sessions WHERE session_token = ?',
        [sessionToken]
      );

      if (!session) return null;

      const [user] = await db.query<DBUser[]>(
        'SELECT * FROM users WHERE id = ?',
        [session.userId]
      );

      if (!user) return null;

      return { session, user };
    } catch (error) {
      console.error('Error getting session and user:', error);
      return null;
    }
  },

  async updateSession(session: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">): Promise<AdapterSession | null> {
    try {
      await db.query(
        'UPDATE sessions SET expires = ? WHERE session_token = ?',
        [session.expires, session.sessionToken]
      );
      const [updatedSession] = await db.query<DBSession[]>(
        'SELECT * FROM sessions WHERE session_token = ?',
        [session.sessionToken]
      );
      return updatedSession || null;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },

  async deleteSession(sessionToken: string) {
    try {
      await db.query(
        'DELETE FROM sessions WHERE session_token = ?',
        [sessionToken]
      );
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  },

  async createVerificationToken(token: VerificationToken): Promise<VerificationToken> {
    try {
      await db.query(
        `INSERT INTO verification_tokens (identifier, token, expires)
         VALUES (?, ?, ?)`,
        [token.identifier, token.token, token.expires]
      );
      return token;
    } catch (error) {
      console.error('Error creating verification token:', error);
      throw error;
    }
  },

  async useVerificationToken({ identifier, token }: { identifier: string; token: string }): Promise<VerificationToken | null> {
    try {
      const [verificationToken] = await db.query<DBVerificationToken[]>(
        `SELECT * FROM verification_tokens
         WHERE identifier = ? AND token = ?`,
        [identifier, token]
      );

      if (!verificationToken) return null;

      await db.query(
        `DELETE FROM verification_tokens
         WHERE identifier = ? AND token = ?`,
        [identifier, token]
      );

      return verificationToken;
    } catch (error) {
      console.error('Error using verification token:', error);
      throw error;
    }
  }
  };
}
