import React from 'react';
import { Home } from "communi-design-system";
import { Link, useLoaderData } from "@remix-run/react";
import { type LoaderArgs, json, redirect } from "@remix-run/cloudflare";
import { getUser } from "~/utils/session.server";
import { useModal } from "~/context";
export const loader = async ({ request, context }: LoaderArgs) => {
  const { sessionStorage } = context as any;
  const user =
    (await getUser(request, sessionStorage));
  const { discord_user_id, provider, account } = user ?? {}
  console.log('user', user)
  const authedDiscord = Boolean(discord_user_id);
  const authedWallet = Boolean(provider);
  console.log(
    "AuthStatus",
    authedDiscord,
    authedWallet
  );
  // return json({ session: Boolean(discord_user_id) });
  if (authedDiscord && !authedWallet) {
    return redirect("/connect");
  } else if (authedDiscord && authedWallet) {
    return json({ session: Boolean(discord_user_id) });
  } else {
    return json({ session: false });
  }
};

export default function Index() {
  const { session } = useLoaderData();
  const { closeModal, isOpen } = useModal();

  React.useEffect(() => {
    if (isOpen) {
      closeModal();
    }
  }, []);

  return (
    <div>
      <Home component={Link} session={session} />
    </div>
  );
}
