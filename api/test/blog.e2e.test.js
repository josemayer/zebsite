const request = require("supertest");
const app = require("../app");
const bcrypt = require("bcrypt");
const { resetUsers, resetPosts } = require("./config/testDatabase");

const db = require("../services/db");

describe("blog service", () => {
  afterAll(async () => {
    await db.close();
  });

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(jest.fn());
  });

  describe("post creation", () => {
    var tokenAdmin, tokenUser;

    beforeAll(async () => {
      const usernameAdmin = "adminblog";
      const passwordAdmin = "password123";
      const usernameUser = "userblog";
      const passwordUser = "testpassword";

      await db.query(
        "INSERT INTO users (username, password, service, role) VALUES ($1, $2, 'blog', 'admin')",
        [usernameAdmin, bcrypt.hashSync(passwordAdmin, 10)]
      );
      await db.query(
        "INSERT INTO users (username, password, service, role) VALUES ($1, $2, 'blog', 'user')",
        [usernameUser, bcrypt.hashSync(passwordUser, 10)]
      );

      tokenAdmin = await request(app)
        .post("/login")
        .send({ username: usernameAdmin, password: passwordAdmin })
        .then((response) => response.body.token);

      tokenUser = await request(app)
        .post("/login")
        .send({ username: usernameUser, password: passwordUser })
        .then((response) => response.body.token);
    });

    afterAll(async () => {
      await resetUsers();
      await resetPosts();
    });

    beforeEach(async () => {
      await resetPosts();
    });

    test("should create a new post on /blog/post POST route", async () => {
      const response = await request(app)
        .post("/blog/post")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({
          title: "Test Post",
          content: "This is a test post",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        message: "Post created successfully",
      });
    });

    test("should return 401 if no token is provided on /blog/post POST route", async () => {
      const response = await request(app).post("/blog/post").send({
        title: "Test Post",
        content: "This is a test post",
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({
        message: "Unauthorized",
      });
    });

    test("should return 403 without admin role on /blog/post POST route", async () => {
      const response = await request(app)
        .post("/blog/post")
        .set("Authorization", `Bearer ${tokenUser}`)
        .send({
          title: "Test Post",
          content: "This is a test post",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        message: "Forbidden",
      });
    });
  });

  describe("post listing", () => {
    var tokenAdmin;

    beforeAll(async () => {
      const usernameAdmin = "adminblog";
      const passwordAdmin = "password123";

      await db.query(
        "INSERT INTO users (username, password, service, role) VALUES ($1, $2, 'blog', 'admin')",
        [usernameAdmin, bcrypt.hashSync(passwordAdmin, 10)]
      );

      tokenAdmin = await request(app)
        .post("/login")
        .send({ username: usernameAdmin, password: passwordAdmin })
        .then((response) => response.body.token);

      for (let i = 0; i < 2; i++) {
        await request(app)
          .post("/blog/post")
          .set("Authorization", `Bearer ${tokenAdmin}`)
          .send({
            title: `Test Post ${i}`,
            content: `This is a test post with number ${i}`,
          });
      }
    });

    afterAll(async () => {
      await resetUsers();
      await resetPosts();
    });

    test("should return all posts summary on /blog/posts GET route", async () => {
      const response = await request(app).get("/blog/posts");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([
        {
          id: 2,
          title: "Test Post 1",
          author: "adminblog",
        },
        {
          id: 1,
          title: "Test Post 0",
          author: "adminblog",
        },
      ]);
    });

    test("should return post details on /blog/post/:id GET route", async () => {
      const response = await request(app).get("/blog/post/1");

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        title: "Test Post 0",
        content: "This is a test post with number 0",
        author: "adminblog",
      });
    });

    test("should return 404 if post does not exist on /blog/post/:id GET route", async () => {
      const response = await request(app).get("/blog/post/3");

      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        message: "Post not found",
      });
    });

    test("should return empty array if no posts on /blog/posts GET route", async () => {
      await resetPosts();

      const response = await request(app).get("/blog/posts");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("post deletion", () => {
    var tokenAdmin, tokenUser;

    beforeAll(async () => {
      const usernameAdmin = "adminblog";
      const passwordAdmin = "password123";
      const usernameUser = "userblog";
      const passwordUser = "testpassword";

      await db.query(
        "INSERT INTO users (username, password, service, role) VALUES ($1, $2, 'blog', 'admin')",
        [usernameAdmin, bcrypt.hashSync(passwordAdmin, 10)]
      );
      await db.query(
        "INSERT INTO users (username, password, service, role) VALUES ($1, $2, 'blog', 'user')",
        [usernameUser, bcrypt.hashSync(passwordUser, 10)]
      );

      tokenAdmin = await request(app)
        .post("/login")
        .send({ username: usernameAdmin, password: passwordAdmin })
        .then((response) => response.body.token);

      tokenUser = await request(app)
        .post("/login")
        .send({ username: usernameUser, password: passwordUser })
        .then((response) => response.body.token);

      await request(app)
        .post("/blog/post")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({
          title: "Test Post",
          content: "This is a test post",
        });
    });

    afterAll(async () => {
      await resetUsers();
      await resetPosts();
    });

    test("should delete post successfully on /blog/post/:id DELETE route", async () => {
      const response = await request(app)
        .delete("/blog/post/1")
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(response.statusCode).toBe(204);

      const deletedPost = await request(app).get("/blog/post/1");

      expect(deletedPost.statusCode).toBe(404);
    });

    test("should return 404 if post does not exist on /blog/post/:id DELETE route", async () => {
      const response = await request(app)
        .delete("/blog/post/3")
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        message: "Post not found",
      });
    });

    test("should return 401 if no token is provided on /blog/post/:id DELETE route", async () => {
      const response = await request(app).delete("/blog/post/1");

      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({
        message: "Unauthorized",
      });
    });

    test("should return 403 without admin role on /blog/post/:id DELETE route", async () => {
      const response = await request(app)
        .delete("/blog/post/1")
        .set("Authorization", `Bearer ${tokenUser}`);

      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        message: "Forbidden",
      });
    });
  });
});
