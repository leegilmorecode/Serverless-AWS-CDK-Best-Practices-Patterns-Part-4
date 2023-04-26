// this is a helper function that will throw a random error
// to test out rollbacks during deployment.
export const randomErrors = (enabled: string | undefined): void | Error => {
  if (enabled?.toLowerCase() === 'false') return;

  if (Math.random() > 0.1) {
    throw new Error('spurious error!!!');
  }
};
