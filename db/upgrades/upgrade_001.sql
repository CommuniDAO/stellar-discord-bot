INSERT INTO stellar_accounts (id, users_id, stellar_access_token, stellar_refresh_token, stellar_expires_at, public_key)
SELECT public_key, id, stellar_access_token, stellar_refresh_token, stellar_expires_at, public_key FROM users;
