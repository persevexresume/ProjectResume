
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Try to find .env in server directory
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in server/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
    console.log(`Connecting to: ${supabaseUrl}`);
    
    const adminData = {
        id: 'admin_primary',
        email: 'admin@gmail.com',
        password: 'admin@123',
        name: 'System Administrator'
    };

    console.log('Attempting to upsert admin...');
    const { data, error } = await supabase
        .from('admins')
        .upsert(adminData, { onConflict: 'email' })
        .select();

    if (error) {
        console.error('Failed to create admin:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
    } else {
        console.log('Admin account successfully created/updated:');
        console.log(JSON.stringify(data, null, 2));
    }
}

createAdmin().catch(err => {
    console.error('Unhandled script error:', err);
});
