import * as cdk from 'aws-cdk-lib';
import * as certificateManager from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';

import { Construct } from 'constructs';

interface WebCloudFrontDistributionProps
  extends Pick<cloudFront.CloudFrontWebDistributionProps, 'enabled'> {
  /**
   * The stage name which the distribution is being used with
   */
  stageName: string;
  /**
   * The removal policy for the distribution
   */
  removalPolicy: cdk.RemovalPolicy;
  /**
   * Whether or not the distribution is enabled
   */
  enabled: boolean;
  /**
   * The domain certificate arn
   */
  domainCertArn: string;
  /**
   * The origin access identity
   */
  originAccessIdentity: cloudFront.OriginAccessIdentity;
  /**
   * The s3 bucket which the distribution will target
   */
  bucket: s3.Bucket;
  /**
   * The sub domain for the distribution
   */
  subDomain: string;
}

type FixedWebCloudFrontDistributionProps = Omit<
  cloudFront.CloudFrontWebDistributionProps,
  'enabled'
>;

export class WebCloudFrontDistribution extends Construct {
  public readonly distribution: cloudFront.CloudFrontWebDistribution;

  constructor(
    scope: Construct,
    id: string,
    props: WebCloudFrontDistributionProps
  ) {
    super(scope, id);

    const fixedProps: FixedWebCloudFrontDistributionProps = {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: props.bucket,
            originAccessIdentity: props.originAccessIdentity,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
      comment: `${props.stageName} client web distribution`,
      defaultRootObject: 'index.html',
      priceClass: cloudFront.PriceClass.PRICE_CLASS_100,
      // we need to pull in the certificate you have already created for your own domain
      viewerCertificate: cloudFront.ViewerCertificate.fromAcmCertificate(
        certificateManager.Certificate.fromCertificateArn(
          this,
          'Certificate',
          props.domainCertArn
        ),
        {
          securityPolicy: cloudFront.SecurityPolicyProtocol.TLS_V1_2_2021,
          sslMethod: cloudFront.SSLMethod.SNI,
          aliases: [props.subDomain],
        }
      ),
      httpVersion: cloudFront.HttpVersion.HTTP3,
    };

    this.distribution = new cloudFront.CloudFrontWebDistribution(this, id, {
      // fixed props
      ...fixedProps,
      // custom props
      ...props,
    });

    this.distribution.applyRemovalPolicy(props.removalPolicy);
  }
}
