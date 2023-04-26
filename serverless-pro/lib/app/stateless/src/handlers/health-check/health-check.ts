import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger';
import {
  MetricUnits,
  Metrics,
  logMetrics,
} from '@aws-lambda-powertools/metrics';

import { headers } from '../../shared';
import middy from '@middy/core';

const logger = new Logger({ serviceName: 'health-check' });
const metrics = new Metrics();

export const healthCheckHandler: APIGatewayProxyHandler =
  async (): Promise<APIGatewayProxyResult> => {
    try {
      logger.info('success');
      return {
        statusCode: 200,
        body: JSON.stringify('success'),
        headers,
      };
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) errorMessage = error.message;
      logger.error(errorMessage);

      // we create the metric for failure
      metrics.addMetric('HealthCheckError', MetricUnits.Count, 1);

      return {
        body: JSON.stringify(errorMessage),
        statusCode: 400,
        headers,
      };
    }
  };

export const handler = middy(healthCheckHandler)
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics));
