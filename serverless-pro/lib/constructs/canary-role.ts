import * as iam from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';

interface CanaryRoleProps {
  /**
   * The stage name which the api is being used with
   */
  stageName: string;
  /**
   * The bucket arn for the role to grant access to
   */
  bucketArn: string;
}

export class CanaryRole extends iam.Role {
  constructor(scope: Construct, id: string, props: CanaryRoleProps) {
    super(scope, id, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Canary IAM Role for ${props.stageName}`,
    });

    this.addToPolicy(
      new iam.PolicyStatement({
        resources: ['*'],
        actions: ['s3:ListAllMyBuckets'],
        effect: iam.Effect.ALLOW,
      })
    );

    this.addToPolicy(
      new iam.PolicyStatement({
        resources: [`${props.bucketArn}/*`],
        actions: ['kms:GenerateDataKey'],
        effect: iam.Effect.ALLOW,
      })
    );

    this.addToPolicy(
      new iam.PolicyStatement({
        resources: [`${props.bucketArn}/*`],
        actions: ['s3:*'],
        effect: iam.Effect.ALLOW,
      })
    );

    this.addToPolicy(
      new iam.PolicyStatement({
        resources: ['*'],
        actions: ['cloudwatch:PutMetricData'],
        effect: iam.Effect.ALLOW,
        conditions: {
          StringEquals: {
            'cloudwatch:namespace': 'CloudWatchSynthetics',
          },
        },
      })
    );

    this.addToPolicy(
      new iam.PolicyStatement({
        resources: ['arn:aws:logs:::*'],
        actions: [
          'logs:CreateLogStream',
          'logs:CreateLogGroup',
          'logs:PutLogEvents',
        ],
        effect: iam.Effect.ALLOW,
      })
    );
  }
}
