import assert from "node:assert/strict";
import { before, after, describe, it } from "node:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import { RedisMemoryServer } from "redis-memory-server";
import request from "supertest";
import { io as connectSocket } from "socket.io-client";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-secret-that-is-long-enough-for-the-suite";
process.env.CLIENT_ORIGIN = "http://localhost:5173";

const mongo = await MongoMemoryServer.create();
const redis = new RedisMemoryServer();
process.env.MONGODB_URI = mongo.getUri("social_forum_test");
process.env.REDIS_HOST = await redis.getHost();
process.env.REDIS_PORT = String(await redis.getPort());

const { createHttpRuntime } = await import("../server.js");
const { connectRedis, disconnectRedis } = await import("../config/redis.js");
const { default: connectDB, disconnectDB } = await import("../config/db.js");
const { startFeedQueue, stopFeedQueue } = await import("../config/queue.js");
const { startFeedWorker, stopFeedWorker } = await import("../workers/feedWorker.js");
const { default: User } = await import("../models/User.js");
const { default: Conversation } = await import("../models/Conversation.js");

let runtime;
let baseUrl;
let alice;
let bob;
let aliceToken;
let bobToken;

const signup = async (user) => {
  const response = await request(runtime.app).post("/api/auth/signup").send(user);
  assert.equal(response.status, 201);
};

const signin = async (email, password) => {
  const response = await request(runtime.app).post("/api/auth/signin").send({ email, password });
  assert.equal(response.status, 200);
  return response.body;
};

const waitForEvent = (socket, event, timeout = 5000) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), timeout);
  socket.once(event, (payload) => {
    clearTimeout(timer);
    resolve(payload);
  });
});

before(async () => {
  await connectDB();
  await connectRedis();
  await startFeedQueue();
  await startFeedWorker();
  runtime = createHttpRuntime();
  await new Promise((resolve) => runtime.httpServer.listen(0, resolve));
  const address = runtime.httpServer.address();
  baseUrl = `http://127.0.0.1:${address.port}`;

  await signup({ firstName: "Alice", lastName: "Tester", username: "alice", email: "alice@example.com", password: "password123" });
  await signup({ firstName: "Bob", lastName: "Tester", username: "bob", email: "bob@example.com", password: "password123" });
  alice = await User.findOne({ email: "alice@example.com" });
  bob = await User.findOne({ email: "bob@example.com" });
  aliceToken = (await signin("alice@example.com", "password123")).accessToken;
  bobToken = (await signin("bob@example.com", "password123")).accessToken;
});

after(async () => {
  await runtime.io.close();
  if (runtime.httpServer.listening) {
    await new Promise((resolve) => runtime.httpServer.close(resolve));
  }
  await stopFeedWorker();
  await stopFeedQueue();
  await disconnectRedis();
  await disconnectDB();
  await redis.stop();
  await mongo.stop();
});

