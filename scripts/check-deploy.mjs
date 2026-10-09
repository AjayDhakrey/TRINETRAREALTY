async function check() {
  const res = await fetch('https://api.github.com/repos/AjayDhakrey/TRINETRAREALTY/deployments');
  const deployments = await res.json();
  const top = deployments[0];
  console.log('Top deployment:', top?.sha, top?.created_at);
  if (top) {
    const sRes = await fetch(top.statuses_url);
    const statuses = await sRes.json();
    console.log('Status:', statuses[0]?.state, statuses[0]?.target_url);
  }
}
check().catch(console.error);

