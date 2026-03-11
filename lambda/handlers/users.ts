import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    },
    body: JSON.stringify(body),
  };
}

export const usersHandler = {
  GET: async (
    event: APIGatewayProxyEvent,
    prisma: PrismaClient,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          picture: true,
          isInDb: true,
          isFirstLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return createResponse(200, users);
    } catch (error) {
      console.error('Error fetching users:', error);
      return createResponse(500, { error: 'Failed to fetch users' });
    }
  },

  POST: async (
    event: APIGatewayProxyEvent,
    prisma: PrismaClient,
  ): Promise<APIGatewayProxyResult> => {
    try {
      if (!event.body) {
        return createResponse(400, { error: 'Request body is required' });
      }

      const userData = JSON.parse(event.body);
      const user = (event as any).user; // From authentication middleware

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          auth0Sub: user.sub,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          isInDb: true,
          isFirstLogin: false,
        },
      });

      return createResponse(201, newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      return createResponse(500, { error: 'Failed to create user' });
    }
  },

  PUT: async (
    event: APIGatewayProxyEvent,
    prisma: PrismaClient,
  ): Promise<APIGatewayProxyResult> => {
    try {
      if (!event.body) {
        return createResponse(400, { error: 'Request body is required' });
      }

      const userData = JSON.parse(event.body);
      const user = (event as any).user;
      const userId = event.pathParameters?.id || user.sub;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: userData,
      });

      return createResponse(200, updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      return createResponse(500, { error: 'Failed to update user' });
    }
  },

  DELETE: async (
    event: APIGatewayProxyEvent,
    prisma: PrismaClient,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const user = (event as any).user;
      const userId = event.pathParameters?.id || user.sub;

      await prisma.user.delete({
        where: { id: userId },
      });

      return createResponse(204, {});
    } catch (error) {
      console.error('Error deleting user:', error);
      return createResponse(500, { error: 'Failed to delete user' });
    }
  },

  getMe: async (
    event: APIGatewayProxyEvent,
    prisma: PrismaClient,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const user = (event as any).user;

      const currentUser = await prisma.user.findUnique({
        where: { auth0Sub: user.sub },
        include: {
          preferences: true,
        },
      });

      if (!currentUser) {
        return createResponse(404, { error: 'User not found' });
      }

      return createResponse(200, currentUser);
    } catch (error) {
      console.error('Error fetching current user:', error);
      return createResponse(500, { error: 'Failed to fetch user' });
    }
  },

  updateMe: async (
    event: APIGatewayProxyEvent,
    prisma: PrismaClient,
  ): Promise<APIGatewayProxyResult> => {
    try {
      if (!event.body) {
        return createResponse(400, { error: 'Request body is required' });
      }

      const userData = JSON.parse(event.body);
      const user = (event as any).user;

      const updatedUser = await prisma.user.update({
        where: { auth0Sub: user.sub },
        data: userData,
      });

      return createResponse(200, updatedUser);
    } catch (error) {
      console.error('Error updating current user:', error);
      return createResponse(500, { error: 'Failed to update user' });
    }
  },

  setup: async (
    event: APIGatewayProxyEvent,
    prisma: PrismaClient,
  ): Promise<APIGatewayProxyResult> => {
    try {
      if (!event.body) {
        return createResponse(400, { error: 'Request body is required' });
      }

      const setupData = JSON.parse(event.body);
      const user = (event as any).user;

      // Create user with preferences
      const newUser = await prisma.user.create({
        data: {
          auth0Sub: user.sub,
          email: setupData.email,
          name: setupData.name,
          picture: setupData.picture,
          isInDb: true,
          isFirstLogin: false,
          preferences: {
            create: setupData.preferences || {},
          },
        },
        include: {
          preferences: true,
        },
      });

      return createResponse(201, newUser);
    } catch (error) {
      console.error('Error setting up user:', error);
      return createResponse(500, { error: 'Failed to setup user' });
    }
  },
};
