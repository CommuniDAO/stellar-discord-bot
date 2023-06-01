import { Networks, TransactionBuilder } from 'stellar-base';
import { badgeDetails } from './badge-details';
import jwt from "@tsndr/cloudflare-worker-jwt";
import type { Horizon } from 'horizon-api';
import { Discord, StellarAccount } from '~/models';
import { getUser } from './session.server';
import { Balance, Claimable } from '~/models';
import { BalanceForm, ClaimableForm } from '~/forms';


export async function handleResponse(response: Response) {
  const { headers, ok } = response;
  const contentType = headers.get('content-type');
  
  const content = contentType
    ? contentType.includes('json')
      ? response.json()
      : response.text()
    : { status: response.status, message: response.statusText };
  if (ok) return content;
  else throw await content;
}  

export async function fetchRegisteredAccounts(request: Request, context: any) {
  const { DB } = context.env as any;
  const { discord_user_id } = await getUser(request, context.sessionStorage);
  const stellarAccounts = await StellarAccount.findBy("discord_user_id", discord_user_id, DB);
  return stellarAccounts;
}
export async function getAccessToken(account: string, request: Request, context: any) {
  const { DB } = context.env as any;
  const { discord_user_id } = await getUser(request, context.sessionStorage);
  const record = await StellarAccount.findBy("public_key", account, DB);
  return record[0].refresh_token;
}
export async function generateProofs(request: Request, context: any, accounts: string[]) {
  const { sessionStorage } = context as any;
  const user = await getUser(request, sessionStorage);
  const { discord_user_id } = user ?? false;

  const proofs = [];
  var totalSorobanQuestCodes = 0;
  var totalStellarQuestCodes = 0;
  for (const account of accounts) {
    const accesstoken = await getAccessToken(account, request, context);
    const decoded = await jwt.decode(accesstoken)
    let passphrase: Networks = Networks.PUBLIC;
    let transaction = new (TransactionBuilder.fromXDR as any)(decoded.payload.xdr, passphrase);
    const signature = transaction.signatures[0].signature().toString("base64");
    const token = await getVerificationToken(account, 'production', transaction, signature);
    proofs.push(token);
    totalSorobanQuestCodes += token.soroban.length;
    totalStellarQuestCodes += token.userBadges.length;
  }
  console.log(proofs, 'THE PROOFS')

  const metadata = {
    sorobanquest: totalSorobanQuestCodes,
    stellarquest: totalStellarQuestCodes
  };

  console.log(metadata, 'metadata')
  const pushed = await Discord.pushMetadata(discord_user_id, metadata, context.env);
  console.log(pushed, "PUSHED")

  return proofs;
}

export async function generateVerificationHash(verificationObject: any) {
  let jsonString = JSON.stringify(verificationObject);
  let hash = await crypto.subtle.digest('SHA-256', Buffer.from(jsonString));
  let hashHex = Buffer.from(hash).toString('hex');
  return hashHex;
}


export const horizonUrl = (env: any) =>
  env === 'production'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';

export const networkPassphrase = (env: any) =>
  env === 'production' ? Networks['PUBLIC'] : Networks['TESTNET'];

// 12/13/2023
export const DEADLINE = 1702486141;

export const stellarNetwork = (env: any) =>
  env === 'production' ? 'PUBLIC' : 'TESTNET';

export const stellarExpertTxLink = (hash: string, env: any) =>
  `https://stellar.expert/explorer/${stellarNetwork(
    env,
  ).toLowerCase()}/tx/${hash}`;



export async function fetchOperations(
  env: any,
  account: string,
  cursor?: string,
) {

  if (cursor !== undefined) {
    const url = horizonUrl(env) +
      `/accounts/${account}/operations?cursor=${cursor}&limit=200&order=desc&include_failed=false`;
    console.log(url)
    const response = await fetchWithRetry(url);
    return handleResponse(response);
  } else {
    const url = horizonUrl(env) +
      `/accounts/${account}/operations?limit=200&order=desc&include_failed=false`;
    const response = await fetchWithRetry(url);
    return handleResponse(response);
  }
}

export async function fetchOperation(
  env: any,
  operationId: string,
) {
  return fetch(horizonUrl(env) + `/operations/${operationId}`).then(
    handleResponse,
  );
}



