import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://jhbjtaoxhpvovpqnwlsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoYmp0YW94aHB2b3ZwcW53bHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0Njk5NTEsImV4cCI6MjA5NjA0NTk1MX0.94Sg0lQJgj23EBZ1V15Xmjy1ledHLmALXV7Ita6Ept8"
);
