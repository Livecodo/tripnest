import { createClient } from '@insforge/sdk';

// TODO: Replace these with your own Insforge project values from your .env file.
// See .env.example at the repository root.
const BASE_URL = process.env.VITE_INSFORGE_BASE_URL || 'https://your-project.us-east.insforge.app';
const ANON_KEY = process.env.VITE_INSFORGE_ANON_KEY || 'your-anon-key-here';
// TODO: Replace with a real vault ID from your own project for testing.
const TEST_VAULT_ID = process.env.TEST_VAULT_ID || 'your-vault-id-here';

const clientSubhosting = createClient({
  baseUrl: BASE_URL,
  anonKey: ANON_KEY
});

const clientProxy = createClient({
  baseUrl: BASE_URL,
  anonKey: ANON_KEY,
  functionsUrl: `${BASE_URL}/functions`
});

async function testInvoke(name, client) {
  console.log(`Invoking function via SDK (${name})...`);
  const { data, error } = await client.functions.invoke('generate-upload-url', {
    body: {
      action: 'generate',
      vaultId: TEST_VAULT_ID,
      filename: 'test.txt',
      contentType: 'text/plain'
    }
  });

  if (error) {
    console.error(`SDK ${name} Invoke Error:`, error);
  } else {
    console.log(`SDK ${name} Invoke Success! Data:`, JSON.stringify(data, null, 2));
  }
}

async function run() {
  await testInvoke('Subhosting', clientSubhosting);
  await testInvoke('Proxy', clientProxy);
}

run();
