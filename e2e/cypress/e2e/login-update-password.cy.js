describe("Agent login with an outdated password, reset password and logout", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();

    cy.intercept("GET", "**/api/auth/csrf-token").as("csrfToken");
    cy.intercept("POST", "**/api/auth/login").as("login");

    cy.visit("http://localhost:3000/auth/login");

    cy.get('input[name="email"]').type("jane@example.com");
    cy.get('input[name="password"]').type("Password123!");
    cy.contains("button", "Se connecter").click();

    cy.wait("@csrfToken").its("response.statusCode").should("eq", 200);
    cy.wait("@login").then((interception) => {
      if (interception.response?.statusCode === 403) {
        expect(interception.response.body).to.have.property("errorMessage", "Token CSRF invalide.");
        cy.wait("@login").its("response.statusCode").should("eq", 200);
        return;
      }

      expect(interception.response?.statusCode).to.eq(200);
    });
  });

  it("should login and prompt to update password", () => {
    cy.url().should("include", "/account");

    cy.get('.password-expired-warning', { timeout: 10000 }).should("be.visible");
  });

  it("should reset password and logout", () => {
    cy.fixture("update-password").then((passwords) => {
      cy.get('input[name="currentPassword"]', { timeout: 10000 }).type(passwords.currentPassword);
      cy.get('input[name="newPassword"]').type(passwords.newPassword);
      cy.get('input[name="newPasswordConfirm"]').type(passwords.newPassword);
      cy.contains("button", "Modifier le mot de passe").click();
    });

    cy.get('.password-reset-success', { timeout: 10000 }).should("be.visible");
  });
});
