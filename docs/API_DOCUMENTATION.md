# API Documentation with tsoa

This project uses [tsoa](https://tsoa-community.github.io/docs/) to automatically generate OpenAPI 3.0 specifications and Swagger UI documentation from TypeScript controllers.

## Overview

**tsoa** provides:

- ✅ TypeScript-first API documentation
- ✅ Auto-generated OpenAPI 3.0 spec
- ✅ Interactive Swagger UI for testing
- ✅ Type-safe route generation
- ✅ Request/response validation

## Accessing the Documentation

Once the server is running, access the interactive API documentation at:

```
http://localhost:3000/api-docs
```

## Project Structure

```
src/
├── controllers/
│   ├── *.controller.ts          # Original Express controllers
│   └── *.controller.tsoa.ts     # tsoa-annotated controllers
├── docs/
│   └── openapi.json            # Generated OpenAPI spec
├── routes/
│   └── generated/
│       └── routes.ts           # Auto-generated routes
└── types/
    └── api.types.ts            # Shared API type definitions
```

## Creating tsoa Controllers

tsoa controllers use TypeScript decorators to define API endpoints. Here's an example:

```typescript
import { Route, Get, Post, Body, Path, Tags, Security } from "tsoa";

@Route("api/v1/organizations")
@Tags("Organizations")
@Security("clerk")
export class OrganizationsController {
  /**
   * Get all organizations
   * @summary List user's organizations
   */
  @Get()
  public async getOrganizations(): Promise<Organization[]> {
    // Implementation
  }

  /**
   * Create organization
   * @param requestBody Organization details
   */
  @Post()
  public async createOrganization(
    @Body() requestBody: CreateOrganizationRequest
  ): Promise<Organization> {
    // Implementation
  }

  /**
   * Get organization by ID
   * @param orgId Organization ID
   */
  @Get("{orgId}")
  public async getOrganizationById(
    @Path() orgId: string
  ): Promise<Organization> {
    // Implementation
  }
}
```

## Available Decorators

### Route Decorators

- `@Route('path')` - Define base path for controller
- `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()` - HTTP methods
- `@Tags('tag')` - Group endpoints in documentation

### Parameter Decorators

- `@Body()` - Request body
- `@Path()` - Path parameter
- `@Query()` - Query string parameter
- `@Header()` - Request header
- `@Request()` - Access Express request object

### Response Decorators

- `@SuccessResponse(code, description)` - Success response
- `@Response<Type>(code, description)` - Error response
- `@Example({ ... })` - Example response data

### Security

- `@Security('clerk')` - Require Clerk authentication

## Generating Documentation

The OpenAPI spec and routes are automatically generated from tsoa controllers:

```bash
# Generate both spec and routes
npm run tsoa:gen

# Generate only OpenAPI spec
npm run tsoa:spec

# Generate only routes
npm run tsoa:routes
```

**Note:** Run `npm run tsoa:gen` after:

- Adding new tsoa controllers
- Modifying existing controller signatures
- Changing request/response types

## Workflow

### Option 1: Use tsoa Controllers (Recommended for new endpoints)

1. Create a new controller in `src/controllers/*.controller.tsoa.ts`
2. Add tsoa decorators (`@Route`, `@Get`, etc.)
3. Define TypeScript interfaces in `src/types/api.types.ts`
4. Run `npm run tsoa:gen` to generate docs
5. Routes are auto-generated in `src/routes/generated/routes.ts`

### Option 2: Keep Existing Controllers

Your existing Express controllers in `src/controllers/*.controller.ts` will continue to work normally. The tsoa controllers are optional and can coexist with traditional Express routes.

## Current Implementation Status

### ✅ Documented Endpoints (tsoa)

- `GET /health` - Health check
- `GET /health/ping` - Simple ping
- `GET /api/v1/organizations` - List organizations
- `POST /api/v1/organizations` - Create organization
- `GET /api/v1/organizations/{orgId}` - Get organization by ID
- `GET /api/v1/organizations/slug/{slug}` - Get by slug
- `PATCH /api/v1/organizations/{orgId}` - Update organization
- `POST /api/v1/jobs/title` - Generate blog titles
- `POST /api/v1/jobs/outline` - Generate blog outline
- `POST /api/v1/jobs/blog` - Generate blog content

### 📝 To Be Documented (existing controllers)

- Settings endpoints
- Blog title endpoints
- Blog outline endpoints
- Blog content endpoints
- Calendar endpoints
- User endpoints

## Configuration

tsoa is configured in `tsoa.json`:

```json
{
  "entryFile": "src/app.ts",
  "controllerPathGlobs": ["src/controllers/**/*.tsoa.ts"],
  "spec": {
    "outputDirectory": "src/docs",
    "specVersion": 3,
    "basePath": "/api/v1"
  },
  "routes": {
    "routesDir": "src/routes/generated"
  }
}
```

## Type Safety

All request/response types are defined in `src/types/api.types.ts` to ensure:

- Consistency between documentation and implementation
- Type checking at compile time
- IntelliSense support in IDEs
- Validation of request payloads

## Zod Integration

tsoa controllers work alongside existing Zod validation:

- tsoa validates at the OpenAPI level
- Zod validates in service/controller logic
- Both provide type safety and runtime validation

## Best Practices

1. **Use descriptive JSDoc comments** - They appear in the documentation
2. **Define response types explicitly** - Better docs and type safety
3. **Add @Example decorators** - Provide sample data for testing
4. **Tag endpoints logically** - Groups related endpoints together
5. **Document error responses** - Use `@Response` for different error codes
6. **Keep types in api.types.ts** - Centralized, reusable definitions

## Customization

Swagger UI options are configured in `src/app.ts`:

```typescript
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "Wryte AI API Documentation",
    swaggerOptions: {
      persistAuthorization: true, // Remember auth token
      displayRequestDuration: true, // Show response times
      docExpansion: "list", // Expand tag list by default
      filter: true, // Enable search
      tryItOutEnabled: true, // Enable "Try it out" by default
    },
  })
);
```

## Migration Guide

To migrate an existing Express controller to tsoa:

1. **Copy the controller** to a new `.tsoa.ts` file
2. **Add decorators** to the class and methods
3. **Extract types** to `api.types.ts` if not already there
4. **Update method signatures** to use tsoa parameter decorators
5. **Generate docs** with `npm run tsoa:gen`
6. **Test** using Swagger UI at `/api-docs`

Example before/after:

**Before (Express):**

```typescript
async getById(req: Request, res: Response, next: NextFunction) {
  const { orgId } = req.params;
  const org = await service.findById(orgId);
  return successResponse(res, org);
}
```

**After (tsoa):**

```typescript
@Get('{orgId}')
public async getOrganizationById(
  @Path() orgId: string
): Promise<ApiResponse<Organization>> {
  const org = await service.findById(orgId);
  return { success: true, data: org };
}
```

## Resources

- [tsoa Documentation](https://tsoa-community.github.io/docs/)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)

## Troubleshooting

**Issue:** Controllers not found during generation

- Check `controllerPathGlobs` in `tsoa.json`
- Ensure controllers have the correct file extension
- Verify decorators are properly imported

**Issue:** Types not generating correctly

- Ensure types are exported from `api.types.ts`
- Check that all referenced types are defined
- Run `npm run tsoa:gen` after type changes

**Issue:** Swagger UI not loading

- Verify `openapi.json` exists in `src/docs/`
- Check console for import errors
- Ensure `resolveJsonModule: true` in `tsconfig.json`
