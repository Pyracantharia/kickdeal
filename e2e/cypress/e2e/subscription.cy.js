describe("Subscription", () => {
  it("should show the current agent plan and available upgrade", () => {
    cy.fixture("register-agent-subscription").then((agent) => cy.uniqueEmail(agent.email).then((email) => {
      cy.registerAgentViaUi(agent, email);
      cy.loginViaUi(email, agent.password, "ROLE_AGENT");

      cy.intercept("GET", "**/api/subscription/me").as("getSubscription");

      cy.visit("http://localhost:3000/subscription");

      cy.wait("@getSubscription").its("response.statusCode").should("eq", 200);
      cy.contains("Plan KickDeal", { timeout: 10000 }).should("be.visible");
      cy.contains("Agent Free").should("be.visible");
      cy.contains("Agent Pro").should("be.visible");
    }));
  });
});
