import { json, type LoaderArgs } from "@remix-run/cloudflare";
import { getUser } from "~/utils/session.server";
import { generateAuthChallenge } from '~/utils/stellarUtils.server';
import { Keypair } from "stellar-base";


export const loader = async ({ request, context, params }: LoaderArgs) => {
    const { sessionStorage } = context as any;
    const { assetId, Issuer } = params
    const { DB } = context.env;
    const stmt = DB.prepare(`
    SELECT * 
    FROM balances 
    WHERE issuer_id = ?1 AND asset_id = ?2 
  `);

  const records = await stmt.bind(Issuer, assetId).all();

  return json(records.results);
}