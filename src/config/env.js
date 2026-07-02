const env = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://api.example.com',
  GOOGLE_CLIENT_ID:
    process.env.REACT_APP_GOOGLE_CLIENT_ID ||
    '983073986551-a49ce7tnjh29fccqnqp1v92ma4i3b3ba.apps.googleusercontent.com',
  LOCATIONIQ_API_KEY: process.env.REACT_APP_LOCATIONIQ_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

export const API_URL = env.API_URL;
export const API_BASE_URL = env.API_BASE_URL;
export const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
export const LOCATIONIQ_API_KEY = env.LOCATIONIQ_API_KEY;
export const NODE_ENV = env.NODE_ENV;
export const IS_DEVELOPMENT = env.NODE_ENV === 'development';

export default env;
