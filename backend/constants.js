import { config as loadEnv } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

loadEnv({ path: './.env', quiet: true });

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const NODE_ENV = process.env.NODE_ENV;
export const PORT = process.env.PORT;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRY = process.env.JWT_EXPIRY;
export const CORS_ORIGIN = process.env.CORS_ORIGIN;
export const IMAGE_PATH = process.env.IMAGE_PATH;
export const LOGO_URL = process.env.LOGO_URL;
export const API_URL = process.env.API_URL;
export const twillio_accountSid = process.env.twillio_accountSid;
export const twillio_authToken = process.env.twillio_authToken;
export const twillio_serviceSid = process.env.twillio_serviceSid;
export const twilio_number = process.env.twilio_number;

export const smtpConfig = {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
}

export const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE,
};
