describe("Landing page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3001");
  });

  it("should load successfully", () => {
    cy.title().should("not.be.empty");

    cy.get("h1")
      .should("exist")
      .and("be.visible");
  
    cy.get("nav").should("exist");
  
    // Should see the main button "Commencer gratuitement"
    cy.get(".home-cta")
      .should("exist")
      .and("be.visible");
  
    cy.window().should("exist");
  
    // Scroll test
    cy.scrollTo("bottom");
    cy.scrollTo("top");
  });
});
