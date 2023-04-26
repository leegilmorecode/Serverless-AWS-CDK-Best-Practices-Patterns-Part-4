import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as codeDeploy from 'aws-cdk-lib/aws-codedeploy';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';

import { Duration, RemovalPolicy } from 'aws-cdk-lib';

import { Construct } from 'constructs';

interface ProgressiveLambdaProps extends nodeLambda.NodejsFunctionProps {
  /**
   * The stage name which the lambda is being used with
   */
  stageName: string;
  /**
   * The code deploy application which this lambda is part of
   */
  application: codeDeploy.LambdaApplication;
  /**
   * The code deploy lambda deployment config
   */
  deploymentConfig: codeDeploy.ILambdaDeploymentConfig;
  /**
   * whether or not the alarm is enabled
   */
  alarmEnabed: boolean;
  /**
   * A reference to the sns topic which the alarm will use
   */
  snsTopic: sns.Topic;
  /**
   * the metric name for our alarm
   */
  metricName: string;
  /**
   * the namespace for our alarm
   */
  namespace: string;
  /**
   * the service name for our alarm
   */
  serviceName: string;
}

export class ProgressiveLambda extends Construct {
  public readonly lambda: nodeLambda.NodejsFunction;
  public readonly alias: lambda.Alias;
  public readonly alarm: cloudwatch.Alarm;

  public readonly deploymentGroup: codeDeploy.LambdaDeploymentGroup;
  private readonly application: codeDeploy.LambdaApplication;
  private readonly deploymentConfig: codeDeploy.ILambdaDeploymentConfig;

  constructor(scope: Construct, id: string, props: ProgressiveLambdaProps) {
    super(scope, id);

    this.application = props.application;
    this.deploymentConfig = props.deploymentConfig;

    // creation of the lambda passing through the props
    this.lambda = new nodeLambda.NodejsFunction(this, id, {
      ...props,
    });

    // the lambda alias
    this.alias = new lambda.Alias(this, id + 'Alias', {
      aliasName: props.stageName,
      version: this.lambda.currentVersion,
    });

    // a fixed prop cloudwatch alarm
    this.alarm = new cloudwatch.Alarm(this, id + 'Failure', {
      alarmDescription: `${props.namespace}/${props.metricName} deployment errors > 0 for ${id}`,
      actionsEnabled: props.alarmEnabed,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING, // ensure the alarm is only triggered for a period
      metric: new cloudwatch.Metric({
        metricName: props.metricName,
        namespace: props.namespace,
        statistic: cloudwatch.Stats.SUM,
        dimensionsMap: {
          service: props.serviceName,
        },
        period: Duration.minutes(1),
      }),
      threshold: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 1,
    });

    this.alarm.addAlarmAction(new actions.SnsAction(props.snsTopic));
    this.alarm.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // the code deploy deployment group
    this.deploymentGroup = new codeDeploy.LambdaDeploymentGroup(
      this,
      id + 'CanaryDeployment',
      {
        alias: this.alias,
        deploymentConfig: this.deploymentConfig,
        alarms: [this.alarm],
        application: this.application,
      }
    );
  }
}
