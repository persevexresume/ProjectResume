
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
    const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .limit(1);
    
    if (error) {
        console.log('resumes error:', error.message);
    } else {
        console.log('resumes columns:', data && data[0] ? Object.keys(data[0]) : 'no data');
    }
}

checkTable();
