/**
 * GET /api/newsletters
 *
 * Proxies the Brevo emailCampaigns list endpoint.
 * Returns sent campaigns sorted newest-first.
 *
 * Required env var: BREVO_API_KEY
 * Set this in Vercel → Project Settings → Environment Variables.
 */

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'BREVO_API_KEY environment variable is not set.' });
  }

  try {
    const url = 'https://api.brevo.com/v3/emailCampaigns?' + new URLSearchParams({
      status:  'sent',
      limit:   '100',
      offset:  '0',
      sort:    'desc',
    });

    const upstream = await fetch(url, {
      headers: { 'api-key': apiKey, 'Accept': 'application/json' },
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      return res.status(upstream.status).json({ error: `Brevo API returned ${upstream.status}` });
    }

    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
