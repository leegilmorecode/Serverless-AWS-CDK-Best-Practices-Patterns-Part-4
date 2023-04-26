import * as apigw from 'aws-cdk-lib/aws-apigateway';

import { Construct } from 'constructs';

interface ApiProps extends Pick<apigw.RestApiProps, 'description' | 'deploy'> {
  /**
   * The stage name which the api is being used with
   */
  stageName: string;
  /**
   * The api description
   */
  description: string;
  /**
   * Whether or not to deploy the api
   */
  deploy: boolean;
}

type FixedApiProps = Omit<apigw.RestApiProps, 'description' | 'deploy'>;

export class Api extends Construct {
  public readonly api: apigw.RestApi;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const fixedProps: FixedApiProps = {
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowCredentials: true,
        allowMethods: ['OPTIONS', 'POST', 'GET'],
        allowHeaders: ['*'],
      },
      endpointTypes: [apigw.EndpointType.REGIONAL],
      cloudWatchRole: true,
      deployOptions: {
        stageName: props.stageName,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
      },
    };

    this.api = new apigw.RestApi(this, id + 'Api', {
      // fixed props
      ...fixedProps,
      // custom props
      description: props.description
        ? props.description
        : `Serverless Pro API ${props.stageName}`,
      deploy: props.deploy ? props.deploy : true,
    });
  }
}
