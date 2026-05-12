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
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    ME: '/auth/me',
  },
  CATEGORIES: {
    LIST: '/categories',
    GET: (id: string) => `/categories/${id}`,
    TREE: (id: string) => `/categories/${id}/tree`,
    BREADCRUMB: (id: string) => `/categories/${id}/breadcrumb`,
  },
  CONTENT: {
    LIST: '/content',
    GET: (id: string) => `/content/${id}`,
    CREATE: '/content',
    UPDATE: (id: string) => `/content/${id}`,
    DELETE: (id: string) => `/content/${id}`,
  },
  DISCUSSIONS: {
    LIST: '/discussions',
    GET: (id: string) => `/discussions/${id}`,
    CREATE: '/discussions',
    POST_ANSWER: (id: string) => `/discussions/${id}/answers`,
  },
  USERS: {
    GET_PROFILE: (username: string) => `/users/${username}`,
    GET_ME: '/users/me',
    UPDATE_ME: '/users/me',
    GET_CONTENT: (username: string) => `/users/${username}/content`,
  },
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
} as const;
