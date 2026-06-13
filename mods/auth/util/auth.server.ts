import { createCookie, redirect } from "react-router";

export const authCookie = createCookie("auth_token", {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24, // 1 día
});

export async function getToken(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  const token = await authCookie.parse(cookieHeader);
  return token ?? null;
}

export async function requireAuth(request: Request) {
  const token = await getToken(request);

  if (!token) {
    throw redirect("/login");
  }

  return token;
}

export async function createAuthCookie(token: string) {
  return authCookie.serialize(token);
}

export async function destroyAuthCookie() {
  return authCookie.serialize("", {
    maxAge: 0,
  });
}
const isServer = typeof window === "undefined";
export function getApiUrl() {
  if (isServer) {
    console.log("Es server");
    return process.env.API_URL ?? "http://[IP_ADDRESS]/api";
  }
  return `/api`;
}
