import { Router } from 'express'
import type { Request, Response } from 'express'
import { Webhook } from 'svix'
import { env } from '../config/env'
import { userService } from '../services/user.service'
import { logger } from '../utils/logger'

const router = Router()

router.post('/clerk', async (req: Request, res: Response) => {
  const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET
  
  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET')
  }

  // Get Svix headers for verification
  const svix_id = req.headers['svix-id'] as string
  const svix_timestamp = req.headers['svix-timestamp'] as string
  const svix_signature = req.headers['svix-signature'] as string

  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.warn('Missing svix headers in webhook request')
    return res.status(400).json({ error: 'Missing svix headers' })
  }

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: any

  try {
    evt = wh.verify(JSON.stringify(req.body), {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    logger.error('Webhook verification failed', err)
    return res.status(400).json({ error: 'Webhook verification failed' })
  }

  // Handle the event
  const { id, email_addresses, first_name, last_name } = evt.data
  const eventType = evt.type

  try {
    if (eventType === 'user.created') {
      logger.info(`Creating user from webhook: ${id}`)
      await userService.create({
        clerkId: id,
        email: email_addresses[0].email_address,
        name: `${first_name || ''} ${last_name || ''}`.trim() || null,
      })
      logger.info(`User created successfully: ${id}`)
    }

    if (eventType === 'user.updated') {
      logger.info(`Updating user from webhook: ${id}`)
      await userService.update(id, {
        email: email_addresses[0].email_address,
        name: `${first_name || ''} ${last_name || ''}`.trim() || null,
      })
      logger.info(`User updated successfully: ${id}`)
    }

    if (eventType === 'user.deleted') {
      logger.info(`Deleting user from webhook: ${id}`)
      await userService.delete(id)
      logger.info(`User deleted successfully: ${id}`)
    }
  } catch (error) {
    logger.error(`Error processing webhook event ${eventType}:`, error)
    // Return 200 anyway to avoid webhook retries for application errors
    return res.status(200).json({ 
      message: 'Webhook received but processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  res.status(200).json({ message: 'Webhook processed successfully' })
})

export { router as webhookRoutes }
