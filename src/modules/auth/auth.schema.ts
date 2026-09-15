import { z } from 'zod';

const bloodGroupEnum = z.enum([
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
], { required_error: 'Blood group is required' });

export const registerSchema = z.object({
  fullName: z.string({ required_error: 'Full name is required' }).min(2, 'Full name must be at least 2 characters'),
  phone: z.string({ required_error: 'Phone number is required' }).min(10, 'Phone number must be at least 10 digits'),
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
  cnicNumber: z.string({ required_error: 'CNIC number is required' }).min(13, 'CNIC must be 13 digits'),
  password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  bloodGroup: bloodGroupEnum,
  city: z.string({ required_error: 'City is required' }).min(2, 'City is required'),
  area: z.string({ required_error: 'Area is required' }).min(2, 'Area is required'),
  agreedToTermsAt: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token is required' }).min(1, 'Refresh token is required'),
});

export const verifyEmailSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
  otp: z.string({ required_error: 'OTP is required' }).length(6, 'OTP must be 6 digits'),
});

export const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
  otp: z.string({ required_error: 'OTP is required' }).length(6, 'OTP must be 6 digits'),
  newPassword: z.string({ required_error: 'New password is required' }).min(6, 'Password must be at least 6 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
