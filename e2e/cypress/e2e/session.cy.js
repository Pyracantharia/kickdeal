describe("Session", () => {
  it("should logout and protect authenticated pages again", () => {
    cy.fixture("register-agent-session").then((agent) => cy.uniqueEmail(agent.email).then((email) => {
      cy.registerAgentViaUi(agent, email);
      cy.loginViaUi(email, agent.password, "ROLE_AGENT");

      cy.contains("Espace agent", { timeout: 10000 }).should("be.visible");

      cy.intercept("DELETE", "**/api/auth/logout").as("logout");
      cy.contains("button", agent.agencyName).click();
      cy.contains("button", "Déconnexion").click();
      cy.waitForApi("@logout", 200);

      cy.url({ timeout: 10000 }).should("include", "/auth/login");

      cy.visit("http://localhost:3000/dashboard");
      cy.url({ timeout: 10000 }).should("include", "/auth/login");
    }));
  });
});
