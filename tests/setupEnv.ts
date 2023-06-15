import { loadEnvConfig } from "@next/env";

function setupEnv() {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
}

export default setupEnv;
