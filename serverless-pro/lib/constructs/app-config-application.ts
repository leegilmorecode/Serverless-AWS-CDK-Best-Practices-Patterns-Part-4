import * as appconfig from 'aws-cdk-lib/aws-appconfig';
import * as cdk from 'aws-cdk-lib';

import { Construct } from 'constructs';

interface AppConfigApplicationProps
  extends Pick<
    appconfig.CfnHostedConfigurationVersionProps,
    'content' | 'description'
  > {
  /**
   * The stage name which the appconfig application is being used with
   */
  stageName: string;
  /**
   * The removal policy for the table
   */
  removalPolicy: cdk.RemovalPolicy;
  /**
   * The deployment time in minutes
   */
  deploymentDurationInMinutes: number;
  /**
   * The growth factor per interval
   */
  growthFactor: number;
  /**
   * The growth type: EXPONENTIAL | LINEAR
   */
  growthType: 'EXPONENTIAL' | 'LINEAR';
  /**
   * The description
   */
  description: string;
  /**
   * The json schema validator for the contents
   */
  validatorSchema: string;
}

export class AppConfigApplication extends Construct {
  public readonly appilcation: appconfig.CfnApplication;
  public readonly appilcationEnvironment: appconfig.CfnEnvironment;
  public readonly featureFlags: appconfig.CfnHostedConfigurationVersion[];
  public readonly appilcationConfigurationProfile: appconfig.CfnConfigurationProfile;

  private readonly deploymentStrategy: appconfig.CfnDeploymentStrategy;
  private readonly deployment: appconfig.CfnDeployment;

  constructor(scope: Construct, id: string, props: AppConfigApplicationProps) {
    super(scope, id);

    this.featureFlags = [];

    // In AWS AppConfig , an application is simply an organizational construct like a folder.
    // This organizational construct has a relationship with some unit of executable code.
    // For example, you could create an application called MyMobileApp to organize and manage configuration
    // data for a mobile application installed by your users.
    this.appilcation = new appconfig.CfnApplication(this, id, {
      name: `${props.stageName} app config application`,
      description: `${props.stageName} app config application`,
    });
    this.appilcation.applyRemovalPolicy(props.removalPolicy);

    // creates an environment, which is a logical deployment group of AWS AppConfig targets,
    // such as applications in a Beta or Production environment.
    this.appilcationEnvironment = new appconfig.CfnEnvironment(
      this,
      id + 'Env',
      {
        applicationId: this.appilcation.ref,
        name: `${props.stageName}Environment`,
      }
    );
    this.appilcationEnvironment.applyRemovalPolicy(props.removalPolicy);

    // creates a configuration profile that enables AWS AppConfig to access the configuration source
    this.appilcationConfigurationProfile =
      new appconfig.CfnConfigurationProfile(this, id + 'ConfigProfile', {
        applicationId: this.appilcation.ref,
        name: `${props.stageName}ConfigurationProfile`,
        description: `${props.stageName}Config Profile`,
        locationUri: 'hosted',
        type: 'AWS.AppConfig.FeatureFlags',
        validators: [{ type: 'JSON_SCHEMA', content: props.validatorSchema }],
      });
    this.appilcationConfigurationProfile.applyRemovalPolicy(
      props.removalPolicy
    );

    // resource creates an AWS AppConfig deployment strategy. A deployment strategy defines
    // important criteria for rolling out your configuration to the designated targets.
    this.deploymentStrategy = new appconfig.CfnDeploymentStrategy(
      this,
      id + 'DepStrategy',
      {
        deploymentDurationInMinutes: props.deploymentDurationInMinutes,
        growthFactor: props.growthFactor,
        name: `${props.stageName}DeploymentStrategy`,
        description: `${props.stageName} Deployment Strategy`,
        growthType: props.growthType,
        replicateTo: 'NONE',
      }
    );
    this.deploymentStrategy.applyRemovalPolicy(props.removalPolicy);

    // Create a new configuration in the AWS AppConfig hosted configuration store.
    // Configurations must be 1 MB or smaller.
    const featureFlagHostedConfiguration =
      new appconfig.CfnHostedConfigurationVersion(
        this,
        id + 'HostedConfVersion',
        {
          applicationId: this.appilcation.ref,
          configurationProfileId: this.appilcationConfigurationProfile.ref,
          content: props.content,
          contentType: 'application/json',
        }
      );
    featureFlagHostedConfiguration.applyRemovalPolicy(
      cdk.RemovalPolicy.DESTROY
    );

    // Starting a deployment in AWS AppConfig calls the StartDeployment API action.
    // This call includes the IDs of the AWS AppConfig application, the environment, the configuration profile,
    // and (optionally) the configuration data version to deploy.
    this.deployment = new appconfig.CfnDeployment(this, id + 'Deployment', {
      applicationId: this.appilcation.ref,
      configurationProfileId: this.appilcationConfigurationProfile.ref,
      deploymentStrategyId: this.deploymentStrategy.ref,
      description: `${props.stageName} Deployment`,
      environmentId: this.appilcationEnvironment.ref,
      configurationVersion: featureFlagHostedConfiguration.ref,
    });
    this.deployment.applyRemovalPolicy(props.removalPolicy);
  }
}
