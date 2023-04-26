import * as AWS from 'aws-sdk';

import {
  APIGatewayEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
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
import { v4 as uuid } from 'uuid';

type Order = {
  id: string;
  quantity: number;
  productId: string;
  storeId: string;
  created: string;
  type: string;
};

type Store = {
  id: string;
  storeCode: string;
  storeName: string;
  type: string;
};
type Stores = Store[];

const { logLevel, logSampleRate, logEvent } = config.get('shared.functions');

const logger = new Logger({
  serviceName: 'create-order',
  logLevel: logLevel as LogLevel,
  sampleRateValue: logSampleRate,
});

const tracer = new Tracer();
const metrics = new Metrics();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

export const createOrderHandler: APIGatewayProxyHandler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('started');

    if (!event.body) {
      throw new Error('no order supplied');
    }

    // get the config values from process env
    const application = config.get('appConfig.appConfigApplicationId');
    const environment = config.get('appConfig.appConfigEnvironmentId');
    const configuration = config.get('appConfig.appConfigConfigurationId');
    const { preventCreateOrder, checkCreateOrderQuantity } =
      config.get('flags');
    const randomErrorsEnabled = config.get('shared.randomErrorsEnabled');
    const ordersTable = config.get('tableName');
    const bucketName = config.get('bucketname');

    // get feature flags from appconfig
    const flags: Flags | Record<string, unknown> = (await getFeatureFlags(
      application,
      environment,
      configuration,
      [preventCreateOrder, checkCreateOrderQuantity]
    )) as Flags;

    logger.info(`feature flags: ${JSON.stringify(flags)}`);

    // we use a flag here to prevent the creation of new orders from an operational sense
    if (flags.opsPreventCreateOrders.enabled) {
      logger.error(
        `opsPreventCreateOrders enabled so preventing new order creation`
      );
      throw new Error(
        'The creation of orders is currently on hold for maintenance'
      );
    }

    // if we have this enabled it will sometimes randomly throw errors
    randomErrors(randomErrorsEnabled);

    // we take the body (payload) from the event coming through from api gateway
    const item = JSON.parse(event.body);

    // we wont validate the input with this being a basic example only
    const createdDateTime = new Date().toISOString();

    const order: Order = {
      id: uuid(),
      type: 'Orders',
      created: createdDateTime,
      ...item,
    };

    // we use a flag here for a new release which checks the quantity of the order
    // alongside our progressive deployments to see how customers find this release
    if (
      flags.releaseCheckCreateOrderQuantity.enabled &&
      order.quantity >= flags.releaseCheckCreateOrderQuantity.limit
    ) {
      logger.error(
        `releaseCheckCreateOrderQuantity enabled so limiting quantities`
      );
      throw new Error(
        `The quantity of ${order.quantity} is above the limit of ${flags.releaseCheckCreateOrderQuantity.limit}`
      );
    }

    logger.info(`order: ${JSON.stringify(order)}`);

    // we validate that the order is for a real store that we have in config
    const getParams: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: ordersTable,
      IndexName: 'storeIndex',
      KeyConditionExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':type': 'Stores',
      },
    };

    const { Items: items } = await dynamoDb.query(getParams).promise();
    const stores = items as Stores;

    if (!stores.find((item) => item.id === order.storeId)) {
      throw new Error(`${order.storeId} is not found`);
    }

    const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: ordersTable,
      Item: order,
    };

    logger.info(`create order: ${JSON.stringify(order)}`);

    await dynamoDb.put(params).promise();

    // create a text invoice and push to s3 bucket
    const bucketParams: AWS.S3.PutObjectRequest = {
      Bucket: bucketName,
      Key: `${order.id}-invoice.txt`,
      Body: JSON.stringify(order),
    };

    await s3.upload(bucketParams, {}).promise();

    logger.info(`invoice written to ${bucketName}`);

    // we create the metric for success
    metrics.addMetric('OrderCreatedSuccess', MetricUnits.Count, 1);

    // api gateway needs us to return this body (stringified) and the status code
    return {
      body: JSON.stringify(order),
      statusCode: 201,
      headers,
    };
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    logger.error(errorMessage);

    // we create the metric for failure
    metrics.addMetric('OrderCreatedError', MetricUnits.Count, 1);

    return {
      body: JSON.stringify(errorMessage),
      statusCode: 400,
      headers,
    };
  }
};

export const handler = middy(createOrderHandler)
  .use(
    injectLambdaContext(logger, {
      logEvent: logEvent.toLowerCase() === 'true' ? true : false,
    })
  )
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));
