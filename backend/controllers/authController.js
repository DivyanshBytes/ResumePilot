const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendToken, cookieOptions } = require('../utils/sendToken');

exports.register = asyncHandler(async (req, res) => {
  const { name, password } = req.body;
  const email = req.body.email?.toLowerCase().trim();

  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = await User.create({ name, email, password });

  sendToken(user, 201, res, 'Account created successfully');
});

exports.login = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const email = req.body.email?.toLowerCase().trim();

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  sendToken(user, 200, res, 'Logged in successfully');
});

exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', { ...cookieOptions, maxAge: 0 });
  res.status(200).json({ success: true, message: 'Logged out' });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});