export async function getVerificationToken(
  pubkey: string,
  env: any,
  message: any,
  signature: any,
) {
  let accountOperations: any = [];
  let opRes: any = await fetchOperations(env, pubkey);
  if (opRes.status === 404) {
    return;
  }
  console.log('opRes', opRes)
  let iter = 0
  while (
    accountOperations.length % 200 === 0 ||
    opRes._embedded.records.length !== 0
  ) {
    //handle extremely large accounts
    if (iter > 1000) { break }
    accountOperations = accountOperations.concat(opRes._embedded.records);
    opRes = await fetch(opRes['_links'].next.href).then(handleResponse);
    iter += 1
  }

  const badgePayments = accountOperations
    .filter(
      (item: any) => item.type === 'payment' && item.asset_type !== 'native',
    )
    .filter((item: any) =>
      badgeDetails.find(
        ({ code, issuer }) => item.asset_code === code && item.from === issuer,
      ),
    );

  const badgeOperations = accountOperations
    .filter(
      (item: any) =>
        item.type === 'create_claimable_balance' &&
        item.claimants.some((e: any) => e.destination === pubkey),
    )
    .filter((item: any) =>
      badgeDetails.find(
        ({ code, issuer }) =>
          item.asset.split(':')[0] === code &&
          item.asset.split(':')[1] === issuer,
      ),
    );

  let allBadges = await Promise.all(
    badgeDetails.map(async (item) => {
      let payment;
      if (/^SSQ0[234]|SQ040[1-6]$/.test(item.code)) {
        payment = badgeOperations.find(
          ({ asset, source_account }: any) =>
            item.code === asset.split(':')[0] &&
            item.issuer === source_account &&
            item.issuer === asset.split(':')[1],
        );
      } else {
        payment = badgePayments.find(
          ({ asset_code, from }: any) =>
            item.code === asset_code && item.issuer === from,
        );
      }
      if (!payment) return item;
      return {
        ...item,
        owned: true,
        date: new Date(payment.created_at).toISOString().split('T')[0],
        hash: payment.transaction_hash,
        operation: payment.id,
        prize: await getPrizeTransaction(payment.transaction_hash, env),
      };
    }),
  );
  let userBadges = allBadges.filter((item) => item.owned === true);
  console.log(userBadges)
  let soroban = userBadges.filter((item) => item.soroban === true);
  console.log(soroban)
  console.log(soroban.length)
  console.log('user badges - soroban badges', userBadges.length - soroban.length)
  let generateVerificationOperations = (assets: any[]) => {
    return assets.reduce((acc, item, i, a) => {
      return acc.concat(item.operation);
    }, []);
  };
  
  let verificationObject = {
    p: pubkey,
    m: message,
    s: signature,
    d: new Date(),
    o: generateVerificationOperations(userBadges),
  };

  const hash = await generateVerificationHash(verificationObject);
  let finalArray = new Array(JSON.stringify(verificationObject), hash);
  let token = Buffer.from(finalArray.join(',')).toString('base64');
  console.log(token)
  return { token, userBadges, soroban };
}


async function getPrizeTransaction(hash: string, env: any) {
  let res = await fetch(
    horizonUrl(env) + '/transactions/' + hash + '/operations',
  );
  let json: any = await res.json();
  let prizeRecord = json._embedded.records.filter(
    (item: any) =>
      item.hasOwnProperty('asset_type') && item.asset_type === 'native',
  );
  return prizeRecord.length > 0 ? parseInt(prizeRecord[0].amount) : false;
}

