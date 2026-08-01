export const DOMAINS = {
  UPSC: 'UPSC',
  JEE: 'JEE',
  FINANCE: 'Finance',
} as const;

export const CONTENT_TYPES = {
  VIDEO: 'video',
  NOTES: 'notes',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    REQUEST_OTP: '/auth/otp/request',
    VERIFY_OTP: '/auth/otp/verify',
    LOGIN: '/auth/login',
    GOOGLE: '/auth/google',
    ME: '/auth/me',
  },
  CATEGORIES: {
    LIST: '/categories',
    GET: (slug: string) => `/categories/${slug}`,
    TREE: (id: string) => `/categories/${id}/tree`,
    BREADCRUMB: (id: string) => `/categories/${id}/breadcrumb`,
  },
  CONTENT: {
    LIST: '/content',
    GET: (id: string) => `/content/${id}`,
    CREATE: '/content',
    UPDATE: (id: string) => `/content/${id}`,
    DELETE: (id: string) => `/content/${id}`,
    COMMENT: (id: string) => `/content/${id}/comment`,
    RATE: (id: string) => `/content/${id}/rate`,
    UPVOTE: (id: string) => `/content/${id}/upvote`,
  },
  DISCUSSIONS: {
    LIST: '/discussions',
    GET: (id: string) => `/discussions/${id}`,
    CREATE: '/discussions',
    POST_ANSWER: (id: string) => `/discussions/${id}/answers`,
    COMMENT: (id: string) => `/discussions/${id}/comment`,
  },
  ANSWERS: {
    UPVOTE: (id: string) => `/answers/${id}/upvote`,
    COMMENT: (id: string) => `/answers/${id}/comment`,
  },
  COMMENTS: {
    CREATE: '/comments',
    UPVOTE: (id: string) => `/comments/${id}/upvote`,
    DELETE: (id: string) => `/comments/${id}`,
  },
  DAILY_QUESTIONS: {
    TODAY: (type: string) => `/daily-questions/today/${type}`,
    HISTORY: (type: string) => `/daily-questions/history/${type}`,
    SUBMIT: (id: string) => `/daily-questions/${id}/submit`,
  },
  USERS: {
    GET_PROFILE: (username: string) => `/users/${username}`,
    GET_ME: '/users/me',
    UPDATE_ME: '/users/me',
    GET_CONTENT: (username: string) => `/users/${username}/content`,
    GET_ANSWERS: (username: string) => `/users/${username}/answers`,
  },
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
} as const;
