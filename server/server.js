import app from './app.js'
import config, { assertConfig } from './config/env.js'
import { connectDB } from './config/db.js'
import { syncAchievementCatalogue } from './services/achievementService.js'

assertConfig()

async function start() {
  await connectDB()

  // Keep the badge catalogue aligned with config/constants.js.
  try {
    const { upserted } = await syncAchievementCatalogue()
    if (upserted > 0) {
      // eslint-disable-next-line no-console
      console.log(`[YogAI] Seeded ${upserted} new achievement definition(s)`)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`[YogAI] Could not sync achievements: ${error.message}`)
  }

  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`\n[YogAI] API listening on ${config.apiBaseUrl} (${config.env})`)
    // eslint-disable-next-line no-console
    console.log(`[YogAI] CORS origins: ${config.cors.origins.join(', ')}`)
    // eslint-disable-next-line no-console
    console.log(
      `[YogAI] Yogi Assistant: ${config.ai.enabled ? 'LIVE AI' : 'DEMO MODE (no AI_API_KEY set)'}\n`
    )
  })

  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`\n[YogAI] ${signal} received — shutting down gracefully...`)
    server.close(async () => {
      const { disconnectDB } = await import('./config/db.js')
      await disconnectDB()
      process.exit(0)
    })
    // Force exit if connections refuse to close.
    setTimeout(() => process.exit(1), 10000).unref()
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('[YogAI] Unhandled promise rejection:', reason)
  })
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[YogAI] Failed to start the server:', error)
  process.exit(1)
})
