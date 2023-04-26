import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import * as codeDeploy from 'aws-cdk-lib/aws-codedeploy';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as synthetics from '@aws-cdk/aws-synthetics-alpha';

import {
  Api,
  ApiCloudFrontDistribution,
  CanaryRole,
  ProgressiveLambda,
  SyntheticCanary,
} from '../../constructs';
import { Aspects, CustomResource, RemovalPolicy } from 'aws-cdk-lib';

import { AwsSolutionsChecks } from 'cdk-nag';
import { Construct } from 'constructs';
import { Flags } from '../feature-flags/config/FeatureFlags';
import { NagSuppressions } from 'cdk-nag';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Stage } from '../../types';

export interface StatelessStackProps extends cdk.StackProps {
  env: {
    account: string;
    region: string;
  };
  table: dynamodb.Table;
  bucket: s3.Bucket;
  assetsBucket: s3.Bucket;
  stageName: string;
  lambdaMemorySize: number;
  domainName: string;
  canaryNotificationEmail: string;
  domainCertArn: string;
  appConfigLambdaLayerArn: string;
  randomErrorsEnabled: string;
  appConfigApplicationRef: string;
  appConfigEnvName: string;
  appConfigConfigurationProfileRef: string;
  appConfigEnvRef: string;
  powerToolServiceName: string;
  powerToolsMetricsNamespace: string;
}

export class StatelessStack extends cdk.Stack {
  public readonly apiEndpointUrl: cdk.CfnOutput;
  public readonly healthCheckUrl: cdk.CfnOutput;
  private readonly ordersApi: apigw.RestApi;
  private readonly cloudFrontDistribution: cloudFront.Distribution;

  constructor(scope: Construct, id: string, props: StatelessStackProps) {
    super(scope, id, props);

    const { table, bucket } = props;
    const apiSubDomain =
      `api-${props.stageName}.${props.domainName}`.toLowerCase();
    const websiteSubDomain =
      `https://${props.stageName}.${props.domainName}`.toLowerCase();

    // create the rest api
    this.ordersApi = new Api(this, 'Api', {
      description: `Serverless Pro API ${props.stageName}`,
      stageName: props.stageName,
      deploy: true,
    }).api;

    // create the rest api resources
    const orders: apigw.Resource = this.ordersApi.root.addResource('orders');
    const healthCheck: apigw.Resource =
      this.ordersApi.root.addResource('health-checks');

    const order: apigw.Resource = orders.addResource('{id}');

    // create the cloudfront distribution
    this.cloudFrontDistribution = new ApiCloudFrontDistribution(
      this,
      'Distribution',
      {
        stageName: props.stageName,
        domainCertArn: props.domainCertArn,
        api: this.ordersApi,
        apiSubDomain: apiSubDomain,
        enabled: true,
        priceClass: cloudFront.PriceClass.PRICE_CLASS_100,
        comment: `${props.stageName} api web distribution`,
      }
    ).distribution;

    // get the hosted zone based on domain name lookup
    const zone: route53.IHostedZone = route53.HostedZone.fromLookup(
      this,
      'HostedZone',
      {
        domainName: `${props.domainName}`,
      }
    );

    // create the alias record for the api for this particular stage
    // e.g. api-featuredev.your-domain.co.uk/orders/
    const subDomainRecord: route53.ARecord = new route53.ARecord(
      this,
      'Alias',
      {
        zone,
        recordName: `api-${props.stageName}`,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(this.cloudFrontDistribution)
        ),
      }
    );
    subDomainRecord.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // create a new application for the progressive deployments
    const application = new codeDeploy.LambdaApplication(
      this,
      'CodeDeployApplication',
      {
        applicationName: props.stageName,
      }
    );

    // create a lambda progressive deployment topic
    const lambdaDeploymentTopic: sns.Topic = new sns.Topic(
      this,
      'LambdaDeploymentTopic',
      {
        displayName: `${props.stageName} Lambda Deployment Topic`,
        topicName: `${props.stageName}LambdaDeploymentTopic`,
      }
    );
    lambdaDeploymentTopic.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // send an email when the lambda progressive deployment topic is in error state
    const lambdaDeploymentSubscriptions = lambdaDeploymentTopic.addSubscription(
      new subscriptions.EmailSubscription(props.canaryNotificationEmail)
    );
    lambdaDeploymentSubscriptions.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // get the correct lambda layer extension for our region (props)
    const appConfigLambdaLayerExtension =
      lambda.LayerVersion.fromLayerVersionArn(
        this,
        'AppConfigExtension',
        props.appConfigLambdaLayerArn
      );

