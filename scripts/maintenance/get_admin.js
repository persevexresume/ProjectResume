const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in server/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAdmins() {
    const { data, error } = await supabase
        .from('admins')
        .select('*');

    if (error) {
        console.error('Error fetching admins:', error.message);
    } else {
        console.log('Admins list:');
        console.log(JSON.stringify(data, null, 2));
    }
}

getAdmins();