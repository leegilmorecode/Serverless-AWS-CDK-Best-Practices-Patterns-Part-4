describe('create-order', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should have modal closed on initial page load', () => {
    cy.get('[data-test="create-order-modal"]').should('not.exist');
  });

  it('should open the create order modal', () => {
    // arrange / act
    cy.get('[data-test="create-order-button"]').click();
    // assert
    cy.get('[data-test="create-order-modal"]').should('exist');
  });

  it('should close modal when cancel button clicked', () => {
    // arrange
    cy.get('[data-test="create-order-modal"]').should('not.exist');
    cy.get('[data-test="create-order-button"]').click();
    cy.get('[data-test="create-order-modal"]').should('exist');
    // act
    cy.get('[data-test="cancel-create-order-modal-button"]').click();
    // assert
    cy.get('[data-test="create-order-modal"]').should('not.exist');
  });

  it('should create an new order successfully and close the modal', () => {
    // arrange
    cy.get('[data-test="create-order-button"]').click();

    cy.get('[data-test="create-order-select-product"]')
      .click()
      .get('ul > li[data-value="MacPro"]')
      .click();

    cy.get('[data-test="create-order-select-store"]')
      .click()
      .get('ul > li[data-value="59b8a675-9bb7-46c7-955d-2566edfba8ea"]')
      .click();

    cy.get('[data-test="create-order-set-quantity"]')
      .click()
      .type('{uparrow}{uparrow}{uparrow}{uparrow}');

    // act
    cy.get('[data-test="create-order-modal-button"]').click();
    // assert
    cy.get('[data-test="create-order-modal"]').should('not.exist');
  });

  it('should show newly added item in the refreshed table', () => {
    // arrange
    cy.intercept('POST', '**/orders/').as('createOrder');

    // act
    cy.get('[data-test="create-order-button"]').click();

    cy.get('[data-test="create-order-select-product"]')
      .click()
      .get('ul > li[data-value="MacPro"]')
      .click();

    cy.get('[data-test="create-order-select-store"]')
      .click()
      .get('ul > li[data-value="59b8a675-9bb7-46c7-955d-2566edfba8ea"]')
      .click();

    cy.get('[data-test="create-order-set-quantity"]')
      .click()
      .type('{uparrow}{uparrow}');

    cy.get('[data-test="create-order-modal-button"]').click();

    cy.wait('@createOrder').then(({ response }) => {
      cy.get(`[data-test="view-order-table-row-${response?.body.id}"]`, {
        timeout: 5000,
      }).should('be.visible');
    });
  });
});
