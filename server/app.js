import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import mongoSanitize from 'express-mongo-sanitize'
import hpp from 'hpp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import config from './config/env.js'
import routes from './routes/index.js'
import { csrfProtection } from './middleware/csrf.js'
import { apiLimiter } from './middleware/rateLimit.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import { sendSuccess } from './utils/apiResponse.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// Behind Render/Vercel proxies the client IP arrives via X-Forwarded-For.
app.set('trust proxy', 1)

/* ------------------------------- Security -------------------------------- */

app.use(
  helmet({
    // Images served from /uploads must be readable by the frontend origin.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
)

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin/server-to-server requests have no Origin header.
      if (!origin) return callback(null, true)
      if (config.cors.origins.includes(origin)) return callback(null, true)
      return callback(new Error(`Origin ${origin} is not allowed by CORS policy.`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
)

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(cookieParser())

// Strip MongoDB operators ($, .) from user input.
app.use(mongoSanitize({ replaceWith: '_' }))
// Guard against HTTP parameter pollution.
app.use(hpp())

if (!config.isProd) app.use(morgan('dev'))

/* -------------------------------- Static --------------------------------- */

// Uploaded pose images. Served read-only with long lived caching.
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, 'uploads'), {
    maxAge: '7d',
    index: false,
    dotfiles: 'deny',
  })
)

/* -------------------------------- Routing -------------------------------- */

app.get('/', (_req, res) =>
  sendSuccess(res, {
    message: 'YogAI — Smart Yoga Companion API',
    data: { version: '1.0.0', docs: '/api/health', environment: config.env },
  })
)

app.use('/api', apiLimiter, csrfProtection, routes)

app.use(notFound)
app.use(errorHandler)

export default app
