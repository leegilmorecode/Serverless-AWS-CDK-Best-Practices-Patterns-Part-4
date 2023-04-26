export interface EnvironmentConfig {
  env: {
    account: string;
    region: string;
  };
  stageName: string;
  stateful: {
    bucketName: string;
    assetsBucketName: string;
  };
  stateless: {
    lambdaMemorySize: number;
    canaryNotificationEmail: string;
    randomErrorsEnabled: string;
  };
  client: {
    bucketName: string;
  };
  shared: {
    domainName: string;
    domainCertificateArn: string;
    appConfigLambdaLayerArn: string;
    powerToolsMetricsNamespace: string;
    powerToolServiceName: string;
  };
}
