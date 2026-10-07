import type {APIGatewayProxyResultV2} from 'aws-lambda';

/** GET /v1/health: proves the TV → API Gateway → Lambda path works (PLAN.md Phase 0 exit). */
export const handler = async (): Promise<APIGatewayProxyResultV2> => ({
  statusCode: 200,
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({ok: true, service: 'nightlight-api', stage: process.env.STAGE ?? 'unknown'}),
});
