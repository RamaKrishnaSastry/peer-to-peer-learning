import { v4 as uuid } from 'uuid';

export const generateToken = () => uuid();

export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePasswords = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/\-{2,}/g, '-');
};

export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export const calculateReputation = (
  upvotes: number,
  contentCount: number,
  answerCount: number,
  streakDays: number
): number => {
  return (
    upvotes * 10 + contentCount * 20 + answerCount * 15 + streakDays * 5
  );
};
