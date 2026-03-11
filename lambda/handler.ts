import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { JWTVerifier } from './lib/auth';

// Import your existing API handlers (we'll adapt them)
import { usersHandler } from './handlers/users';
import { budgetsHandler } from './handlers/budgets';
import { giftsHandler } from './handlers/gifts';
import { contactsHandler } from './handlers/contacts';
import { cardsHandler } from './handlers/cards';
import { accountsHandler } from './handlers/accounts';
import { invitesHandler } from './handlers/invites';
import { sharesHandler } from './handlers/shares';

// Global Prisma instance (reuse across lambda invocations)
let prisma: PrismaClient;

// Initialize Prisma
function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

// Route mapping
const routes: {
  [key: string]: (
    event: APIGatewayProxyEvent,
    prisma: PrismaClient,
  ) => Promise<APIGatewayProxyResult>;
} = {
  // Users routes
  'GET /api/users': usersHandler.GET,
  'POST /api/users': usersHandler.POST,
  'PUT /api/users': usersHandler.PUT,
  'DELETE /api/users': usersHandler.DELETE,

  'GET /api/users/me': usersHandler.getMe,
  'PUT /api/users/me': usersHandler.updateMe,
  'POST /api/users/setup': usersHandler.setup,

  // Budgets routes
  'GET /api/budgets': budgetsHandler.GET,
  'POST /api/budgets': budgetsHandler.POST,
  'PUT /api/budgets': budgetsHandler.PUT,
  'DELETE /api/budgets': budgetsHandler.DELETE,

  // Budget transactions
  'GET /api/budget-transactions': budgetsHandler.getTransactions,
  'POST /api/budget-transactions': budgetsHandler.createTransaction,

  // Gifts routes
  'GET /api/gifts': giftsHandler.GET,
  'POST /api/gifts': giftsHandler.POST,
  'PUT /api/gifts': giftsHandler.PUT,
  'DELETE /api/gifts': giftsHandler.DELETE,

  // Contacts routes
  'GET /api/contacts': contactsHandler.GET,
  'POST /api/contacts': contactsHandler.POST,
  'PUT /api/contacts': contactsHandler.PUT,
  'DELETE /api/contacts': contactsHandler.DELETE,

  // Cards routes
  'GET /api/cards': cardsHandler.GET,
  'POST /api/cards': cardsHandler.POST,
  'PUT /api/cards': cardsHandler.PUT,
  'DELETE /api/cards': cardsHandler.DELETE,

  // Accounts routes
  'GET /api/accounts': accountsHandler.GET,
  'POST /api/accounts': accountsHandler.POST,
  'PUT /api/accounts': accountsHandler.PUT,
  'DELETE /api/accounts': accountsHandler.DELETE,

  // Invites routes
  'GET /api/invites': invitesHandler.GET,
  'POST /api/invites': invitesHandler.POST,
  'PUT /api/invites': invitesHandler.PUT,
  'DELETE /api/invites': invitesHandler.DELETE,

  // Shares routes
  'GET /api/shares': sharesHandler.GET,
  'POST /api/shares': sharesHandler.POST,
  'PUT /api/shares': sharesHandler.PUT,
  'DELETE /api/shares': sharesHandler.DELETE,
};

// Helper function to create response
function createResponse(
  statusCode: number,
  body: any,
  headers: { [key: string]: string } = {},
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

// Auth middleware
async function authenticate(event: APIGatewayProxyEvent): Promise<any> {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header');
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token with Auth0
    const jwtVerifier = new JWTVerifier();
    const user = await jwtVerifier.verifyToken(token);

    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Authentication failed');
  }
}

// Main Lambda handler
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  // Set Lambda context to not wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, {});
    }

    // Get Prisma client
    const prismaClient = getPrismaClient();

    // Create route key
    const routeKey = `${event.httpMethod} ${event.path}`;
    console.log(`Processing route: ${routeKey}`);

    // Handle dynamic routes (with path parameters)
    let handler = routes[routeKey];
    if (!handler) {
      // Try to match dynamic routes
      const dynamicRoutes = Object.keys(routes).filter(
        route => route.includes('[') && route.includes(']'),
      );
      for (const route of dynamicRoutes) {
        const pattern = route.replace(/\[(\w+)\]/g, '([^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(routeKey)) {
          handler = routes[route];
          // Extract path parameters
          const matches = routeKey.match(regex);
          if (matches) {
            event.pathParameters = event.pathParameters || {};
            // Add extracted parameters to event
          }
          break;
        }
      }
    }

    if (!handler) {
      return createResponse(404, { error: 'Route not found' });
    }

    // Authenticate user (skip for public routes if any)
    try {
      const user = await authenticate(event);
      // Add user to event context
      (event as any).user = user;
    } catch (authError) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    // Execute handler
    const result = await handler(event, prismaClient);
    return result;
  } catch (error) {
    console.error('Lambda handler error:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
