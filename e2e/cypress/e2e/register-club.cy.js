function waitForSuccessfulRequest(alias, expectedStatusCode) {
  cy.wait(alias).then((interception) => {
    if (interception.response?.statusCode === 403) {
      expect(interception.response.body).to.have.property("errorMessage", "Token CSRF invalide.");
      cy.wait(alias).its("response.statusCode").should("eq", expectedStatusCode);
      return;
    }

    expect(interception.response?.statusCode).to.eq(expectedStatusCode);
  });
}

describe("Club creation", () => {
  it("should create an club account with the free plan", () => {
    cy.fixture("register-club").then((club) => {
      const uniqueEmail = club.email.replace("@", `+${Date.now()}@`);

      cy.clearCookies();
      cy.clearLocalStorage();

      cy.intercept("GET", "**/api/auth/csrf-token").as("csrfToken");
      cy.intercept("POST", "**/api/auth/register").as("registerClub");
      cy.intercept("POST", "**/api/auth/login").as("login");
      cy.intercept("GET", "**/api/clubs/leagues").as("getLeagues");
      cy.intercept("GET", "**/api/clubs/search?league=*").as("getClubsByLeague");
      cy.intercept("POST", "**/api/clubs/requests").as("createClubRequest");

      cy.visit("http://localhost:3000/auth/login");

      cy.contains("a", "Créer un compte").click();

      cy.url().should("include", "/auth/register");

      cy.contains("Je suis un club").click();

      cy.url().should("include", "/auth/register/club");

      cy.get('input[name="firstName"]', { timeout: 10000 }).should('be.visible');

      cy.get('input[name="firstName"]').type(club.firstName);
      cy.get('input[name="lastName"]').type(club.lastName);
      cy.get('input[name="email"]').type(uniqueEmail);
      cy.get('input[name="password"]').type(club.password);
      cy.get('input[name="confirmation"]').type(club.password);
      cy.get('input[name="jobTitle"]').type(club.jobTitle);
      cy.get('input[name="professionalContact"]').type(uniqueEmail);

      cy.get("button.plan-selection-choice")
        .contains("Club Free")
        .click();

      cy.contains("button", "Créer mon compte gratuit").click();

      cy.wait("@csrfToken").its("response.statusCode").should("eq", 200);
      waitForSuccessfulRequest("@registerClub", 201);
      waitForSuccessfulRequest("@login", 200);

      cy.url({ timeout: 10000 }).should("include", "/club");

      cy.contains("a", "Choisir mon club").click();
      cy.url().should("include", "/club/create");
      cy.wait("@getLeagues").its("response.statusCode").should("eq", 200);

      cy.contains("button", "Ligue 1").click();
      cy.wait("@getClubsByLeague").its("response.statusCode").should("eq", 200);

      cy.contains("button", "Racing Club de Lens").click();
      cy.contains("button", "Valider ce club").click();
      cy.contains("button", "Continuer").click();

      cy.contains(uniqueEmail).should("be.visible");
      cy.contains("Racing Club de Lens").should("be.visible");
      cy.contains("button", "Continuer").click();

      cy.contains("button", "Email professionnel").click();
      cy.get('input[placeholder="votre.nom@nomduclub.com"]').type(uniqueEmail);
      cy.contains("button", "Confirmer").click();
      cy.contains(uniqueEmail).should("be.visible");

      cy.contains("button", "Soumettre la demande").click();
      waitForSuccessfulRequest("@createClubRequest", 201);

      cy.url({ timeout: 10000 }).should("include", "/club/pending");
    });
  });
});
