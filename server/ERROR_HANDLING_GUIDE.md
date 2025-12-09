# Error Handling Guide

## Overview

This project uses a standardized error handling system that ensures:
- **Consistent error responses** across all API endpoints
- **Proper error logging** with contextual information
- **Security** - no sensitive information leaked to clients
- **Developer experience** - simple, clean code patterns

## Key Components

### 1. Error Handler Middleware (`src/middleware/error-handler.ts`)

The global error handler catches all errors and formats them consistently:

```typescript
import { createError, asyncHandler, logError } from '../middleware/error-handler';
```

#### Available Utilities:

##### `createError` - Error Creators
Pre-configured error creators for common HTTP status codes:

```typescript
// 400 Bad Request
throw createError.badRequest('Invalid input data');

// 401 Unauthorized
throw createError.unauthorized('Authentication required');

// 403 Forbidden
throw createError.forbidden('Access denied');

// 404 Not Found
throw createError.notFound('Resource not found');

// 409 Conflict
throw createError.conflict('Email already exists');

// 422 Validation Error
throw createError.validationError('Invalid email format');

// 429 Too Many Requests
throw createError.tooManyRequests('Rate limit exceeded');

// 500 Internal Server Error
throw createError.internal('Unexpected error occurred');
```

##### `asyncHandler` - Async Route Wrapper
Automatically catches errors in async routes and passes them to the error handler:

```typescript
// ❌ OLD WAY - Manual try-catch
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ✅ NEW WAY - asyncHandler wrapper
router.get('/users', asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany();
  res.json({ users });
}));
```

##### `logError` - Standardized Error Logging
Consistent error logging with contextual information:

```typescript
logError('User creation', error, { userId, email });
// Output: [ERROR] User creation: { timestamp, message, statusCode, userId, email }
```

## Usage Patterns

### Pattern 1: Simple GET Route

```typescript
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const item = await prisma.item.findUnique({
    where: { id },
  });

  if (!item) {
    throw createError.notFound('Item not found');
  }

  res.json({ item });
}));
```

### Pattern 2: POST Route with Validation

```typescript
router.post(
  '/',
  requireAuth,
  validate(createItemSchema),
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    // Check for duplicates
    const existing = await prisma.item.findFirst({
      where: { name },
    });

    if (existing) {
      throw createError.conflict('Item with this name already exists');
    }

    // Create item
    const item = await prisma.item.create({
      data: { name, description, ownerId: req.user!.id },
    });

    res.status(201).json({ item });
  })
);
```

### Pattern 3: Authorization Checks

```typescript
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw createError.notFound('Item not found');
    }

    // Check ownership
    if (item.ownerId !== req.user!.id) {
      throw createError.forbidden('You do not have permission to modify this item');
    }

    const updated = await prisma.item.update({
      where: { id },
      data: req.body,
    });

    res.json({ item: updated });
  })
);
```

### Pattern 4: Middleware with Error Handling

```typescript
export const requireOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError.unauthorized('Authentication required');
    }

    const { id } = req.params;

    const resource = await prisma.resource.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!resource) {
      throw createError.notFound('Resource not found');
    }

    if (resource.ownerId !== req.user.id) {
      throw createError.forbidden('Access denied');
    }

    next();
  } catch (error) {
    logError('Ownership check', error, { resourceId: req.params.id });
    next(error); // Pass error to global error handler
  }
};
```

## Error Response Format

All errors follow a consistent structure:

### Production Response (5xx errors)
```json
{
  "error": "Internal server error. Please try again later.",
  "statusCode": 500,
  "timestamp": "2025-12-08T23:00:00.000Z"
}
```

### Development Response (includes stack trace)
```json
{
  "error": "Failed to fetch user",
  "statusCode": 500,
  "timestamp": "2025-12-08T23:00:00.000Z",
  "stack": "Error: Failed to fetch user\n    at...",
  "originalMessage": "User not found in database"
}
```

### Client Errors (4xx)
```json
{
  "error": "Email already exists",
  "statusCode": 409,
  "timestamp": "2025-12-08T23:00:00.000Z"
}
```

## Best Practices

### ✅ DO

1. **Use `asyncHandler` for all async routes**
   ```typescript
   router.get('/items', asyncHandler(async (req, res) => { ... }));
   ```

2. **Throw errors instead of returning responses**
   ```typescript
   if (!item) {
     throw createError.notFound('Item not found');
   }
   ```

