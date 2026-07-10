describe("Agent login with an outdated password, reset password", () => {
  beforeEach(() => {
    cy.loginViaUi("jane@example.com", "Password123!");
  });

  it("should login and prompt to update password", () => {
    cy.url().should("include", "/account");

    cy.get('.password-expired-warning', { timeout: 10000 }).should("be.visible");
  });

  it("should reset password", () => {
    cy.fixture("update-password").then((passwords) => {
      cy.get('input[name="currentPassword"]', { timeout: 10000 }).type(passwords.currentPassword);
      cy.get('input[name="newPassword"]').type(passwords.newPassword);
      cy.get('input[name="newPasswordConfirm"]').type(passwords.newPassword);
      cy.contains("button", "Modifier le mot de passe").click();
    });

    cy.get('.password-reset-success', { timeout: 10000 }).should("be.visible");
  });
});
