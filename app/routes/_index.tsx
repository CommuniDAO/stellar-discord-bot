import { Home } from 'communi-design-system';
import { Link, useLoaderData } from '@remix-run/react'
import { type LoaderArgs, json } from "@remix-run/cloudflare";
import { getUser } from '~/utils/session.server';

export const loader = async ({ request, context }: LoaderArgs) => {
  const { sessionStorage } = context as any;

  const user =  await getUser(request, sessionStorage)
  console.log("user", user)
  return json({ session: Boolean(user), user });
};

export default function Index() {
  const session = useLoaderData();
  console.log('session', session)
  return (
    <div>
      <Home component={Link} />
    </div>
  );
}