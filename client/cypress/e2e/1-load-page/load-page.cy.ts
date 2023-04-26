describe('load-page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads page successfully', () => {
    cy.visit('/');
  });

  it('displays the main title', () => {
    cy.get('[data-test="app-header-title"]').contains('Shopping Orders');
  });

  it('displays the sub title', () => {
    cy.get('[data-test="app-header-sub-title"]').contains(
      'The table below shows all of the recent orders for env'
    );
  });

  it('displays the create order button', () => {
    cy.get('[data-test="create-order-button"]').should(
      'have.text',
      'Create Order'
    );
  });

  it('displays the correct table headers', () => {
    cy.get('[data-test="main-table-row-order-id"]').should(
      'have.text',
      'Order ID'
    );
    cy.get('[data-test="main-table-row-product-id"]').should(
      'have.text',
      'Product ID'
    );
    cy.get('[data-test="main-table-row-quantity"]').should(
      'have.text',
      'Quantity'
    );
    cy.get('[data-test="main-table-row-created"]').should(
      'have.text',
      'Created'
    );
  });
});