describe("backend foundation", () => {
  it("reports liveness and readiness", async () => {
    const live = await request(runtime.app).get("/health/live");
    assert.equal(live.status, 200);
    assert.equal(live.body.status, "ok");

    const ready = await request(runtime.app).get("/health/ready");
    assert.equal(ready.status, 200);
    assert.equal(ready.body.status, "ready");
    assert.equal(ready.body.checks.mongo.ready, true);
    assert.equal(ready.body.checks.redis.ready, true);
    assert.equal(ready.body.checks.bullmq.queue, true);
    assert.equal(ready.body.checks.bullmq.worker, true);
  });

  it("rejects invalid credentials and protected requests", async () => {
    const invalid = await request(runtime.app).post("/api/auth/signin").send({
      email: "alice@example.com",
      password: "wrong-password",
    });
    assert.equal(invalid.status, 401);

    const protectedResponse = await request(runtime.app).get("/api/users/profile");
    assert.equal(protectedResponse.status, 401);
  });

  it("registers and logs in a valid user", async () => {
    await signup({ firstName: "Charlie", lastName: "Tester", username: "charlie", email: "charlie@example.com", password: "password123" });
    const session = await signin("charlie@example.com", "password123");
    assert.ok(session.accessToken);
    assert.equal(session.user.email, "charlie@example.com");
  });

  it("rejects invalid post input at the route boundary", async () => {
    const response = await request(runtime.app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ content: "" });
    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.ok(Array.isArray(response.body.errors));
  });

  it("rejects user B from updating user A post", async () => {
    const created = await request(runtime.app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ title: "Alice post", content: "hello" });
    assert.equal(created.status, 201);

    const update = await request(runtime.app)
      .put(`/api/posts/${created.body.post._id}`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send({ content: "Bob takeover" });
    assert.equal(update.status, 403);
  });

  it("creates a post and enforces comment ownership", async () => {
    const createdPost = await request(runtime.app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ title: "Foundation", content: "Backend foundation" });
    assert.equal(createdPost.status, 201);

    const createdComment = await request(runtime.app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ postId: createdPost.body.post._id, content: "Alice comment" });
    assert.equal(createdComment.status, 201);

    const update = await request(runtime.app)
      .put(`/api/comments/${createdComment.body.comment._id}`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send({ content: "Bob takeover" });
    assert.equal(update.status, 403);
  });

  it("runs profile, follow, feed, reaction, search, and chat smoke flows", async () => {
    const profile = await request(runtime.app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${aliceToken}`);
    assert.equal(profile.status, 200);
    assert.equal(profile.body.user.email, "alice@example.com");

    const follow = await request(runtime.app)
      .put("/api/users/profile/bob/follow")
      .set("Authorization", `Bearer ${aliceToken}`);
    assert.equal(follow.status, 200);
    assert.equal(follow.body.isFollowing, true);

    const unfollow = await request(runtime.app)
      .put("/api/users/profile/bob/follow")
      .set("Authorization", `Bearer ${aliceToken}`);
    assert.equal(unfollow.status, 200);
    assert.equal(unfollow.body.isFollowing, false);

    const createdPost = await request(runtime.app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ title: "Foundation smoke", content: "Searchable foundation smoke content" });
    assert.equal(createdPost.status, 201);

    const feed = await request(runtime.app)
      .get("/api/posts?tab=explore&limit=10")
      .set("Authorization", `Bearer ${bobToken}`);
    assert.equal(feed.status, 200);
    assert.ok(feed.body.posts.some((post) => post._id === createdPost.body.post._id));

    const reaction = await request(runtime.app)
      .post(`/api/posts/${createdPost.body.post._id}/react`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send({ emoji: "like" });
    assert.equal(reaction.status, 200);
    assert.ok(reaction.body.reactions.some((item) => item.emoji === "like"));

    const search = await request(runtime.app)
      .get("/api/search?q=alice&type=user&limit=500")
      .set("Authorization", `Bearer ${bobToken}`);
    assert.equal(search.status, 200);
    assert.ok(search.body.data.users.some((user) => user.Username === "alice"));
    assert.ok(search.body.data.users.length <= 50);

    const chat = await request(runtime.app)
      .post("/api/chat/conversations")
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ receiverId: bob._id.toString() });
    assert.equal(chat.status, 200);
    assert.ok(chat.body.conversation.participants.some((participant) => participant._id === bob._id.toString()));
  });

  it("requires auth intent for cookie-authenticated mutations", async () => {
    const response = await request(runtime.app).post("/api/auth/refresh");
    assert.equal(response.status, 403);
  });

  it("blocks outsiders from sending or marking a conversation read", async () => {
    const conversation = await Conversation.create({ participants: [alice._id, bob._id] });
    await signup({ firstName: "Out", lastName: "Sider", username: "outsider", email: "outsider@example.com", password: "password123" });
    const outsider = await User.findOne({ email: "outsider@example.com" });
    const outsiderToken = (await signin("outsider@example.com", "password123")).accessToken;
    const socket = connectSocket(baseUrl, { auth: { token: outsiderToken }, transports: ["websocket"] });
    await waitForEvent(socket, "connect");

    const sendError = waitForEvent(socket, "receive_error");
    socket.emit("send_message", { conversationId: conversation._id.toString(), content: "intrusion" });
    assert.match((await sendError).message, /quyền gửi/i);

    const readError = waitForEvent(socket, "receive_error");
    socket.emit("read_conversation", conversation._id.toString());
    assert.match((await readError).message, /quyền đọc/i);
    socket.close();
    await User.findByIdAndDelete(outsider._id);
  });

  it("allows participants to send messages and enforces block rules", async () => {
    const allowedConversation = await Conversation.create({ participants: [alice._id, bob._id] });
    const aliceSocket = connectSocket(baseUrl, { auth: { token: aliceToken }, transports: ["websocket"] });
    const bobSocket = connectSocket(baseUrl, { auth: { token: bobToken }, transports: ["websocket"] });
    await Promise.all([waitForEvent(aliceSocket, "connect"), waitForEvent(bobSocket, "connect")]);

    const received = waitForEvent(bobSocket, "receive_message");
    aliceSocket.emit("send_message", { conversationId: allowedConversation._id.toString(), content: "hello bob" });
    assert.equal((await received).content, "hello bob");

    await User.findByIdAndUpdate(bob._id, { $addToSet: { blockedUsers: alice._id } });
    const blockedConversation = await Conversation.create({ participants: [alice._id, bob._id] });
    const blockedError = waitForEvent(aliceSocket, "receive_error");
    aliceSocket.emit("send_message", { conversationId: blockedConversation._id.toString(), content: "blocked" });
    assert.match((await blockedError).message, /bị người này chặn/i);

    await User.findByIdAndUpdate(bob._id, { $pull: { blockedUsers: alice._id } });
    aliceSocket.close();
    bobSocket.close();
  });
});
