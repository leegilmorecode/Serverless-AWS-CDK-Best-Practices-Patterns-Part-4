import * as cdk from 'aws-cdk-lib';
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';

import { Construct } from 'constructs';

interface WebBucketProps
  extends Pick<s3.BucketProps, 'removalPolicy' | 'bucketName'> {
  /**
   * The stage name which the dynamodb table is being used with
   */
  stageName: string;
  /**
   * The removal policy for the table
   */
  removalPolicy: cdk.RemovalPolicy;
  /**
   * The bucket name
   */
  bucketName: string;
}

type FixedWebBucketProps = Omit<s3.BucketProps, 'removalPolicy' | 'bucketName'>;

export class WebBucket extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly originAccessIdentity: cloudFront.OriginAccessIdentity;

  constructor(scope: Construct, id: string, props: WebBucketProps) {
    super(scope, id);

    const fixedProps: FixedWebBucketProps = {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
    };

    this.bucket = new s3.Bucket(this, id, {
      // fixed props
      ...fixedProps,
      // custom props
      ...props,
    });

    this.originAccessIdentity = new cloudFront.OriginAccessIdentity(
      this,
      id + 'OAI',
      {
        comment: `Origin Access Identity for ${id} web bucket`,
      }
    );

    this.bucket.grantRead(this.originAccessIdentity);
  }
}
