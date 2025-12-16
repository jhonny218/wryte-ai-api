import type { NextFunction, Request, Response } from "express";
import { settingsService } from "../services/settings.service";
import { successResponse } from "../utils/response";

class SettingsController {
  async upsert (req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = req.params
      const data = req.body
      const result = await settingsService.upsert(orgId!, data)

      return successResponse(res, result, 'Settings upserted successfully')
    } catch (error) {
      next(error)
    }
  }

  async getByOrgId (req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = req.params
      const settings = await settingsService.getByOrgId(orgId!)

      if(!settings) {
        return successResponse(res, null, 'No settings found for this organization')
      }

      return successResponse(res, settings)
    } catch (error) {
      next(error)
    }
  }
}

export const settingsController = new SettingsController();