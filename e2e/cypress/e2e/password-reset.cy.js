describe("Password reset", () => {
  it("should reset a user password and allow login with the new password", () => {
    cy.fixture("register-agent-password-reset").then((agent) => cy.uniqueEmail(agent.email).then((email) => {
      cy.registerAgentViaUi(agent, email);

      cy.resetBrowserState();
      cy.intercept("GET", "**/api/auth/csrf-token").as("csrfToken");
      cy.intercept("POST", "**/api/auth/forgot-password").as("forgotPassword");

      cy.visit("http://localhost:3000/auth/forgot-password");
      cy.get('input[type="email"]').type(email);
      cy.contains("button", "Envoyer le lien").click();

      cy.wait("@csrfToken").its("response.statusCode").should("eq", 200);
      cy.wait("@forgotPassword").then((interception) => {
        if (interception.response?.statusCode === 403) {
          expect(interception.response.body).to.have.property("errorMessage", "Token CSRF invalide.");
          cy.wait("@forgotPassword").its("response.statusCode").should("eq", 200);
          return cy.get("@forgotPassword");
        }

        expect(interception.response?.statusCode).to.eq(200);
        return cy.wrap(interception);
      }).its("response.body.resetTokenString").then((resetToken) => {
        expect(resetToken).to.be.a("string");
        expect(resetToken.length).to.be.greaterThan(0);

        cy.intercept("PATCH", "**/api/auth/reset-password?token=*").as("resetPassword");
        cy.visit(`http://localhost:3000/auth/reset-password?token=${encodeURIComponent(resetToken)}`);

        cy.get('input[autocomplete="new-password"]').first().type(agent.newPassword);
        cy.get('input[autocomplete="new-password"]').last().type(agent.newPassword);
        cy.contains("button", "Modifier le mot de passe").click();

        cy.waitForApi("@resetPassword", 200);
        cy.get('[role="status"]').should("be.visible");

        cy.loginViaUi(email, agent.newPassword, "ROLE_AGENT");
        cy.url({ timeout: 10000 }).should("include", "/dashboard");
      });
    }));
  });
});
