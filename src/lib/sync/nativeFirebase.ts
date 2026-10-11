import type { FirebaseContext } from './firebase'
import { nativeInvoke } from '../desktop/runtime'
import type { CloudUser } from './types'

type Ref = {path: string; id: string; constraints?: Constraint[]}
type Constraint = {kind: 'limit' | 'order' | 'cursor'; value: number | string; direction?: string}
type Row = {path: string; data: Record<string, unknown>}
type Operation = {kind: 'set' | 'delete'; path: string; data?: Record<string, unknown>}

/** Native transport implements the document operations consumed by the shared reconciler.
 * SDK-shaped references never leave this module; credentials never enter JavaScript.
 */
export async function createNativeFirebaseContext(): Promise<FirebaseContext> {
  const auth: {currentUser: CloudUser | null} = {currentUser: (await nativeInvoke<{user: CloudUser | null}>('cloud_status')).user}
  const reference = (_db: unknown, ...segments: string[]): Ref => ({path: segments.join('/'), id: segments.at(-1)!})
  const snapshot = (row?: Row) => ({id: row?.path.split('/').at(-1), ref: row ? {path: row.path} : undefined, exists: () => !!row, data: () => row?.data})
  const modules = {
    signInWithPopup: async () => { auth.currentUser = await nativeInvoke<CloudUser>('cloud_sign_in'); return {user: auth.currentUser} },
    signOut: async () => { await nativeInvoke('cloud_sign_out'); auth.currentUser = null },
    deleteUser: async () => { await nativeInvoke('cloud_delete_account'); auth.currentUser = null },
    onAuthStateChanged: (_auth: unknown, callback: (user: CloudUser | null) => void) => { callback(auth.currentUser); return () => {} },
    doc: reference,
    collection: reference,
    query: (ref: Ref, ...constraints: Constraint[]) => ({...ref, constraints}),
    documentId: () => '__name__',
    startAfter: (doc: {ref: Ref}): Constraint => ({kind: 'cursor', value: doc.ref.path}),
    limit: (value: number): Constraint => ({kind: 'limit', value}),
    orderBy: (value: string, direction = 'asc'): Constraint => ({kind: 'order', value, direction}),
    getDoc: async (ref: Ref) => snapshot(await nativeInvoke<Row | undefined>('cloud_document', {path: ref.path})),
    getDocs: async (ref: Ref) => {
      const rows = await nativeInvoke<Row[]>('cloud_documents', {path: ref.path, constraints: ref.constraints ?? []})
      const docs = rows.map(row => snapshot(row))
      return {docs, forEach: (callback: (doc: ReturnType<typeof snapshot>) => void) => docs.forEach(callback)}
    },
    setDoc: async (ref: Ref, data: Record<string, unknown>) => nativeInvoke('cloud_commit', {operations: [{kind: 'set', path: ref.path, data}]}),
    deleteDoc: async (ref: Ref) => nativeInvoke('cloud_commit', {operations: [{kind: 'delete', path: ref.path}]}),
    writeBatch: () => {
      const operations: Operation[] = []
      return {set: (ref: Ref, data: Record<string, unknown>) => operations.push({kind: 'set', path: ref.path, data}), delete: (ref: Ref) => operations.push({kind: 'delete', path: ref.path}), commit: () => nativeInvoke('cloud_commit', {operations})}
    },
  }
  // Firebase's concrete opaque reference types are adapted only at this transport boundary.
  return {app: {}, db: {}, auth, googleProvider: {}, modules} as unknown as FirebaseContext
}
