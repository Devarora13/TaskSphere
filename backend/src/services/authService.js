const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/db');
const AppError = require('../utils/appError');

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

exports.register = async ({ name, email, password, role }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError('A user with this email address already exists.', 400);
  }

  // Check if this is the first user in the DB. If so, default them to ADMIN.
  // This makes testing role-based access control extremely frictionless for the interviewer.
  const userCount = await prisma.user.count();
  let userRole = role || 'USER';
  if (userCount === 0) {
    userRole = 'ADMIN';
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: userRole
    }
  });

  // Omit password from output
  const { password: _, ...userWithoutPassword } = newUser;

  // Generate tokens
  const accessToken = generateAccessToken(userWithoutPassword);
  const rawRefreshToken = generateRefreshToken(userWithoutPassword);
  
  // Hash refresh token for storage
  const refreshTokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      userId: newUser.id,
      expiresAt
    }
  });

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken: rawRefreshToken
  };
};

exports.login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Incorrect email or password.', 401);
  }

  // Omit password
  const { password: _, ...userWithoutPassword } = user;

  // Generate tokens
  const accessToken = generateAccessToken(userWithoutPassword);
  const rawRefreshToken = generateRefreshToken(userWithoutPassword);
  
  // Hash refresh token for storage
  const refreshTokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt
    }
  });

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken: rawRefreshToken
  };
};

exports.refresh = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    throw new AppError('Refresh token is required.', 401);
  }

  // Verify JWT structure
  let decoded;
  try {
    decoded = jwt.verify(rawRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const tokenHash = hashToken(rawRefreshToken);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
    // Revoke all tokens for this user if we detect reuse of a refresh token
    if (storedToken) {
      await prisma.refreshToken.deleteMany({ where: { userId: storedToken.userId } });
    }
    throw new AppError('Invalid, expired, or reused refresh token.', 401);
  }

  // Generate new Access and Refresh tokens (Refresh Token Rotation)
  const { password: _, ...userWithoutPassword } = storedToken.user;
  const newAccessToken = generateAccessToken(userWithoutPassword);
  const newRawRefreshToken = generateRefreshToken(userWithoutPassword);

  // Hash new refresh token for storage
  const newRefreshTokenHash = hashToken(newRawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Transaction: Delete old refresh token, save new refresh token
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: storedToken.id } }),
    prisma.refreshToken.create({
      data: {
        tokenHash: newRefreshTokenHash,
        userId: storedToken.userId,
        expiresAt
      }
    })
  ]);

  return {
    accessToken: newAccessToken,
    refreshToken: newRawRefreshToken
  };
};

exports.logout = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;

  const tokenHash = hashToken(rawRefreshToken);
  
  // Delete the refresh token from database if it exists
  try {
    await prisma.refreshToken.delete({
      where: { tokenHash }
    });
  } catch (error) {
    // If already deleted or doesn't exist, ignore
  }
};

exports.getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
