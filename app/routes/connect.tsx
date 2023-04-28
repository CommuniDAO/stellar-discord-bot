import { ImportAccount } from "~/templates/ImportAccount";
import { useLoaderData } from "@remix-run/react";
import { type LoaderArgs, redirect, json } from "@remix-run/cloudflare";
import { getUser } from "~/utils/session.server";

export const loader = async ({ request, context }: LoaderArgs) => {
  const { DB, sessionStorage } = context as any;

  const user =  await getUser(request, sessionStorage)
  console.log("user", user)
  if (!user) return redirect('/')
  
  return json({ session: Boolean(user), user });
};


export default function Index() {
  const session = useLoaderData();
  console.log('session', session)
  
  return (
      <ImportAccount />
  );
}

