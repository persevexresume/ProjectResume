
const { createClient } = require('./server/node_modules/@supabase/supabase-js');
const dotenv = require('./server/node_modules/dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAdmins() {
    try {
        const { data, error } = await supabase
            .from('admins')
            .select('*');
        
        if (error) {
            console.error('Error:', error.message);
        } else {
            console.log('Admins:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('Catch Error:', e.message);
    }
}

getAdmins();
