import * as dotenv from 'dotenv';

import { Region, Stage } from '../../types';

import { EnvironmentConfig } from '../pipeline-types/pipeline-types';

dotenv.config();

export const environments: Record<Stage, EnvironmentConfig> = {
  // allow developers to spin up a quick branch for a given PR they are working on e.g. pr-124
  // this is done with a npm run develop, not through the pipeline, and uses the values in .env
  [Stage.develop]: {
    env: {
      account:
        process.env.ACCOUNT || (process.env.CDK_DEFAULT_ACCOUNT as string),
      region: process.env.REGION || (process.env.CDK_DEFAULT_REGION as string),
    },
    stateful: {
      bucketName:
        `serverless-pro-${process.env.PR_NUMBER}-bucket`.toLowerCase(),
      assetsBucketName:
        `serverless-pro-${process.env.PR_NUMBER}-canary-bucket`.toLowerCase(),
    },
    stateless: {
      lambdaMemorySize: parseInt(process.env.LAMBDA_MEM_SIZE || '128'),
      canaryNotificationEmail: process.env.NOTIFICATION_EMAIL as string,
      randomErrorsEnabled: process.env.RANDOM_ERRORS_ENABLED || 'false',
    },
    client: {
      bucketName:
        `serverless-pro-client-${process.env.PR_NUMBER}-bucket`.toLowerCase(),
    },
    shared: {
      domainName: process.env.DOMAIN_NAME as string,
      domainCertificateArn: process.env.DOMAIN_CERT_ARN as string,
      appConfigLambdaLayerArn: process.env
        .APP_CONFIG_LAMBDA_LAYER_ARN as string,
      powerToolsMetricsNamespace: process.env
        .POWERTOOLS_METRICS_NAMESPACE as string,
      powerToolServiceName: process.env.POWERTOOLS_SERVICE_NAME as string,
    },
    stageName: process.env.PR_NUMBER || Stage.develop,
  },
  [Stage.featureDev]: {
    env: {
      account: '123456789123',
      region: Region.dublin,
    },
    stateful: {
      bucketName: 'serverless-pro-feature-dev-bucket',
      assetsBucketName:
        `serverless-pro-feature-dev-canary-bucket`.toLowerCase(),
    },
    stateless: {
      lambdaMemorySize: 128,
      canaryNotificationEmail: 'your-email@gmail.com',
      randomErrorsEnabled: 'false',
    },
    client: {
      bucketName: 'serverless-pro-client-feature-dev-bucket',
    },
    shared: {
      domainName: 'your-domain.co.uk',
      domainCertificateArn:
        'arn:aws:acm:us-east-1:123456789123:certificate/3c0a6045-j786-iu87-rt45-74e87b1e6099',
      appConfigLambdaLayerArn:
        'arn:aws:lambda:eu-west-1:434848589818:layer:AWS-AppConfig-Extension-Arm64:46',
      powerToolServiceName: 'serverless-pro-orders-service-feature-dev',
      powerToolsMetricsNamespace: 'ServerlessProFeatureDev',
    },
    stageName: Stage.featureDev,
  },
  [Stage.staging]: {
    env: {
      account: '123456789123',
      region: Region.dublin,
    },
    stateful: {
      bucketName: 'serverless-pro-staging-bucket',
      assetsBucketName: `serverless-pro-staging-canary-bucket`.toLowerCase(),
    },
    stateless: {
      lambdaMemorySize: 1024,
      canaryNotificationEmail: 'your-email@gmail.com',
      randomErrorsEnabled: 'false',
    },
    client: {
      bucketName: 'serverless-pro-client-staging-bucket',
    },
    shared: {
      domainName: 'your-domain.co.uk',
      domainCertificateArn:
        'arn:aws:acm:us-east-1:123456789123:certificate/3c0a6045-j786-iu87-rt45-74e87b1e6099',
      appConfigLambdaLayerArn:
        'arn:aws:lambda:eu-west-1:434848589818:layer:AWS-AppConfig-Extension-Arm64:46',
      powerToolServiceName: 'serverless-pro-orders-service-staging',
      powerToolsMetricsNamespace: 'ServerlessProStaging',
    },
    stageName: Stage.staging,
  },
  [Stage.prod]: {
    env: {
      account: '123456789123',
      region: Region.dublin,
    },
    stateful: {
      bucketName: 'serverless-pro-prod-bucket',
      assetsBucketName: `serverless-pro-prod-canary-bucket`.toLowerCase(),
    },
    stateless: {
      lambdaMemorySize: 1024,
      canaryNotificationEmail: 'your-email@gmail.com',
      randomErrorsEnabled: 'false',
    },
    client: {
      bucketName: 'serverless-pro-client-prod-bucket',
    },
    shared: {
      domainName: 'your-domain.co.uk',
      domainCertificateArn:
        'arn:aws:acm:us-east-1:123456789123:certificate/3c0a6045-j786-iu87-rt45-74e87b1e6099',
      appConfigLambdaLayerArn:
        'arn:aws:lambda:eu-west-1:434848589818:layer:AWS-AppConfig-Extension-Arm64:46',
      powerToolServiceName: 'serverless-pro-orders-service-prod',
      powerToolsMetricsNamespace: 'ServerlessProProd',
    },
    stageName: Stage.prod,
  },
};
