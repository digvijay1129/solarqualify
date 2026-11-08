import {
  loginUser,
  registerUser,
} from './auth.service.js';

export async function register(req, res) {
  const result = await registerUser(req.body ?? {});

  return res.status(201).json({
    success: true,
    message: 'Account registered successfully.',
    data: result,
  });
}

export async function login(req, res) {
  const result = await loginUser(req.body ?? {});

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: result,
  });
}

export async function getCurrentUser(req, res) {
  return res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully.',
    data: {
      user: req.user,
    },
  });
}

export async function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Logout successful. Remove the access token from the client.',
  });
}