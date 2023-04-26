import * as AWS from 'aws-sdk';

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { Flags, getFeatureFlags, headers, randomErrors } from '../../shared';
import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger';
import {
  MetricUnits,
  Metrics,
  logMetrics,
} from '@aws-lambda-powertools/metrics';
import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';

import { LogLevel } from '@aws-lambda-powertools/logger/lib/types';
import { config } from '../../config';
import middy from '@middy/core';

type Order = {
  id: string;
  quantity: number;
  productId: string;
  storeId: string;
  created: string;
  type: string;
};

const { logLevel, logSampleRate, logEvent } = config.get('shared.functions');

const logger = new Logger({
  serviceName: 'list-orders',
  logLevel: logLevel as LogLevel,
  sampleRateValue: logSampleRate,
});

const tracer = new Tracer();
const metrics = new Metrics();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const listOrdersHandler: APIGatewayProxyHandler =
  async (): Promise<APIGatewayProxyResult> => {
    try {
      logger.info('started');

      // get the config values from process env
      const application = config.get('appConfig.appConfigApplicationId');
      const environment = config.get('appConfig.appConfigEnvironmentId');
      const configuration = config.get('appConfig.appConfigConfigurationId');
      const opsLimitListOrdersResults = config.get('flags.limitOrdersList');
      const randomErrorsEnabled = config.get('shared.randomErrorsEnabled');
      const ordersTable = config.get('tableName');

      // get feature flags from appconfig
      const flags: Flags | Record<string, unknown> = await getFeatureFlags(
        application,
        environment,
        configuration,
        [opsLimitListOrdersResults]
      );

      const flag = flags as Flags['opsLimitListOrdersResults'];

      logger.info(`feature flags: ${JSON.stringify(flags)}`);

      // if we have this enabled it will sometimes randomly throw errors
      // which helps us test our progressive deployments
      randomErrors(randomErrorsEnabled);

      logger.info(`get the orders from the database`);

      const params: AWS.DynamoDB.DocumentClient.ScanInput = {
        TableName: ordersTable,
      };

      // note: for this demo we will use a simple scan
      const { Items } = await dynamoDb.scan(params).promise();

      let orders: Order[] = !Items
        ? []
        : Items?.filter((item) => item.type === 'Orders').map((item) => {
            return {
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              storeId: item.storeId,
              created: item.created,
              type: item.type,
            };
          });

      // we have an operational feature flag that limits the orders returned
      // note: this is for the article only and we would not be performing a full scan typically like this
      if (flag.enabled) {
        console.error(
          `opsLimitListOrdersResults enabled so limiting results to ${flag.limit}`
        );
        orders = orders.slice(0, flag.limit);
      }

      // we create the metric for success
      metrics.addMetric('ListOrdersSuccess', MetricUnits.Count, 1);

      // api gateway needs us to return this body (stringified) and the status code
      return {
        statusCode: 200,
        body: JSON.stringify(orders),
        headers,
      };
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) errorMessage = error.message;
      logger.error(errorMessage);

      // we create the metric for failure
      metrics.addMetric('ListOrdersError', MetricUnits.Count, 1);

      return {
        body: JSON.stringify(errorMessage),
        statusCode: 400,
        headers,
      };
    }
  };

export const handler = middy(listOrdersHandler)
  .use(
    injectLambdaContext(logger, {
      logEvent: logEvent.toLowerCase() === 'true' ? true : false,
    })
  )
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));
