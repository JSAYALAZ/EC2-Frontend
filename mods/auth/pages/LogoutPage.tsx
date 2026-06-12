import { redirect } from "react-router";
import { destroyAuthCookie } from "../util/auth.server";

export async function loader() {
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroyAuthCookie(),
    },
  });
}

export default function Logout() {
  return null;
}
