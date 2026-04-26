# Maintenance Scripts

These scripts are manual admin/diagnostic utilities and are not part of the production runtime.

## Available scripts

- `create_admin.js`: Upserts the default admin account.
- `get_admin.js`: Lists all admin rows using Supabase SDK.
- `final_admin_check.js`: Alternate admin list/check via Supabase SDK.
- `get_admin_direct.js`: Direct REST call to Supabase admin table.

## Run from project root

```bash
node scripts/maintenance/create_admin.js
node scripts/maintenance/get_admin.js
node scripts/maintenance/final_admin_check.js
node scripts/maintenance/get_admin_direct.js
```

All scripts read credentials from `server/.env`.