async function fetchWithRetry(url: string, retries = 3, delay = 500): Promise<Response> {
  try {
    const response = await fetch(url);
    if (response.status !== 503) {
      return response;
    }
    throw new Error('Service Unavailable');
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
}

export async function fetchPayments(
  env: any,
  issuer: string,
  cursor?: string,
) {
  if (cursor !== undefined) {
    const url = horizonUrl(env) +
      `/accounts/${issuer}/payments?cursor=${cursor}&limit=200&order=desc&include_failed=false`;
    console.log(url)
    const response = await fetchWithRetry(url);
    return handleResponse(response);
  } else {
    const url = horizonUrl(env) +
      `/accounts/${issuer}/payments?limit=200&order=desc&include_failed=false`;
    const response = await fetchWithRetry(url);
    return handleResponse(response);
  }

}

export async function getOriginalClaimants(
  env: any,
  context: any,
  issuer: any,
  assetid: any,
) {
  let accountOperations = [];
  const { DB } = context.env;
  console.log('before the stmt')
  const stmt = DB.prepare(`
    SELECT * 
    FROM balances
    WHERE issuer_id = ?1 AND asset_id = ?2 
    ORDER BY date_acquired ASC 
    LIMIT 1
  `);
  console.log('after the stmt')
  let cursor;
  let preparedStatements = [];
  const lastrecord = await stmt.bind(issuer, assetid).all();
  console.log('after the bind')
  console.log(lastrecord)
  if (lastrecord.results.length > 0) {
    cursor = lastrecord.results[0].id;
    console.log(cursor, "claimable cursor")
  } else {
    cursor = undefined
    console.log(`there is no cursor for ${issuer} ${assetid}`)
  }

  let operationResults = await fetchOperations("production", issuer, cursor);
  if (operationResults.status === 404) {
    return;
  }


  let iter = 0
  while (
    accountOperations.length % 200 === 0 ||
    operationResults._embedded.records.length !== 0
  ) {
    //handle extremely large accounts
    if (iter > 1000) { break }

    accountOperations = accountOperations.concat(operationResults._embedded.records);
    operationResults = await fetch(operationResults['_links'].next.href).then(handleResponse);
    iter += 1
  }
  const balanceForms: BalanceForm[] = [];
  const claimableForms: ClaimableForm[] = [];

  const badgeOperations: Horizon.CreateClaimableBalanceOperationResponse[] = accountOperations
    .filter(
      (operation) => {
        const optype = operation.type === "create_claimable_balance";
        if (optype === false || operation.asset === "native") { return }
        const asset = operation.asset;
        const assetcode = asset.split(":")[0] === assetid;
        const assetissuer = asset.split(":")[1] === issuer;
        const amount = parseFloat(operation.amount) === 0.0000001 || parseFloat(operation.amount) === 1.0000000;
        return amount && assetcode && assetissuer;
      }
    )

  const claimBacks: Horizon.ClaimClaimableBalanceOperationResponse[] = accountOperations
    .filter(
      (operation) => {
        const optype = operation.type === "claim_claimable_balance";
        const asset = operation.asset;
        if (optype === false || operation.asset === "native") { return }
      }
    );

  for (let op in badgeOperations) {
    const effects = await fetch(badgeOperations[op]._links.effects.href).then(handleResponse);
    console.log(effects)
    const claimcreated = effects.filter((effect) => effect.type === "claimable_balance_created");

    const claimable_ID = claimcreated[0].balance_id;
    const claimed = claimBacks.some((claim) => claim.balance_id === claimable_ID);
    if (claimed) { continue }

    let claimants: Horizon.Claimant[] = badgeOperations[op].claimants;
    if (claimants.length > 1) {
      claimants = claimants.filter((claimant) => claimant.destination != issuer);
    }
    //if there was more than 2 claimants and the issuer was one of them, then this probably wasn't an SQ badge.
    if (claimants.length > 1) {
      continue;
    }

    let createdClaimOpId = badgeOperations[op].id;
    const claimableForm = new ClaimableForm(
      new Claimable({
        id: createdClaimOpId,
        claimable_id: claimable_ID,
        date_granted: badgeOperations[op].created_at
      })
    )
    const balanceForm = new BalanceForm(
      new Balance({
        id: createdClaimOpId,
        tx_id: badgeOperations[op].transaction_hash,
        issuer_id: issuer,
        asset_id: assetid,
        account_id: claimants[0].destination,
        balance: badgeOperations[op].amount,
        date_acquired: badgeOperations[op].created_at,
      })
    );
    console.log(claimableForm)
    claimableForms.push(claimableForm);
    balanceForms.push(balanceForm);
  }
  const chunkSize = 9; 
  for (let i = 0; i < balanceForms.length; i += chunkSize) {
    const chunk = balanceForms.slice(i, i + chunkSize);
    const valuesPlaceholders = chunk.map(() => "(?,?,?,?,?,?,?,datetime('now'),datetime('now'))").join(","); // Change the number of "?" placeholders to match the number of parameters per record
    const values = chunk.flatMap(form => [form.data.id, form.data.tx_id, form.data.issuer_id, form.data.asset_id, form.data.account_id, form.data.balance, form.data.date_acquired]);
    const preparedStatement = DB.prepare(`
        INSERT OR IGNORE INTO balances (id, tx_id, issuer_id, asset_id, account_id, balance, date_acquired, created_at, updated_at)
        VALUES ${valuesPlaceholders} RETURNING *;
      `).bind(...values);
    preparedStatements.push(preparedStatement);
  }
  for (let i = 0; i < claimableForms.length; i += chunkSize) {
    const chunk = claimableForms.slice(i, i + chunkSize);
    const valuesPlaceholders = chunk.map(() => "(?,?,?,datetime('now'),datetime('now'))").join(","); // Change the number of "?" placeholders to match the number of parameters per record
    const values = chunk.flatMap(form => [form.data.id, form.data.claimable_id, form.data.date_granted]);
    const preparedStatement = DB.prepare(`
        INSERT OR IGNORE INTO balances (id, claimable_id, date_granted, created_at, updated_at)
        VALUES ${valuesPlaceholders} RETURNING *;
      `).bind(...values);

    preparedStatements.push(preparedStatement);
  }
  await DB.batch(preparedStatements);
   return void 0;
}


export async function getOriginalPayees(
  env: any,
  context: any,
  issuer: any,
  assetid: any,
) {
  const { DB } = context.env;
  const stmt = DB.prepare(`
  SELECT * 
  FROM balances 
  WHERE issuer_id = ?1 AND asset_id = ?2 
  ORDER BY date_acquired ASC 
  LIMIT 1
`);
  let cursor;

  const lastrecord = await stmt.bind(issuer, assetid).all();
  //console.log(lastrecord, "last record")
  if (lastrecord.results.length > 0) {
    cursor = lastrecord.results[0].id;
    console.log(cursor, "cursor")
  } else {
    cursor = undefined
    console.log(`there is no cursor for ${issuer} ${assetid}`)
  }
  let accountPayments: any = [];
  let owners: [{ asset_id?: string, account_id?: string, balance?: string, date_acquired?: string }] = [{}];
  let paymentResponse: any = await fetchPayments(env, issuer, cursor);
  if (paymentResponse.status === 404) {
    return;
  }
  let iter = 0
  let needsNext = false
  let nextcursor = "blank"
  const preparedStatements = [];
  while (
    paymentResponse.length % 200 === 0 ||
    paymentResponse._embedded.records.length !== 0
  ) {
    if (iter > 1000) {
      needsNext = true;
      nextcursor = paymentResponse['_links'].next.href
      break
    }
    accountPayments = accountPayments.concat(paymentResponse._embedded.records);
    let balanceForms = [];
    for (let record in paymentResponse._embedded.records) {
      if (paymentResponse._embedded.records[record].asset_code === assetid) {
        const txid = paymentResponse._embedded.records[record].transaction_hash;
        const balanceid = paymentResponse._embedded.records[record].id;
        const balanceForm = new BalanceForm(
          new Balance({
            id: balanceid,
            tx_id: txid,
            issuer_id: issuer,
            asset_id: assetid,
            account_id: paymentResponse._embedded.records[record].to,
            balance: paymentResponse._embedded.records[record].amount,
            date_acquired: paymentResponse._embedded.records[record].created_at,
          })
        );

        balanceForms.push(balanceForm);
        owners.push({
          asset_id: assetid,
          account_id: paymentResponse._embedded.records[record].to,
          balance: paymentResponse._embedded.records[record].amount,
          date_acquired: paymentResponse._embedded.records[record].created_at,
        })
      }
    }
    const chunkSize = 9; // Change this to fit the actual number of parameters per record


    for (let i = 0; i < balanceForms.length; i += chunkSize) {
      const chunk = balanceForms.slice(i, i + chunkSize);
      const valuesPlaceholders = chunk.map(() => "(?,?,?,?,?,?,?,datetime('now'),datetime('now'))").join(","); // Change the number of "?" placeholders to match the number of parameters per record
      const values = chunk.flatMap(form => [form.data.id, form.data.tx_id, form.data.issuer_id, form.data.asset_id, form.data.account_id, form.data.balance, form.data.date_acquired]);
      const preparedStatement = DB.prepare(`
        INSERT OR IGNORE INTO balances (id, tx_id, issuer_id, asset_id, account_id, balance, date_acquired, created_at, updated_at)
        VALUES ${valuesPlaceholders} RETURNING *;
      `).bind(...values);

      preparedStatements.push(preparedStatement);
    }
    paymentResponse = await fetch(paymentResponse['_links'].next.href).then(handleResponse);
    iter += 1
  }
  await DB.batch(preparedStatements);
  return { owners, nextcursor };
}