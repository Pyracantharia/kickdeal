describe("Agent creation", () => {
  it("should create an agent account with the free plan", () => {
    cy.fixture("register-agent").then((agent) => {
      cy.visit("http://localhost:3000/auth/login");

      cy.contains("a", "Créer un compte").click();

      cy.url().should("include", "/auth/register");

      cy.contains("Je suis un agent").click();

      cy.url().should("include", "/auth/register/manager");

      cy.get('input[name="firstName"]', { timeout: 10000 }).should('be.visible');

      cy.get('input[name="firstName"]').type(agent.firstName);
      cy.get('input[name="lastName"]').type(agent.lastName);
      cy.get('input[name="email"]').type(agent.email);
      cy.get('input[name="password"]').type(agent.password);
      cy.get('input[name="confirmation"]').type(agent.password);
      cy.get('input[name="agencyName"]').type(agent.agencyName);

      cy.get(".country-select")
        .find('[role="button"]')
        .click();

      cy.get(".country-select-input")
        .should("be.visible")
        .focus()
        .type(agent.country);

      cy.get("button.country-select-choice")
        .contains(agent.country)
        .click();

      cy.get("button.plan-selection-choice")
        .contains("Agent Free")
        .click();

      cy.contains("button", "Créer mon compte gratuit").click();

      cy.url().should("include", "/auth/login");
    });
  });
});