    // create the typed feature flags
    const createOrderAllowList: Flags = 'createOrderAllowList';
    const opsPreventCreateOrders: Flags = 'opsPreventCreateOrders';
    const releaseCheckCreateOrderQuantity: Flags =
      'releaseCheckCreateOrderQuantity';
    const opsLimitListOrdersResults: Flags = 'opsLimitListOrdersResults';

    // create the app config specific config shared properties
    const appConfigEnvironment = {
      APPCONFIG_APPLICATION_ID: props.appConfigApplicationRef,
      APPCONFIG_ENVIRONMENT: props.appConfigEnvName,
      APPCONFIG_ENVIRONMENT_ID: props.appConfigEnvRef,
      APPCONFIG_CONFIGURATION_ID: props.appConfigConfigurationProfileRef,
      AWS_APPCONFIG_EXTENSION_POLL_INTERVAL_SECONDS: '30',
      AWS_APPCONFIG_EXTENSION_POLL_TIMEOUT_MILLIS: '3000',
      AWS_APPCONFIG_EXTENSION_HTTP_PORT: '2772',
      AWS_APPCONFIG_EXTENSION_PREFETCH_LIST: `/applications/${props.appConfigApplicationRef}/environments/${props.appConfigEnvRef}/configurations/${props.appConfigConfigurationProfileRef}`,
    };

    // create the lambda power tools specific config shared properties
    const lambdaPowerToolsConfig = {
      LOG_LEVEL: 'DEBUG',
      POWERTOOLS_LOGGER_LOG_EVENT: 'false',
      POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
      POWERTOOLS_METRICS_NAMESPACE: props.powerToolsMetricsNamespace,
      POWERTOOLS_SERVICE_NAME: props.powerToolServiceName,
    };

    // create the policy statement for accessing appconfig
    const appConfigRoleStatement = new iam.PolicyStatement({
      actions: [
        'appconfig:StartConfigurationSession',
        'appconfig:GetLatestConfiguration',
        'appConfig:GetConfiguration',
      ],
      resources: ['*'],
    });

    const { alias: createOrderLambdaAlias, lambda: createOrderLambda } =
      new ProgressiveLambda(this, 'CreateOrderLambda', {
        stageName: props.stageName,
        serviceName: props.powerToolServiceName,
        metricName: 'OrderCreatedError',
        namespace: props.powerToolsMetricsNamespace,
        tracing: lambda.Tracing.ACTIVE,
        logRetention: RetentionDays.ONE_DAY,
        architecture: lambda.Architecture.ARM_64,
        application,
        alarmEnabed: true,
        snsTopic: lambdaDeploymentTopic,
        timeout: cdk.Duration.seconds(10),
        retryAttempts: 0,
        deploymentConfig:
          codeDeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
        runtime: lambda.Runtime.NODEJS_16_X,
        layers: [appConfigLambdaLayerExtension],
        entry: path.join(
          __dirname,
          'src/handlers/create-order/create-order.ts'
        ),
        memorySize: props.lambdaMemorySize,
        handler: 'handler',
        bundling: {
          minify: true,
          externalModules: ['aws-sdk'],
          sourceMap: true,
        },
        environment: {
          TABLE_NAME: table.tableName,
          BUCKET_NAME: bucket.bucketName,
          RANDOM_ERRORS_ENABLED: props.randomErrorsEnabled,
          ...appConfigEnvironment,
          ...lambdaPowerToolsConfig,
          FLAG_CREATE_ORDER_ALLOW_LIST: createOrderAllowList,
          FLAG_PREVENT_CREATE_ORDERS: opsPreventCreateOrders,
          FLAG_CHECK_CREATE_ORDER_QUANTITY: releaseCheckCreateOrderQuantity,
        },
      });

