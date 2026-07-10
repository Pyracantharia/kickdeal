describe("Account security", () => {
  it("should validate password confirmation before submitting a password change", () => {
    cy.fixture("register-agent-account-security").then((agent) => cy.uniqueEmail(agent.email).then((email) => {
      cy.registerAgentViaUi(agent, email);
      cy.loginViaUi(email, agent.password);

      cy.visit("http://localhost:3000/account");

      cy.get('input[name="currentPassword"]', { timeout: 10000 }).type(agent.password);
      cy.get('input[name="newPassword"]').type("NewPassword123!");
      cy.get('input[name="newPasswordConfirm"]').type("OtherPassword123!");
      cy.contains("button", "Modifier le mot de passe").click();

      cy.contains("Les mots de passe ne correspondent pas.").should("be.visible");
      cy.get(".password-reset-success").should("not.exist");
    }));
  });
});
