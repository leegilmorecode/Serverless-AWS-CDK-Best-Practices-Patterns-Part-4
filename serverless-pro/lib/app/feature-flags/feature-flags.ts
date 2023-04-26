import * as cdk from 'aws-cdk-lib';

import { FeatureFlagConfig, environments } from './config/config';

import { AppConfigApplication } from '../../constructs';
import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';
import { Stage } from 'lib/types';
import { schema } from './config/config.schema';

export interface FeatureFlagStackProps extends cdk.StackProps {
  stageName: string;
}

export class FeatureFlagStack extends cdk.Stack {
  public readonly appConfigApplicationRef: string;
  public readonly appConfigEnvName: string;
  public readonly appConfigEnvRef: string;
  public readonly appConfigConfigurationProfileRef: string;

  constructor(scope: Construct, id: string, props: FeatureFlagStackProps) {
    super(scope, id, props);

    const stage = [Stage.featureDev, Stage.staging, Stage.prod].includes(
      props.stageName as Stage
    )
      ? props.stageName
      : Stage.develop;

    const appConfigApplication = new AppConfigApplication(
      this,
      'AppConfigApplication',
      {
        stageName: props.stageName,
        growthFactor: 100,
        deploymentDurationInMinutes: 0,
        growthType: 'LINEAR',
        description: `${props.stageName} application feature flags`,
        validatorSchema: JSON.stringify(schema),
        content: JSON.stringify(environments[stage as keyof FeatureFlagConfig]),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    this.appConfigApplicationRef = appConfigApplication.appilcation.ref;
    this.appConfigEnvName = appConfigApplication.appilcationEnvironment.name;
    this.appConfigConfigurationProfileRef =
      appConfigApplication.appilcationConfigurationProfile.ref;
    this.appConfigEnvRef = appConfigApplication.appilcationEnvironment.ref;

    // cdk nag check and suppressions
    Aspects.of(this).add(new AwsSolutionsChecks({ verbose: true }));
    NagSuppressions.addStackSuppressions(this, []);
  }
}