    const { alias: getOrderLambdaAlias, lambda: getOrderLambda } =
      new ProgressiveLambda(this, 'GetOrderLambda', {
        stageName: props.stageName,
        serviceName: props.powerToolServiceName,
        metricName: 'GetOrderError',
        namespace: props.powerToolsMetricsNamespace,
        tracing: lambda.Tracing.ACTIVE,
        logRetention: RetentionDays.ONE_DAY,
        architecture: lambda.Architecture.ARM_64,
        application,
        alarmEnabed: true,
        snsTopic: lambdaDeploymentTopic,
        timeout: cdk.Duration.seconds(10),
        retryAttempts: 0,
        deploymentConfig:
          codeDeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, 'src/handlers/get-order/get-order.ts'),
        memorySize: props.lambdaMemorySize,
        handler: 'handler',
        layers: [appConfigLambdaLayerExtension],
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: ['aws-sdk'],
        },
        environment: {
          TABLE_NAME: table.tableName,
          RANDOM_ERRORS_ENABLED: props.randomErrorsEnabled,
          ...appConfigEnvironment,
          ...lambdaPowerToolsConfig,
        },
      });

    const { alias: listOrdersLambdaAlias, lambda: listOrdersLambda } =
      new ProgressiveLambda(this, 'ListOrdersLambda', {
        stageName: props.stageName,
        serviceName: props.powerToolServiceName,
        metricName: 'ListOrdersError',
        namespace: props.powerToolsMetricsNamespace,
        tracing: lambda.Tracing.ACTIVE,
        logRetention: RetentionDays.ONE_DAY,
        architecture: lambda.Architecture.ARM_64,
        application,
        alarmEnabed: true,
        snsTopic: lambdaDeploymentTopic,
        timeout: cdk.Duration.seconds(10),
        retryAttempts: 0,
        deploymentConfig:
          codeDeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, 'src/handlers/list-orders/list-orders.ts'),
        memorySize: props.lambdaMemorySize,
        handler: 'handler',
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: ['aws-sdk'],
        },
        layers: [appConfigLambdaLayerExtension],
        environment: {
          TABLE_NAME: table.tableName,
          RANDOM_ERRORS_ENABLED: props.randomErrorsEnabled,
          ...appConfigEnvironment,
          ...lambdaPowerToolsConfig,
          FLAG_LIMIT_LIST_ORDERS_RESULTS: opsLimitListOrdersResults,
        },
      });

    const healthCheckLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'HealthCheckLambda', {
        runtime: lambda.Runtime.NODEJS_16_X,
        logRetention: RetentionDays.ONE_DAY,
        entry: path.join(
          __dirname,
          'src/handlers/health-check/health-check.ts'
        ),
        memorySize: props.lambdaMemorySize,
        handler: 'handler',
        environment: {
          ...lambdaPowerToolsConfig,
        },
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: ['aws-sdk'],
        },
      });

    // add the app config role statements to the existing functions
    createOrderLambda.addToRolePolicy(appConfigRoleStatement);
    listOrdersLambda.addToRolePolicy(appConfigRoleStatement);
    getOrderLambda.addToRolePolicy(appConfigRoleStatement);

    // this is the custom resource which populates our table with initial master data
    const populateOrdersHandler: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'PopulateTableLambda', {
        runtime: lambda.Runtime.NODEJS_16_X,
        logRetention: RetentionDays.ONE_DAY,
        entry: path.join(
          __dirname,
          'src/handlers/populate-table-cr/populate-table-cr.ts'
        ),
        memorySize: props.lambdaMemorySize,
        handler: 'handler',
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: [
            'aws-sdk',
            '@aws-lambda-powertools/commons',
            '@aws-lambda-powertools/logger',
            '@aws-lambda-powertools/tracer',
            '@aws-lambda-powertools/metrics',
          ],
        },
      });

    // hook up the lambda functions to the api
    orders.addMethod(
      'POST',
      new apigw.LambdaIntegration(createOrderLambdaAlias, {
        proxy: true,
      })
    );

    orders.addMethod(
      'GET',
      new apigw.LambdaIntegration(listOrdersLambdaAlias, {
        proxy: true,
      })
    );

    order.addMethod(
      'GET',
      new apigw.LambdaIntegration(getOrderLambdaAlias, {
        proxy: true,
      })
    );

    healthCheck.addMethod(
      'GET',
      new apigw.LambdaIntegration(healthCheckLambda, {
        proxy: true,
      })
    );

    const provider: cr.Provider = new cr.Provider(
      this,
      'PopulateTableConfigCustomResource',
      {
        onEventHandler: populateOrdersHandler, // this lambda will be called on cfn deploy
        logRetention: logs.RetentionDays.ONE_DAY,
        providerFunctionName: `populate-orders-${props.stageName}-cr-lambda`,
      }
    );

    // use the custom resource provider
    new CustomResource(this, 'DbTableConfigCustomResource', {
      serviceToken: provider.serviceToken,
      properties: {
        tableName: props.table.tableName,
      },
    });

    // grant the relevant lambdas access to our dynamodb database
    table.grantReadData(getOrderLambda);
    table.grantReadWriteData(createOrderLambda);
    table.grantWriteData(populateOrdersHandler);
    table.grantReadData(listOrdersLambda);

    // grant the create order lambda access to the s3 bucket
    bucket.grantWrite(createOrderLambda);

    // we only use synthetics in the staging (gamma) or prod stages
    // https://pipelines.devops.aws.dev/application-pipeline/index.html
    if (props.stageName === Stage.staging || props.stageName === Stage.prod) {
      const canaryTopic: sns.Topic = new sns.Topic(this, 'CanaryAPITopic', {
        displayName: `${props.stageName} API Canary Topic`,
        topicName: `${props.stageName}ApiCanaryTopic`,
      });
      canaryTopic.applyRemovalPolicy(RemovalPolicy.DESTROY);

      const apiTopicSubscription = canaryTopic.addSubscription(
        new subscriptions.EmailSubscription(props.canaryNotificationEmail)
      );
      apiTopicSubscription.applyRemovalPolicy(RemovalPolicy.DESTROY);

      // create the role for both of our canaries
      const canaryRole = new CanaryRole(this, 'CanaryIamRole', {
        stageName: props.stageName,
        bucketArn: props.assetsBucket.bucketArn,
      });

      new SyntheticCanary(this, 'APICanary', {
        stageName: props.stageName,
        actionEnabled: true,
        snsTopic: canaryTopic,
        canaryName: `${props.stageName}-api-canary`,
        role: canaryRole,
        schedule: synthetics.Schedule.rate(cdk.Duration.minutes(60)),
        artifactsBucketLocation: {
          bucket: props.assetsBucket,
        },
        test: synthetics.Test.custom({
          code: synthetics.Code.fromAsset(
            path.join(__dirname, './src/canaries/api-canary')
          ),
          handler: 'index.handler',
        }),
        runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_9,
        environmentVariables: {
          APP_API_HOST: props.domainName,
          STAGE: props.stageName,
        },
      });

      new SyntheticCanary(this, 'VisualCanary', {
        stageName: props.stageName,
        actionEnabled: true,
        snsTopic: canaryTopic,
        canaryName: `${props.stageName}-visual-canary`,
        role: canaryRole,
        schedule: synthetics.Schedule.rate(cdk.Duration.minutes(60)),
        artifactsBucketLocation: {
          bucket: props.assetsBucket,
        },
        test: synthetics.Test.custom({
          code: synthetics.Code.fromAsset(
            path.join(__dirname, './src/canaries/visual-canary')
          ),
          handler: 'index.handler',
        }),
        runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_9,
        environmentVariables: {
          STAGE: props.stageName,
          WEBSITE_URL: websiteSubDomain,
        },
      });
    }

    // add our outputs
    const apiEndpoint = `api-${props.stageName}.${props.domainName}`;
    this.apiEndpointUrl = new cdk.CfnOutput(this, 'ApiEndpointOutput', {
      value: apiEndpoint,
      exportName: `api-endpoint-${props.stageName}`,
    });

    this.healthCheckUrl = new cdk.CfnOutput(this, 'healthCheckUrlOutput', {
      value: `${apiEndpoint}/health-checks`,
      exportName: `healthcheck-endpoint-${props.stageName}`,
    });

    // cdk nag check and suppressions
    Aspects.of(this).add(new AwsSolutionsChecks({ verbose: false }));
    NagSuppressions.addStackSuppressions(
      this,
      [
        {
          id: 'AwsSolutions-COG4',
          reason: `Rule suppression for 'The REST API stage is not associated with AWS WAFv2 web ACL'`,
        },
        {
          id: 'AwsSolutions-APIG3',
          reason: `Rule suppression for 'The REST API stage is not associated with AWS WAFv2 web ACL'`,
        },
        {
          id: 'AwsSolutions-APIG2',
          reason: `Rule suppression for 'The REST API does not have request validation enabled'`,
        },
        {
          id: 'AwsSolutions-IAM4',
          reason: `Rule suppression for 'The IAM user, role, or group uses AWS managed policies'`,
        },
        {
          id: 'AwsSolutions-APIG4',
          reason: `Rule suppression for 'The API does not implement authorization.'`,
        },
        {
          id: 'AwsSolutions-APIG1',
          reason: `Rule suppression for 'The API does not have access logging enabled'`,
        },
        {
          id: 'AwsSolutions-L1',
          reason: `Rule suppression for 'The non-container Lambda function is not configured to use the latest runtime version'`,
        },
        {
          id: 'AwsSolutions-IAM5',
          reason: `Rule suppression for 'The IAM entity contains wildcard permissions and does not have a cdk-nag rule suppression with evidence for those permission'`,
        },
        {
          id: 'AwsSolutions-CFR3',
          reason: `Rule suppression for 'The CloudFront distribution does not have access logging enabled'`,
        },
        {
          id: 'AwsSolutions-SNS2',
          reason: `Rule supression for 'The SNS Topic does not have server-side encryption enabled'`,
        },
        {
          id: 'AwsSolutions-SNS3',
          reason: `Rule supression for 'The SNS Topic does not require publishers to use SSL.'`,
        },
      ],
      true
    );
  }
}
