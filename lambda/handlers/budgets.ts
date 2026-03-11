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

export const budgetsHandler = {
  GET: async (
    event: APIGatewayProxyEvent,
    prisma: PrismaClient,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const user = (event as any).user;
      const { holidayId } = event.queryStringParameters || {};

      const whereClause: any = {
        createdBy: user.sub,
      };

      if (holidayId) {
        whereClause.holidayId = holidayId;
      }

      const budgets = await prisma.budget.findMany({
        where: whereClause,
        include: {
          transactions: true,
          holiday: true,
        },
      });

      return createResponse(200, budgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      return createResponse(500, { error: 'Failed to fetch budgets' });
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

      const budgetData = JSON.parse(event.body);
      const user = (event as any).user;

      const budget = await prisma.budget.create({
        data: {
          ...budgetData,
          createdBy: user.sub,
        },
        include: {
          transactions: true,
          holiday: true,
        },
      });

      return createResponse(201, budget);
    } catch (error) {
      console.error('Error creating budget:', error);
      return createResponse(500, { error: 'Failed to create budget' });
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

      const budgetData = JSON.parse(event.body);
      const user = (event as any).user;
      const budgetId = event.pathParameters?.id;

      if (!budgetId) {
        return createResponse(400, { error: 'Budget ID is required' });
      }

      const budget = await prisma.budget.update({
        where: {
          id: budgetId,
          createdBy: user.sub, // Ensure user owns the budget
        },
        data: budgetData,
        include: {
          transactions: true,
          holiday: true,
        },
      });

      return createResponse(200, budget);
    } catch (error) {
      console.error('Error updating budget:', error);
      return createResponse(500, { error: 'Failed to update budget' });
    }
  },

  DELETE: async (
    event: APIGatewayProxyEvent,
    prisma: PrismaClient,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const user = (event as any).user;
      const budgetId = event.pathParameters?.id;

      if (!budgetId) {
        return createResponse(400, { error: 'Budget ID is required' });
      }

      await prisma.budget.delete({
        where: {
          id: budgetId,
          createdBy: user.sub,
        },
      });

      return createResponse(204, {});
    } catch (error) {
      console.error('Error deleting budget:', error);
      return createResponse(500, { error: 'Failed to delete budget' });
    }
  },

  getTransactions: async (
    event: APIGatewayProxyEvent,
    prisma: PrismaClient,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const user = (event as any).user;
      const { budgetId } = event.queryStringParameters || {};

      const whereClause: any = {
        createdBy: user.sub,
      };

      if (budgetId) {
        whereClause.budgetId = budgetId;
      }

      const transactions = await prisma.budgetTransaction.findMany({
        where: whereClause,
        include: {
          budget: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      return createResponse(200, transactions);
    } catch (error) {
      console.error('Error fetching budget transactions:', error);
      return createResponse(500, { error: 'Failed to fetch transactions' });
    }
  },

  createTransaction: async (
    event: APIGatewayProxyEvent,
    prisma: PrismaClient,
  ): Promise<APIGatewayProxyResult> => {
    try {
      if (!event.body) {
        return createResponse(400, { error: 'Request body is required' });
      }

      const transactionData = JSON.parse(event.body);
      const user = (event as any).user;

      const transaction = await prisma.budgetTransaction.create({
        data: {
          ...transactionData,
          createdBy: user.sub,
        },
        include: {
          budget: true,
        },
      });

      return createResponse(201, transaction);
    } catch (error) {
      console.error('Error creating budget transaction:', error);
      return createResponse(500, { error: 'Failed to create transaction' });
    }
  },
};
