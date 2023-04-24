import { Home } from 'communi-design-system';
import { Link } from '@remix-run/react'

export default function Index() {
  return (
    <div>
      <Home component={Link} />
    </div>
  );
}

