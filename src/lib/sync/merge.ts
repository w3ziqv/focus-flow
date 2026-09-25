import type { ChecklistItem, SessionLogEntryV2 } from '../../types'
import type { SessionTombstone } from './types'
import {
  MAX_CHECKLIST_ID_LENGTH,
  MAX_CHECKLIST_ITEMS,
  MAX_CHECKLIST_TEXT_LENGTH,
  MAX_SESSIONS,
  MAX_TASK_LENGTH,
  sanitizeSessionEntry,
} from '../storage'

/**
 * Sanitizes a single checklist item, tolerating `done: true` as well as `completed: true`.
 * Strips prototype pollution, clamps field lengths.
 */
export function sanitizeChecklistItem(value: unknown): ChecklistItem | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const v = value as Record<string, unknown>

  if (typeof v.id !== 'string' || v.id.trim() === '') return null
  const id: string = v.id.trim().slice(0, MAX_CHECKLIST_ID_LENGTH)

  if (typeof v.text !== 'string' || v.text.trim() === '') return null
  const text: string = v.text.trim().slice(0, MAX_CHECKLIST_TEXT_LENGTH)

  const completed: boolean = v.completed === true || v.done === true

  return { id, text, completed }
}

/**
 * Reconciles two checklists for the same session by item ID.
 * Monotonic completion: once completed, remains completed (`done: true` wins).
 * Fully commutative: mergeChecklists(A, B) === mergeChecklists(B, A).
 */
export function mergeChecklists(
  listA?: readonly ChecklistItem[] | null,
  listB?: readonly ChecklistItem[] | null,
): ChecklistItem[] | undefined {
  const hasA = Array.isArray(listA) && listA.length > 0
  const hasB = Array.isArray(listB) && listB.length > 0

  if (!hasA && !hasB) return undefined

  if (!hasA) {
    const sanitized = (listB as readonly ChecklistItem[])
      .map(sanitizeChecklistItem)
      .filter((item): item is ChecklistItem => item !== null)
      .slice(0, MAX_CHECKLIST_ITEMS)
    return sanitized.length > 0 ? sanitized : undefined
  }

  if (!hasB) {
    const sanitized = (listA as readonly ChecklistItem[])
      .map(sanitizeChecklistItem)
      .filter((item): item is ChecklistItem => item !== null)
      .slice(0, MAX_CHECKLIST_ITEMS)
    return sanitized.length > 0 ? sanitized : undefined
  }

  const itemMap = new Map<string, ChecklistItem>()

  // Canonical ordering between the two lists to guarantee 100% commutativity
  const strA = JSON.stringify(listA)
  const strB = JSON.stringify(listB)
  const [firstList, secondList] = strA.localeCompare(strB) >= 0 ? [listA, listB] : [listB, listA]

  for (const raw of firstList) {
    const item = sanitizeChecklistItem(raw)
    if (item) {
      itemMap.set(item.id, item)
    }
  }

  for (const raw of secondList) {
    const item = sanitizeChecklistItem(raw)
    if (!item) continue

    const existing = itemMap.get(item.id)
    if (!existing) {
      itemMap.set(item.id, item)
    } else {
      // Monotonic completion: true wins over false
      const completed = existing.completed || item.completed
      // Longer text wins, alphabetical tie-break
      let text: string
      if (item.text.length !== existing.text.length) {
        text = item.text.length > existing.text.length ? item.text : existing.text
      } else {
        text = item.text.localeCompare(existing.text) >= 0 ? item.text : existing.text
      }

      itemMap.set(item.id, {
        id: existing.id,
        text: text.slice(0, MAX_CHECKLIST_TEXT_LENGTH),
        completed,
      })
    }
  }

  const merged = Array.from(itemMap.values()).slice(0, MAX_CHECKLIST_ITEMS)
  return merged.length > 0 ? merged : undefined
}

function reconcileTask(taskA: string | null, taskB: string | null): string | null {
  if (taskA !== null && taskB !== null) {
    if (taskA.length !== taskB.length) {
      return taskA.length > taskB.length ? taskA : taskB
    }
    return taskA.localeCompare(taskB) >= 0 ? taskA : taskB
  }
  return taskA ?? taskB
}

/**
 * Reconciles two conflicting session records representing the same physical session.
 * Fully commutative: reconcileSessionConflict(A, B) === reconcileSessionConflict(B, A).
 */
export function reconcileSessionConflict(
  entryA: SessionLogEntryV2,
  entryB: SessionLogEntryV2,
): SessionLogEntryV2 {
  // Task: prefer non-null, longer string, then alphabetical localeCompare
  const rawTask = reconcileTask(entryA.task, entryB.task)
  const finalTask: string | null =
    rawTask && rawTask.trim() !== '' ? rawTask.trim().slice(0, MAX_TASK_LENGTH) : null

  // Checklist: merge items monotonically
  const checklist = mergeChecklists(entryA.checklist, entryB.checklist)

  // Duration: take maximum minutes
  const minutes: number = Math.max(entryA.minutes, entryB.minutes)

  // Date: canonical timestamp from earliest valid timestamp
  const tsA = Date.parse(entryA.date)
  const tsB = Date.parse(entryB.date)
  let date: string
  if (tsA !== tsB) {
    date = tsA <= tsB ? entryA.date : entryB.date
  } else {
    date = entryA.date.localeCompare(entryB.date) <= 0 ? entryA.date : entryB.date
  }

  // ID: deterministic tie-break if IDs differed on secondary match
  const id: string = entryA.id.localeCompare(entryB.id) >= 0 ? entryA.id : entryB.id

  const result: SessionLogEntryV2 = {
    id,
    date,
    minutes,
    task: finalTask,
  }

  if (checklist && checklist.length > 0) {
    result.checklist = checklist
  }

  return result
}

