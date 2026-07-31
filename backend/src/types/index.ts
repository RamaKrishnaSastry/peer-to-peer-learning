// User types
export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  bio: string | null;
  avatarUrl: string | null;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends Omit<User, 'password'> {
  stats: UserStats;
}

export interface UserStats {
  id: string;
  userId: string;
  reputationScore: number;
  upvotesReceived: number;
  contentCount: number;
  answerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicStats {
  reputationScore: number;
  upvotesReceived: number;
  contentCount: number;
  answerCount: number;
  currentStreak: number;
  longestStreak: number;
}

// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  domain: 'UPSC' | 'JEE' | 'Finance';
  level: number;
  path: string;
  parentId: number | null;
  isLeaf: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Content types
export type ContentType = 'video' | 'notes';

export interface Content {
  id: string;
  creatorId: string;
  categoryId: number;
  title: string;
  description: string;
  type: ContentType;
  contentUrl: string;
  version: number;
  avgRating: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Discussion types
export interface Discussion {
  id: string;
  creatorId: string;
  categoryId: number;
  title: string;
  description: string;
  answerCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Answer types
export type LLMVerdict = 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT' | 'REQUIRES_CONTEXT';

export interface Answer {
  id: string;
  discussionId: string;
  creatorId: string;
  text: string;
  verified: boolean;
  verdict: LLMVerdict | null;
  upvoteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Comment types
export type CommentParentType = 'content' | 'answer' | 'discussion';

export interface Comment {
  id: string;
  parentId: string;
  parentType: CommentParentType;
  userId: string;
  text: string;
  upvoteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Rating types
export interface Rating {
  id: string;
  contentId: string;
  userId: string;
  stars: number;
  createdAt: Date;
  updatedAt: Date;
}

// Streak types
export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  updatedAt: Date;
}

// Vote types
export interface Vote {
  id: string;
  parentId: string;
  parentType: 'content' | 'answer' | 'comment';
  userId: string;
  createdAt: Date;
}

// Daily question types
export interface QuestionOption {
  label: string;
  text: string;
}

export interface DailyQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string | null;
  type: string;
  date: Date;
  categoryId: number | null;
  attempted?: boolean;
  myAttempt?: QuestionAttempt | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionAttempt {
  id: string;
  userId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  verdict: string | null;
  explanation: string | null;
  createdAt: Date;
}

// Badge types
export interface Badge {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge?: Badge;
  earnedAt: Date;
}

// API Request/Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UploadContentRequest {
  title: string;
  description: string;
  type: ContentType;
  contentUrl: string;
  categoryId: number;
}

export interface PostAnswerRequest {
  text: string;
}

export interface RateRequest {
  stars: number;
}

export interface PostCommentRequest {
  text: string;
  parentId: string;
  parentType: CommentParentType;
}

export interface SubmitAnswerRequest {
  selectedAnswer: string;
}

// Pagination types
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// LLM types
export interface LLMVerificationResponse {
  verdict: LLMVerdict;
  confidence: number;
  explanation: string;
}

// Search types
export interface SearchParams {
  query: string;
  domain?: 'UPSC' | 'JEE' | 'Finance';
  type?: 'content' | 'discussion' | 'answer';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  type: 'content' | 'discussion' | 'answer';
  title: string;
  description: string;
  relevanceScore: number;
}
