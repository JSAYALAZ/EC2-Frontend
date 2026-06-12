import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("../mods/home/pages/LandingPage.tsx"),
  route("/login", "../mods/auth/pages/LoginPage.tsx"),
  route("/register", "../mods/auth/pages/RegisterPage.tsx"),
  route("/verify", "../mods/auth/pages/VerifyPage.tsx"),
  route("/logout", "../mods/auth/pages/LogoutPage.tsx"),
  route("/dashboard", "../mods/media/pages/MediaPage.tsx"),
] satisfies RouteConfig;

