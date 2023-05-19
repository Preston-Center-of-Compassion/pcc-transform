import { createClient } from "@supabase/supabase-js";

// Create a single supabase client for interacting with your database
const supabase = createClient(
  "https://lvkximtfjwgyamewnwwt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2a3hpbXRmandneWFtZXdud3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzEyMTkxNzUsImV4cCI6MTk4Njc5NTE3NX0.G_9wywEssraQTHEtJnkkDipYDpUZcG1fnORBdwE1VUI"
);
