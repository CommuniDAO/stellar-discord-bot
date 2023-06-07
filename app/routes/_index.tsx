import React from "react";
import { Home } from "communi-design-system";
import { Link, useLoaderData } from "@remix-run/react";
import { type LoaderArgs, json, redirect } from "@remix-run/cloudflare";
import { getUserAuthProgress } from "~/utils/session.server";
import { useWallet } from "~/context";

export const loader = async ({ request, context }: LoaderArgs) => {
  const { sessionStorage } = context as any;
  const authProgress = await getUserAuthProgress(request, sessionStorage);
  return authProgress;
};

export default function Index() {
  const { view } = useLoaderData();
  const { newSession, signTransaction } = useWallet();

  return (
    <div>
      <Home
        component={Link}
        view={view}
        openWallet={newSession}
        signTransaction={signTransaction}
      />
    </div>
  );
}
