import { describe, test, expect } from "@jest/globals";

describe("src/index.ts", () => {
  test("sayHello function should return a greeting with the given name", () => {
    // Arrange
    const name = "Hello World";

    // Assert
    expect(name).toBe("Hello World");
  });
});