3. **Use specific error creators**
   ```typescript
   throw createError.conflict('Email already in use');
   throw createError.forbidden('Access denied');
   ```

4. **Let the global handler format responses**
   - The middleware automatically handles:
     - Status codes
     - Error messages
     - Security (hiding sensitive info in production)
     - Logging

5. **Use `logError` for custom logging**
   ```typescript
   logError('Database operation', error, { userId, operation: 'create' });
   ```

### ❌ DON'T

1. **Don't use manual try-catch blocks**
   ```typescript
   // ❌ BAD
   try {
     const data = await fetchData();
     res.json(data);
   } catch (error) {
     res.status(500).json({ error: 'Failed' });
   }
   ```

2. **Don't return error responses manually**
   ```typescript
   // ❌ BAD
   if (!user) {
     return res.status(404).json({ error: 'User not found' });
   }
   ```

3. **Don't log with `console.error` directly**
   ```typescript
   // ❌ BAD
   console.error('Error:', error);

   // ✅ GOOD
   logError('Context', error, { additionalInfo });
   ```

4. **Don't throw generic errors**
   ```typescript
   // ❌ BAD
   throw new Error('Something went wrong');

   // ✅ GOOD
   throw createError.internal('Database connection failed');
   ```

## Migration Checklist

When updating existing routes to use the new error handling:

- [ ] Import `asyncHandler`, `createError`, `logError` from error-handler
- [ ] Wrap async route handlers with `asyncHandler()`
- [ ] Replace manual error responses with `throw createError.*()`
- [ ] Remove try-catch blocks (asyncHandler handles this)
- [ ] Replace `console.error()` with `logError()`
- [ ] Test route with valid and invalid inputs
- [ ] Verify error responses match expected format

## Example Files

See these files for complete reference implementations:

- **Routes**: [`src/routes/memorials.ts`](./src/routes/memorials.ts) - Full CRUD with standardized errors
- **Middleware**: [`src/middleware/authorization.ts`](./src/middleware/authorization.ts) - Middleware with error handling
- **Error Handler**: [`src/middleware/error-handler.ts`](./src/middleware/error-handler.ts) - Error utilities

## Testing Error Handling

### Test 404 Errors
```bash
curl http://localhost:3000/api/memorials/invalid-id
```

Expected response:
```json
{
  "error": "Memorial not found",
  "statusCode": 404,
  "timestamp": "2025-12-08T23:00:00.000Z"
}
```

### Test 401 Errors
```bash
curl http://localhost:3000/api/memorials/mine
```

Expected response:
```json
{
  "error": "Authentication required. Please log in.",
  "statusCode": 401,
  "timestamp": "2025-12-08T23:00:00.000Z"
}
```

### Test 409 Errors
```bash
curl -X POST http://localhost:3000/api/memorials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"deceasedName": "Existing Name", "birthDate": "1950-01-01"}'
```

Expected response:
```json
{
  "error": "A memorial with this name and date already exists",
  "statusCode": 409,
  "timestamp": "2025-12-08T23:00:00.000Z"
}
```

## Security Considerations

- **Production**: Only generic error messages for 5xx errors (no stack traces)
- **Development**: Detailed error messages with stack traces for debugging
- **No Sensitive Data**: Error responses never include user data, database details, or internal paths
- **Consistent Format**: All errors follow the same structure regardless of source

## FAQ

**Q: What if I need custom error messages?**
A: Pass a custom message to any error creator:
```typescript
throw createError.badRequest('Email format is invalid. Expected: user@domain.com');
```

**Q: How do I handle database errors?**
A: Let `asyncHandler` catch them automatically. They'll be logged with full details server-side and return a generic message to the client.

**Q: Can I still use try-catch for specific error handling?**
A: Yes, but only when you need custom logic for specific errors:
```typescript
router.post('/items', asyncHandler(async (req, res) => {
  try {
    const item = await riskyOperation();
  } catch (error) {
    if (error.code === 'SPECIFIC_CODE') {
      throw createError.conflict('Specific error message');
    }
    throw error; // Re-throw to let asyncHandler handle it
  }
}));
```

**Q: How do I test error handling locally?**
A: Set `NODE_ENV=development` to see full error details including stack traces.

---

## Summary

The standardized error handling system provides:
- ✅ Consistent error responses
- ✅ Automatic error logging
- ✅ Security (no info leakage)
- ✅ Clean, simple code
- ✅ Better developer experience

Always use `asyncHandler` + `createError` + `logError` for all routes and middleware.
