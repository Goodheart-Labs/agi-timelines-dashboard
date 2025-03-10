export async function GET() {
  const deployHookUrl = process.env.DEPLOY_HOOK_URL;
  if (!deployHookUrl) {
    return new Response("Deploy hook URL not configured", { status: 500 });
  }

  await fetch(deployHookUrl);
  return new Response("Redeploy triggered", { status: 200 });
}
