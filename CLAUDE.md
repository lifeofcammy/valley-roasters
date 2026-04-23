@AGENTS.md

## Karpathy-Inspired Claude Code Guidelines

Derived from Andrej Karpathy's observations on LLM coding pitfalls.

### Think Before Coding
Don't make assumptions on the user's behalf and run with them. Surface confusion, seek clarifications, present tradeoffs, push back when appropriate. If something is ambiguous, ask before coding.

### Simplicity First
Don't overcomplicate code or APIs. Don't bloat abstractions. If 100 lines would do, don't write 1000. Prefer small, direct, readable solutions over clever frameworks.

### Surgical Changes
Only touch code directly relevant to the task. Don't change or remove comments and code you don't fully understand as side effects, even if they seem orthogonal. If a cleanup is genuinely needed, mention it and ask first.

### Goal-Driven Execution
Work toward verifiable success criteria. Prefer a tests-first or check-first approach: define how you'll know the change works, then make the change, then verify.
