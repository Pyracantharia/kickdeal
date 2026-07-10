describe("Agent creation", () => {
  it("should create an agent account with the free plan", () => {
    cy.fixture("register-agent").then((agent) => cy.uniqueEmail(agent.email).then((uniqueEmail) => {
      cy.resetBrowserState();

      cy.intercept("GET", "**/api/auth/csrf-token").as("csrfToken");
      cy.intercept("POST", "**/api/auth/register").as("registerAgent");

      cy.visit("http://localhost:3000/auth/login");

      cy.contains("a", "Créer un compte").click();

      cy.url().should("include", "/auth/register");

      cy.contains("Je suis un agent").click();

      cy.url().should("include", "/auth/register/manager");

      cy.fillAgentRegistrationForm(agent, uniqueEmail);

      cy.contains("button", "Créer mon compte gratuit").click();

      cy.wait("@csrfToken").its("response.statusCode").should("eq", 200);
      cy.waitForApi("@registerAgent", 201);

      cy.url().should("include", "/auth/login");
      cy.url().should("include", "registered=true");
    }));
  });
});
