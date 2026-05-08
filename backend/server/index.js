require('dotenv').config();

// Ensure environment variables are set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgres://postgres:Ayush_35@localhost:5432/timevault_db';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'A91737YU80843SH';
}
if (!process.env.SMTP_HOST) {
  // process.env.SMTP_HOST = 'smtp.gmail.com';
  // process.env.SMTP_PORT = '587';
  // process.env.SMTP_USER = 'buzzstravel@gmail.com';
  // process.env.SMTP_PASS = 'zmhbioxaqsrxltpi';
  // process.env.SMTP_FROM = 'buzzstravel@gmail.com';
  // process.env.SMTP_SECURE = 'false';
  
  process.env.SMTP_HOST = 'smtp.gmail.com';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'bobthemajoor@gmail.com';
  process.env.SMTP_PASS = 'uybu ecry rbnx kkhc';
  process.env.SMTP_FROM = 'bobthemajoor@gmail.com';
  process.env.SMTP_SECURE = 'false';
}

const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const EmailService = require('./emailService');
const databaseService = require('./services/directDatabaseService');
const otpService = require('./services/otpService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Multer configuration for media uploads (store bytes in DB, not on disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, and audio files
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('audio/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only image, video, and audio files are allowed'));
    }
  }
});

// Initialize DB tables on startup (safe to call multiple times)
(async () => {
  try {
    await databaseService.testConnection();
    await databaseService.createTables();
  } catch (e) {
    console.error('Database init failed:', e);
  }
})();

// Initialize services
const emailService = new EmailService();
// Verify SMTP connectivity on startup
(async () => {
  const result = await emailService.verifyConnection();
  if (!result.ok) {
    console.error('SMTP verification failed:', result.error);
  } else {
    console.log('✅ SMTP connection verified');
  }
})();

// Helper function to get client IP
const getClientIP = (req) => {
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// Helper to hide password hash and expose hasPassword
function sanitizeCapsule(row) {
  if (!row) return row;
  const clone = { ...row };
  delete clone.passwordhash;
  delete clone.passwordHash;
  clone.hasPassword = !!(row.passwordHash || row.passwordhash);
  return clone;
}

// Routes
//
// Media upload endpoint (images, videos, audio)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    return res.status(400).json({
      success: false,
      message: 'Use POST /api/capsules/:capsuleId/media to store media in the database'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
});

