import * as dotenv from 'dotenv';
import * as path from 'path';
import weaviate, { WeaviateClient, ApiKey } from 'weaviate-ts-client';

// 1. Resolve the .env file path
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);

// 2. Load and verify .env
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  process.exit(1);
}

// 3. Verify required variables
const requiredVars = ['WEAVIATE_URL', 'WEAVIATE_API_KEY'];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

console.log('✅ Environment variables loaded successfully');
console.log('- WEAVIATE_URL:', process.env.WEAVIATE_URL ? '***set***' : 'NOT SET');
console.log('- WEAVIATE_API_KEY:', process.env.WEAVIATE_API_KEY ? '***set***' : 'NOT SET');

// 4. Initialize Weaviate client
const client: WeaviateClient = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_URL!,
  apiKey: new ApiKey(process.env.WEAVIATE_API_KEY!),
});

// 5. Test connection
async function testConnection() {
  try {
    console.log('\nTesting Weaviate connection...');
    const meta = await client.misc.metaGetter().do();
    console.log('✅ Successfully connected to Weaviate');
    console.log('Version:', meta.version);
    return meta;
  } catch (error) {
    console.error('❌ Connection failed:');
    if (error instanceof Error) {
      console.error('Error:', error.message);
      if (error.stack) {
        console.error('Stack:', error.stack.split('\n')[1]);
      }
    }
    process.exit(1);
  }
}

// 6. Run the test
testConnection();