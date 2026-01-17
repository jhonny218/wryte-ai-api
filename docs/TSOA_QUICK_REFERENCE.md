# tsoa Quick Reference

## Access Documentation

```
http://localhost:3000/api-docs
```

## Generate Documentation

```bash
npm run tsoa:gen          # Generate spec + routes
npm run tsoa:spec         # Generate spec only
npm run tsoa:routes       # Generate routes only
```

## Basic Controller Structure

```typescript
import { Route, Get, Post, Body, Path, Tags, Security } from "tsoa";

@Route("api/v1/resource")
@Tags("ResourceName")
@Security("clerk")
export class ResourceController {
  @Get()
  public async getAll(): Promise<Resource[]> {
    // Implementation
  }

  @Post()
  public async create(@Body() body: CreateResourceRequest): Promise<Resource> {
    // Implementation
  }

  @Get("{id}")
  public async getById(@Path() id: string): Promise<Resource> {
    // Implementation
  }
}
```

## Common Decorators

### Route Decorators

```typescript
@Route('path')              // Base path
@Tags('TagName')           // Group in docs
@Security('clerk')         // Require auth
```

### Method Decorators

```typescript
@Get()                     // GET request
@Get('{id}')              // GET with param
@Post()                    // POST request
@Put('{id}')              // PUT request
@Patch('{id}')            // PATCH request
@Delete('{id}')           // DELETE request
```

### Parameter Decorators

```typescript
@Body()                    // Request body
@Path()                    // Path parameter
@Query()                   // Query string
@Header()                  // Request header
@Request()                 // Express request
```

### Response Decorators

```typescript
@SuccessResponse(200, 'OK')
@Response<ErrorResponse>(400, 'Bad Request')
@Response<ErrorResponse>(401, 'Unauthorized')
@Response<ErrorResponse>(404, 'Not Found')
@Example({ id: '123', name: 'Example' })
```

## Response Types

### Standard Response

```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
```

### Error Response

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}
```

## Example: Complete Endpoint

```typescript
/**
 * Create a new organization
 * @summary Create organization
 * @param requestBody Organization details
 * @returns Created organization with ID and slug
 */
@Post()
@SuccessResponse(201, 'Organization created successfully')
@Response<ErrorResponse>(400, 'Invalid request data')
@Response<ErrorResponse>(401, 'User not authenticated')
@Example<ApiResponse<Organization>>({
  success: true,
  message: 'Organization created successfully',
  data: {
    id: 'org_123abc',
    name: 'Acme Corp',
    slug: 'acme-corp',
    createdAt: new Date(),
    updatedAt: new Date()
  }
})
public async createOrganization(
  @Body() requestBody: CreateOrganizationRequest,
  @Request() request: ExpressRequest
): Promise<ApiResponse<Organization>> {
  const userId = getUserId(request);
  const org = await service.create(userId, requestBody);

  return {
    success: true,
    message: 'Organization created successfully',
    data: org
  };
}
```

## Accessing Express Request

When you need the raw Express request:

```typescript
import { Request } from 'tsoa';
import type { Request as ExpressRequest } from 'express';

@Get()
public async method(
  @Request() request: ExpressRequest
): Promise<Data> {
  const userId = getUserId(request);
  // ...
}
```

## File Organization

```
src/
├── controllers/
│   ├── resource.controller.ts       # Original
│   └── resource.controller.tsoa.ts  # tsoa version
├── types/
│   └── api.types.ts                 # Shared types
├── docs/
│   └── openapi.json                 # Generated
└── routes/
    └── generated/
        └── routes.ts                # Generated
```

## Workflow

1. Create/edit `*.controller.tsoa.ts`
2. Add/update type in `api.types.ts`
3. Run `npm run tsoa:gen`
4. Check docs at `/api-docs`
5. Test with "Try it out"

## Tips

✅ **DO:**

- Use descriptive JSDoc comments
- Define explicit return types
- Document all error responses
- Add examples with `@Example()`
- Keep types in `api.types.ts`

❌ **DON'T:**

- Return `any` types
- Skip JSDoc comments
- Forget to regenerate after changes
- Mix business logic in controllers
- Duplicate type definitions

## Common Issues

### "Controllers not found"

→ Check `controllerPathGlobs` in `tsoa.json`

### "Cannot import JSON"

→ Add `"resolveJsonModule": true` to `tsconfig.json`

### Documentation not updating

→ Run `npm run tsoa:gen` after code changes

### Types not matching

→ Ensure types are exported from `api.types.ts`

## Resources

- [tsoa Docs](https://tsoa-community.github.io/docs/)
- [OpenAPI Spec](https://swagger.io/specification/)
- [Project Guide](./API_DOCUMENTATION.md)
