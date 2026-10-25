import mongoose from 'mongoose'
import config from './env.js'

mongoose.set('strictQuery', true)

/**
 * Connect to MongoDB. Retries a few times on transient failures so the API is
 * resilient when the database is still starting up.
 */
export async function connectDB(attempt = 1) {
  const maxAttempts = 5

  try {
    const connection = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: !config.isProd,
    })

    // eslint-disable-next-line no-console
    console.log(`[YogAI] MongoDB connected → ${connection.connection.host}/${connection.connection.name}`)

    mongoose.connection.on('disconnected', () => {
      // eslint-disable-next-line no-console
      console.warn('[YogAI] MongoDB disconnected')
    })

    return connection
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[YogAI] MongoDB connection failed (attempt ${attempt}/${maxAttempts}): ${error.message}`)

    if (attempt >= maxAttempts) throw error

    const delay = Math.min(2000 * 2 ** (attempt - 1), 15000)
    await new Promise((resolve) => setTimeout(resolve, delay))
    return connectDB(attempt + 1)
  }
}

export async function disconnectDB() {
  await mongoose.connection.close()
}

export default connectDB
