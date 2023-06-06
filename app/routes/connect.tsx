// import { ImportAccount } from "~/templates/ImportAccount";
import { useLoaderData } from "@remix-run/react";
import { type LoaderArgs, redirect, json } from "@remix-run/cloudflare";
import { getUser } from "~/utils/session.server";
import { useWallet } from "~/context";
import React from 'react';
export const loader = async ({ request, context }: LoaderArgs) => {
  const { DB, sessionStorage } = context as any;

  const user = await getUser(request, sessionStorage);
  console.log("user", user);
  if (!user) return redirect("/");

  return json({ session: Boolean(user), user });
};

export default function Index() {
  const session = useLoaderData();
  const { newSession } = useWallet();

  React.useEffect(() => {
    newSession();
  }, []);
  return (
    <div>
      <div
        style={{
          backgroundImage:
            "url('https://imagedelivery.net/uDbEDRBQqhBXrrfuCRrATQ/cb3fca94-6358-47a3-6150-a10d0d7e1100/public')",
          backgroundSize: "cover",
          height: "100vh",
          width: "100%",
        }}
      ></div>
    </div>
  );
}
