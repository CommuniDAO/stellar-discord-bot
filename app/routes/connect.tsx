import { ImportAccount } from "~/templates/ImportAccount";
import { type LoaderArgs, redirect } from "@remix-run/cloudflare";
import { getUser } from "~/utils/session.server";

export const loader = async ({ request, context }: LoaderArgs) => {
  const { DB, sessionStorage } = context as any;

  const user =  await getUser(request, sessionStorage)
  console.log("user", user)
  if (!user) return redirect('/')
  
  return null
};


export default function Index() {
  return (
      <ImportAccount />
  );
}

