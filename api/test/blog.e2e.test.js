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

      await db.query(
        "INSERT INTO categories (name, description) VALUES ($1, $2)",
        ["Test Category", "This is the first test category"]
      );
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
          subtitle: "Test subtitle",
          category_id: 1,
          content: "This is a test post",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({
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
      expect(response.body).toEqual({
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
      expect(response.body).toEqual({
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

      await db.query(
        "INSERT INTO categories (name, description) VALUES ($1, $2)",
        ["Test Listing", "This is the first test category of listing tests"]
      );

      for (let i = 0; i < 2; i++) {
        await request(app)
          .post("/blog/post")
          .set("Authorization", `Bearer ${tokenAdmin}`)
          .send({
            title: `Test Post ${i}`,
            subtitle: `Test post description with index ${i}`,
            category_id: 1,
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
          subtitle: "Test post description with index 1",
          author: "adminblog",
        },
        {
          id: 1,
          title: "Test Post 0",
          subtitle: "Test post description with index 0",
          author: "adminblog",
        },
      ]);
    });

    test("should return post details on /blog/post/:id GET route", async () => {
      const response = await request(app).get("/blog/post/1");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        id: 1,
        title: "Test Post 0",
        subtitle: "Test post description with index 0",
        category_id: 1,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        content: "This is a test post with number 0",
        author: "adminblog",
        author_id: 1,
      });
    });

    test("should return 404 if post does not exist on /blog/post/:id GET route", async () => {
      const response = await request(app).get("/blog/post/3");

      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({
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

      await db.query(
        "INSERT INTO categories (name, description) VALUES ($1, $2)",
        ["Test Deletion", "This is the first test category of deletion tests"]
      );

      await request(app)
        .post("/blog/post")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({
          title: "Test Post",
          subtitle: "Test post subtitle",
          category_id: 1,
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
      expect(response.body).toEqual({
        message: "Post not found",
      });
    });

    test("should return 401 if no token is provided on /blog/post/:id DELETE route", async () => {
      const response = await request(app).delete("/blog/post/1");

      expect(response.statusCode).toBe(401);
      expect(response.body).toEqual({
        message: "Unauthorized",
      });
    });

    test("should return 403 without admin role on /blog/post/:id DELETE route", async () => {
      const response = await request(app)
        .delete("/blog/post/1")
        .set("Authorization", `Bearer ${tokenUser}`);

      expect(response.statusCode).toBe(403);
      expect(response.body).toEqual({
        message: "Forbidden",
      });
    });
  });

  describe("post edit", () => {
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

      await db.query(
        "INSERT INTO categories (name, description) VALUES ($1, $2)",
        ["Test Edit 1", "This is the first test category of edit tests"]
      );
      await db.query(
        "INSERT INTO categories (name, description) VALUES ($1, $2)",
        ["Test Edit 2", "This is the second test category of edit tests"]
      );
    });

    beforeEach(async () => {
      resetPosts();
      await request(app)
        .post("/blog/post")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({
          title: "Initial Post",
          subtitle: "Initial post subtitle",
          category_id: 1,
          content: "This is the original content",
        });
    });

    afterAll(async () => {
      await resetUsers();
      await resetPosts();
    });

    test("should edit a post successfully without all fields on /blog/post/:id PUT route", async () => {
      const response = await request(app)
        .put("/blog/post/1")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({
          title: "Updated Post",
          content: "This is the updated content",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        id: "1",
        message: "Post updated successfully",
      });

      const updatedPost = await request(app).get("/blog/post/1");
      expect(updatedPost.body).toEqual({
        id: 1,
        title: "Updated Post",
        subtitle: "Initial post subtitle",
        category_id: 1,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        content: "This is the updated content",
        author: "adminblog",
        author_id: 1,
      });
    });

    test("should throw error if all keys are not allowed on /blog/post/:id PUT route", async () => {
      const response = await request(app)
        .put("/blog/post/1")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({ invalidKey: "Test", anotherInvalidKey: "Still test" });

      expect(response.statusCode).toBe(403);
      expect(response.body).toEqual({
        message: expect.stringContaining("None of your keys are allowed"),
      });
    });

    test("should edit valid keys despite mixed with invalid ones on /blog/post/:id PUT route", async () => {
      const response = await request(app)
        .put("/blog/post/1")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({ title: "Updated title", invalid: "Test" });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        id: "1",
        message: "Post updated successfully",
      });

      const updatedPost = await request(app).get("/blog/post/1");
      expect(updatedPost.body).toEqual({
        id: 1,
        title: "Updated title",
        subtitle: "Initial post subtitle",
        category_id: 1,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        content: "This is the original content",
        author: "adminblog",
        author_id: 1,
      });
    });

    test("should return 404 if the post does not exist on /blog/post/:id PUT route", async () => {
      const response = await request(app)
        .put("/blog/post/99")
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send({
          title: "Nonexistent Post",
          content: "Trying to update a non-existent post",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({
        message: "Post not found",
      });
    });

    test("should return 401 if no token is provided on /blog/post/:id PUT route", async () => {
      const response = await request(app).put("/blog/post/1").send({
        title: "Unauthorized Edit",
        content: "This edit should not be allowed",
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toEqual({
        message: "Unauthorized",
      });
    });

    test("should return 403 without admin role on /blog/post/:id PUT route", async () => {
      const response = await request(app)
        .put("/blog/post/1")
        .set("Authorization", `Bearer ${tokenUser}`)
        .send({
          title: "Unauthorized User Edit",
          content: "This edit should be forbidden",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body).toEqual({
        message: "Forbidden",
      });
    });
  });
});
