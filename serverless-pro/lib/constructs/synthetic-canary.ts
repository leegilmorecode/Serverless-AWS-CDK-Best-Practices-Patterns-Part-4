import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as synthetics from '@aws-cdk/aws-synthetics-alpha';

import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';

interface SyntheticCanaryProps extends synthetics.CanaryProps {
  /**
   * The stage name which the canary is being used with
   */
  stageName: string;
  /**
   * A reference to the sns topic used for our alarm
   */
  snsTopic: sns.Topic;
  /**
   * whether or not the alarm action is enabled
   */
  actionEnabled: boolean;
}

export class SyntheticCanary extends Construct {
  public readonly canary: synthetics.Canary;
  public readonly alarm: cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props: SyntheticCanaryProps) {
    super(scope, id);

    // create the canary
    this.canary = new synthetics.Canary(this, id, {
      ...props,
    });
    this.canary.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // create the cloudwatch alarm
    this.alarm = new cloudwatch.Alarm(this, id + 'Alarm', {
      metric: this.canary.metricSuccessPercent(), // percentage of successful canary runs over a given time
      evaluationPeriods: 1,
      threshold: 90,
      actionsEnabled: props.actionEnabled,
      alarmDescription: `${props.stageName} Canary CloudWatch Alarm`,
      alarmName: `${props.stageName}${id}Alarm`,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });
    this.alarm.addAlarmAction(new actions.SnsAction(props.snsTopic));
    this.alarm.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
