const authService = require('../services/authService');

const setRefreshTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.register({ name, email, password, role });
    
    setRefreshTokenCookie(res, result.refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      accessToken: result.accessToken,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    
    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken: result.accessToken,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    // Get refresh token from signed/unsigned cookies
    const rawRefreshToken = req.cookies.refreshToken;
    const result = await authService.refresh(rawRefreshToken);
    
    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      accessToken: result.accessToken
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken;
    await authService.logout(rawRefreshToken);

    // Clear client-side cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};
