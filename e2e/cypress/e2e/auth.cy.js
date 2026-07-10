describe("Authentication", () => {
  beforeEach(() => {
    cy.resetBrowserState();
  });

  it("should redirect anonymous users from protected pages to login", () => {
    cy.visit("http://localhost:3000/dashboard");

    cy.url({ timeout: 10000 }).should("include", "/auth/login");
    cy.get('input[name="email"]').should("be.visible");
  });

  it("should reject invalid credentials", () => {
    cy.intercept("GET", "**/api/auth/csrf-token").as("csrfToken");
    cy.intercept("POST", "**/api/auth/login").as("login");

    cy.visit("http://localhost:3000/auth/login");

    cy.get('input[name="email"]').type("unknown@example.com");
    cy.get('input[name="password"]').type("WrongPassword123!");
    cy.contains("button", "Se connecter").click();

    cy.wait("@csrfToken").its("response.statusCode").should("eq", 200);
    cy.waitForApi("@login", 401);

    cy.url().should("include", "/auth/login");
    cy.contains('[role="alert"]', "Identifiants invalides").should("be.visible");
  });

  it("should request a password reset email", () => {
    cy.intercept("GET", "**/api/auth/csrf-token").as("csrfToken");
    cy.intercept("POST", "**/api/auth/forgot-password").as("forgotPassword");

    cy.visit("http://localhost:3000/auth/login");
    cy.contains("a", "Mot de passe oublié ?").click();

    cy.url().should("include", "/auth/forgot-password");
    cy.get('input[type="email"]').type("jane@example.com");
    cy.contains("button", "Envoyer le lien").click();

    cy.wait("@csrfToken").its("response.statusCode").should("eq", 200);
    cy.waitForApi("@forgotPassword", 200);

    cy.get('[role="status"]').should("be.visible");
  });
});
