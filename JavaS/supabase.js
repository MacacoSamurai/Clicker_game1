const { createClient } = supabase;

const SUPABASE_URL = 'https://vqqvfvtuikpohzuzgymb.supabase.co';
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcXZmdnR1aWtwb2h6dXpneW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTgwNzYsImV4cCI6MjA5NDc5NDA3Nn0.Qu8xLpsyb_m4jrRmLZUUDEgYb2CQm4OXCAFSwcwS5zs";

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    global: {
        headers: {
            'x-client-info': 'quadrado-clicker-v2'
        }
    }
});