// src/models/user.ts
import { Schema, model, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;  // Added username field
  email: string;
  password: string;
  name: string;
  role?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  username: {  // Added username field to schema
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true,
    select: false
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin']
  }
}, { 
  timestamps: true 
});

// Pre-save hook for hashing password
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create and export the model
export const User = model<IUser>('User', userSchema);