/**
 * Normalizes and sanitizes raw input entries, handling Date objects and `done: true`.
 */
function sanitizeCandidate(raw: unknown): SessionLogEntryV2 | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>

  // Normalize date if passed as Date object
  let dateVal: unknown = r.date ?? r.startTime
  if (dateVal instanceof Date && !Number.isNaN(dateVal.getTime())) {
    dateVal = dateVal.toISOString()
  }

  // Normalize checklist items (support done: true as well as completed: true)
  let checklistVal: unknown = r.checklist
  if (Array.isArray(checklistVal)) {
    checklistVal = checklistVal.map((item) => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const itemRec = item as Record<string, unknown>
        const completed = itemRec.completed === true || itemRec.done === true
        return {
          ...itemRec,
          completed,
        }
      }
      return item
    })
  }

  const normalized = {
    ...r,
    date: dateVal,
    checklist: checklistVal,
  }

  return sanitizeSessionEntry(normalized)
}

/**
 * Deterministically merges local and remote session logs into a unified,
 * deduplicated, chronologically sorted, and capped array.
 *
 * Guarantees:
 * 1. Non-destructive: empty remote state never clears local sessions; empty local adopts remote.
 * 2. Idempotent: merge(A, A) === A.
 * 3. Commutative: merge(A, B) === merge(B, A).
 * 4. Deduplication: strictly deduplicates by primary session ID.
 * 5. Conflict Resolution: max minutes; non-null/longer task wins; monotonic checklist merge.
 * 6. Sorting: descending chronologically by date (newest first); secondary tie-break descending by ID.
 * 7. Capped: result never exceeds MAX_SESSIONS (1,000).
 * 8. Resilient: invalid, corrupted, or malicious payloads are safely ignored without throwing.
 */
export function mergeSessions(
  local?: readonly unknown[] | null,
  remote?: readonly unknown[] | null,
  tombstones?: readonly SessionTombstone[] | null,
): SessionLogEntryV2[] {
  const sanitizedLocal: SessionLogEntryV2[] = Array.isArray(local)
    ? local
        .map(sanitizeCandidate)
        .filter((entry): entry is SessionLogEntryV2 => entry !== null)
    : []

  const sanitizedRemote: SessionLogEntryV2[] = Array.isArray(remote)
    ? remote
        .map(sanitizeCandidate)
        .filter((entry): entry is SessionLogEntryV2 => entry !== null)
    : []

  // Fast-path for empty inputs
  if (sanitizedLocal.length === 0 && sanitizedRemote.length === 0) {
    return []
  }

  // Active tombstones map (within 30 days) to prevent zombie resurrection
  const tombstoneMap = new Map<string, string>()
  if (Array.isArray(tombstones)) {
    const now = Date.now()
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
    for (const t of tombstones) {
      if (t && typeof t.id === 'string' && typeof t.deletedAt === 'string') {
        const deletedTime = Date.parse(t.deletedAt)
        if (!Number.isNaN(deletedTime) && now - deletedTime < THIRTY_DAYS_MS) {
          tombstoneMap.set(t.id, t.deletedAt)
        }
      }
    }
  }

  // Primary index by session ID
  const byId = new Map<string, SessionLogEntryV2>()
  const pool: SessionLogEntryV2[] = [...sanitizedLocal, ...sanitizedRemote]

  for (const candidate of pool) {
    const deletedAt = tombstoneMap.get(candidate.id)
    if (deletedAt) {
      const candidateTime = Date.parse(candidate.date)
      const tombstoneTime = Date.parse(deletedAt)
      if (!Number.isNaN(candidateTime) && candidateTime <= tombstoneTime) {
        continue // Skip deleted session to prevent resurrection
      }
    }
    const existing = byId.get(candidate.id)
    if (existing) {
      byId.set(candidate.id, reconcileSessionConflict(existing, candidate))
    } else {
      byId.set(candidate.id, candidate)
    }
  }

  // Sort descending chronologically by date (newest first), secondary tie-break descending by ID
  const merged: SessionLogEntryV2[] = Array.from(byId.values()).sort((a, b) => {
    const timeDiff = Date.parse(b.date) - Date.parse(a.date)
    if (timeDiff !== 0) return timeDiff
    return b.id.localeCompare(a.id)
  })

  // Cap at MAX_SESSIONS (1,000)
  return merged.slice(0, MAX_SESSIONS)
}
