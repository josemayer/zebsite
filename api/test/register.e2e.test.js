const request = require("supertest");
const app = require("../app");
const { resetUsers } = require("./config/testDatabase");

const db = require("../services/db");

describe("Register E2E Tests", () => {
  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    await resetUsers();
  });

  test("POST /api/users should create a new user", async () => {
    const response = await request(app)
      .post("/register")
      .send({ username: "testuser", password: "password123" });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      message: "Registration successful",
    });
  });
});
