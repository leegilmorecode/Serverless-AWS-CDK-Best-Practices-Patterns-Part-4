import { ICreateOrder, IOrder } from '../types';

export async function listOrders(api: string): Promise<IOrder[]> {
  // list all of the orders
  const response = await fetch(`${api}/orders/`, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.ok
    ? ((await response.json()) as IOrder[])
    : await Promise.reject(response.json);
}

export async function createOrder(
  api: string,
  order: ICreateOrder
): Promise<IOrder> {
  // create a new order
  const response = await fetch(`${api}/orders/`, {
    method: 'POST',
    mode: 'cors',
    body: JSON.stringify(order),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) {
    return (await response.json()) as IOrder;
  }
  const error = await response.json();
  return await Promise.reject(error);
}
