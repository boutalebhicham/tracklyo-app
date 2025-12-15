import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kaikrvpyumubuvvdaeor.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaWtydnB5dW11YnV2dmRhZW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDM3OTIsImV4cCI6MjA4MTM3OTc5Mn0.zC9ij3fcaczokay_DYD_nsDL9A1qg7Qn8annLMpmnF4';

export const supabase = createClient(supabaseUrl, supabaseKey);