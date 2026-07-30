/**
 * five-world-event-bridge.js
 *
 * Bridges Chinese-formatted dialogue reproduction events to the DNF runtime.
 * AI appends structured requests to 生殖系统.待处理请求;
 * the bridge maps, validates, and submits them to submitConception/settleBirth.
 */

import { ensureFiveWorldState } from './five-world-mvu.js';
import { submitConception, settleBirth } from './five-world-runtime.js';

/** Fields the AI is allowed to submit. Any extra field → rejection. */
const ALLOWED_EVENT_FIELDS = new Set([
  '类型', '事件ID', '日期', '参与者ID',
  '妊娠候选ID', '授精候选ID', '是否体内授精',
  '避孕措施', '健康与年龄证据', '世界修正证据',
]);

/** Script-only fields that the AI must never supply. */
const SCRIPT_ONLY_FIELDS = new Set([
  'D100', '骰点', 'roll', 'probability',
  '受孕结果', '妊娠时长', '后代数量', '后代性别', '遗传结果',
]);

// ── Mapping ────────────────────────────────────────────────────────

export function mapConceptionEvent(event) {
  // Reject script-only fields
  for (const key of Object.keys(event)) {
    if (!ALLOWED_EVENT_FIELDS.has(key)) {
      return { error: `脚本只读字段: ${key}`, request: null };
    }
    if (SCRIPT_ONLY_FIELDS.has(key)) {
      return { error: `脚本只读字段: ${key}`, request: null };
    }
  }

  if (event.类型 !== '受孕请求') {
    return { error: `未知生殖事件类型: ${event.类型}`, request: null };
  }

  const health = event.健康与年龄证据?.健康 || {};
  const age = event.健康与年龄证据?.年龄 || {};

  const request = {
    eventId: event.事件ID || '',
    date: event.日期 || '',
    participantIds: event.参与者ID || [],
    gestatingId: event.妊娠候选ID || '',
    inseminatingId: event.授精候选ID || '',
    internalInsemination: event.是否体内授精 ?? true,
    contraception: event.避孕措施 || [],
    healthEvidence: Object.values(health).filter(Boolean).join(';'),
    ageEvidence: Object.values(age).filter(Boolean).join(';'),
    worldModifiers: event.世界修正证据 || [],
  };

  // Validate required fields
  const missing = [];
  if (!request.eventId) missing.push('事件ID');
  if (!request.date) missing.push('日期');
  if (!request.gestatingId) missing.push('妊娠候选ID');
  if (!request.inseminatingId) missing.push('授精候选ID');

  if (missing.length) {
    return { error: `缺少必填字段: ${missing.join('、')}`, request: null };
  }

  return { error: null, request };
}

// ── Single event processing ────────────────────────────────────────

function rejectedBridgeResult(event, reason) {
  return { 事件ID: event?.事件ID || '', status: '已拒绝', reason, roll: null };
}

function recordBridgeError(statData, event, error) {
  statData.生殖系统.最后错误 = error;
  return rejectedBridgeResult(event, error);
}

function recordBridgeResult(statData, event, result) {
  const results = statData.生殖系统.事件结果 || [];
  // Idempotent by event ID
  const existing = results.find(r => r.事件ID === event.事件ID);
  if (existing) return { ...existing, duplicate: true };

  const entry = {
    事件ID: event.事件ID,
    status: result.status,
    roll: result.roll ?? null,
    probability: result.probability ?? 0,
    reason: result.reason || '',
  };
  results.push(entry);
  statData.生殖系统.事件结果 = results;
  return entry;
}

export function processReproductionEvent(statData, event, random = Math.random) {
  ensureFiveWorldState(statData);

  if (!event || typeof event !== 'object') {
    return recordBridgeError(statData, event, '无效事件对象');
  }

  if (event.类型 !== '受孕请求') {
    return recordBridgeError(statData, event, `未知生殖事件类型: ${event.类型}`);
  }

  const mapped = mapConceptionEvent(event);
  if (mapped.error) {
    return recordBridgeError(statData, event, mapped.error);
  }

  // Reject minors before RNG call
  if (mapped.request) {
    const gestating = statData.角色档案?.[mapped.request.gestatingId];
    const inseminating = statData.角色档案?.[mapped.request.inseminatingId];
    if (gestating && !gestating.是否成年) {
      return recordBridgeError(statData, event, '妊娠候选未成年');
    }
    if (inseminating && !inseminating.是否成年) {
      return recordBridgeError(statData, event, '授精候选未成年');
    }
  }

  const result = submitConception(statData, mapped.request, random);
  return recordBridgeResult(statData, event, result);
}

// ── Queue processing ───────────────────────────────────────────────

export function consumeReproductionRequests(statData, random = Math.random) {
  ensureFiveWorldState(statData);
  const results = [];
  const queue = statData.生殖系统.待处理请求 || [];
  while (queue.length) {
    const event = queue.shift();
    const result = processReproductionEvent(statData, event, random);
    results.push(result);
  }
  statData.生殖系统.待处理请求 = queue;
  return results;
}

export function settlePendingBirths(statData, random = Math.random) {
  ensureFiveWorldState(statData);
  const pending = [...(statData.生殖系统.待生育事件 || [])];
  const results = [];
  for (const id of pending) {
    try {
      const result = settleBirth(statData, id, random);
      if (!result.duplicate) {
        results.push(result);
      }
    } catch (err) {
      statData.生殖系统.最后错误 = String(err.message || err);
    }
  }
  // Remove settled IDs from pending list
  statData.生殖系统.待生育事件 = (
    statData.生殖系统.待生育事件 || []
  ).filter(id => !pending.includes(id) || !statData.角色档案[id]?.妊娠?.待结算);
  return results;
}
