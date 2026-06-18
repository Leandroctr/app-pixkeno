import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";

export const adminCookieName = "admin_session";

function getAdminToken() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  return createHash("sha256")
    .update(`${email}:${password}`)
    .digest("hex");
}

export function validateAdminCredentials(email: string, password: string) {
  return (
    Boolean(process.env.ADMIN_EMAIL) &&
    Boolean(process.env.ADMIN_PASSWORD) &&
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  );
}

export async function createAdminSession() {
  const token = getAdminToken();

  if (!token) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return true;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(adminCookieName);
}

export async function isAdminAuthenticated() {
  const token = getAdminToken();

  if (!token) {
    return false;
  }

  const cookieStore = await cookies();
  return cookieStore.get(adminCookieName)?.value === token;
}
