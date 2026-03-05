# Next.js App Router API Scaffold

A comprehensive API scaffold for Next.js App Router projects using Prisma + Auth0 with role-based access control, pagination, and validation.

## Features

- **Prisma Singleton**: Optimized database client with connection pooling
- **Auth0 Integration**: User authentication and session management
- **Role-Based Access Control**: Account-level permissions (owner, admin, member)
- **Request Validation**: Zod schemas for all API inputs
- **Pagination**: Built-in pagination with sensible limits
- **HTTP Helpers**: Consistent API response formatting
- **TypeScript**: Full type safety throughout
- **Testing**: Jest setup with mocked Prisma client

## File Structure

```
src/
├── lib/
│   ├── prisma.ts          # Prisma singleton with SSL support
│   ├── auth.ts            # Auth0 helpers and user management
│   ├── http.ts            # HTTP response helpers
│   ├── rbac.ts            # Role-based access control
│   ├── pagination.ts      # Pagination utilities
│   └── __tests__/         # Test examples
├── types/
│   └── http.ts            # HTTP response types
└── app/api/
    ├── accounts/
    │   ├── route.ts       # Collection endpoints (GET, POST)
    │   └── [id]/
    │       └── route.ts   # Single resource endpoints (GET, PUT, DELETE)
```

## Core Libraries

### Prisma Singleton (`lib/prisma.ts`)

```typescript
import { prisma } from '@/lib/prisma';

// Global singleton with connection pooling
// Automatic SSL configuration for production
// Graceful shutdown handling
```

### Authentication (`lib/auth.ts`)

```typescript
import { getCurrentUser, requireAuth } from '@/lib/auth';

// Get current user (creates user record if needed)
const user = await getCurrentUser(request);

// Require authentication (throws if not authenticated)
const user = await requireAuth(request);
```

### HTTP Responses (`lib/http.ts`)

```typescript
import {
  ok,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from '@/lib/http';

// Consistent response format
return ok(data); // 200 OK
return created(data); // 201 Created
return badRequest(error); // 400 Bad Request
return unauthorized(); // 401 Unauthorized
return forbidden(); // 403 Forbidden
return notFound(); // 404 Not Found
return serverError(); // 500 Internal Server Error
```

### Role-Based Access Control (`lib/rbac.ts`)

```typescript
import {
  requireAccountAccess,
  requireAccountOwner,
  requireAccountAdmin,
} from '@/lib/rbac';

// Check user has access to account
await requireAccountAccess(accountId, userId, ['owner', 'admin']);

// Check user is owner
await requireAccountOwner(accountId, userId);

// Check user is admin or owner
await requireAccountAdmin(accountId, userId);
```

### Pagination (`lib/pagination.ts`)

```typescript
import { parsePagination, createPaginationMeta } from '@/lib/pagination';

// Parse pagination from request
const pagination = parsePagination(request);

// Create pagination metadata
const meta = createPaginationMeta(page, pageSize, total);
```

## API Route Patterns

### Collection Routes (`/app/api/resource/route.ts`)

```typescript
// GET /api/accounts - List with pagination and filtering
export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  const pagination = parsePagination(request);

  // Validate query parameters
  const queryResult = QuerySchema.safeParse(queryParams);
  if (!queryResult.success) {
    return badRequest(queryResult.error.issues);
  }

  // Build database query
  const [data, total] = await Promise.all([
    prisma.resource.findMany({
      /* query */
    }),
    prisma.resource.count({ where }),
  ]);

  return ok(createPaginatedResponse(data, meta));
}

// POST /api/accounts - Create new resource
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);

  // Validate request body
  const body = await request.json();
  const validation = CreateSchema.safeParse(body);
  if (!validation.success) {
    return badRequest(validation.error.issues);
  }

  const resource = await prisma.resource.create({
    data: { ...validation.data, id: uuidv4() },
  });

  return created(resource);
}
```

### Single Resource Routes (`/app/api/resource/[id]/route.ts`)

```typescript
// GET /api/accounts/[id] - Get single resource
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth(request);
  const { id } = await params;

  // Validate ID
  const idValidation = IdSchema.safeParse({ id });
  if (!idValidation.success) {
    return badRequest(idValidation.error.issues);
  }

  // Check access
  await requireAccountAccess(id, user.id);

  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) {
    return notFound();
  }

  return ok(resource);
}

// PUT /api/accounts/[id] - Update resource
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth(request);
  const { id } = await params;

  // Check admin access
  await requireAccountAdmin(id, user.id);

  const body = await request.json();
  const validation = UpdateSchema.safeParse(body);
  if (!validation.success) {
    return badRequest(validation.error.issues);
  }

  const resource = await prisma.resource.update({
    where: { id },
    data: validation.data,
  });

  return ok(resource);
}

// DELETE /api/accounts/[id] - Delete resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth(request);
  const { id } = await params;

  // Check owner access
  await requireAccountOwner(id, user.id);

  await prisma.resource.delete({ where: { id } });

  return ok({ message: 'Resource deleted successfully' });
}
```

## Validation with Zod

```typescript
import { z } from 'zod';

// Request validation schemas
const CreateAccountSchema = z.object({
  name: z.string().min(1).max(100),
});

const UpdateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

const QuerySchema = z.object({
  q: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Validate request body
const validation = CreateAccountSchema.safeParse(body);
if (!validation.success) {
  return badRequest(validation.error.issues);
}
```

## Testing

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Test Example

```typescript
import { GET, POST } from '@/app/api/accounts/route';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/auth');

describe('Accounts API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated accounts', async () => {
    // Mock data and functions
    mockRequireAuth.mockResolvedValue(mockUser);
    mockPrisma.account.findMany.mockResolvedValue(mockAccounts);

    const request = new NextRequest('http://localhost:3000/api/accounts');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.account.findMany).toHaveBeenCalled();
  });
});
```

## Environment Variables

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/database"

# Auth0
AUTH0_SECRET="your-auth0-secret"
AUTH0_BASE_URL="http://localhost:3000"
AUTH0_ISSUER_BASE_URL="https://your-tenant.auth0.com"
AUTH0_CLIENT_ID="your-client-id"
AUTH0_CLIENT_SECRET="your-client-secret"
```

## Dependencies

### Production Dependencies

- `@auth0/nextjs-auth0`: Auth0 integration
- `uuid`: UUID generation
- `zod`: Schema validation

### Development Dependencies

- `jest`: Testing framework
- `@types/jest`: Jest TypeScript types
- `@types/uuid`: UUID TypeScript types

## Best Practices

1. **Always validate inputs** with Zod schemas
2. **Use UUIDs** for all IDs in the application layer
3. **Check permissions** before any data access
4. **Handle errors gracefully** with appropriate HTTP status codes
5. **Use pagination** for all list endpoints
6. **Include proper TypeScript types** for all responses
7. **Write tests** for all API endpoints
8. **Use consistent response format** with success/error indicators

## Conventions

- All handlers in `/app/api/**/route.ts` (collection) and `/app/api/**/[id]/route.ts` (single)
- Use `uuid` to generate CHAR(36) IDs in app layer
- Return 400 with Zod issues on validation failure
- Use `requireAuth()` for authentication
- Use `requireAccountAccess()` for authorization
- Use `parsePagination()` for pagination
- Use HTTP helper functions for consistent responses
