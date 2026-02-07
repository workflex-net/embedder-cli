// Original: src/main.ts
// CLI entry - parses args and launches the app
export async function main() {
  // TODO: restore from lib_app.js
  const { startCli } = await import("./lib/cli");
  await startCli();
}
main().catch(console.error);
