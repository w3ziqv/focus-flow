# Focus Flow — Security Review Report (v2.5.3)

**Scan Date:** 2026-09-20  
**Target Baseline:** Focus Flow v2.5.3 (commit `d47455b`)  
**Scope:** Client-side Web PWA (`src/lib/`, `src/components/`, `src/views/`, `firestore.rules`)  
**Methodology:** 5-Phase Threat Assessment (Bigpowers / OWASP Top 10 / CWE Mapping)  

---

## 1. Executive Summary

Focus Flow exhibits an exceptional baseline of client-side security:
- **Local-First Architecture (ADR-005)** eliminates server-side attack surfaces (zero SQLi, zero SSRF to cloud backends, zero command injection).
- **React 19 Auto-Escaping**: Zero occurrences of `dangerouslySetInnerHTML`, `innerHTML`, `eval()`, or `document.write` in production source code.
- **Prototype Pollution Defenses**: Comprehensive JSON revivers in `dataPort.ts` and candidate sanitization in `merge.ts` explicitly reject `__proto__`, `constructor`, and `prototype` payloads.
- **Cloud Firestore Security Rules**: Complete subcollection isolation (`isOwner(userId)`) with strict default deny (`match /{document=**} { allow read, write: if false; }`).

The scan identified **1 HIGH** vulnerability and **1 MEDIUM** defense-in-depth finding meeting the confidence threshold (≥ 8/10).

---

## 2. Findings Matrix

| ID | File:Line | Category | CWE | Severity | Confidence | Status |
|---|---|---|---|:---:|:---:|:---:|
| **SEC-01** | `src/lib/dataPort.ts:187` | Client-Side SSRF / Unrestricted Network Fetch | CWE-918 | **HIGH** | **9/10** | **RESOLVED** |
| **SEC-02** | `src/lib/export.ts:197` | CSV Formula Injection | CWE-1236 | **MEDIUM** | **8/10** | **RESOLVED** |

---

## 3. Detailed Vulnerability Assessments

### SEC-01: Client-Side SSRF via Unrestricted `fetch()` in Backup Sound Restoration

* **Location:** `src/lib/dataPort.ts:185-195`
* **CWE:** CWE-918 (Server-Side Request Forgery / Client-Side Fetch Injection)
* **Severity:** **HIGH**
* **Confidence Score:** **9/10**

#### Vulnerability Description
In `src/lib/dataPort.ts`, the `restoreSounds()` function restores custom audio attachments from an imported JSON backup file:

```typescript
const audio = typeof v.audio === 'string' ? v.audio : typeof v.dataUrl === 'string' ? v.dataUrl : null
if (audio !== null) {
  try {
    const blob = await (await fetch(audio)).blob()
```

While backup audio is expected to be a `data:audio/...;base64` URI, the code does not enforce the `data:` protocol scheme before invoking `fetch(audio)`. 

#### Exploit Scenario
An attacker crafts a malicious `focus-flow-backup.json` containing:
```json
{
  "app": "focus-flow",
  "version": 2,
  "data": {
    "sounds": [
      {
        "id": "exploit",
        "name": "Beacon",
        "audio": "http://192.168.1.1/api/reboot"
      }
    ]
  }
}
```
When a victim imports this backup file, the user's browser issues background HTTP requests to internal intranet endpoints or external servers with the user's IP and session context, bypassing the Zero-Network Local-First invariant (ADR-005).

#### Recommendation
Enforce that the restored audio string strictly starts with `data:audio/` before passing to `fetch()`:

```typescript
if (audio !== null && audio.startsWith('data:audio/')) {
  try {
    const blob = await (await fetch(audio)).blob()
    ...
```

---

### SEC-02: CSV Formula Injection via Unsanitized Task Intentions

* **Location:** `src/lib/export.ts:190-205`
* **CWE:** CWE-1236 (Improper Neutralization of Formula Elements in a CSV File)
* **Severity:** **MEDIUM**
* **Confidence Score:** **8/10**

#### Vulnerability Description
`escapeCsvField()` escapes embedded double-quotes per RFC 4180, but does not sanitize formula trigger prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`). 

```typescript
export function escapeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""'
  if (typeof val === 'number') return String(val)
  const str = String(val)
  return `"${str.replace(/"/g, '""')}"`
}
```

#### Exploit Scenario
A malicious session payload (via imported backup or synced data) with a task name like `=HYPERLINK("https://phishing.site", "Click to verify")` or `=cmd|'/C calc'!A0` is exported by the user to CSV. When opened in Microsoft Excel or LibreOffice Calc, the spreadsheet engine evaluates the cell as an executable formula.

#### Recommendation
Neutralize formula triggers by prepending a single quote `'` if the field starts with `= `, `+`, `-`, `@`, `\t`, or `\r` (unless it is a pure numerical value):

```typescript
export function escapeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""'
  if (typeof val === 'number') return String(val)
  let str = String(val)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`
  }
  return `"${str.replace(/"/g, '""')}"`
}
```

---

## 4. Hard Exclusions & Clean Verifications (False-Positive Check)

1. **DOM XSS (CWE-79)**: Verified clean. React 19 JSX auto-escapes all strings; no raw DOM insertion methods used in production code.
2. **Client-Side Webhook Dispatch (CWE-918)**: Verified clean. `isValidWebhookUrl` restricts URLs to `http:`/`https:` protocols, and webhooks are excluded from backup exports (cannot be injected via untrusted JSON imports).
3. **Hardcoded Secrets (CWE-798)**: Verified clean. 0 hardcoded credentials or API keys found.
4. **Cloud Firestore Rules (CWE-285 / CWE-639)**: Verified clean. Comprehensive subcollection ownership checks (`request.auth.uid == userId`) and default deny verified by automated adversarial tests (`firestore_rules.adversarial.test.ts`).
