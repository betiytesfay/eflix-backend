import { Request, Response } from 'express';
import User from '../models/User.model';
import { isUserRegistration, isUserLogin } from '../validators/user.validator';
import { signToken } from '../utils/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUserRegistration(req.body)) {
      res.status(400).json({ error: 'Phone number and password are required.' });
      return;
    }

    const { phoneNumber, password, username, email, telegramAccount } = req.body;

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      res.status(409).json({ error: 'Phone number already registered.' });
      return;
    }

    const user = await User.create({
      phoneNumber,
      password,
      username,
      email,
      telegramAccount,
    });

    const token = signToken({ userId: user._id.toString(), role: user.role });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error during registration', details: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isUserLogin(req.body)) {
      res.status(400).json({ error: 'Phone number and password are required.' });
      return;
    }

    const { phoneNumber, password } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      res.status(401).json({ error: 'Invalid phone number or password.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid phone number or password.' });
      return;
    }

    const token = signToken({ userId: user._id.toString(), role: user.role });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error during login', details: error.message });
  }
};
