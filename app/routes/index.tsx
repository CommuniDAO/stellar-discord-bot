import { useFetcher} from '@remix-run/react';

export default function Index() {
  const fetcher = useFetcher();

  const postInfo = async () => {
    if (fetcher.type ==='init') {
      console.log('init')
      fetcher.submit(
        { message: 'OK'},
        { method: 'post', action: '/post_info'}
        )
    }
  }


  return (

    <div>
      <button onClick={() => postInfo()}>Hello</button>
    </div>
  );
}
