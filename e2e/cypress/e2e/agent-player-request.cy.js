describe("Agent player request", () => {
  it("should submit a represented player request with a document", () => {
    cy.fixture("register-agent-player-request").then((agent) => cy.uniqueEmail(agent.email).then((email) => {
      cy.registerAgentViaUi(agent, email);
      cy.loginViaUi(email, agent.password, "ROLE_AGENT");

      cy.intercept("GET", "**/api/agents/player-requests/mine").as("getPlayerRequests");
      cy.intercept("GET", "**/api/players/agent-roster").as("getAgentRoster");
      cy.intercept("GET", "**/api/agents/players/candidates*").as("getPlayerCandidates");
      cy.intercept("POST", "**/api/agents/player-requests").as("createPlayerRequest");

      cy.visit("http://localhost:3000/mes-joueurs?add=1");

      cy.wait("@getPlayerRequests").its("response.statusCode").should("eq", 200);
      cy.wait("@getAgentRoster").its("response.statusCode").should("eq", 200);
      cy.wait("@getPlayerCandidates").its("response.statusCode").should("eq", 200);

      cy.contains("AJOUTER UN JOUEUR", { timeout: 10000 }).should("be.visible");
      cy.contains("button", "Sélectionner").click();

      cy.contains("Vérification obligatoire").should("be.visible");
      cy.get('input[type="file"]').selectFile("cypress/fixtures/agent-mandate.pdf", { force: true });
      cy.get("textarea").type("Demande Cypress de représentation joueur.");
      cy.contains("button", /Envoyer la demande|Demander la passation/).click();

      cy.waitForApi("@createPlayerRequest", 201);
      cy.contains("Demande envoyée", { timeout: 10000 }).should("be.visible");
    }));
  });
});
