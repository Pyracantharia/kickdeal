describe("Agent dashboard", () => {
  it("should let a new agent login and open the market hub", () => {
    cy.fixture("register-agent-dashboard").then((agent) => cy.uniqueEmail(agent.email).then((email) => {
      cy.registerAgentViaUi(agent, email);
      cy.loginViaUi(email, agent.password, "ROLE_AGENT");

      cy.url({ timeout: 10000 }).should("include", "/dashboard");
      cy.contains("Espace agent", { timeout: 10000 }).should("be.visible");
      cy.contains("Explorer le marché").click();

      cy.url().should("include", "/market");
      cy.contains("Marché des transferts").should("be.visible");
    }));
  });
});
