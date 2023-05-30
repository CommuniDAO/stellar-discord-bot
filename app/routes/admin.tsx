import { type LoaderArgs, json, redirect } from "@remix-run/cloudflare";
import { getUser } from "~/utils/session.server";
import { AdminHeader } from 'communi-design-system';
import { adminMenu } from '~/utils/constants'
import { Link, Outlet } from '@remix-run/react';

export const loader = async ({ request, context }: LoaderArgs) => {
  const { env, sessionStorage } = context as any;
  const { adminkey } = env;
  const user = await getUser(request, sessionStorage);
  const { provider, account } = user ?? null;
  if (adminkey !== account) {
    return redirect("/")
  } else {
    return json({ isAdmin: true, user, provider });
  }
};

export default function Admin() {
  return <div>
    <AdminHeader menu={adminMenu} component={Link} />
    Settings
    <Outlet />
  </div>
}