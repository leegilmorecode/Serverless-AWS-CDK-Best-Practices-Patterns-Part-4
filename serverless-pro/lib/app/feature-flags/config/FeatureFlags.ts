export interface FeatureFlags {
  flags: {
    createOrderAllowList: {
      name: string;
      description: string;
      attributes: {
        allow: {
          constraints: {
            type: string;
            enum: Array<'beta-group' | 'qa'>;
            required: true;
          };
        };
      };
    };
    releaseCheckCreateOrderQuantity: {
      name: string;
      description: string;
      attributes: {
        limit: {
          constraints: {
            type: string;
            required: true;
          };
        };
      };
      _deprecation?: {
        status: string;
      };
    };
    opsPreventCreateOrders: {
      name: string;
      description: string;
    };
    opsLimitListOrdersResults: {
      name: string;
      description: string;
      attributes: {
        limit: {
          constraints: {
            type: string;
            required: true;
          };
        };
      };
    };
  };
  values: {
    createOrderAllowList: {
      enabled: boolean;
      allow: 'beta-group' | 'qa';
    };
    releaseCheckCreateOrderQuantity: {
      enabled: boolean;
      limit: number;
    };
    opsPreventCreateOrders: {
      enabled: boolean;
    };
    opsLimitListOrdersResults: {
      enabled: boolean;
      limit: number;
    };
  };
  version: string;
}

export type Flags = keyof FeatureFlags['flags'];
