import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

async function runDoctor() {
  console.log('🩺 Running VedaSphere System Doctor...\n');

  let issueCount = 0;

  // 1. Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0], 10);
  if (majorVersion >= 20) {
    console.log(`✅ Node.js Version: ${nodeVersion} (>= 20)`);
  } else {
    console.log(`❌ Node.js Version: ${nodeVersion} (Requires Node 20+)`);
    issueCount++;
  }

  // 2. Check .env file
  const rootEnvPath = join(process.cwd(), '.env');
  const exampleEnvPath = join(process.cwd(), '.env.example');
  if (existsSync(rootEnvPath)) {
    console.log('✅ Configuration: .env file present');
  } else if (existsSync(exampleEnvPath)) {
    console.log('⚠️  Configuration: .env not found, but .env.example exists');
  } else {
    console.log('❌ Configuration: .env and .env.example missing');
    issueCount++;
  }

  // 3. Check sources.json config
  const sourcesConfigPath = join(process.cwd(), 'apps', 'api', 'config', 'sources.json');
  if (existsSync(sourcesConfigPath)) {
    try {
      const sourcesData = JSON.parse(readFileSync(sourcesConfigPath, 'utf-8'));
      console.log(`✅ Sources Config: Loaded ${sourcesData.sources?.length || 0} configured data sources`);
    } catch {
      console.log('❌ Sources Config: Invalid JSON in apps/api/config/sources.json');
      issueCount++;
    }
  } else {
    console.log('❌ Sources Config: Missing apps/api/config/sources.json');
    issueCount++;
  }

  // 4. Ping API /health if server is running
  const apiPort = process.env.PORT || '4000';
  const healthUrl = `http://localhost:${apiPort}/health`;
  try {
    const res = await fetch(healthUrl);
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ API Health Check (${healthUrl}): Status ${data.status.toUpperCase()}, Uptime ${data.uptime}s`);
    } else {
      console.log(`⚠️  API Health Check (${healthUrl}): HTTP ${res.status}`);
    }
  } catch {
    console.log(`ℹ️  API Server is not running locally on port ${apiPort} (Start with 'npm run dev')`);
  }

  console.log('\n--- Doctor Summary ---');
  if (issueCount === 0) {
    console.log('✨ System looks healthy!');
  } else {
    console.log(`⚠️  Found ${issueCount} issue(s) to review.`);
  }
}

runDoctor();
