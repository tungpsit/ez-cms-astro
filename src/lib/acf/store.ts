import type { FieldGroup, Field, FieldValue } from './types';
import { nanoid } from 'nanoid';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const DATA_DIR = './data';
const FIELD_GROUPS_FILE = path.join(DATA_DIR, 'field-groups.json');
const FIELD_VALUES_FILE = path.join(DATA_DIR, 'field-values.json');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  await ensureDataDir();
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getFieldGroups(): Promise<FieldGroup[]> {
  return readJsonFile<FieldGroup[]>(FIELD_GROUPS_FILE, []);
}

export async function getFieldGroup(id: string): Promise<FieldGroup | null> {
  const groups = await getFieldGroups();
  return groups.find(g => g.id === id) || null;
}

export async function createFieldGroup(data: Omit<FieldGroup, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const groups = await getFieldGroups();
    const id = nanoid(10);
    const newGroup: FieldGroup = {
      ...data,
      id,
      created_at: new Date(),
      updated_at: new Date(),
    };
    groups.push(newGroup);
    await writeJsonFile(FIELD_GROUPS_FILE, groups);
    return { success: true, id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateFieldGroup(id: string, data: Partial<FieldGroup>): Promise<{ success: boolean; error?: string }> {
  try {
    const groups = await getFieldGroups();
    const index = groups.findIndex(g => g.id === id);
    if (index === -1) {
      return { success: false, error: 'Field group not found' };
    }
    groups[index] = {
      ...groups[index],
      ...data,
      updated_at: new Date(),
    };
    await writeJsonFile(FIELD_GROUPS_FILE, groups);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteFieldGroup(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let groups = await getFieldGroups();
    groups = groups.filter(g => g.id !== id);
    await writeJsonFile(FIELD_GROUPS_FILE, groups);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getFieldValues(postId: string, postType: string): Promise<Record<string, unknown>> {
  const allValues = await readJsonFile<Record<string, Record<string, unknown>>>(FIELD_VALUES_FILE, {});
  const key = `${postType}:${postId}`;
  return allValues[key] || {};
}

export async function saveFieldValues(postId: string, postType: string, values: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    const allValues = await readJsonFile<Record<string, Record<string, unknown>>>(FIELD_VALUES_FILE, {});
    const key = `${postType}:${postId}`;
    allValues[key] = values;
    await writeJsonFile(FIELD_VALUES_FILE, allValues);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getMatchingFieldGroups(postType: string, template?: string): Promise<FieldGroup[]> {
  const groups = await getFieldGroups();
  return groups.filter(group => {
    if (!group.active) return false;
    
    return group.location.some(loc => {
      if (loc.param === 'post_type') {
        const matches = loc.value === postType;
        return loc.operator === '==' ? matches : !matches;
      }
      if (loc.param === 'page_template' && template) {
        const matches = loc.value === template;
        return loc.operator === '==' ? matches : !matches;
      }
      return false;
    });
  });
}
