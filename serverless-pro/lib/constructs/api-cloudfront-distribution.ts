import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as certificateManager from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

import {
  CachePolicy,
  OriginRequestPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';

import { Construct } from 'constructs';

interface ApiCloudFrontDistributionProps
  extends Pick<
    cloudFront.DistributionProps,
    'comment' | 'priceClass' | 'enabled'
  > {
  /**
   * The stage name which the distribution is being used with
   */
  stageName: string;
  /**
   * The domain certificate arn
   */
  domainCertArn: string;
  /**
   * A reference to the api which the cloudfront distribution will target
   */
  api: apigw.RestApi;
  /**
   * The api sub domain for the cloudfront distribution
   */
  apiSubDomain: string;
  /**
   * The cloud front price class
   */
  priceClass: cloudFront.PriceClass;
  /**
   *Whether or not the distribution is enabled
   */
  enabled: boolean;
  /**
   * The comment associated with the distribution
   */
  comment: string;
}

type FixedApiCloudFrontDistributionProps = Omit<
  cloudFront.DistributionProps,
  'comment' | 'priceClass' | 'enabled'
>;

export class ApiCloudFrontDistribution extends Construct {
  public readonly distribution: cloudFront.Distribution;
  private readonly api: apigw.RestApi;

  constructor(
    scope: Construct,
    id: string,
    props: ApiCloudFrontDistributionProps
  ) {
    super(scope, id);

    this.api = props.api;

    const fixedProps: FixedApiCloudFrontDistributionProps = {
      httpVersion: cloudFront.HttpVersion.HTTP3,
      defaultBehavior: {
        origin: new origins.RestApiOrigin(this.api),
        allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,
        compress: true,
        cachePolicy: new CachePolicy(this, id + 'CachePolicy', {
          comment: 'Policy with caching disabled',
          enableAcceptEncodingGzip: false,
          enableAcceptEncodingBrotli: false,
          defaultTtl: Duration.seconds(0),
          maxTtl: Duration.seconds(0),
          minTtl: Duration.seconds(0),
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: new OriginRequestPolicy(
          this,
          id + 'RequestPolicy',
          {
            comment: 'Policy to forward all query parameters but no headers',
            headerBehavior: cloudFront.OriginRequestHeaderBehavior.none(),
            queryStringBehavior:
              cloudFront.OriginRequestQueryStringBehavior.all(),
          }
        ),
      },
      domainNames: [props.apiSubDomain],
      sslSupportMethod: cloudFront.SSLMethod.SNI,
      minimumProtocolVersion: cloudFront.SecurityPolicyProtocol.TLS_V1_2_2021,
      certificate: certificateManager.Certificate.fromCertificateArn(
        this,
        id + 'Certificate',
        props.domainCertArn
      ),
    };

    this.distribution = new cloudFront.Distribution(this, id, {
      // fixed props
      ...fixedProps,
      // custom props
      priceClass: props.priceClass
        ? props.priceClass
        : cloudFront.PriceClass.PRICE_CLASS_100,
      enabled: props.enabled ? props.enabled : true,
    });

    this.distribution.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
