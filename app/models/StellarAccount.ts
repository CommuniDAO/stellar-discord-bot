import { Model, Schema } from 'model-one'
import type { SchemaConfigI } from 'model-one';
import type { StellarAccountI, StellarAccountDataI } from '../interfaces'

const stellarAccountSchema: SchemaConfigI = new Schema({
  table_name: 'stellar_accounts',
  columns: [
    { name: 'id', type: 'string' },
    { name: 'users_id', type: 'string' },
    { name: 'stellar_access_token', type: 'string' },
    { name: 'stellar_refresh_token', type: 'string' },
    { name: 'stellar_expires_at', type: 'string' },
    { name: 'public_key', type: 'string' }
  ],
})

export class StellarAccount extends Model implements StellarAccountI {
  data: StellarAccountDataI

  constructor(props: StellarAccountDataI) {
    super(stellarAccountSchema, props)
    this.data = props
  }
}