const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,                       
  secure: isProd,                       
  sameSite: isProd ? 'none' : 'lax',    
  maxAge: 7 * 24 * 60 * 60 * 1000,      
};

const sendToken = (user, statusCode, res, message) => {
  const token = user.generateToken();

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
};

module.exports = { sendToken, cookieOptions };