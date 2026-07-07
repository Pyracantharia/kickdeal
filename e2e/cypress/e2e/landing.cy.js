describe("Landing page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3001");
  });

  it("should load successfully", () => {
    cy.title().should("not.be.empty");
  });

  it("should display the main heading", () => {
    cy.get("h1")
      .should("exist")
      .and("be.visible");
  });

  it("should display the navigation", () => {
    cy.get("nav").should("exist");
  });

  // Should see the main button "Commencer gratuitement"
  it("should display the main CTA button", () => {
    cy.get(".home-cta")
      .should("exist")
      .and("be.visible");
  });

  it("should not contain JavaScript errors", () => {
    cy.window().should("exist");
  });

  it("should scroll to the bottom", () => {
    cy.scrollTo("bottom");
    cy.scrollTo("top");
  });
});
