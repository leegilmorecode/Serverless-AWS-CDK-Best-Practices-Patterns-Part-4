export interface IConfig {
  api: string;
  stage: string;
  domainName: string;
  subDomain: string;
}

export interface IOrder {
  id: string;
  type: string;
  created: string;
  quantity: number;
  productId: string;
  storeId: string;
}

export interface ICreateOrder {
  quantity: number;
  productId: string;
  storeId: string;
}

type IStores = Record<string, string>;

export const Stores: IStores = {
  Newcastle: '59b8a675-9bb7-46c7-955d-2566edfba8ea',
  Manchester: 'f5de2a0a-5a1d-4842-b38d-34e0fe420d33',
  London: '4e02e8f2-c0fe-493e-b259-1047254ad969',
};
