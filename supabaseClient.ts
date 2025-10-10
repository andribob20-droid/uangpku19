import { createClient, SupabaseClient } from '@supabase/supabase-js';

// TODO: Replace with your project's credentials
// 1. Go to your Supabase project dashboard.
// 2. Go to the "Project Settings" page.
// 3. Go to the "API" tab.
// 4. Find your "Project URL" and "Project API keys" (use the anon, public one).
// 5. IMPORTANT FOR FILE UPLOADS: Go to the "Storage" section in your Supabase dashboard.
//    - Create a new bucket named `bukti-pembayaran`. This bucket will be used for both payment proofs and expense receipts.
//    - Go to the bucket's "Policies" and create a new policy for public read access.
//    - Give the policy a name (e.g., "Public Read Access").
//    - Under "Allowed operations", check `SELECT` and `INSERT`.
//    - For the policy definition, use the template "Enable read access to public folder" and save it.
// FIX: Explicitly type as string to avoid a TypeScript error on line 14 where this constant is compared to a placeholder string.
const supabaseUrl: string = 'https://zwljloikczeniehovtof.supabase.co';
// FIX: Explicitly type as string to avoid a TypeScript error on line 16 where this constant is compared to a placeholder string.
const supabaseKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3bGpsb2lrY3plbmllaG92dG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMzM0NjAsImV4cCI6MjA3NDYwOTQ2MH0.6JFW2V8p0sbzJ3GFePj9Nqk8RbH4qBshajt7zySEy68';

export const isSupabaseConfigured =
    supabaseUrl &&
    supabaseUrl !== 'YOUR_SUPABASE_URL' &&
    supabaseKey &&
    supabaseKey !== 'YOUR_SUPABASE_ANON_KEY';

// The global declaration is necessary because the Supabase SDK is loaded from a CDN.
// This tells TypeScript that `createClient` will be available globally.
declare global {
    const supabase: {
        createClient: typeof createClient;
    };
}

let supabase: SupabaseClient;
if (isSupabaseConfigured) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    // A warning will be shown in the console, and the UI will guide the user.
    console.warn("Supabase credentials are not configured in supabaseClient.ts");
}

export { supabase };