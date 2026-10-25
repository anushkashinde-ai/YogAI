import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..', '..')

// Load environment variables. 
// We look for .env in the server directory specifically to avoid working-directory issues.
const serverDir = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(serverDir, '.env') })
// Also fall back to root .env for monorepo setups
dotenv.config({ path: path.join(rootDir, '.env') })
dotenv.config()

const toBool = (value, fallback = false) =>
  value === undefined ? fallback : String(value).toLowerCase() === 'true'

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const nodeEnv = process.env.NODE_ENV || 'development'
const isProd = nodeEnv === 'production'

const config = {
  env: nodeEnv,
  isProd,
  port: toInt(process.env.PORT, 5000),
  apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${toInt(process.env.PORT, 5000)}`,

  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yogai',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_only_insecure_secret_change_me_now',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  cookie: {
    name: 'yogai_token',
    csrfName: 'yogai_csrf',
    secure: toBool(process.env.COOKIE_SECURE, isProd),
    domain: process.env.COOKIE_DOMAIN || undefined,
    sameSite: process.env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax'),
  },

  cors: {
    origins: (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:4173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },

  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 15) * 60 * 1000,
    max: toInt(process.env.RATE_LIMIT_MAX, 300),
    authMax: toInt(process.env.AUTH_RATE_LIMIT_MAX, 20),
  },

  ai: {
    apiKey: process.env.AI_API_KEY || '',
    apiBase: process.env.AI_API_BASE || 'https://api.openai.com/v1',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    timeoutMs: toInt(process.env.AI_TIMEOUT_MS, 20000),
    // When no key is configured the assistant answers in demo mode.
    get enabled() {
      return Boolean(process.env.AI_API_KEY)
    },
  },

  seed: {
    adminName: process.env.SEED_ADMIN_NAME || 'YogAI Admin',
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@yogai.app',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
    demoEmail: process.env.SEED_DEMO_EMAIL || 'demo@yogai.app',
    demoPassword: process.env.SEED_DEMO_PASSWORD || 'Demo@12345',
  },
}

/**
 * Fail fast on obviously unsafe production configuration.
 */
export function assertConfig() {
  const problems = []

  if (config.isProd) {
    if (!process.env.JWT_SECRET || config.jwt.secret.length < 32) {
      problems.push('JWT_SECRET must be set to at least 32 characters in production.')
    }
    if (!process.env.MONGODB_URI) {
      problems.push('MONGODB_URI must be set in production.')
    }
    if (!config.cookie.secure) {
      problems.push('COOKIE_SECURE must be true in production (HTTPS required).')
    }
    if (config.cors.origins.some((origin) => origin.includes('localhost'))) {
      problems.push('CLIENT_ORIGINS must not include localhost in production.')
    }
  }

  if (problems.length > 0) {
    // eslint-disable-next-line no-console
    console.error('\n[YogAI] Invalid environment configuration:')
    problems.forEach((problem) => console.error(`  - ${problem}`))
    process.exit(1)
  }
}

export const isProdEnv = isProd
export default config
