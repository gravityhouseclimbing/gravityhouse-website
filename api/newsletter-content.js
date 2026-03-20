/**
 * GET /api/newsletter-content?id={id}
 * GET /api/newsletter-content?id={id}&format=html
 */

function sanitise(html) {
  return html
    .replace(/\{\{\s*contact\.\w+\s*\/?\s*default\(['"](.+?)['"]\)\s*\}\}/gi, '$1')
    .replace(/\{\{\s*contact\.\w+\s*\}\}/gi, '')
    .replace(/\{unsubscribe\}/gi, '#')
    .replace(/\{mirror\}/gi, '');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'BREVO_API_KEY not set' });
  const { id, format } = req.query;
  if (!id || !/^\d+$/.test(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const upstream = await fetch(`https://api.brevo.com/v3/emailCampaigns/${id}`, {
      headers: { 'api-key': apiKey, 'Accept': 'application/json' }
    });
    if (!upstream.ok) return res.status(upstream.status).json({ error: `Brevo ${upstream.status}` });
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300');
    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(sanitise(data.htmlContent || ''));
    }
    return res.status(200).json({
      id: data.id, name: data.name, subject: data.subject,
      sentDate: data.sentDate, statistics: data.statistics,
      htmlContent: sanitise(data.htmlContent || '')
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', detail: err.message });
  }
}
