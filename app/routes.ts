import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("../mods/home/pages/LandingPage.tsx"),
  route("/login", "../mods/auth/pages/LoginPage.tsx"),
  route("/logout", "../mods/auth/pages/LogoutPage.tsx"),
  route("/dashboard", "../mods/clients/pages/ClientsPage.tsx"),
] satisfies RouteConfig;
