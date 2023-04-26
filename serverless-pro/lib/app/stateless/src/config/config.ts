import convict = require('convict');

export const config = convict({
  tableName: {
    doc: 'The orders table',
    default: '',
    env: 'TABLE_NAME',
    nullable: false,
  },
  bucketname: {
    doc: 'The s3 bucket which create orders uses to push new invoices to',
    default: '',
    env: 'BUCKET_NAME',
    nullable: false,
  },
  appConfig: {
    appConfigApplicationId: {
      doc: 'The appConfig application ID',
      default: '',
      env: 'APPCONFIG_APPLICATION_ID',
      nullable: false,
    },
    appConfigEnvironmentId: {
      doc: 'The appConfig environment ID',
      default: '',
      env: 'APPCONFIG_ENVIRONMENT_ID',
      nullable: false,
    },
    appConfigConfigurationId: {
      doc: 'The appConfig configuration ID',
      default: '',
      env: 'APPCONFIG_CONFIGURATION_ID',
      nullable: false,
    },
  },
  flags: {
    createOrderAllowList: {
      doc: 'The feature flag for create order allow list',
      default: '',
      env: 'FLAG_CREATE_ORDER_ALLOW_LIST',
      nullable: false,
    },
    preventCreateOrder: {
      doc: 'The feature flag for preventing the creation of orders',
      default: '',
      env: 'FLAG_PREVENT_CREATE_ORDERS',
    },
    checkCreateOrderQuantity: {
      doc: 'The feature flag release for checking the quantity limit on an order',
      default: '',
      env: 'FLAG_CHECK_CREATE_ORDER_QUANTITY',
    },
    limitOrdersList: {
      doc: 'The feature flag for operationally limiting the orders on a list',
      default: '',
      env: 'FLAG_LIMIT_LIST_ORDERS_RESULTS',
    },
  },
  shared: {
    ordersWebsiteUrl: {
      doc: 'The orders website URL',
      default: '',
      env: 'WEBSITE_URL',
      nullable: false,
    },
    ordersApiHost: {
      doc: 'The orders API host',
      default: '',
      env: 'APP_API_HOST',
      nullable: false,
    },
    stage: {
      doc: 'The current stage',
      default: 'develop',
      env: 'STAGE',
      nullable: false,
    },
    randomErrorsEnabled: {
      doc: 'A boolean to toggle the random throwing of errors',
      default: 'false',
      env: 'RANDOM_ERRORS_ENABLED',
    },
    functions: {
      logLevel: {
        doc: 'The log levels for the logger',
        default: 'INFO',
        env: 'LOG_LEVEL',
        nullable: false,
      },
      logEvent: {
        doc: 'Whether or not to log the incoming event',
        default: 'false',
        env: 'POWERTOOLS_LOGGER_LOG_EVENT',
        nullable: false,
      },
      logSampleRate: {
        doc: 'The sample rate of the logging between 0-1',
        default: 1,
        format: 'int',
        env: 'POWERTOOLS_LOGGER_SAMPLE_RATE',
        nullable: false,
      },
    },
  },
});