// Capsule media upload endpoint (stores in DB)
app.post('/api/capsules/:capsuleId/media', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const user = await getAuthedUser(req, res);
    if (!user) return;

    const { capsuleId } = req.params;
    if (!capsuleId) {
      return res.status(400).json({ success: false, message: 'capsuleId is required' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    if (!req.file.buffer || req.file.size === 0) {
      return res.status(400).json({ success: false, message: 'Empty file uploaded' });
    }

    // Verify user has access to the capsule (owner or approved collaborator)
    const accessQuery = `
      SELECT c.id
      FROM capsules c
      LEFT JOIN capsule_collaborators cc
        ON cc."capsuleId" = c.id
        AND LOWER(cc.email) = LOWER($2)
        AND cc.status = 'approved'
      WHERE c.id = $1
        AND c."deletedAt" IS NULL
        AND (c."ownerId" = $3 OR cc.id IS NOT NULL)
      LIMIT 1
    `;
    const access = await databaseService.query(accessQuery, [capsuleId, user.email || '', user.id]);
    if (!access.rows[0]) {
      return res.status(403).json({ success: false, message: 'Not authorized to upload media to this capsule' });
    }

    const insertQuery = `
      INSERT INTO capsule_media ("capsuleId", name, type, url, data, size)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, "capsuleId", name, type, url, size, "createdAt"
    `;
    const inserted = await databaseService.query(insertQuery, [
      capsuleId,
      req.file.originalname,
      req.file.mimetype,
      null,
      req.file.buffer,
      req.file.size
    ]);

    res.status(201).json({
      success: true,
      media: inserted.rows[0],
      downloadUrl: `/api/media/${inserted.rows[0].id}`
    });
  } catch (error) {
    console.error('Capsule media upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
});

// Secure media streaming endpoint (authorized users only)
// Supports auth via Bearer header OR ?token= (needed for <img>/<video> tags)
app.get('/api/media/:id', async (req, res) => {
  try {
    const headerToken = req.headers.authorization?.replace('Bearer ', '');
    const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
    const token = headerToken || queryToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    req.authToken = token;
    const user = await getAuthedUser(req, res);
    if (!user) return;

    const mediaId = req.params.id;
    const q = `
      SELECT
        cm.id,
        cm.name,
        cm.type,
        cm.size,
        cm.data,
        c."ownerId",
        c."deletedAt"
      FROM capsule_media cm
      JOIN capsules c ON c.id = cm."capsuleId"
      WHERE cm.id = $1
      LIMIT 1
    `;
    const result = await databaseService.query(q, [mediaId]);
    const row = result.rows[0];
    if (!row || row.deletedAt) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    // Authorization: owner or approved collaborator
    let allowed = false;
    if (String(row.ownerId) === String(user.id)) {
      allowed = true;
    } else {
      const collabQ = `
        SELECT 1
        FROM capsule_collaborators cc
        JOIN capsule_media cm ON cm."capsuleId" = cc."capsuleId"
        WHERE cm.id = $1 AND LOWER(cc.email) = LOWER($2) AND cc.status = 'approved'
        LIMIT 1
      `;
      const collab = await databaseService.query(collabQ, [mediaId, user.email || '']);
      allowed = !!collab.rows[0];
    }
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this media' });
    }

    if (!row.data) {
      return res.status(404).json({ success: false, message: 'Media data missing' });
    }

    const buffer = row.data; // pg returns Buffer for BYTEA
    const total = row.size || buffer.length;
    res.setHeader('Content-Type', row.type || 'application/octet-stream');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Disposition', `inline; filename="${String(row.name || 'media').replace(/"/g, '')}"`);

    const range = req.headers.range;
    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (!match) {
        return res.status(416).end();
      }
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : total - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
        return res.status(416).end();
      }
      const chunk = buffer.subarray(start, end + 1);
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', String(chunk.length));
      return res.end(chunk);
    }

    res.setHeader('Content-Length', String(total));
    return res.end(buffer);
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch media' });
  }
});

