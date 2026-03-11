import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handler } from '../handler';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    budget: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

// Mock JWT verification
jest.mock('../lib/auth', () => ({
  JWTVerifier: jest.fn().mockImplementation(() => ({
    verifyToken: jest.fn().mockResolvedValue({
      sub: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    }),
  })),
}));

describe('Lambda Handler', () => {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
    memoryLimitInMB: '512',
    awsRequestId: 'test-request-id',
    logGroupName: 'test-log-group',
    logStreamName: 'test-log-stream',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };

  const createEvent = (
    httpMethod: string,
    path: string,
    body?: any,
    headers: any = {},
  ): APIGatewayProxyEvent => ({
    httpMethod,
    path,
    body: body ? JSON.stringify(body) : null,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
      ...headers,
    },
    queryStringParameters: null,
    pathParameters: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      httpMethod,
      path,
      stage: 'test',
      requestId: 'test-request',
      identity: {
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
      },
    } as any,
    resource: path,
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
  });

  beforeEach(() => {
    process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';
    process.env.AUTH0_DOMAIN = 'test.auth0.com';
    process.env.AUTH0_AUDIENCE = 'https://test.api';
  });

  it('should handle CORS preflight requests', async () => {
    const event = createEvent('OPTIONS', '/api/users');

    const result: APIGatewayProxyResult = await handler(event, mockContext);

    expect(result.statusCode).toBe(200);
    expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
    expect(result.headers?.['Access-Control-Allow-Methods']).toContain('GET');
  });

  it('should handle GET /api/users', async () => {
    const event = createEvent('GET', '/api/users');

    const result: APIGatewayProxyResult = await handler(event, mockContext);

    expect(result.statusCode).toBe(200);
    expect(result.headers?.['Content-Type']).toBe('application/json');
  });

  it('should return 404 for unknown routes', async () => {
    const event = createEvent('GET', '/api/unknown');

    const result: APIGatewayProxyResult = await handler(event, mockContext);

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Route not found');
  });

  it('should return 401 for requests without authorization', async () => {
    const event = createEvent('GET', '/api/users', null, { Authorization: '' });

    const result: APIGatewayProxyResult = await handler(event, mockContext);

    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Unauthorized');
  });

  it('should handle POST requests with body', async () => {
    const event = createEvent('POST', '/api/users', {
      name: 'John Doe',
      email: 'john@example.com',
    });

    const result: APIGatewayProxyResult = await handler(event, mockContext);

    expect(result.statusCode).toBe(201);
  });
});
