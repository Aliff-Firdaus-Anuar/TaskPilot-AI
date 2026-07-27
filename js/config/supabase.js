const SUPABASE_URL = 'https://cologubkjfwpqyzivykc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvbG9ndWJramZ3cHF5eml2eWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMzk0MzYsImV4cCI6MjEwMDYxNTQzNn0.KHMFRvJHarTL_DNMo1UxfVqEqSKUoi4WRvoB9D1fg0o';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
