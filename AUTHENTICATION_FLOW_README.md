# Authentication Flow Documentation - Mac Development Notes

## Overview

This document tracks the complete authentication flow in the Next Holiday application, from initial login to logout, specifically for Mac development and debugging purposes.

## User ID Architecture

### Database Schema

- **Primary User ID**: Prisma-generated UUID (`id` field)
- **Auth0 ID**: Stored separately as `auth0Sub` field
- **Relationship**: All database relationships use the Prisma UUID, not Auth0 ID

```prisma
model User {
  id            String   @id @default(uuid()) @db.Char(36)  // Primary key
  auth0Sub      String   @unique @map("auth0_sub")          // Auth0 identifier
  email         String?
  name          String?
  picture       String?
  isInDb        Boolean  @default(false) @map("is_in_db")
  isFirstLogin  Boolean  @default(true) @map("is_first_login")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
}
```

## Authentication Flow

### 1. Initial Login Process

#### Step 1: Auth0 Authentication

- User clicks login → Auth0 handles OAuth flow
- Auth0 returns session with user information including `sub` (unique identifier)
- Session stored in browser/client

#### Step 2: User Creation/Lookup

**File**: `src/lib/auth.ts` - `getCurrentUser()` function

```typescript
const user = await prisma.user.upsert({
  where: { auth0Sub: session.user.sub }, // Find by Auth0 ID
  update: {
    // Update existing user info
    email: session.user.email,
    name: session.user.name,
    picture: session.user.picture,
    isInDb: true,
    updatedAt: new Date(),
  },
  create: {
    // Create new user
    auth0Sub: session.user.sub, // Store Auth0 ID
    email: session.user.email,
    name: session.user.name,
    picture: session.user.picture,
    isInDb: true,
    isFirstLogin: true, // Mark as first login
  },
});
```

#### Step 3: User ID Assignment

- **New User**: Prisma generates UUID for `id` field
- **Existing User**: Uses existing UUID from database
- **All subsequent operations**: Use the Prisma UUID, not Auth0 ID

### 2. Session Management

#### Auth0 Session Handling

**File**: `src/lib/auth.ts` - `getAuth0Session()`

```typescript
async function getAuth0Session(request: NextRequest): Promise<Auth0Session | null> {
  // Currently mocked for API scaffold
  // TODO: Implement proper Auth0 session handling for Next.js 15
  return null;
}
```

**Note**: Session handling is currently mocked. In production, this would use proper Auth0 session management.

#### User State Management

- User information stored in Redux store
- Session persistence handled by Auth0 client SDK
- Database queries use Prisma UUID for all relationships

### 3. API Authentication

#### Protected Route Access

**File**: `src/lib/auth.ts` - `requireAuth()`

```typescript
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}
```

#### Usage in API Routes

**Example**: `src/app/api/accounts/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const user = await requireAuth(request); // Get authenticated user

  // Use user.id (Prisma UUID) for database queries
  const accounts = await prisma.account.findMany({
    where: {
      members: {
        some: {
          userId: user.id, // Uses Prisma UUID
        },
      },
    },
  });
}
```

### 4. Database Relationships

#### All Tables Reference Prisma UUID

- `Account.ownerUserId` → `User.id`
- `Task.createdBy` → `User.id`
- `Gift.createdBy` → `User.id`
- `Contact.createdBy` → `User.id`
- All other user relationships use `User.id`

#### Auth0 ID Usage

- Only used for authentication lookup
- Stored in `User.auth0Sub` field
- Never used in foreign key relationships

### 5. Logout Process

#### Step 1: Auth0 Logout

- Auth0 handles session cleanup
- Clears browser session storage
- Redirects to logout URL

#### Step 2: Application Cleanup

- Redux store cleared
- User state reset
- No database cleanup needed (user record remains)

## Development Notes for Mac

### Environment Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add Auth0 configuration to .env.local

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Debugging Authentication

#### Check User Creation

```bash
# Connect to database
npx prisma studio

# Or use Prisma CLI
npx prisma db seed
```

#### Verify Auth0 Configuration

- Check Auth0 dashboard for correct callback URLs
- Verify environment variables are set correctly
- Test Auth0 login flow in browser

#### Database Queries

```sql
-- Check user table structure
DESCRIBE users;

-- View user records
SELECT id, auth0_sub, email, name, is_first_login, created_at
FROM users
ORDER BY created_at DESC;

-- Check relationships
SELECT u.id, u.auth0_sub, u.email, a.name as account_name
FROM users u
LEFT JOIN account_members am ON u.id = am.user_id
LEFT JOIN accounts a ON am.account_id = a.id;
```

### Common Issues & Solutions

#### Issue: User not found after login

**Solution**: Check if `auth0Sub` is being stored correctly

```typescript
// Debug in getCurrentUser function
console.log('Auth0 sub:', session.user.sub);
console.log('User lookup result:', user);
```

#### Issue: Database relationships failing

**Solution**: Ensure using `user.id` (Prisma UUID) not `user.auth0Sub`

```typescript
// Correct
const account = await prisma.account.create({
  data: {
    ownerUserId: user.id, // Use Prisma UUID
  },
});

// Incorrect
const account = await prisma.account.create({
  data: {
    ownerUserId: user.auth0Sub, // Don't use Auth0 ID
  },
});
```

#### Issue: Session not persisting

**Solution**: Check Auth0 configuration and session handling

- Verify Auth0 domain and client ID
- Check callback URLs in Auth0 dashboard
- Ensure proper session storage configuration

### Testing Authentication Flow

#### Manual Testing Steps

1. **Clear browser data** (to simulate new user)
2. **Navigate to app** and click login
3. **Complete Auth0 flow** with test credentials
4. **Check database** for new user record
5. **Verify UUID generation** and Auth0 ID storage
6. **Test API calls** to ensure authentication works
7. **Test logout** and session cleanup

#### Automated Testing

```bash
# Run tests
npm test

# Run specific auth tests
npm test -- --testNamePattern="auth"
```

## Security Considerations

### UUID vs Auth0 ID Usage

- **UUID**: Used for all internal relationships (more secure)
- **Auth0 ID**: Only used for authentication lookup
- **Separation**: Prevents Auth0 ID exposure in API responses

### Session Security

- Auth0 handles session security
- No sensitive data stored in client-side storage
- Database queries use internal UUIDs only

### Environment Variables

```bash
# Required Auth0 variables
AUTH0_SECRET='your-secret'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
```

## Future Improvements

### TODO Items

- [ ] Implement proper Auth0 session handling for Next.js 15
- [ ] Add session refresh logic
- [ ] Implement proper error handling for auth failures
- [ ] Add user profile update functionality
- [ ] Implement account deletion with proper cleanup

### Performance Optimizations

- [ ] Add user caching layer
- [ ] Optimize database queries with proper indexing
- [ ] Implement connection pooling for database

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Environment**: Mac Development
