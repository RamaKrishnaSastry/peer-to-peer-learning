export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, meta || '');
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, meta || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, meta || '');
  },
  debug: (message: string, meta?: any) => {
    console.log(`[DEBUG] ${new Date().toISOString()} ${message}`, meta || '');
  },
};

export const generateId = () => {
  return crypto.randomUUID();
};

export const handleError = (error: any) => {
  logger.error('Error occurred:', error);
  return {
    success: false,
    error: error.message || 'Internal server error',
  };
};

export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};
