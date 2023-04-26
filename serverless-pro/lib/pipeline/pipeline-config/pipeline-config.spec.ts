// https://github.com/cypress-io/cypress/issues/22059
import { describe, expect, it } from '@jest/globals';

import { environments } from './pipeline-config';

describe('pipeline-config', () => {
  it('should return the correct config for feature-dev', () => {
    expect(environments.featureDev).toMatchSnapshot();
  });

  it('should return the correct config for staging', () => {
    expect(environments.staging).toMatchSnapshot();
  });

  it('should return the correct config for prod', () => {
    expect(environments.prod).toMatchSnapshot();
  });
});
