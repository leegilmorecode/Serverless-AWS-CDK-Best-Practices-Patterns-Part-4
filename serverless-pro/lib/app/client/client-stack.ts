import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

import { WebBucket, WebCloudFrontDistribution } from '../../constructs';

import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';
import { RemovalPolicy } from 'aws-cdk-lib';

export interface ClientStackProps extends cdk.StackProps {
  bucketName: string;
  stageName: string;
  domainName: string;
  domainCertArn: string;
}

export class ClientStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly route53ClientUrl: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: ClientStackProps) {
    super(scope, id, props);

    const stage = props.stageName.toLowerCase();
    const subDomain = `${stage}.${props.domainName}`;

    // create the s3 bucket and oai for the client app
    const { originAccessIdentity, bucket } = new WebBucket(
      this,
      'ClientBucket',
      {
        bucketName: props.bucketName,
        removalPolicy: RemovalPolicy.DESTROY,
        stageName: props.stageName,
      }
    );
    this.bucket = bucket;

    // create the cloudfront web distribution for the app for the specific sub domain
    // e.g. featuredev.your-domain.co.uk with an ssl cert you have already created for your domain
    const cloudFrontDistribution = new WebCloudFrontDistribution(
      this,
      'Distribution',
      {
        enabled: true,
        stageName: props.stageName,
        subDomain,
        removalPolicy: RemovalPolicy.DESTROY,
        originAccessIdentity,
        bucket: this.bucket,
        domainCertArn: props.domainCertArn,
      }
    ).distribution;

    // Setup Bucket Deployment to automatically deploy new assets and invalidate cache
    new s3deploy.BucketDeployment(this, 'ClientBucketDeployment', {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, '../../../../client/build')),
        s3deploy.Source.jsonData('config.json', {
          stage,
          domainName: props.domainName,
          subDomain,
          api: `https://api-${stage}.${props.domainName}`,
        }), // runtime config for client
      ],
      destinationBucket: this.bucket,
      metadata: {
        stageName: stage,
      },
      distribution: cloudFrontDistribution,
      distributionPaths: ['/*'],
    });

    // get the hosted zone based on domain name lookup
    const zone: route53.IHostedZone = route53.HostedZone.fromLookup(
      this,
      'HostedZone',
      {
        domainName: `${props.domainName}`,
      }
    );

    // create the alias record for the client for this particular stage
    const subDomainRecord: route53.ARecord = new route53.ARecord(
      this,
      'Alias',
      {
        zone,
        recordName: `${stage}`,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(cloudFrontDistribution)
        ),
      }
    );
    subDomainRecord.applyRemovalPolicy(RemovalPolicy.DESTROY);

    this.route53ClientUrl = new cdk.CfnOutput(this, 'Route53ClientUrl', {
      value: `${subDomain}`,
      exportName: `${stage}-route53-client-url`,
    });

    // cdk nag check and suppressions
    Aspects.of(this).add(new AwsSolutionsChecks({ verbose: true }));
    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-IAM5',
        reason: `Rule suppression for 'The IAM entity contains wildcard permissions and does not have a cdk-nag rule suppression with evidence for those permission'`,
      },
      {
        id: 'AwsSolutions-IAM4',
        reason: `Rule suppression for 'The IAM user, role, or group uses AWS managed policies'`,
      },
      {
        id: 'AwsSolutions-CFR1',
        reason: `Rule suppression for 'The CloudFront distribution may require Geo restrictions'`,
      },
      {
        id: 'AwsSolutions-CFR4',
        reason: `Rule suppression for 'The CloudFront distribution allows for SSLv3 or TLSv1 for HTTPS viewer connections'`,
      },
      {
        id: 'AwsSolutions-CFR2',
        reason: `Rule suppression for 'The CloudFront distribution may require integration with AWS WAF'`,
      },
      {
        id: 'AwsSolutions-CFR3',
        reason: `Rule suppression for 'The CloudFront distribution does not have access logging enabled'`,
      },
      {
        id: 'AwsSolutions-S1',
        reason: `Rule suppression for 'The S3 Bucket has server access logs disabled'`,
      },
      {
        id: 'AwsSolutions-S5',
        reason: `Rule suppression for 'The S3 static website bucket either has an open world bucket policy or does not use a CloudFront Origin Access Identity (OAI)'`,
      },
      {
        id: 'AwsSolutions-CFR5',
        reason: `Rule suppression for 'The CloudFront distributions uses SSLv3 or TLSv1 for communication to the origin'`,
      },
      {
        id: 'AwsSolutions-S10',
        reason: `Rule suppression for 'The S3 Bucket or bucket policy does not require requests to use SSL'`,
      },
      {
        id: 'AwsSolutions-S2',
        reason: `Rule suppression for 'The S3 Bucket does not have public access restricted and blocked'`,
      },
    ]);
  }
}
