Cypress.Commands.add("uniqueEmail", (email) => {
  const [localPart, domain] = email.split("@");
  return cy.wrap(`${localPart}+${Date.now()}-${Cypress._.random(1000, 9999)}@${domain}`, { log: false });
});

function waitForApiResponse(alias, expectedStatusCode, validateResponse = () => {}) {
  cy.wait(alias).then((interception) => {
    if (interception.response?.statusCode === 403) {
      expect(interception.response.body).to.have.property("errorMessage", "Token CSRF invalide.");
      cy.wait(alias).then((retryInterception) => {
        expect(retryInterception.response?.statusCode).to.eq(expectedStatusCode);
        validateResponse(retryInterception.response);
      });
      return;
    }

    expect(interception.response?.statusCode).to.eq(expectedStatusCode);
    validateResponse(interception.response);
  });
}

Cypress.Commands.add("waitForApi", (alias, expectedStatusCode) => {
  waitForApiResponse(alias, expectedStatusCode);
});

Cypress.Commands.add("resetBrowserState", () => {
  cy.clearCookies();
  cy.clearLocalStorage();
});

Cypress.Commands.add("loginViaUi", (email, password, expectedRole) => {
  cy.resetBrowserState();

  cy.intercept("GET", "**/api/auth/csrf-token").as("csrfToken");
  cy.intercept("POST", "**/api/auth/login").as("login");

  cy.visit("http://localhost:3000/auth/login");

  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.contains("button", "Se connecter").click();

  cy.wait("@csrfToken").its("response.statusCode").should("eq", 200);
  waitForApiResponse("@login", 200, (response) => {
    if (expectedRole) {
      expect(response?.body.user.roles).to.include(expectedRole);
    }
  });
});

Cypress.Commands.add("fillAgentRegistrationForm", (agent, email) => {
  cy.get('input[name="firstName"]', { timeout: 10000 }).should("be.visible");

  cy.get('input[name="firstName"]').type(agent.firstName);
  cy.get('input[name="lastName"]').type(agent.lastName);
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(agent.password);
  cy.get('input[name="confirmation"]').type(agent.password);
  cy.get('input[name="agencyName"]').type(agent.agencyName);

  cy.get(".country-select")
    .find('[role="button"]')
    .click();

  cy.get(".country-select-input")
    .should("be.visible")
    .focus()
    .type(agent.country);

  cy.get("button.country-select-choice")
    .contains(agent.country)
    .click();

  cy.get("button.plan-selection-choice")
    .contains("Agent Free")
    .click();

  cy.get('input[name="termsAccepted"]').check();
});

Cypress.Commands.add("registerAgentViaUi", (agent, email) => {
  cy.resetBrowserState();

  cy.intercept("GET", "**/api/auth/csrf-token").as("csrfToken");
  cy.intercept("POST", "**/api/auth/register").as("registerAgent");

  cy.visit("http://localhost:3000/auth/register/manager");

  cy.fillAgentRegistrationForm(agent, email);
  cy.contains("button", "Créer mon compte gratuit").click();

  cy.wait("@csrfToken").its("response.statusCode").should("eq", 200);
  cy.waitForApi("@registerAgent", 201);
  cy.url({ timeout: 10000 }).should("include", "/auth/login");
});
