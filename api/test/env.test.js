test("Should load test database URL from .env.test", () => {
  expect(process.env.DB_NAME).toBe("test");
});
