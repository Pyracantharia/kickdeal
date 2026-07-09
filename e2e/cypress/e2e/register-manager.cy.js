describe("Inscription agent", () => {
  it("permet de créer un compte agent avec le plan gratuit", () => {
    cy.fixture("register-manager").then((manager) => {
      cy.visit("http://localhost:3000");

      cy.url().should("include", "/auth/login");

      cy.contains("a", "Créer un compte").click();

      cy.url().should("include", "/auth/register");

      cy.contains("Je suis un agent").click();

      cy.url().should("include", "/auth/register/manager");

      cy.get('input[name="firstName"]', { timeout: 10000 }).should('be.visible');

      cy.get('input[name="firstName"]').type(manager.firstName);
      cy.get('input[name="lastName"]').type(manager.lastName);
      cy.get('input[name="email"]').type(manager.email);
      cy.get('input[name="password"]').type(manager.password);
      cy.get('input[name="confirmation"]').type(manager.password);
      cy.get('input[name="agencyName"]').type(manager.agencyName);

      cy.get(".country-select")
        .find('[role="button"]')
        .click();

      cy.get(".country-select-input")
        .should("be.visible")
        .focus()
        .type(manager.country);

      cy.get("button.country-select-choice")
        .contains(manager.country)
        .click();

      cy.get("button.plan-selection-choice")
        .contains("Agent Free")
        .click();

      cy.contains("button", "Créer mon compte gratuit").click();

      // À adapter selon le comportement réel après inscription
      cy.url().should("not.include", "/auth/register/manager");
    });
  });
});
