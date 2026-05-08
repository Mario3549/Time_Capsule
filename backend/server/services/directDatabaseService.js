const { Pool } = require('pg');
require('dotenv').config();

class DirectDatabaseService {
  constructor() {
    // Use DATABASE_URL if provided, otherwise fall back to individual env vars
    const config = process.env.DATABASE_URL 
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          database: process.env.DB_NAME || 'timevault_db',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'password',
        };

    this.pool = new Pool({
      ...config,
      max: parseInt(process.env.DB_POOL_MAX || 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || 30000),
      connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT_MS || 20000),
      allowExitOnIdle: false,
      keepAlive: true,
      keepAliveInitialDelayMillis: 0
    });

    // Set connection-level settings (keepalive, statement_timeout) when a client is created
    this.pool.on('connect', (client) => {
      // tcp keepalives (server-dependent; safe no-op if not supported)
      client.query('SET idle_in_transaction_session_timeout TO 30000').catch(() => {});
      client.query('SET statement_timeout TO 30000').catch(() => {});
    });

    // Log and gracefully handle pool-level errors
    this.pool.on('error', (err) => {
      console.error('Postgres pool error:', err.message);
    });
  }

  async query(text, params) {
    const maxAttempts = 3;
    let attempt = 0;
    let lastError;
    while (attempt < maxAttempts) {
      attempt++;
      const client = await this.pool.connect();
      try {
        const result = await client.query(text, params);
        client.release();
        return result;
      } catch (error) {
        client.release();
        lastError = error;
        // Retry on transient errors
        const message = String(error && (error.message || error.code || error.name));
        const transient =
          message.includes('Connection terminated') ||
          message.includes('terminating connection') ||
          message.includes('timeout') ||
          message.includes('ECONNRESET') ||
          message.includes('EPIPE');
        if (!transient || attempt >= maxAttempts) {
          throw error;
        }
        // small backoff
        await new Promise(r => setTimeout(r, 300 * attempt));
      }
    }
    throw lastError;
  }

  async testConnection() {
    try {
      const result = await this.query('SELECT NOW()');
      console.log('✅ Database connection established successfully.');
      return true;
    } catch (error) {
      console.error('❌ Unable to connect to the database:', error.message);
      return false;
    }
  }

  async createTables() {
    try {
      // Enable UUID extension
      await this.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

      // Create users table
      await this.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          "isVerified" BOOLEAN DEFAULT FALSE,
          "isActive" BOOLEAN DEFAULT TRUE,
          "lastLoginAt" TIMESTAMP,
          "emailVerifiedAt" TIMESTAMP,
          "profilePicture" TEXT,
          bio TEXT,
          preferences JSONB DEFAULT '{}',
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP
        )
      `);

      // Ensure new user columns exist for older databases
      await this.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "profilePicture" TEXT');
      await this.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb");

      // Create email_verifications table
      await this.query(`
        CREATE TABLE IF NOT EXISTS email_verifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          email VARCHAR(255) NOT NULL,
          token VARCHAR(255) NOT NULL,
          "expiresAt" TIMESTAMP NOT NULL,
          "isUsed" BOOLEAN DEFAULT FALSE,
          "usedAt" TIMESTAMP,
          "usedIp" INET,
          "usedUserAgent" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create password_resets table
      await this.query(`
        CREATE TABLE IF NOT EXISTS password_resets (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          email VARCHAR(255) NOT NULL,
          token VARCHAR(255) NOT NULL,
          "expiresAt" TIMESTAMP NOT NULL,
          "isUsed" BOOLEAN DEFAULT FALSE,
          "usedAt" TIMESTAMP,
          "usedIp" INET,
          "usedUserAgent" TEXT,
          "newHashedPassword" VARCHAR(255),
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create login_sessions table
      await this.query(`
        CREATE TABLE IF NOT EXISTS login_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) NOT NULL,
          "ipAddress" INET,
          "userAgent" TEXT,
          "expiresAt" TIMESTAMP NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create otps table
      await this.query(`
        CREATE TABLE IF NOT EXISTS otps (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) NOT NULL,
          otp VARCHAR(6) NOT NULL,
          "expiresAt" TIMESTAMP NOT NULL,
          "isUsed" BOOLEAN DEFAULT FALSE,
          "usedAt" TIMESTAMP,
          "attempts" INTEGER DEFAULT 0,
          "maxAttempts" INTEGER DEFAULT 3,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create capsules table
      await this.query(`
        CREATE TABLE IF NOT EXISTS capsules (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "ownerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          message TEXT,
          type VARCHAR(50) NOT NULL DEFAULT 'Personal',
          "unlockDate" TIMESTAMP NOT NULL,
          "isPublic" BOOLEAN DEFAULT FALSE,
          "isMultiUser" BOOLEAN DEFAULT FALSE,
          "emailNotification" VARCHAR(255),
          "passwordHash" VARCHAR(255),
          "unlockNotifiedAt" TIMESTAMP,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP
        )
      `);
      // Backfill/upgrade for older databases
      await this.query('ALTER TABLE capsules ADD COLUMN IF NOT EXISTS "unlockNotifiedAt" TIMESTAMP');
      await this.query('ALTER TABLE capsules ADD COLUMN IF NOT EXISTS "emailNotification" VARCHAR(255)');
      await this.query('ALTER TABLE capsules ADD COLUMN IF NOT EXISTS "passwordHash" VARCHAR(255)');

      // Create capsule_media table
      await this.query(`
        CREATE TABLE IF NOT EXISTS capsule_media (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "capsuleId" UUID NOT NULL REFERENCES capsules(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          url TEXT,
          data BYTEA,
          size INTEGER,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Backfill/upgrade for older DBs
      await this.query('ALTER TABLE capsule_media ADD COLUMN IF NOT EXISTS url TEXT');
      await this.query('ALTER TABLE capsule_media ADD COLUMN IF NOT EXISTS data BYTEA');
      await this.query('ALTER TABLE capsule_media ADD COLUMN IF NOT EXISTS size INTEGER');
      try {
        await this.query('ALTER TABLE capsule_media ALTER COLUMN url DROP NOT NULL');
      } catch (e) {
        // ignore if already nullable or column missing in old versions
      }

      // Create capsule_collaborators table (with approval status)
      await this.query(`
        CREATE TABLE IF NOT EXISTS capsule_collaborators (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "capsuleId" UUID NOT NULL REFERENCES capsules(id) ON DELETE CASCADE,
          email VARCHAR(255) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          UNIQUE ("capsuleId", email)
        )
      `);
      // Ensure status column exists for older databases and mark existing rows as approved
      await this.query('ALTER TABLE capsule_collaborators ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'pending\'');
      await this.query('UPDATE capsule_collaborators SET status = \'approved\' WHERE status IS NULL');

      // Create user_memories table
      await this.query(`
        CREATE TABLE IF NOT EXISTS user_memories (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          "capsuleId" UUID NOT NULL REFERENCES capsules(id) ON DELETE CASCADE,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE ("userId", "capsuleId")
        )
      `);

      // Create capsule_comments table
      await this.query(`
        CREATE TABLE IF NOT EXISTS capsule_comments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "capsuleId" UUID NOT NULL REFERENCES capsules(id) ON DELETE CASCADE,
          "userId" UUID REFERENCES users(id) ON DELETE SET NULL,
          "userName" VARCHAR(255) NOT NULL,
          "userEmail" VARCHAR(255),
          content TEXT NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create capsule_likes table
      await this.query(`
        CREATE TABLE IF NOT EXISTS capsule_likes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "capsuleId" UUID NOT NULL REFERENCES capsules(id) ON DELETE CASCADE,
          "userId" UUID REFERENCES users(id) ON DELETE SET NULL,
          "userName" VARCHAR(255) NOT NULL,
          "userEmail" VARCHAR(255),
          "ipAddress" INET,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE ("capsuleId", "userId", "ipAddress")
        )
      `);

      // Indexes for capsules
      await this.query('CREATE INDEX IF NOT EXISTS idx_capsules_owner_id ON capsules("ownerId")');
      await this.query('CREATE INDEX IF NOT EXISTS idx_capsules_public ON capsules("isPublic")');
      await this.query('CREATE INDEX IF NOT EXISTS idx_capsules_unlock_date ON capsules("unlockDate")');

      // Create indexes
      await this.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_users_isverified ON users("isVerified")');
      await this.query('CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications("userId")');
      await this.query('CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets("userId")');
      await this.query('CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON login_sessions(token)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions("userId")');
      await this.query('CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps("expiresAt")');
      await this.query('CREATE INDEX IF NOT EXISTS idx_capsule_media_capsule_id ON capsule_media("capsuleId")');
      await this.query('CREATE INDEX IF NOT EXISTS idx_capsule_collaborators_capsule_id ON capsule_collaborators("capsuleId")');
      await this.query('CREATE INDEX IF NOT EXISTS idx_capsule_collaborators_email ON capsule_collaborators(email)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON user_memories("userId")');
      await this.query('CREATE INDEX IF NOT EXISTS idx_user_memories_capsule_id ON user_memories("capsuleId")');
      await this.query('CREATE INDEX IF NOT EXISTS idx_capsule_comments_capsule_id ON capsule_comments("capsuleId")');
      await this.query('CREATE INDEX IF NOT EXISTS idx_capsule_comments_user_id ON capsule_comments("userId")');
      await this.query('CREATE INDEX IF NOT EXISTS idx_capsule_likes_capsule_id ON capsule_likes("capsuleId")');
      await this.query('CREATE INDEX IF NOT EXISTS idx_capsule_likes_user_id ON capsule_likes("userId")');

      // Create updated_at trigger function
      await this.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW."updatedAt" = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);

      // Create triggers
      await this.query(`
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at 
          BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);

      await this.query(`
        DROP TRIGGER IF EXISTS update_email_verifications_updated_at ON email_verifications;
        CREATE TRIGGER update_email_verifications_updated_at 
          BEFORE UPDATE ON email_verifications
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);

      await this.query(`
        DROP TRIGGER IF EXISTS update_password_resets_updated_at ON password_resets;
        CREATE TRIGGER update_password_resets_updated_at 
          BEFORE UPDATE ON password_resets
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);

      await this.query(`
        DROP TRIGGER IF EXISTS update_otps_updated_at ON otps;
        CREATE TRIGGER update_otps_updated_at 
          BEFORE UPDATE ON otps
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);

      await this.query(`
        DROP TRIGGER IF EXISTS update_capsules_updated_at ON capsules;
        CREATE TRIGGER update_capsules_updated_at 
          BEFORE UPDATE ON capsules
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);

      console.log('✅ All tables created successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error creating tables:', error.message);
      return false;
    }
  }

  // User operations
  async createUser(userData) {
    try {
      const { name, email, password } = userData;
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const query = `
        INSERT INTO users (name, email, password, "isVerified", "isActive")
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, "isVerified", "isActive", "createdAt"
      `;
      const result = await this.query(query, [name, email, hashedPassword, true, true]);
      return { success: true, user: result.rows[0] };
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return { success: false, message: 'User with this email already exists' };
      }
      console.error('Create user error:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }

  // Capsule operations
  async createCapsule(ownerId, data) {
    const bcrypt = require('bcryptjs');
    const passwordHash = data.hasPassword && data.password
      ? await bcrypt.hash(data.password, 10)
      : null;

    const insertCapsuleQuery = `
      INSERT INTO capsules ("ownerId", title, message, type, "unlockDate", "isPublic", "isMultiUser", "emailNotification", "passwordHash")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const capsuleResult = await this.query(insertCapsuleQuery, [
      ownerId,
      data.title,
      data.message || null,
      data.type || 'Personal',
      new Date(data.unlockDate),
      !!data.isPublic,
      !!data.isMultiUser,
      data.emailNotification || null,
      passwordHash
    ]);
    const capsule = capsuleResult.rows[0];

    // media
    if (Array.isArray(data.media) && data.media.length > 0) {
      const values = [];
      const params = [];
      let idx = 1;
      for (const m of data.media) {
        // name, type, url
        params.push(capsule.id, m.name || 'file', m.type || 'file', m.url);
        values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      }
      const mediaQuery = `
        INSERT INTO capsule_media ("capsuleId", name, type, url)
        VALUES ${values.join(', ')}
      `;
      await this.query(mediaQuery, params);
    }

    // collaborators - default to 'pending' until they approve via email
    if (Array.isArray(data.collaborators) && data.collaborators.length > 0) {
      const values = [];
      const params = [];
      let idx = 1;
      for (const email of data.collaborators) {
        params.push(capsule.id, email.toLowerCase().trim(), 'pending');
        values.push(`($${idx++}, $${idx++}, $${idx++})`);
      }
      const collabQuery = `
        INSERT INTO capsule_collaborators ("capsuleId", email, status)
        VALUES ${values.join(', ')}
        ON CONFLICT ("capsuleId", email) DO UPDATE SET status = 'pending'
      `;
      await this.query(collabQuery, params);
    }

    return capsule;
  }

  async listUserCapsules(userId, userEmail) {
    const query = `
      SELECT
        c.*,
        u.name AS "ownerName",
        u.email AS "ownerEmail",
        COALESCE(
          json_agg(
            json_build_object('id', cm.id, 'name', cm.name, 'type', cm.type, 'url', cm.url, 'size', cm.size)
            ORDER BY cm."createdAt"
          ) FILTER (WHERE cm.id IS NOT NULL),
          '[]'::json
        ) AS media,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object('email', cc2.email, 'status', cc2.status, 'name', u2.name)
              ORDER BY cc2.email
            )
            FROM capsule_collaborators cc2
            LEFT JOIN users u2
              ON LOWER(u2.email) = LOWER(cc2.email)
              AND u2."deletedAt" IS NULL
            WHERE cc2."capsuleId" = c.id
          ),
          '[]'::json
        ) AS collaborators
      FROM capsules c
      JOIN users u ON u.id = c."ownerId"
      LEFT JOIN capsule_collaborators cc
        ON cc."capsuleId" = c.id
        AND cc.email = $2
        AND cc.status = 'approved'
      LEFT JOIN capsule_media cm ON cm."capsuleId" = c.id
      WHERE c."deletedAt" IS NULL
        AND (c."ownerId" = $1 OR cc.id IS NOT NULL)
      GROUP BY c.id, u.name, u.email
      ORDER BY c."createdAt" DESC
    `;
    const result = await this.query(query, [userId, (userEmail || '').toLowerCase()]);
    return result.rows;
  }

  async updateCollaboratorStatus(capsuleId, email, status) {
    const query = `
      UPDATE capsule_collaborators
      SET status = $1
      WHERE "capsuleId" = $2 AND LOWER(email) = LOWER($3)
      RETURNING *
    `;
    const result = await this.query(query, [status, capsuleId, email]);
    return result.rows[0] || null;
  }

  async listCapsuleCollaborators(capsuleId) {
    const query = `
      SELECT email FROM capsule_collaborators WHERE "capsuleId" = $1 ORDER BY email ASC
    `;
    const result = await this.query(query, [capsuleId]);
    return result.rows.map(r => r.email);
  }

  async listDueUnlockedCapsules() {
    const query = `
      SELECT c.*,
             u.email as owner_email,
             u.name as owner_name,
             array_agg(cc.email) FILTER (
               WHERE cc.email IS NOT NULL
                 AND (cc.status = 'approved' OR cc.status IS NULL)
             ) as collaborators
      FROM capsules c
      JOIN users u ON u.id = c."ownerId"
      LEFT JOIN capsule_collaborators cc ON cc."capsuleId" = c.id
      WHERE c."deletedAt" IS NULL
        AND c."unlockDate" <= NOW()
        AND (c."unlockNotifiedAt" IS NULL)
      GROUP BY c.id, u.email, u.name
      ORDER BY c."unlockDate" ASC
      LIMIT 50
    `;
    const result = await this.query(query);
    return result.rows;
  }

  async markCapsuleUnlockNotified(capsuleId) {
    const query = 'UPDATE capsules SET "unlockNotifiedAt" = NOW(), "updatedAt" = NOW() WHERE id = $1';
    await this.query(query, [capsuleId]);
  }

  async listPublicCapsules() {
    const query = `
      SELECT
        c.*,
        u.name AS "ownerName",
        u.email AS "ownerEmail",
        COALESCE(
          json_agg(
            json_build_object('id', cm.id, 'name', cm.name, 'type', cm.type, 'url', cm.url, 'size', cm.size)
            ORDER BY cm."createdAt"
          ) FILTER (WHERE cm.id IS NOT NULL),
          '[]'::json
        ) AS media,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object('email', cc2.email, 'status', cc2.status, 'name', u2.name)
              ORDER BY cc2.email
            )
            FROM capsule_collaborators cc2
            LEFT JOIN users u2
              ON LOWER(u2.email) = LOWER(cc2.email)
              AND u2."deletedAt" IS NULL
            WHERE cc2."capsuleId" = c.id
          ),
          '[]'::json
        ) AS collaborators
      FROM capsules c
      JOIN users u ON u.id = c."ownerId"
      LEFT JOIN capsule_media cm ON cm."capsuleId" = c.id
      WHERE c."deletedAt" IS NULL AND c."isPublic" = TRUE
      GROUP BY c.id, u.name, u.email
      ORDER BY c."createdAt" DESC
    `;
    const result = await this.query(query);
    return result.rows;
  }

  async deleteCapsule(userId, capsuleId) {
    // Hard delete owned capsule; cascades will remove related rows
    const query = 'DELETE FROM capsules WHERE id = $1 AND "ownerId" = $2 RETURNING id';
    const result = await this.query(query, [capsuleId, userId]);
    return result.rows.length > 0;
  }

  async addToMemories(userId, capsuleId) {
    const query = `
      INSERT INTO user_memories ("userId", "capsuleId")
      VALUES ($1, $2)
      ON CONFLICT ("userId", "capsuleId") DO NOTHING
      RETURNING *
    `;
    const result = await this.query(query, [userId, capsuleId]);
    return result.rows[0] || null;
  }

  async removeFromMemories(userId, capsuleId) {
    const query = 'DELETE FROM user_memories WHERE "userId" = $1 AND "capsuleId" = $2';
    await this.query(query, [userId, capsuleId]);
  }

  async listUserMemories(userId) {
    const query = `
      SELECT
        c.*,
        u.name AS "ownerName",
        u.email AS "ownerEmail",
        COALESCE(
          json_agg(
            json_build_object('id', cm.id, 'name', cm.name, 'type', cm.type, 'url', cm.url, 'size', cm.size)
            ORDER BY cm."createdAt"
          ) FILTER (WHERE cm.id IS NOT NULL),
          '[]'::json
        ) AS media,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object('email', cc2.email, 'status', cc2.status, 'name', u2.name)
              ORDER BY cc2.email
            )
            FROM capsule_collaborators cc2
            LEFT JOIN users u2
              ON LOWER(u2.email) = LOWER(cc2.email)
              AND u2."deletedAt" IS NULL
            WHERE cc2."capsuleId" = c.id
          ),
          '[]'::json
        ) AS collaborators
      FROM user_memories um
      JOIN capsules c ON c.id = um."capsuleId"
      JOIN users u ON u.id = c."ownerId"
      LEFT JOIN capsule_media cm ON cm."capsuleId" = c.id
      WHERE um."userId" = $1 AND c."deletedAt" IS NULL
      GROUP BY c.id, um."createdAt", u.name, u.email
      ORDER BY um."createdAt" DESC
    `;
    const result = await this.query(query, [userId]);
    return result.rows;
  }

  async removeCollaboratorByOwner(ownerId, capsuleId, email) {
    const query = `
      DELETE FROM capsule_collaborators cc
      USING capsules c
      WHERE cc."capsuleId" = c.id
        AND c.id = $1
        AND c."ownerId" = $2
        AND LOWER(cc.email) = LOWER($3)
      RETURNING cc.*
    `;
    const result = await this.query(query, [capsuleId, ownerId, email]);
    return result.rows[0] || null;
  }

  async removeCollaboratorByOwnerOrSelf(ownerId, requesterEmail, capsuleId, targetEmail) {
    const query = `
      DELETE FROM capsule_collaborators cc
      USING capsules c
      WHERE cc."capsuleId" = c.id
        AND c.id = $1
        AND (
          c."ownerId" = $2
          OR LOWER(cc.email) = LOWER($3)
        )
        AND LOWER(cc.email) = LOWER($4)
      RETURNING cc.*
    `;
    const result = await this.query(query, [
      capsuleId,
      ownerId,
      requesterEmail || '',
      targetEmail,
    ]);
    return result.rows[0] || null;
  }

  async listPendingCollaborationRequests(email) {
    const query = `
      SELECT
        cc."capsuleId" AS "capsuleId",
        cc.email,
        cc.status,
        c.title AS "capsuleTitle",
        c."createdAt" AS "capsuleCreatedAt",
        u.name AS "ownerName",
        u.email AS "ownerEmail"
      FROM capsule_collaborators cc
      JOIN capsules c ON c.id = cc."capsuleId"
      JOIN users u ON u.id = c."ownerId"
      WHERE LOWER(cc.email) = LOWER($1)
        AND cc.status = 'pending'
        AND c."deletedAt" IS NULL
      ORDER BY c."createdAt" DESC
    `;
    const result = await this.query(query, [email]);
    return result.rows;
  }

  async verifyCapsulePassword(capsuleId, password) {
    const bcrypt = require('bcryptjs');
    const query = 'SELECT "passwordHash" FROM capsules WHERE id = $1 AND "deletedAt" IS NULL';
    const result = await this.query(query, [capsuleId]);
    const row = result.rows[0];
    const hash = row && (row.passwordHash || row.passwordhash);
    if (!hash) return false;
    return await bcrypt.compare(password, hash);
  }

  // Validate password
  async validatePassword(user, password) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, user.password);
  }

  // Generate auth token
  generateAuthToken(userId) {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, type: 'auth' },
      process.env.JWT_SECRET || 'A91737YU80843SH',
      { expiresIn: '7d' }
    );
  }

  async findUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1 AND "deletedAt" IS NULL';
    const result = await this.query(query, [email]);
    return result.rows[0] || null;
  }

  async findUserById(id) {
    const query = 'SELECT * FROM users WHERE id = $1 AND "deletedAt" IS NULL';
    const result = await this.query(query, [id]);
    return result.rows[0] || null;
  }

  async findUserByToken(token) {
    const query = `
      SELECT u.* FROM users u
      JOIN login_sessions ls ON u.id = ls."userId"
      WHERE ls.token = $1 AND ls."expiresAt" > NOW() AND u."deletedAt" IS NULL
    `;
    const result = await this.query(query, [token]);
    return result.rows[0] || null;
  }

  async updateUser(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `"${field}" = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE users 
      SET ${setClause}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1 AND "deletedAt" IS NULL
      RETURNING *
    `;
    const result = await this.query(query, [id, ...values]);
    return result.rows[0] || null;
  }

  async updateLastLogin(userId) {
    const query = `
      UPDATE users 
      SET "lastLoginAt" = CURRENT_TIMESTAMP
      WHERE id = $1 AND "deletedAt" IS NULL
    `;
    await this.query(query, [userId]);
  }

  // OTP Management Functions
  async createOTP(email, otp) {
    // Delete any existing OTPs for this email
    await this.query('DELETE FROM otps WHERE email = $1', [email]);
    
    // Create new OTP with 2-minute expiration
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    const query = `
      INSERT INTO otps (email, otp, "expiresAt")
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.query(query, [email, otp, expiresAt]);
    return result.rows[0];
  }

  async verifyOTP(email, otp) {
    const query = `
      SELECT * FROM otps 
      WHERE email = $1 AND otp = $2 AND "expiresAt" > NOW() AND "isUsed" = FALSE
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    const result = await this.query(query, [email, otp]);
    return result.rows[0] || null;
  }

  async markOTPAsUsed(otpId) {
    const query = `
      UPDATE otps 
      SET "isUsed" = TRUE, "usedAt" = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.query(query, [otpId]);
  }

  async incrementOTPAttempts(email) {
    // First get the OTP record to update
    const selectQuery = `
      SELECT id FROM otps 
      WHERE email = $1 AND "expiresAt" > NOW() AND "isUsed" = FALSE
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    const selectResult = await this.query(selectQuery, [email]);
    
    if (selectResult.rows.length > 0) {
      const otpId = selectResult.rows[0].id;
      const updateQuery = `
        UPDATE otps 
        SET attempts = attempts + 1
        WHERE id = $1
      `;
      await this.query(updateQuery, [otpId]);
    }
  }

  async getOTPAttempts(email) {
    const query = `
      SELECT attempts, "maxAttempts" FROM otps 
      WHERE email = $1 AND "expiresAt" > NOW() AND "isUsed" = FALSE
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    const result = await this.query(query, [email]);
    return result.rows[0] || null;
  }

  async cleanupExpiredOTPs() {
    const query = 'DELETE FROM otps WHERE "expiresAt" < NOW()';
    const result = await this.query(query);
    return result.rowCount;
  }

  // Email verification operations
  async createEmailVerification(userId, email, token, expiresAt) {
    const query = `
      INSERT INTO email_verifications ("userId", email, token, "expiresAt")
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await this.query(query, [userId, email, token, expiresAt]);
    return result.rows[0];
  }

  async findEmailVerification(token) {
    const query = `
      SELECT ev.*, u.name, u.email 
      FROM email_verifications ev
      JOIN users u ON ev."userId" = u.id
      WHERE ev.token = $1 AND ev."isUsed" = FALSE AND ev."expiresAt" > NOW()
    `;
    const result = await this.query(query, [token]);
    return result.rows[0] || null;
  }

  async markEmailVerificationUsed(token, ipAddress, userAgent) {
    const query = `
      UPDATE email_verifications 
      SET "isUsed" = TRUE, "usedAt" = CURRENT_TIMESTAMP, "usedIp" = $2, "usedUserAgent" = $3
      WHERE token = $1
      RETURNING *
    `;
    const result = await this.query(query, [token, ipAddress, userAgent]);
    return result.rows[0];
  }

  // Password reset operations
  async createPasswordReset(userId, email, token, expiresAt) {
    const query = `
      INSERT INTO password_resets ("userId", email, token, "expiresAt")
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await this.query(query, [userId, email, token, expiresAt]);
    return result.rows[0];
  }

  async findPasswordReset(token) {
    const query = `
      SELECT pr.*, u.name, u.email 
      FROM password_resets pr
      JOIN users u ON pr."userId" = u.id
      WHERE pr.token = $1 AND pr."isUsed" = FALSE AND pr."expiresAt" > NOW()
    `;
    const result = await this.query(query, [token]);
    return result.rows[0] || null;
  }

  async updateUserPassword(userId, plainPassword) {
    try {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(plainPassword, 12);
      const query = `
        UPDATE users
        SET password = $1, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $2 AND "deletedAt" IS NULL
        RETURNING id
      `;
      const result = await this.query(query, [hashedPassword, userId]);
      if (!result.rows[0]) {
        return { success: false };
      }
      return { success: true, hashedPassword };
    } catch (error) {
      console.error('updateUserPassword error:', error);
      return { success: false };
    }
  }

  async markPasswordResetUsed(token, newPassword, ipAddress, userAgent) {
    const query = `
      UPDATE password_resets 
      SET "isUsed" = TRUE, "usedAt" = CURRENT_TIMESTAMP, "usedIp" = $3, "usedUserAgent" = $4, "newHashedPassword" = $2
      WHERE token = $1
      RETURNING *
    `;
    const result = await this.query(query, [token, newPassword, ipAddress, userAgent]);
    return result.rows[0];
  }

  // Login session operations
  async createLoginSession(userId, token, ipAddress, userAgent, expiresAt) {
    const query = `
      INSERT INTO login_sessions ("userId", token, "ipAddress", "userAgent", "expiresAt")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await this.query(query, [userId, token, ipAddress, userAgent, expiresAt]);
    return result.rows[0];
  }

  async findLoginSession(token) {
    const query = `
      SELECT ls.*, u.name, u.email 
      FROM login_sessions ls
      JOIN users u ON ls."userId" = u.id
      WHERE ls.token = $1 AND ls."expiresAt" > NOW()
    `;
    const result = await this.query(query, [token]);
    return result.rows[0] || null;
  }

  async deleteLoginSession(token) {
    const query = 'DELETE FROM login_sessions WHERE token = $1';
    await this.query(query, [token]);
  }

  // Cleanup operations
  async cleanupExpiredTokens() {
    try {
      // Delete expired email verifications
      await this.query('DELETE FROM email_verifications WHERE "expiresAt" < NOW()');
      
      // Delete expired password resets
      await this.query('DELETE FROM password_resets WHERE "expiresAt" < NOW()');
      
      // Delete expired login sessions
      await this.query('DELETE FROM login_sessions WHERE "expiresAt" < NOW()');
      
      console.log('🧹 Cleaned up expired tokens');
    } catch (error) {
      console.error('❌ Error cleaning up tokens:', error.message);
    }
  }

  // Comments methods
  async addComment(capsuleId, commentData) {
    const { userId, userName, userEmail, content } = commentData;
    const query = `
      INSERT INTO capsule_comments ("capsuleId", "userId", "userName", "userEmail", content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await this.query(query, [capsuleId, userId, userName, userEmail, content]);
    return result.rows[0];
  }

  async getComments(capsuleId) {
    const query = `
      SELECT cc.*, u."profilePicture"
      FROM capsule_comments cc
      LEFT JOIN users u ON cc."userId" = u.id
      WHERE cc."capsuleId" = $1
      ORDER BY cc."createdAt" ASC
    `;
    const result = await this.query(query, [capsuleId]);
    return result.rows;
  }

  async updateComment(commentId, content, userId) {
    const query = `
      UPDATE capsule_comments 
      SET content = $1, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $2 AND "userId" = $3
      RETURNING *
    `;
    const result = await this.query(query, [content, commentId, userId]);
    return result.rows[0];
  }

  async deleteComment(commentId, userId) {
    const query = `
      DELETE FROM capsule_comments 
      WHERE id = $1 AND "userId" = $2
      RETURNING *
    `;
    const result = await this.query(query, [commentId, userId]);
    return result.rows[0];
  }

  // Likes methods
  async addLike(capsuleId, likeData) {
    const { userId, userName, userEmail, ipAddress } = likeData;
    const query = `
      INSERT INTO capsule_likes ("capsuleId", "userId", "userName", "userEmail", "ipAddress")
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT ("capsuleId", "userId", "ipAddress") DO NOTHING
      RETURNING *
    `;
    const result = await this.query(query, [capsuleId, userId, userName, userEmail, ipAddress]);
    return result.rows[0];
  }

  async removeLike(capsuleId, userId, ipAddress) {
    const query = `
      DELETE FROM capsule_likes 
      WHERE "capsuleId" = $1 AND (
        ("userId" IS NOT NULL AND "userId" = $2) OR 
        ("ipAddress" IS NOT NULL AND "ipAddress" = $3)
      )
      RETURNING *
    `;
    const result = await this.query(query, [capsuleId, userId, ipAddress]);
    return result.rows[0];
  }

  async getLikes(capsuleId) {
    const query = `
      SELECT cl.*, u."profilePicture"
      FROM capsule_likes cl
      LEFT JOIN users u ON cl."userId" = u.id
      WHERE cl."capsuleId" = $1
      ORDER BY cl."createdAt" DESC
    `;
    const result = await this.query(query, [capsuleId]);
    return result.rows;
  }

  async getLikeCount(capsuleId) {
    const query = `
      SELECT COUNT(*) as count
      FROM capsule_likes
      WHERE "capsuleId" = $1
    `;
    const result = await this.query(query, [capsuleId]);
    return parseInt(result.rows[0].count);
  }

  async hasUserLiked(capsuleId, userId, ipAddress) {
    const query = `
      SELECT COUNT(*) as count
      FROM capsule_likes
      WHERE "capsuleId" = $1 AND ("userId" = $2 OR "ipAddress" = $3)
    `;
    const result = await this.query(query, [capsuleId, userId, ipAddress]);
    return parseInt(result.rows[0].count) > 0;
  }

  async getCommentCount(capsuleId) {
    const query = `
      SELECT COUNT(*) as count
      FROM capsule_comments
      WHERE "capsuleId" = $1
    `;
    const result = await this.query(query, [capsuleId]);
    return parseInt(result.rows[0].count);
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new DirectDatabaseService();

