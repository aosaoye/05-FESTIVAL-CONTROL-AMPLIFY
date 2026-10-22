import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const rawClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.TABLE_NAME || 'FestivalEvents';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

interface APIGatewayEvent {
  httpMethod?: string;
  path?: string;
  pathParameters?: Record<string, string> | null;
  body?: string | null;
  requestContext?: {
    http?: {
      method?: string;
      path?: string;
    };
  };
}

export const handler = async (event: APIGatewayEvent) => {
  // Support both REST API v1 (event.httpMethod) and HTTP API v2 (event.requestContext.http.method)
  const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
  const path = event.path || event.requestContext?.http?.path || '/events';
  const id = event.pathParameters?.id || path.split('/').filter(Boolean).pop();

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // GET /events (List all)
    if (method === 'GET' && (!id || id === 'events')) {
      const result = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
        })
      );

      const items = (result.Items || []).sort((a: any, b: any) =>
        (a.time || '').localeCompare(b.time || '')
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(items),
      };
    }

    // GET /events/{id} (Get single)
    if (method === 'GET' && id && id !== 'events') {
      const result = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { id },
        })
      );

      if (!result.Item) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ message: `Evento ${id} no encontrado` }),
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.Item),
      };
    }

    // POST /events (Create)
    if (method === 'POST') {
      const payload = event.body ? JSON.parse(event.body) : {};

      if (!payload.artist || !payload.space || !payload.time) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Campos requeridos: artist, space, time' }),
        };
      }

      const item = {
        id: payload.id || 'EVT-' + Math.floor(100 + Math.random() * 900),
        artist: String(payload.artist).trim().toUpperCase(),
        space: payload.space,
        time: payload.time,
        status: payload.status || 'CONFIRMED',
        createdAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
        })
      );

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(item),
      };
    }

    // PUT /events/{id} (Update)
    if (method === 'PUT' && id) {
      const payload = event.body ? JSON.parse(event.body) : {};

      const updateExpression: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      if (payload.artist !== undefined) {
        updateExpression.push('#art = :art');
        expressionAttributeNames['#art'] = 'artist';
        expressionAttributeValues[':art'] = String(payload.artist).trim().toUpperCase();
      }
      if (payload.space !== undefined) {
        updateExpression.push('#sp = :sp');
        expressionAttributeNames['#sp'] = 'space';
        expressionAttributeValues[':sp'] = payload.space;
      }
      if (payload.time !== undefined) {
        updateExpression.push('#tm = :tm');
        expressionAttributeNames['#tm'] = 'time';
        expressionAttributeValues[':tm'] = payload.time;
      }
      if (payload.status !== undefined) {
        updateExpression.push('#st = :st');
        expressionAttributeNames['#st'] = 'status';
        expressionAttributeValues[':st'] = payload.status;
      }

      if (updateExpression.length === 0) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'No hay campos para actualizar' }),
        };
      }

      const result = await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id },
          UpdateExpression: 'SET ' + updateExpression.join(', '),
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: 'ALL_NEW',
        })
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.Attributes),
      };
    }

    // DELETE /events/{id} (Delete)
    if (method === 'DELETE' && id) {
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { id },
        })
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: `Evento ${id} eliminado`, id }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: `Método ${method} no permitido` }),
    };
  } catch (err: any) {
    console.error('Error en Lambda DynamoDB:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Error interno en el servidor DynamoDB',
        error: err.message,
      }),
    };
  }
};
