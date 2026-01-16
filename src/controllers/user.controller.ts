import type { NextFunction, Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { successResponse, createdResponse } from "../utils/response";
import { NotFoundError } from "../utils/errors";
import { userService } from "../services/user.service";

class UserController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);
      
      if (!userId) {
        throw new NotFoundError('User not authenticated');
      }

      // Fetch full user data from Clerk
      const clerkUser = await clerkClient.users.getUser(userId);
      
      const data = {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
      };
      const result = await userService.create(data);

      return createdResponse(res, result, 'User created successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await userService.findById(id!);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  async getByClerkId(req: Request, res: Response, next: NextFunction) {
    try {
      // In test mode, get userId from test auth middleware
      let userId: string | null;
      if (process.env.NODE_ENV === 'test') {
        userId = (req as any).auth?.userId || null;
      } else {
        const auth = getAuth(req);
        userId = auth.userId;
      }

      if (!userId) {
        throw new NotFoundError('User not authenticated');
      }

      const user = await userService.findByClerkId(userId!);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);

      if (!userId) {
        throw new NotFoundError('User not authenticated');
      }

      // Update user in Clerk first
      const clerkUser = await clerkClient.users.updateUser(userId, {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      });

      // Then update in your database
      const data = {
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
      };

      const updatedUser = await userService.update(userId, data);

      return successResponse(res, updatedUser, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);

      if (!userId) {
        throw new NotFoundError('User not authenticated');
      }

      // Delete user from Clerk first
      await clerkClient.users.deleteUser(userId);

      // Then delete from your database
      await userService.delete(userId);

      return successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getUserOrganizations(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(req);

      if (!userId) {
        throw new NotFoundError('User not authenticated');
      }

      const organizations = await userService.getUserOrganizations(userId!);

      return successResponse(res, organizations);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();