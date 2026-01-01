import type { APIRoute } from 'astro';
import { getAllPlugins, togglePlugin, updatePluginSettings } from '../../lib/cms/plugins';

export const GET: APIRoute = async () => {
  try {
    const plugins = getAllPlugins();
    return new Response(JSON.stringify({ plugins }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const { pluginId, enabled, settings } = await request.json();
    
    if (!pluginId) {
      return new Response(JSON.stringify({ success: false, error: 'Plugin ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    let result;
    if (typeof enabled === 'boolean') {
      result = await togglePlugin(pluginId, enabled);
    } else if (settings) {
      result = await updatePluginSettings(pluginId, settings);
    } else {
      return new Response(JSON.stringify({ success: false, error: 'No action specified' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (result.success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
