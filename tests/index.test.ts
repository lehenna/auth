import { client, inputCode, sessions, testUser } from "./lib/client";

test("sendVerificationCode", async () => {
  const user = await client.sendVerificationCode(testUser.email);
  expect(user.id === testUser.id);
});

test("validateVerificationCode", async () => {
  const session = await client.validateVerificationCode(
    testUser.email,
    inputCode,
    {}
  );
  expect(session.user.id === testUser.id);
});

test("validateUserSession", async () => {
  const session = await client.validateUserSession(sessions[0].id);
  expect(session.user.id === testUser.id);
});
