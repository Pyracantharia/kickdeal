describe("Market search", () => {
  it("should load players and display search results", () => {
    cy.fixture("register-agent-market-search").then((agent) => cy.uniqueEmail(agent.email).then((email) => {
      cy.registerAgentViaUi(agent, email);
      cy.loginViaUi(email, agent.password, "ROLE_AGENT");

      cy.intercept("GET", "**/api/players").as("getPlayers");

      cy.visit("http://localhost:3000/market/search");

      cy.wait("@getPlayers").its("response.statusCode").should("eq", 200);
      cy.contains("RECHERCHE DE JOUEURS", { timeout: 10000 }).should("be.visible");
      cy.contains(/joueur\(s\) charges depuis la base/, { timeout: 10000 }).should("be.visible");

      cy.contains("button", "Rechercher").click();

      cy.url({ timeout: 10000 }).should("include", "/market/results");
      cy.wait("@getPlayers").its("response.statusCode").should("eq", 200);
      cy.contains("RÉSULTATS RECHERCHE", { timeout: 10000 }).should("be.visible");
      cy.contains(/résultat\(s\)|Aucun joueur trouvé/, { timeout: 10000 }).should("be.visible");
    }));
  });
});
