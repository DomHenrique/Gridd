import fetch from "node-fetch";

async function run() {
  const jwt = process.env.SUPABASE_ANON_KEY;
  const projectRef = "lyewjlfgojgvywnkojsf";
  
  const res = await fetch(`https://${projectRef}.supabase.co/functions/v1/storage-ops`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action: "upload", filename: "test.jpg", fileType: "image/jpeg" })
  });
  
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}
run();
