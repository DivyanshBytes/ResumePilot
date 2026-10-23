const bcrypt = require('bcryptjs');
const otpGenerator = require('otp-generator');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const sendEmail = require('../utils/sendEmail');
const { sendToken, cookieOptions } = require('../utils/sendToken');

const OTP_EXPIRY_MINUTES = 10;

// ---------- NEW: helper that creates, stores and emails an OTP ----------
const issueOtp = async (user) => {
  const otp = otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

  // Store only the hash, never the plain code
  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await user.save();

  // Dev convenience so you can test even if email is slow. Never logs in production.
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔑 OTP for ${user.email}: ${otp}`);
  }

  try {
    await sendEmail({
      to: user.email,
      subject: 'Your ResumePilot verification code',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#4F46E5;margin:0 0 8px">ResumePilot</h2>
          <p style="color:#374151">Hi ${user.name}, use this code to verify your email:</p>
          <div style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#1E1B4B;background:#EEF2FF;padding:16px;text-align:center;border-radius:8px">${otp}</div>
          <p style="color:#6B7280;font-size:13px">This code expires in ${OTP_EXPIRY_MINUTES} minutes. If you did not sign up, ignore this email.</p>
        </div>`,
    });
  } catch (err) {
    console.error('Email error:', err.message);
    throw new AppError('Could not send the verification email. Please try resending the code.', 500);
  }
};

// POST /api/auth/register  (CHANGED: no longer logs the user in)
exports.register = asyncHandler(async (req, res) => {
  const { name, password } = req.body;
  const email = req.body.email?.toLowerCase().trim();

  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400);
  }

  let user = await User.findOne({ email });

  if (user && user.isVerified) {
    throw new AppError('An account with this email already exists', 409);
  }

  if (user) {
    // Registered earlier but never verified: refresh details and resend the code
    user.name = name;
    user.password = password; // re-hashed by the pre('save') hook
  } else {
    user = new User({ name, email, password });
  }

  await issueOtp(user);

  res.status(201).json({
    success: true,
    message: `Verification code sent to ${email}`,
    email,
  });
});

// POST /api/auth/verify-otp  (NEW)
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const email = req.body.email?.toLowerCase().trim();

  if (!email || !otp) {
    throw new AppError('Email and OTP are required', 400);
  }

  const user = await User.findOne({ email }).select('+otp +otpExpiry');

  if (!user || !user.otp) {
    throw new AppError('Invalid or expired code', 400);
  }
  if (user.otpExpiry < new Date()) {
    throw new AppError('This code has expired. Please request a new one', 400);
  }

  const isMatch = await bcrypt.compare(String(otp), user.otp);
  if (!isMatch) {
    throw new AppError('Invalid or expired code', 400);
  }

  user.isVerified = true;
  user.otp = undefined;       // one-time use: clear it
  user.otpExpiry = undefined;
  await user.save();

  sendToken(user, 200, res, 'Email verified. Welcome to ResumePilot!');
});

// POST /api/auth/resend-otp  (NEW)
exports.resendOtp = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  if (!email) throw new AppError('Email is required', 400);

  const user = await User.findOne({ email });

  // Only act for unverified accounts, but always answer the same way,
  // so nobody can use this route to discover which emails are registered
  if (user && !user.isVerified) {
    await issueOtp(user);
  }

  res.status(200).json({
    success: true,
    message: 'If that account needs verification, a new code has been sent',
  });
});

// POST /api/auth/login  (CHANGED: blocks unverified accounts)
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

  if (!user.isVerified) {
    throw new AppError('Please verify your email before logging in', 403);
  }

  sendToken(user, 200, res, 'Logged in successfully');
});

// POST /api/auth/logout  (unchanged)
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', { ...cookieOptions, maxAge: 0 });
  res.status(200).json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me  (unchanged)
exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});