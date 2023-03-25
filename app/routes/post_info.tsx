import type { ActionFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import {
  Link,
  Outlet,
  useLoaderData,
} from "@remix-run/react";


export let action: ActionFunction = async ({
  request,
  context,
}): Promise<Response | null> => {
  try {
    const ctx = context as any;
    let form = await request.formData();
    const fields = Array.from(form.entries())
    const data: any = Object.fromEntries(fields);
    console.log('data', data)
      
    return json({ message: 'OK'})
  } catch (error: any) {
    return json({message: 'ERROR'})
  }
}