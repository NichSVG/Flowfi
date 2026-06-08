// Shared mock user storage for demo purposes
// In production, this would be replaced with a database

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

const users: Map<string, MockUser> = new Map();

// Add demo user
users.set("demo@flowfi.com", {
  id: "demo_user",
  name: "Demo User",
  email: "demo@flowfi.com",
  password: "password123",
});

export function getUser(email: string): MockUser | undefined {
  return users.get(email);
}

export function createUser(name: string, email: string, password: string): MockUser {
  const user: MockUser = {
    id: "user_" + Date.now(),
    name: name || email.split("@")[0],
    email,
    password,
  };
  users.set(email, user);
  return user;
}

export function userExists(email: string): boolean {
  return users.has(email);
}
