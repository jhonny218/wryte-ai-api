import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { organizationService } from "../services/organization.service";
import { userService } from "../services/user.service";
import { successResponse, createdResponse } from "../utils/response";
import { NotFoundError, UnauthorizedError } from "../utils/errors";

class OrganizationController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: clerkId } = getAuth(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')
      
      const result = await organizationService.findAll(user.id)
      return successResponse(res, result)
    } catch (error) {
      next(error)
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = getAuth(req)
      const clerkId = auth.userId!
      
      // Get or create user if they don't exist yet
      let user = await userService.findByClerkId(clerkId)
      if (!user) {
        // Auto-create user if not exists (useful for first-time organization creation)
        const { emailAddresses, firstName, lastName } = await import('@clerk/express').then(m => m.clerkClient.users.getUser(clerkId))
        user = await userService.create({
          clerkId,
          email: emailAddresses[0]?.emailAddress,
          name: `${firstName || ''} ${lastName || ''}`.trim() || null
        })
      }
      
      const data = req.body
      const result = await organizationService.create(user.id, data)

      return createdResponse(res, result, 'Organization created successfully')
    } catch (error) {
      next(error)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: clerkId } = getAuth(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')
      
      const { orgId } = req.params

      const org = await organizationService.findById(user.id, orgId!)

      if (!org) {
        throw new NotFoundError('Organization not found')
      }

      return successResponse(res, org)
    } catch (error) {
      next(error)
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: clerkId } = getAuth(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')
      
      const { slug } = req.params

      const org = await organizationService.findBySlug(user.id, slug!)

      if (!org) {
        throw new NotFoundError('Organization not found')
      }

      return successResponse(res, org)
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: clerkId } = getAuth(req)
      const user = await userService.findByClerkId(clerkId!)
      if (!user) throw new UnauthorizedError('User not found')
      
      const { orgId } = req.params
      const data = req.body

      const updated = await organizationService.update(user.id, orgId!, data)

      return successResponse(res, updated, 'Organization updated successfully')
    } catch (error) {
      next(error)
    }
  }
}

export const organizationController = new OrganizationController();