import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(process.cwd());
const STATE_DIR = path.join(ROOT, 'ai-team', 'state');
const QUEUE_FILE = path.join(STATE_DIR, 'task-queue.json');

const now = () => new Date().toISOString();
const id = () => `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

async function ensureState() {
  await fs.mkdir(STATE_DIR, { recursive: true });
  try { await fs.access(QUEUE_FILE); }
  catch { await fs.writeFile(QUEUE_FILE, JSON.stringify({ version: 1, tasks: [] }, null, 2)); }
}

async function readQueue() {
  await ensureState();
  return JSON.parse(await fs.readFile(QUEUE_FILE, 'utf8'));
}

async function writeQueue(queue) {
  const temp = `${QUEUE_FILE}.tmp`;
  await fs.writeFile(temp, JSON.stringify(queue, null, 2));
  await fs.rename(temp, QUEUE_FILE);
}

export async function enqueue({ type, request, priority = 'normal', parentTaskId = null, contextRefs = [] }) {
  if (!type || !request) throw new Error('type and request are required');
  const queue = await readQueue();
  const task = {
    task_id: id(), parent_task_id: parentTaskId, type, priority, request,
    context_refs: contextRefs, assigned_agent: null, required_tools: [],
    approval: 'none', status: 'queued', created_at: now(), updated_at: now(), result_ref: null
  };
  queue.tasks.push(task);
  await writeQueue(queue);
  return task;
}

export async function claimNext(agentId) {
  const queue = await readQueue();
  const task = queue.tasks.find(t => t.status === 'queued');
  if (!task) return null;
  task.status = 'claimed'; task.assigned_agent = agentId; task.updated_at = now();
  await writeQueue(queue);
  return task;
}

export async function updateTask(taskId, patch) {
  const queue = await readQueue();
  const task = queue.tasks.find(t => t.task_id === taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);
  Object.assign(task, patch, { updated_at: now() });
  await writeQueue(queue);
  return task;
}

export async function listTasks(status = null) {
  const queue = await readQueue();
  return status ? queue.tasks.filter(t => t.status === status) : queue.tasks;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'enqueue') {
    console.log(JSON.stringify(await enqueue({ type: args[0], request: args.slice(1).join(' ') }), null, 2));
  } else if (command === 'claim') {
    console.log(JSON.stringify(await claimNext(args[0] || 'amazonite-core'), null, 2));
  } else if (command === 'list') {
    console.log(JSON.stringify(await listTasks(args[0] || null), null, 2));
  } else {
    console.log('Usage: node ai-team/runtime/task-runtime.mjs enqueue <type> <request> | claim <agent> | list [status]');
  }
}
