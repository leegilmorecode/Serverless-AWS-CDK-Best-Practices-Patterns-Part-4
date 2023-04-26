import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { Construct } from 'constructs';

interface SimpleTableProps
  extends Pick<dynamodb.TableProps, 'removalPolicy' | 'partitionKey'> {
  /**
   * The stage name which the dynamodb table is being used with
   */
  stageName: string;
  /**
   * The partition key attribute for the table
   */
  partitionKey: dynamodb.Attribute;
  /**
   * The removal policy for the table
   */
  removalPolicy: cdk.RemovalPolicy;
}

type FixedSimpleTableProps = Omit<
  dynamodb.TableProps,
  'removalPolicy' | 'partitionKey'
>;

export class SimpleTable extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: SimpleTableProps) {
    super(scope, id);

    const fixedProps: FixedSimpleTableProps = {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      contributorInsightsEnabled: true,
    };

    this.table = new dynamodb.Table(this, id, {
      // fixed props
      ...fixedProps,
      // custom props
      ...props,
    });
  }
}
