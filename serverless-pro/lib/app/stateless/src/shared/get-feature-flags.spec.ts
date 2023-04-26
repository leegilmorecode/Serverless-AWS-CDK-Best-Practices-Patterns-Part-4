// https://github.com/cypress-io/cypress/issues/22059
import { describe, expect, it } from '@jest/globals';

import { generateAppConfigExtensionUrl } from './get-feature-flags';

describe('get-feature-flags', () => {
  it('should return the correct url with no additional flags', () => {
    // arrange
    const application = 'application';
    const environment = 'environment';
    const configuration = 'configuration';

    // act
    const url = generateAppConfigExtensionUrl(
      application,
      environment,
      configuration
    );

    // assert
    expect(url).toMatchInlineSnapshot(
      `"http://localhost:2772/applications/application/environments/environment/configurations/configuration"`
    );
  });

  it('should return the correct url with an additional flag', () => {
    // arrange
    const application = 'application';
    const environment = 'environment';
    const configuration = 'configuration';
    const flags = ['flagOne'];

    // act
    const url = generateAppConfigExtensionUrl(
      application,
      environment,
      configuration,
      flags
    );

    // assert
    expect(url).toMatchInlineSnapshot(
      `"http://localhost:2772/applications/application/environments/environment/configurations/configuration?flag=flagOne"`
    );
  });

  it('should return the correct url with an additional flags', () => {
    // arrange
    const application = 'application';
    const environment = 'environment';
    const configuration = 'configuration';
    const flags = ['flagOne', 'flagTwo', 'flagThree'];

    // act
    const url = generateAppConfigExtensionUrl(
      application,
      environment,
      configuration,
      flags
    );

    // assert
    expect(url).toMatchInlineSnapshot(
      `"http://localhost:2772/applications/application/environments/environment/configurations/configuration?flag=flagOne&flag=flagTwo&flag=flagThree"`
    );
  });
});
