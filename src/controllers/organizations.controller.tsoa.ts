import {
  Route,
  Get,
  Post,
  Patch,
  Path,
  Body,
  Tags,
  Security,
  Response,
  SuccessResponse,
  Request,
} from 'tsoa';
import type { Request as ExpressRequest } from 'express';
import {
  Organization,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  ApiResponse,
  ErrorResponse,
} from '../types/api.types';
import { organizationService } from '../services/organization.service';
import { userService } from '../services/user.service';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import { getUserId } from '../utils/auth';

@Route('organizations')
@Tags('Organizations')
@Security('clerk')
export class OrganizationsController {
  /**
   * Get all organizations for the authenticated user
   * @summary List user's organizations
   * @returns List of organizations with user's role
   */
  @Get()
  @SuccessResponse(200, 'Organizations retrieved successfully')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async getOrganizations(
    @Request() request: ExpressRequest
  ): Promise<ApiResponse<Organization[]>> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    const organizations = await organizationService.findAll(user.id);

    return {
      success: true,
      data: organizations as Organization[],
    };
  }

  /**
   * Create a new organization
   * @summary Create organization
   * @param requestBody Organization details
   * @returns Created organization
   */
  @Post()
  @SuccessResponse(201, 'Organization created successfully')
  @Response<ErrorResponse>(400, 'Invalid request')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async createOrganization(
    @Body() requestBody: CreateOrganizationRequest,
    @Request() request: ExpressRequest
  ): Promise<ApiResponse<Organization>> {
    const clerkId = getUserId(request);
    if (!clerkId) throw new UnauthorizedError('User not authenticated');

    // Get or create user if they don't exist yet
    let user = await userService.findByClerkId(clerkId);
    if (!user) {
      if (process.env.NODE_ENV === 'test') {
        throw new NotFoundError('User not found - ensure user is created in test');
      }
      const { emailAddresses, firstName, lastName } = await import('@clerk/express').then((m) =>
        m.clerkClient.users.getUser(clerkId)
      );
      user = await userService.create({
        clerkId,
        email: emailAddresses[0]?.emailAddress,
        name: `${firstName || ''} ${lastName || ''}`.trim() || null,
      });
    }

    const organization = await organizationService.create(user.id, requestBody);

    return {
      success: true,
      message: 'Organization created successfully',
      data: organization as Organization,
    };
  }

  /**
   * Get organization by ID
   * @summary Get organization details
   * @param orgId Organization ID
   * @returns Organization details
   */
  @Get('{orgId}')
  @SuccessResponse(200, 'Organization retrieved successfully')
  @Response<ErrorResponse>(404, 'Organization not found')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async getOrganizationById(
    @Path() orgId: string,
    @Request() request: ExpressRequest
  ): Promise<ApiResponse<Organization>> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    const organization = await organizationService.findById(user.id, orgId);

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    return {
      success: true,
      data: organization as Organization,
    };
  }

  /**
   * Get organization by slug
   * @summary Get organization by slug
   * @param slug Organization slug
   * @returns Organization details
   */
  @Get('slug/{slug}')
  @SuccessResponse(200, 'Organization retrieved successfully')
  @Response<ErrorResponse>(404, 'Organization not found')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async getOrganizationBySlug(
    @Path() slug: string,
    @Request() request: ExpressRequest
  ): Promise<ApiResponse<Organization>> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    const organization = await organizationService.findBySlug(user.id, slug);

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    return {
      success: true,
      data: organization as Organization,
    };
  }

  /**
   * Update organization
   * @summary Update organization details
   * @param orgId Organization ID
   * @param requestBody Updated organization details
   * @returns Updated organization
   */
  @Patch('{orgId}')
  @SuccessResponse(200, 'Organization updated successfully')
  @Response<ErrorResponse>(404, 'Organization not found')
  @Response<ErrorResponse>(401, 'Unauthorized')
  @Response<ErrorResponse>(400, 'Invalid request')
  public async updateOrganization(
    @Path() orgId: string,
    @Body() requestBody: UpdateOrganizationRequest,
    @Request() request: ExpressRequest
  ): Promise<ApiResponse<Organization>> {
    const clerkId = getUserId(request);
    const user = await userService.findByClerkId(clerkId!);
    if (!user) throw new UnauthorizedError('User not found');

    const organization = await organizationService.update(user.id, orgId, requestBody);

    return {
      success: true,
      message: 'Organization updated successfully',
      data: organization as Organization,
    };
  }
}
