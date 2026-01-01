import type { APIRoute } from 'astro';
import { getUsers, createUser, roleLabels, roleDescriptions, roleCapabilities } from '../../../lib/cms/users';

export const GET: APIRoute = async () => {
  try {
    const users = await getUsers();
    return new Response(JSON.stringify({ 
      users,
      roles: Object.entries(roleLabels).map(([value, label]) => ({
        value,
        label,
        description: roleDescriptions[value as keyof typeof roleDescriptions],
        capabilities: roleCapabilities[value as keyof typeof roleCapabilities],
      })),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    if (!data.username || !data.email || !data.displayName || !data.role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const user = await createUser({
      username: data.username,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      avatar: data.avatar || '',
      bio: data.bio || '',
    });
    
    return new Response(JSON.stringify({ success: true, user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
