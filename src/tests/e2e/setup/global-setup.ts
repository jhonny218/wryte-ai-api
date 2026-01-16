import { execSync } from 'child_process'
import { config } from 'dotenv'
import { resolve } from 'path'
import { startTestServer } from './test-server'
import { logger } from '../../../utils/logger'

/**
 * Global setup for Playwright E2E tests
 * Runs once before all tests
 */
async function globalSetup() {
  // Load test environment variables
  const envPath = resolve(process.cwd(), '.env.test')
  config({ path: envPath })
  
  // Force NODE_ENV to test
  process.env.NODE_ENV = 'test'
  
  logger.info('🚀 Starting E2E test setup...')

  try {
    // 1. Setup test database
    logger.info('📊 Setting up test database...')
    execSync('npm run test:db:setup', { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } })

    // 2. Start test server
    logger.info('🌐 Starting test server...')
    await startTestServer()

    // 3. Verify server is responding
    logger.info('✓ Verifying server health...')
    const maxAttempts = 10
    let attempt = 0
    let healthy = false

    while (attempt < maxAttempts && !healthy) {
      try {
        const response = await fetch('http://localhost:3001/health')
        if (response.ok) {
          const data = await response.json()
          logger.info('✅ Server health check passed', data)
          healthy = true
        }
      } catch (error) {
        attempt++
        if (attempt < maxAttempts) {
          logger.debug(`Health check attempt ${attempt} failed, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    }

    if (!healthy) {
      throw new Error('Server failed health check after multiple attempts')
    }

    logger.info('✅ E2E test setup complete')
  } catch (error) {
    logger.error('❌ E2E test setup failed', { error })
    throw error
  }
}

export default globalSetup
