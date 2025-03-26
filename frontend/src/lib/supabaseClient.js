import { createClient } from '@supabase/supabase-js';

// Credenziali Supabase
const supabaseUrl = 'https://jhmixisgdyvxxpyjistt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpobWl4aXNnZHl2eHhweWppc3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODM0ODAsImV4cCI6MjA1NzQ1OTQ4MH0.NurmxG_GBIiIMU1u5LJ9LmFPnjnkU0N2tQHX4ohrB_s';

// Crea e esporta il client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);