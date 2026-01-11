import type { APIRoute } from 'astro';
import { i18n } from '../../lib/i18n';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, code, data } = body;

    switch (action) {
      case 'addLocale':
        if (!code) return new Response(JSON.stringify({ error: 'Code is required' }), { status: 400 });
        await i18n.saveLocale(code, {});
        return new Response(JSON.stringify({ success: true }));

      case 'deleteLocale':
        if (!code) return new Response(JSON.stringify({ error: 'Code is required' }), { status: 400 });
        // For safety, we just delete the file if it exists
        // In a real app, we might want to move it to a backup folder
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const filePath = path.join(process.cwd(), 'src/i18n', `${code}.json`);
        await fs.unlink(filePath);
        return new Response(JSON.stringify({ success: true }));

      case 'saveLocale':
        if (!code || !data) return new Response(JSON.stringify({ error: 'Code and data are required' }), { status: 400 });
        await i18n.saveLocale(code, data);
        return new Response(JSON.stringify({ success: true }));

      case 'scan':
        const keys = await i18n.scanProject();
        // We don't need to do anything else, the scan results are used by the UI
        return new Response(JSON.stringify({ success: true, count: keys.length }));

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};
