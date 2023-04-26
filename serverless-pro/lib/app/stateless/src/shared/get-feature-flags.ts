import axios from 'axios';

export interface Flags {
  createOrderAllowList: {
    allow: string;
    enabled: boolean;
  };
  opsLimitListOrdersResults: {
    limit: number;
    enabled: boolean;
  };
  opsPreventCreateOrders: {
    enabled: boolean;
  };
  releaseCheckCreateOrderQuantity: {
    limit: number;
    enabled: boolean;
  };
}

export const generateAppConfigExtensionUrl = (
  application: string,
  environment: string,
  configuration: string,
  optionalFlags?: string[]
): string => {
  let url = `http://localhost:2772/applications/${application}/environments/${environment}/configurations/${configuration}`;

  if (optionalFlags?.length) {
    url += '?';
    optionalFlags.forEach((flag: string) => (url += `flag=${flag}&`));
    url = url.substring(0, url.length - 1);
  }
  return url;
};

export const getFeatureFlags = async (
  application: string,
  environment: string,
  configuration: string,
  optionalFlags?: string[]
): Promise<Flags | Record<string, unknown>> => {
  const url = generateAppConfigExtensionUrl(
    application,
    environment,
    configuration,
    optionalFlags
  );
  const config = await axios.get(url);
  return config.data;
};