// Profile endpoints
app.get('/api/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const user = await databaseService.findUserByToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        profilePicture: user.profilePicture || null,
        preferences: user.preferences || {},
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.put('/api/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const user = await databaseService.findUserByToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { name, bio, preferences, profilePicture } = req.body;
    const updates = {};
    if (typeof name !== 'undefined') updates.name = name;
    if (typeof bio !== 'undefined') updates.bio = bio;
    if (typeof preferences !== 'undefined') updates.preferences = preferences;
    if (typeof profilePicture !== 'undefined') updates.profilePicture = profilePicture;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const updatedUser = await databaseService.updateUser(user.id, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.put('/api/user/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const user = await databaseService.findUserByToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { currentPassword, newPassword } = req.body;
    
    // Verify current password
    const isCurrentPasswordValid = await databaseService.validatePassword(user, currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Update password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await databaseService.updateUser(user.id, { password: hashedPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete account endpoint
app.delete('/api/user/delete-account', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const user = await databaseService.findUserByToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Soft delete the user (set deletedAt timestamp)
    await databaseService.updateUser(user.id, { 
      deletedAt: new Date(),
      isActive: false 
    });

    // Delete all user sessions
    await databaseService.query('DELETE FROM login_sessions WHERE "userId" = $1', [user.id]);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Debug endpoint to get OTP (temporary for testing)
app.get('/api/debug/otp/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Get OTP directly from database for debugging
    const query = `
      SELECT otp, "expiresAt", attempts, "maxAttempts", "isUsed", "createdAt"
      FROM otps 
      WHERE email = $1 AND "expiresAt" > NOW()
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    const result = await databaseService.query(query, [email]);
    const otpRecord = result.rows[0];
    
    if (otpRecord) {
      res.json({ 
        success: true, 
        email, 
        otpInfo: {
          email,
          attempts: otpRecord.attempts,
          maxAttempts: otpRecord.maxAttempts,
          expiresIn: Math.max(0, Math.floor((new Date(otpRecord.expiresAt) - new Date()) / 1000))
        },
        message: `OTP: ${otpRecord.otp}`
      });
    } else {
      res.json({ 
        success: true, 
        email, 
        otpInfo: null,
        message: 'No OTP found'
      });
    }
  } catch (error) {
    console.error('Debug OTP error:', error);
    res.status(500).json({ success: false, message: 'Error getting OTP info' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'TimeVault API is running' });
});

// Collaboration approve/reject (public - called from email links)
app.post('/api/collaboration/respond', async (req, res) => {
  try {
    const { token, action } = req.body;
    if (!token || !action) {
      return res.status(400).json({ success: false, message: 'Token and action are required' });
    }
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    }
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'A91737YU80843SH');
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid or expired link. Please ask for a new invitation.' });
    }
    if (decoded.type !== 'collaboration_approval' || !decoded.capsuleId || !decoded.email) {
      return res.status(400).json({ success: false, message: 'Invalid collaboration link' });
    }
    const status = action === 'approve' ? 'approved' : 'rejected';
    const updated = await databaseService.updateCollaboratorStatus(decoded.capsuleId, decoded.email, status);
    if (!updated) {
      return res.status(400).json({ success: false, message: 'Collaboration not found or already responded.' });
    }
    res.json({
      success: true,
      action,
      message: action === 'approve'
        ? 'You have approved the collaboration. You can now view this capsule when you log in.'
        : 'You have declined the collaboration.'
    });
  } catch (error) {
    console.error('Collaboration respond error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/collaboration/requests', requireAuth, async (req, res) => {
  try {
    const user = await getAuthedUser(req, res);
    if (!user) return;

    const pending = await databaseService.listPendingCollaborationRequests(user.email || '');
    const requests = pending.map((r) => ({
      capsuleId: r.capsuleId,
      capsuleTitle: r.capsuleTitle || 'Untitled Capsule',
      ownerName: r.ownerName || 'Someone',
      ownerEmail: r.ownerEmail || '',
      createdAt: r.capsuleCreatedAt,
      status: r.status,
      token: emailService.generateCollaborationToken(r.capsuleId, user.email || ''),
    }));

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error('Collaboration requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch collaboration requests' });
  }
});

// Auth middleware helper
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  req.authToken = token;
  next();
}

async function getAuthedUser(req, res) {
  const user = await databaseService.findUserByToken(req.authToken);
  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return null;
  }
  return user;
}

// Capsule endpoints
app.post('/api/capsules', requireAuth, async (req, res) => {
  try {
    const user = await getAuthedUser(req, res);
    if (!user) return;
    const capsule = await databaseService.createCapsule(user.id, req.body);

    // Notify collaborators if multi-user capsule (send approval links)
    try {
      if (req.body && Array.isArray(req.body.collaborators) && req.body.collaborators.length > 0) {
        const uniqueEmails = [...new Set(req.body.collaborators.map(e => String(e).toLowerCase()))];
        for (const email of uniqueEmails) {
          // Skip notifying the owner if their email is also listed
          if (email === (user.email || '').toLowerCase()) continue;
          const token = emailService.generateCollaborationToken(capsule.id, email);
          await emailService.sendCollaboratorInviteEmail(
            email,
            capsule.title || 'Untitled Capsule',
            user.name || 'Someone',
            token
          );
        }
      }
    } catch (e) {
      console.error('Failed to send collaborator invite emails:', e);
      // proceed without failing the request
    }
    res.status(201).json({ success: true, capsule: sanitizeCapsule(capsule) });
  } catch (error) {
    console.error('Create capsule error:', error);
    res.status(500).json({ success: false, message: 'Failed to create capsule' });
  }
});

app.get('/api/capsules', requireAuth, async (req, res) => {
  try {
    const user = await getAuthedUser(req, res);
    if (!user) return;
    const capsules = await databaseService.listUserCapsules(user.id, user.email);
    res.json({ success: true, capsules: capsules.map(sanitizeCapsule) });
  } catch (error) {
    console.error('List capsules error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch capsules' });
  }
});

app.delete('/api/capsules/:id', requireAuth, async (req, res) => {
  try {
    const user = await getAuthedUser(req, res);
    if (!user) return;
    const ok = await databaseService.deleteCapsule(user.id, req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Capsule not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete capsule error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete capsule' });
  }
});

app.delete('/api/capsules/:id/collaborators', requireAuth, async (req, res) => {
  try {
    const user = await getAuthedUser(req, res);
    if (!user) return;
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, message: 'Collaborator email is required' });
    }

    // Allow owner to remove any collaborator, or collaborator to remove themself.
    const removed = await databaseService.removeCollaboratorByOwnerOrSelf(
      user.id,
      user.email || '',
      req.params.id,
      String(email).toLowerCase().trim()
    );
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Collaborator not found or not authorized' });
    }

    res.json({ success: true, message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove collaborator' });
  }
});

// Public capsules
app.get('/api/capsules/public', async (req, res) => {
  try {
    const capsules = await databaseService.listPublicCapsules();
    res.json({ success: true, capsules: capsules.map(sanitizeCapsule) });
  } catch (error) {
    console.error('List public capsules error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch public capsules' });
  }
});

// Memories
app.get('/api/memories', requireAuth, async (req, res) => {
  try {
    const user = await getAuthedUser(req, res);
    if (!user) return;
    const capsules = await databaseService.listUserMemories(user.id);
    res.json({ success: true, capsules: capsules.map(sanitizeCapsule) });
  } catch (error) {
    console.error('List memories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch memories' });
  }
});

app.post('/api/memories/:capsuleId', requireAuth, async (req, res) => {
  try {
    const user = await getAuthedUser(req, res);
    if (!user) return;
    await databaseService.addToMemories(user.id, req.params.capsuleId);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Add to memories error:', error);
    res.status(500).json({ success: false, message: 'Failed to add to memories' });
  }
});

// Verify capsule password
app.post('/api/capsules/:id/unlock', requireAuth, async (req, res) => {
  try {
    const user = await getAuthedUser(req, res);
    if (!user) return;
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ success: false, message: 'Password required' });
    const ok = await databaseService.verifyCapsulePassword(req.params.id, password);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid password' });
    res.json({ success: true });
  } catch (error) {
    console.error('Unlock capsule error:', error);
    res.status(500).json({ success: false, message: 'Failed to unlock capsule' });
  }
});

app.delete('/api/memories/:capsuleId', requireAuth, async (req, res) => {
  try {
    const user = await getAuthedUser(req, res);
    if (!user) return;
    await databaseService.removeFromMemories(user.id, req.params.capsuleId);
    res.json({ success: true });
  } catch (error) {
    console.error('Remove from memories error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove from memories' });
  }
});

// Comments endpoints
app.get('/api/capsules/:id/comments', async (req, res) => {
  try {
    const comments = await databaseService.getComments(req.params.id);
    res.json({ success: true, comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: 'Failed to get comments' });
  }
});

app.post('/api/capsules/:id/comments', async (req, res) => {
  try {
    const { userName, userEmail, content } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    let userId = null;
    let userName_final = userName;
    let userEmail_final = userEmail;

    // If user is authenticated, get their info
    if (token) {
      try {
        const user = await databaseService.findLoginSession(token);
        if (user) {
          userId = user.userId;
          userName_final = user.name;
          userEmail_final = user.email;
        }
      } catch (e) {
        // Continue with anonymous comment
      }
    }

    if (!userName_final || !content) {
      return res.status(400).json({ success: false, message: 'Name and content are required' });
    }

    const comment = await databaseService.addComment(req.params.id, {
      userId,
      userName: userName_final,
      userEmail: userEmail_final,
      content
    });

    res.json({ success: true, comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
});

app.put('/api/comments/:id', requireAuth, async (req, res) => {
  try {
    const user = await getAuthedUser(req, res);
    if (!user) return;
    
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const comment = await databaseService.updateComment(req.params.id, content, user.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found or not authorized' });
    }

    res.json({ success: true, comment });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update comment' });
  }
});

app.delete('/api/comments/:id', requireAuth, async (req, res) => {
  try {
    const user = await getAuthedUser(req, res);
    if (!user) return;

    const comment = await databaseService.deleteComment(req.params.id, user.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found or not authorized' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
});

// Likes endpoints
app.get('/api/capsules/:id/likes', async (req, res) => {
  try {
    const likes = await databaseService.getLikes(req.params.id);
    const likeCount = await databaseService.getLikeCount(req.params.id);
    res.json({ success: true, likes, likeCount });
  } catch (error) {
    console.error('Get likes error:', error);
    res.status(500).json({ success: false, message: 'Failed to get likes' });
  }
});

app.post('/api/capsules/:id/like', async (req, res) => {
  try {
    const { userName, userEmail } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    const ipAddress = getClientIP(req);
    
    let userId = null;
    let userName_final = userName;
    let userEmail_final = userEmail;

    // If user is authenticated, get their info
    if (token) {
      try {
        const user = await databaseService.findLoginSession(token);
        if (user) {
          userId = user.userId;
          userName_final = user.name;
          userEmail_final = user.email;
        }
      } catch (e) {
        // Continue with anonymous like
      }
    }

    if (!userName_final) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    // Check if user already liked
    const hasLiked = await databaseService.hasUserLiked(req.params.id, userId, ipAddress);
    if (hasLiked) {
      return res.status(400).json({ success: false, message: 'Already liked this capsule' });
    }

    const like = await databaseService.addLike(req.params.id, {
      userId,
      userName: userName_final,
      userEmail: userEmail_final,
      ipAddress
    });

    res.json({ success: true, like });
  } catch (error) {
    console.error('Add like error:', error);
    res.status(500).json({ success: false, message: 'Failed to add like' });
  }
});

app.delete('/api/capsules/:id/like', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const ipAddress = getClientIP(req);
    
    let userId = null;

    // If user is authenticated, get their info
    if (token) {
      try {
        const user = await databaseService.findLoginSession(token);
        if (user) {
          userId = user.userId;
        }
      } catch (e) {
        // Continue with anonymous like removal
      }
    }

    const like = await databaseService.removeLike(req.params.id, userId, ipAddress);
    if (!like) {
      // If we couldn't find a like tied to this user or IP, respond gracefully
      return res.status(404).json({ success: false, message: 'Like not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Remove like error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove like' });
  }
});

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Check if user already exists
    const existingUser = await databaseService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Generate and store OTP
    const otp = otpService.generateOTP();
    otpService.storeOTP(email, otp);

    // Send OTP email
    const emailResult = await emailService.sendOTPEmail(email, name, otp);
    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: 'OTP sent to your email. Please verify to complete registration.',
        email: email,
        name: name,
        password: password // Store temporarily for verification
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// OTP verification endpoint
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, name, password } = req.body;
    console.log('Verify OTP request:', { email, otp: otp ? '***' : 'missing', name, password: password ? '***' : 'missing' });

    // Validation
    if (!email || !otp || !name || !password) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Verify OTP
    console.log('Verifying OTP for:', email);
    const otpResult = await otpService.verifyOTP(email, otp);
    console.log('OTP verification result:', otpResult);
    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        message: otpResult.message
      });
    }

    // Create user in database after OTP verification
    console.log('Creating user:', { name, email, password: '***' });
    const userResult = await databaseService.createUser({ name, email, password });
    console.log('User creation result:', userResult);
    if (!userResult.success) {
      return res.status(500).json({
        success: false,
        message: userResult.message || 'Failed to create user account'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully! You can now login.',
      user: userResult.user
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Resend OTP endpoint
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and name are required' 
      });
    }

    // Generate new OTP
    const otp = otpService.generateOTP();
    await otpService.storeOTP(email, otp);

    // Send OTP email
    const emailResult = await emailService.sendOTPEmail(email, name, otp);
    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: 'New OTP sent to your email.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Email verification endpoint
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find verification in database
    const verification = await databaseService.findEmailVerificationByToken(token);
    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Verification token not found'
      });
    }

    // Check if token is expired
    if (verification.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired'
      });
    }

    // Check if token is already used
    if (verification.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has already been used'
      });
    }

    // Verify user email
    const verifyResult = await databaseService.verifyUserEmail(verification.userId);
    if (!verifyResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to verify email'
      });
    }

    // Mark verification as used
    const ipAddress = getClientIP(req);
    const userAgent = req.get('User-Agent');
    await databaseService.markEmailVerificationAsUsed(token, ipAddress, userAgent);

    res.json({
      success: true,
      message: 'Email verified successfully!',
      user: verifyResult.user
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user in database
    const user = await databaseService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await databaseService.validatePassword(user, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in',
        needsVerification: true
      });
    }

    // If OTP is provided, verify it
    if (otp) {
      const otpResult = await otpService.verifyOTP(email, otp);
      if (!otpResult.success) {
        return res.status(401).json({
          success: false,
          message: otpResult.message
        });
      }
    } else {
      // No OTP provided, send OTP and require verification
      const otp = otpService.generateOTP();
      await otpService.storeOTP(email, otp);
      
      // Send OTP email
      try {
        await emailService.sendOTPEmail(email, user.name, otp);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        // Continue anyway, OTP is stored in database
      }

      return res.status(200).json({
        success: false,
        message: 'OTP sent to your email. Please enter the OTP to complete login.',
        needsOTP: true
      });
    }

    // Generate auth token
    const authToken = databaseService.generateAuthToken(user.id);

    // Create login session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const ipAddress = getClientIP(req);
    const userAgent = req.get('User-Agent');
    
    await databaseService.createLoginSession(
      user.id,
      authToken,
      ipAddress,
      userAgent,
      expiresAt
    );

    // Update last login
    await databaseService.updateLastLogin(user.id);

    // Suppress login notification email per request
    // const loginTime = new Date().toLocaleString();
    // await emailService.sendLoginNotificationEmail(email, user.name, loginTime, ipAddress);

    res.json({
      success: true,
      message: 'Login successful',
      token: authToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user in database
    const user = await databaseService.findUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail(email, user.name);
    
    if (emailResult.success) {
      // Store reset token in database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry
      
      await databaseService.createPasswordReset(
        user.id,
        email,
        emailResult.resetToken,
        expiresAt
      );

      res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Find reset token in database (valid, unused, not expired)
    const reset = await databaseService.findPasswordReset(token);
    if (!reset) {
      return res.status(400).json({
        success: false,
        message: 'Reset token not found or has expired'
      });
    }

    if (reset.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has already been used'
      });
    }

    const updateResult = await databaseService.updateUserPassword(reset.userId, newPassword);
    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to reset password'
      });
    }

    const ipAddress = getClientIP(req);
    const userAgent = req.get('User-Agent');
    await databaseService.markPasswordResetUsed(
      token,
      updateResult.hashedPassword,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      message: 'Password reset successfully!'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Resend verification email endpoint
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user in database
    const user = await databaseService.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Send verification email
    const emailResult = await emailService.sendWelcomeEmail(email, user.name);
    
    if (emailResult.success) {
      // Store verification token in database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(process.env.EMAIL_VERIFICATION_EXPIRY || 24));
      
      await databaseService.createEmailVerification(
        user.id,
        email,
        emailResult.verificationToken,
        expiresAt
      );

      res.json({
        success: true,
        message: 'Verification email sent successfully!'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

function parseNotificationRecipients(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[;,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeEmailList(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(
    values
      .map((v) => String(v || '').trim().toLowerCase())
      .filter(Boolean)
  )];
}

async function runUnlockNotificationJob() {
  try {
    const dueCapsules = await databaseService.listDueUnlockedCapsules();
    if (!Array.isArray(dueCapsules) || dueCapsules.length === 0) return;

    for (const capsule of dueCapsules) {
      const fromField = parseNotificationRecipients(capsule.emailNotification);
      const collaboratorEmails = normalizeEmailList(capsule.collaborators);
      const ownerEmail = String(capsule.owner_email || '').trim().toLowerCase();
      const isMultiUser = !!capsule.isMultiUser;
      const shouldEmailOwner = fromField.length > 0;

      // Single-user capsule: only notify when enabled at creation time.
      if (!isMultiUser && fromField.length === 0) {
        await databaseService.markCapsuleUnlockNotified(capsule.id);
        continue;
      }

      // Multi-user capsule: collaborators should be notified regardless of owner's emailNotification selection.
      // Owner gets the email only when they enabled email notification during creation.
      const recipients = normalizeEmailList([
        ...fromField,
        ...collaboratorEmails,
        ...(shouldEmailOwner ? [ownerEmail] : []),
      ]);

      // Safety fallback: if recipient list is still empty, mark processed.
      if (recipients.length === 0) {
        await databaseService.markCapsuleUnlockNotified(capsule.id);
        continue;
      }

      const emailResult = await emailService.sendCapsuleUnlockEmail(
        recipients,
        capsule.title,
        capsule.unlockDate,
        capsule.id
      );

      if (emailResult && emailResult.success) {
        await databaseService.markCapsuleUnlockNotified(capsule.id);
        console.log(`📨 Sent unlock email for capsule ${capsule.id} to ${recipients.join(', ')}`);
      } else {
        // Keep unlockNotifiedAt null so next run retries.
        console.error(`Failed unlock email for capsule ${capsule.id}:`, emailResult && emailResult.error);
      }
    }
  } catch (error) {
    console.error('Error in unlock notification job:', error);
  }
}

// Run once shortly after startup so already-due capsules are processed quickly.
setTimeout(() => {
  runUnlockNotificationJob().catch(() => {});
}, 5000);

// Check unlock notifications every minute.
setInterval(() => {
  runUnlockNotificationJob().catch(() => {});
}, 60 * 1000);

// Cleanup expired tokens every hour
setInterval(async () => {
  try {
    // Cleanup expired tokens
    const result = await databaseService.cleanupExpiredTokens();
    if (result.success) {
      console.log('🧹 Cleaned up expired tokens:', result.cleaned);
    }
    
    // Cleanup expired OTPs
    const otpCleaned = await otpService.cleanupExpiredOTPs();
    if (otpCleaned > 0) {
      console.log('🧹 Cleaned up expired OTPs:', otpCleaned);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}, 60 * 60 * 1000); // 1 hour

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await databaseService.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TimeVault API server running on port ${PORT}`);
  console.log(`📧 Email service configured with ${process.env.SMTP_HOST}`);
  console.log(`🗄️  Database: PostgreSQL (Direct Connection)`);
  console.log(`🧹 Cleanup job scheduled every hour`);
  console.log(`📬 Unlock notification job scheduled every minute`);
});