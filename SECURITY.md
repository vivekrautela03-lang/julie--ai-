# Project Julie — Security Architecture & Privacy Safeguards

Project Julie is built with privacy-first engineering and strict security barriers to ensure user isolation, credential safety, and data governance.

---

## 1. Core Security Principles

1. **Strict User Isolation (Row Level Security)**:
   - Every table in PostgreSQL has RLS enabled.
   - Policies strictly enforce `auth.uid() = user_id`, guaranteeing that users cannot query or mutate data belonging to other students.

2. **No Client-Side Secrets**:
   - Master AI API keys and database service role keys are never bundled into client-side code.
   - Mobile builds operate with public anon keys and scoped bearer tokens.

3. **Tool Permission Tiers**:
   - **Read**: Retrieves data without side effects.
   - **Suggest**: Prepares changes and subtask proposals for user review before committing.
   - **Write**: Performs standard create/update operations.
   - **Sensitive**: High-risk operations (e.g. `forget_memory`) require explicit user confirmation.

4. **Transparent AI Action Logging**:
   - Every autonomous decision, proactive notification, and tool invocation is recorded in the `ai_action_logs` ledger for user inspection.

5. **User Memory Governance & Right to Forget**:
   - The user maintains 100% control over the memory system.
   - The **"Forget Topic"** tool permanently purges all semantic embeddings, tags, and text references associated with the target topic.
