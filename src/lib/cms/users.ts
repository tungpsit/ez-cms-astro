import fs from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';

export type UserRole = 'administrator' | 'editor' | 'author' | 'contributor' | 'subscriber';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface UserCapabilities {
  manageUsers: boolean;
  manageSettings: boolean;
  manageThemes: boolean;
  managePlugins: boolean;
  publishPosts: boolean;
  editOwnPosts: boolean;
  editOthersPosts: boolean;
  deleteOwnPosts: boolean;
  deleteOthersPosts: boolean;
  manageCategories: boolean;
  manageMedia: boolean;
  managePosts: boolean;
  managePages: boolean;
  viewDashboard: boolean;
}

export const roleCapabilities: Record<UserRole, UserCapabilities> = {
  administrator: {
    manageUsers: true,
    manageSettings: true,
    manageThemes: true,
    managePlugins: true,
    publishPosts: true,
    editOwnPosts: true,
    editOthersPosts: true,
    deleteOwnPosts: true,
    deleteOthersPosts: true,
    manageCategories: true,
    manageMedia: true,
    managePosts: true,
    managePages: true,
    viewDashboard: true,
  },
  editor: {
    manageUsers: false,
    manageSettings: false,
    manageThemes: false,
    managePlugins: false,
    publishPosts: true,
    editOwnPosts: true,
    editOthersPosts: true,
    deleteOwnPosts: true,
    deleteOthersPosts: true,
    manageCategories: true,
    manageMedia: true,
    managePosts: true,
    managePages: true,
    viewDashboard: true,
  },
  author: {
    manageUsers: false,
    manageSettings: false,
    manageThemes: false,
    managePlugins: false,
    publishPosts: true,
    editOwnPosts: true,
    editOthersPosts: false,
    deleteOwnPosts: true,
    deleteOthersPosts: false,
    manageCategories: false,
    manageMedia: true,
    managePosts: false,
    managePages: false,
    viewDashboard: true,
  },
  contributor: {
    manageUsers: false,
    manageSettings: false,
    manageThemes: false,
    managePlugins: false,
    publishPosts: false,
    editOwnPosts: true,
    editOthersPosts: false,
    deleteOwnPosts: true,
    deleteOthersPosts: false,
    manageCategories: false,
    manageMedia: false,
    managePosts: false,
    managePages: false,
    viewDashboard: true,
  },
  subscriber: {
    manageUsers: false,
    manageSettings: false,
    manageThemes: false,
    managePlugins: false,
    publishPosts: false,
    editOwnPosts: false,
    editOthersPosts: false,
    deleteOwnPosts: false,
    deleteOthersPosts: false,
    manageCategories: false,
    manageMedia: false,
    managePosts: false,
    managePages: false,
    viewDashboard: false,
  },
};

export const roleLabels: Record<UserRole, string> = {
  administrator: 'Administrator',
  editor: 'Editor',
  author: 'Author',
  contributor: 'Contributor',
  subscriber: 'Subscriber',
};

export const roleDescriptions: Record<UserRole, string> = {
  administrator: 'Full access to all site features and settings',
  editor: 'Can publish and manage all posts, pages, and media',
  author: 'Can publish and manage their own posts',
  contributor: 'Can write and edit their own posts but cannot publish',
  subscriber: 'Can only view their profile',
};

const USERS_FILE = path.join(process.cwd(), 'src/content/users.json');

const defaultUsers: User[] = [
  {
    id: 'admin-001',
    username: 'admin',
    email: 'admin@ezcms.dev',
    displayName: 'Administrator',
    role: 'administrator',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    bio: 'Site administrator',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
];

export async function getUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    await saveUsers(defaultUsers);
    return defaultUsers;
  }
}

export async function saveUsers(users: User[]): Promise<void> {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function getUserById(id: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => u.id === id);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export async function createUser(data: Omit<User, 'id' | 'createdAt' | 'isActive'>): Promise<User> {
  const users = await getUsers();
  
  const existingUsername = users.find(u => u.username.toLowerCase() === data.username.toLowerCase());
  if (existingUsername) {
    throw new Error('Username already exists');
  }
  
  const existingEmail = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
  if (existingEmail) {
    throw new Error('Email already exists');
  }
  
  const newUser: User = {
    ...data,
    id: nanoid(10),
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  
  users.push(newUser);
  await saveUsers(users);
  
  return newUser;
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
  const users = await getUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    throw new Error('User not found');
  }
  
  if (data.username) {
    const existingUsername = users.find(u => u.username.toLowerCase() === data.username!.toLowerCase() && u.id !== id);
    if (existingUsername) {
      throw new Error('Username already exists');
    }
  }
  
  if (data.email) {
    const existingEmail = users.find(u => u.email.toLowerCase() === data.email!.toLowerCase() && u.id !== id);
    if (existingEmail) {
      throw new Error('Email already exists');
    }
  }
  
  users[index] = { ...users[index], ...data };
  await saveUsers(users);
  
  return users[index];
}

export async function deleteUser(id: string): Promise<boolean> {
  const users = await getUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    throw new Error('User not found');
  }
  
  const adminCount = users.filter(u => u.role === 'administrator').length;
  if (users[index].role === 'administrator' && adminCount <= 1) {
    throw new Error('Cannot delete the last administrator');
  }
  
  users.splice(index, 1);
  await saveUsers(users);
  
  return true;
}

export function getUserCapabilities(role: UserRole): UserCapabilities {
  return roleCapabilities[role];
}

export function canUserDo(role: UserRole, capability: keyof UserCapabilities): boolean {
  return roleCapabilities[role][capability];
}
