import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Note: creating buckets might require service_role key, but we'll try with anon first if RLS allows it
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
    console.log('Checking for avatars bucket...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error('Error listing buckets:', listError);
        process.exit(1);
    }

    const hasAvatars = buckets.some(b => b.name === 'avatars');

    if (!hasAvatars) {
        console.log('Creating avatars bucket...');
        const { data, error } = await supabase.storage.createBucket('avatars', {
            public: true,
            fileSizeLimit: 5242880 // 5MB
        });

        if (error) {
            console.error('Error creating bucket:', error);
            if (error.message.includes('permission denied')) {
                console.log('\n--- IMPORTANT ---');
                console.log('It looks like the anonymous key cannot create buckets.');
                console.log('Please go to your Supabase Dashboard -> Storage and create a new PUBLIC bucket named "avatars".');
                console.log('-----------------\n');
                process.exit(0);
            }
            process.exit(1);
        }
        console.log('Avatars bucket created successfully!');
    } else {
        console.log('Avatars bucket already exists.');
    }
}

setupStorage();
