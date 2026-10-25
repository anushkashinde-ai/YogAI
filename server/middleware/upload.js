import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import ApiError from '../utils/ApiError.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const uploadDir = path.resolve(__dirname, '..', 'uploads')

// Make sure the upload directory exists at boot.
fs.mkdirSync(uploadDir, { recursive: true })

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    const safeName = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9-_]/gi, '-')
      .slice(0, 40)
      .toLowerCase()
    cb(null, `${Date.now()}-${safeName}${ext}`)
  },
})

/** Image upload middleware — used only for pose imagery. */
export const uploadImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(ApiError.badRequest('Only JPEG, PNG, WEBP or AVIF images are allowed.'))
    }
    return cb(null, true)
  },
}).single('image')

export default uploadImage
