// There are four typical main types of feature flags:
// release flags, operational flags, experimental flags, and customer/permission flags.
// https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-configuration-and-profile.html#appconfig-type-reference-feature-flags

import { FeatureFlags } from './FeatureFlags';
import { Stage } from '../../../types';

export type FeatureFlagConfig = Record<Stage, FeatureFlags>;

export const environments: FeatureFlagConfig = {
  // allow developers to spin up a quick branch for a given PR they are working on e.g. pr-124
  // this is done with a npm run develop, not through the pipeline, and uses the values in .env
  [Stage.develop]: {
    flags: {
      createOrderAllowList: {
        name: 'createOrderAllowList',
        description:
          'When enabled it limits the allow list to a select set of groups',
        attributes: {
          allow: {
            constraints: {
              type: 'string',
              enum: ['beta-group', 'qa'],
              required: true,
            },
          },
        },
      },
      releaseCheckCreateOrderQuantity: {
        name: 'releaseCheckCreateOrderQuantity',
        description:
          'A release flag for the create order check on max quantity',
        attributes: {
          limit: {
            constraints: {
              type: 'number',
              required: true,
            },
          },
        },
        _deprecation: {
          status: 'planned',
        },
      },
      opsPreventCreateOrders: {
        name: 'opsPreventCreateOrders',
        description: 'Operational toggle to prevent the creation of new orders',
      },
      opsLimitListOrdersResults: {
        name: 'opsLimitListOrdersResults',
        description: 'Operation toggle to limit the results on list orders',
        attributes: {
          limit: {
            constraints: {
              type: 'number',
              required: true,
            },
          },
        },
      },
    },
    values: {
      createOrderAllowList: {
        enabled: false,
        allow: 'qa',
      },
      releaseCheckCreateOrderQuantity: {
        enabled: true,
        limit: 10,
      },
      opsPreventCreateOrders: {
        enabled: false,
      },
      opsLimitListOrdersResults: {
        enabled: true,
        limit: 10,
      },
    },
    version: '1',
  },
  [Stage.featureDev]: {
    flags: {
      createOrderAllowList: {
        name: 'createOrderAllowList',
        description:
          'when enabled it limits the allow list to a select set of groups',
        attributes: {
          allow: {
            constraints: {
              type: 'string',
              enum: ['beta-group', 'qa'],
              required: true,
            },
          },
        },
      },
      releaseCheckCreateOrderQuantity: {
        name: 'releaseCheckCreateOrderQuantity',
        description:
          'A release flag for the create order check on max quantity',
        attributes: {
          limit: {
            constraints: {
              type: 'number',
              required: true,
            },
          },
        },
        _deprecation: {
          status: 'planned',
        },
      },
      opsPreventCreateOrders: {
        name: 'opsPreventCreateOrders',
        description: 'Operational toggle to prevent the creation of new orders',
      },
      opsLimitListOrdersResults: {
        name: 'opsLimitListOrdersResults',
        description: 'Operation toggle to limit the results on list orders',
        attributes: {
          limit: {
            constraints: {
              type: 'number',
              required: true,
            },
          },
        },
      },
    },
    values: {
      createOrderAllowList: {
        enabled: false,
        allow: 'qa',
      },
      releaseCheckCreateOrderQuantity: {
        enabled: true,
        limit: 1000,
      },
      opsPreventCreateOrders: {
        enabled: false,
      },
      opsLimitListOrdersResults: {
        enabled: true,
        limit: 1000,
      },
    },
    version: '1',
  },
  [Stage.staging]: {
    flags: {
      createOrderAllowList: {
        name: 'createOrderAllowList',
        description:
          'when enabled it limits the allow list to a select set of groups',
        attributes: {
          allow: {
            constraints: {
              type: 'string',
              enum: ['beta-group', 'qa'],
              required: true,
            },
          },
        },
      },
      releaseCheckCreateOrderQuantity: {
        name: 'releaseCheckCreateOrderQuantity',
        description:
          'A release flag for the create order check on max quantity',
        attributes: {
          limit: {
            constraints: {
              type: 'number',
              required: true,
            },
          },
        },
        _deprecation: {
          status: 'planned',
        },
      },
      opsPreventCreateOrders: {
        name: 'opsPreventCreateOrders',
        description: 'Operational toggle to prevent the creation of new orders',
      },
      opsLimitListOrdersResults: {
        name: 'opsLimitListOrdersResults',
        description: 'Operation toggle to limit the results on list orders',
        attributes: {
          limit: {
            constraints: {
              type: 'number',
              required: true,
            },
          },
        },
      },
    },
    values: {
      createOrderAllowList: {
        enabled: true,
        allow: 'qa',
      },
      releaseCheckCreateOrderQuantity: {
        enabled: true,
        limit: 1000,
      },
      opsPreventCreateOrders: {
        enabled: false,
      },
      opsLimitListOrdersResults: {
        enabled: true,
        limit: 1000,
      },
    },
    version: '1',
  },
  [Stage.prod]: {
    flags: {
      createOrderAllowList: {
        name: 'createOrderAllowList',
        description:
          'when enabled it limits the allow list to a select set of groups',
        attributes: {
          allow: {
            constraints: {
              type: 'string',
              enum: ['beta-group', 'qa'],
              required: true,
            },
          },
        },
      },
      releaseCheckCreateOrderQuantity: {
        name: 'releaseCheckCreateOrderQuantity',
        description:
          'A release flag for the create order check on max quantity',
        attributes: {
          limit: {
            constraints: {
              type: 'number',
              required: true,
            },
          },
        },
        _deprecation: {
          status: 'planned',
        },
      },
      opsPreventCreateOrders: {
        name: 'opsPreventCreateOrders',
        description: 'Operational toggle to prevent the creation of new orders',
      },
      opsLimitListOrdersResults: {
        name: 'opsLimitListOrdersResults',
        description: 'Operation toggle to limit the results on list orders',
        attributes: {
          limit: {
            constraints: {
              type: 'number',
              required: true,
            },
          },
        },
      },
    },
    values: {
      createOrderAllowList: {
        enabled: false,
        allow: 'qa',
      },
      releaseCheckCreateOrderQuantity: {
        enabled: false,
        limit: 1000,
      },
      opsPreventCreateOrders: {
        enabled: false,
      },
      opsLimitListOrdersResults: {
        enabled: false,
        limit: 1000,
      },
    },
    version: '1',
  },
};
