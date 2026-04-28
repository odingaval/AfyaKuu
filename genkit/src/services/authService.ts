import jwt, { SignOptions } from 'jsonwebtoken';

import { User, IUser } from '../models/user.js';
import { Document } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Ensure JWT_SECRET is defined
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthResponse {
  user: Omit<IUser, 'password' | 'comparePassword' | keyof Document> & { 
    _id: string;
  };
  token: string;
}

export const authService = {
  async register(username: string, email: string, password: string, name: string): Promise<AuthResponse> {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    const user = await User.create({ username, email, password, name, role: 'user' });
    const token = this.generateToken(user);

    // Convert to plain object and remove password
    const userObject = user.toObject();
    const { password: _, comparePassword: __, ...userWithoutPassword } = userObject;
    
    return { 
      user: { 
        ...userWithoutPassword, 
        _id: user._id.toString() 
      }, 
      token 
    };
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    const userObject = user.toObject();
    const { password: _, comparePassword: __, ...userWithoutPassword } = userObject;
    
    return { 
      user: { 
        ...userWithoutPassword, 
        _id: user._id.toString() 
      }, 
      token 
    };
  },

  generateToken(user: IUser): string {
    const payload = { 
      id: user._id.toString(), 
      role: user.role 
    };
    
    // Ensure expiresIn is in the correct format
    let expiresIn: string | number = JWT_EXPIRES_IN;
    if (/^\d+$/.test(JWT_EXPIRES_IN)) {
      expiresIn = parseInt(JWT_EXPIRES_IN, 10);
    }
    
    return jwt.sign(
      payload, 
      JWT_SECRET, 
      { expiresIn } as SignOptions
    );
  },

  verifyToken(token: string): { id: string; role: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    } catch (error) {
      return null;
    }
  }
};

export default authService;