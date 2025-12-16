import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { organizationService } from "../services/organization.service";
import { successResponse, createdResponse } from "../utils/response";
import { NotFoundError } from "../utils/errors";

class OrganizationController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req)
      const result = await organizationService.findAll(userId!)
      return successResponse(res, result)
    } catch (error) {
      next(error)
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req)
      const data = req.body
      const result = await organizationService.create(userId!, data)

      return createdResponse(res, result, 'Organization created successfully')
    } catch (error) {
      next(error)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req)
      const { orgId } = req.params

      const org = await organizationService.findById(userId!, orgId!)

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
      const { userId } = getAuth(req)
      const { orgId } = req.params
      const data = req.body

      const updated = await organizationService.update(userId!, orgId!, data)

      return successResponse(res, updated, 'Organization updated successfully')
    } catch (error) {
      next(error)
    }
  }
}

export const organizationController = new OrganizationController();