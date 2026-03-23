# PRODUCT.md — OpenClaw

## Layer 1: What Is This Thing?

**OpenClaw** is a personal AI assistant you run on your own devices, answering you on the messaging channels you already use.

### Who uses it and why they care

- **Power users and developers** who want a single AI assistant across all their channels (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Google Chat, IRC, Matrix, Teams, LINE, and more)
- They care because it's **self-hosted** (privacy, control), **always-on**, and **extensible** via plugins, skills, and agent harnesses
- It replaces juggling multiple AI apps with one assistant that meets you where you already are

### Distribution and pricing

- **Open source** (MIT license), installed via npm/pnpm/bun
- GitHub: [openclaw/openclaw](https://github.com/openclaw/openclaw) (upstream) · [ghostwater-ai/openclaw](https://github.com/ghostwater-ai/openclaw) (fork)
- Users bring their own model API keys (OpenAI, Anthropic, Google, AWS Bedrock, etc.)
- No SaaS pricing — free to run, users pay only for model API usage

### Tech stack

- **Runtime:** Node.js ≥22, TypeScript
- **Architecture:** Gateway daemon (control plane) + channel plugins + provider adapters
- **Channels:** 20+ messaging integrations (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, etc.)
- **Model providers:** OpenAI, Anthropic, Google, AWS Bedrock, Azure, and more via provider adapters
- **Extensions:** Plugin SDK, AgentSkills, ACP (Agent Client Protocol) harness
- **Companion capabilities:** TTS/STT, Canvas (live UI), browser control, node pairing (mobile/desktop devices)
- **CI:** GitHub Actions
- **Package:** npm (`openclaw`)

### Repo location

- **Upstream:** `https://github.com/openclaw/openclaw`
- **Fork (this repo):** `https://github.com/ghostwater-ai/openclaw` — branch `dev/local-patches`

---

## Layer 2: What Matters Right Now?

### Current focus (Q1 2025)

> From VISION.md — priorities in order:
>
> 1. Security and safe defaults
> 2. Bug fixes and stability
> 3. Setup reliability and first-run UX

### What "done" looks like

- Secure defaults that don't kill capability
- Stable gateway with reliable channel integrations
- Onboarding wizard (`openclaw onboard`) works cleanly on macOS, Linux, and WSL2

### Known constraints

- Upstream is a fast-moving open-source project — fork patches must stay rebasing-friendly
- Model costs borne by end users — UX must help users understand token usage
- Single-user architecture by design (personal assistant, not multi-tenant SaaS)

### What we're explicitly NOT doing

- Multi-tenant / hosted SaaS
- Building a model — we're provider-agnostic
- Competing on model intelligence — we compete on integration breadth and personal-assistant UX

### Fork-specific patches (`dev/local-patches`)

Local patches on top of upstream, maintained via rebase:

- Slack `nativeNames` / `nativePrefix` slash command mapping
- `--session-key` CLI routing for agent dispatch
- Leaked model control token stripping
- Various channel-specific fixes (Mattermost markdown, Slack threading, etc.)

These patches are either candidates for upstream PRs or local-only customizations.

---

## Layer 3: User Acceptance Criteria

### UAC-001: Multi-channel message delivery

- status: implemented
- added: 2025-03-23 (initial PRODUCT.md)
- source_files: src/channels/, src/gateway/
- criteria:
  - User sends a message on any supported channel (WhatsApp, Telegram, Slack, Discord, etc.)
  - Gateway receives the message and routes it to the configured model provider
  - Response is delivered back to the same channel, same thread/conversation

### UAC-002: Onboarding wizard

- status: implemented
- added: 2025-03-23 (initial PRODUCT.md)
- source_files: src/wizard/
- criteria:
  - User runs `openclaw onboard --install-daemon`
  - Wizard guides through gateway setup, workspace config, channel pairing, and skill installation
  - Gateway daemon is installed as a system service (launchd/systemd)

### UAC-003: Model provider failover

- status: implemented
- added: 2025-03-23 (initial PRODUCT.md)
- source_files: src/providers/, src/routing/
- criteria:
  - User configures multiple model providers
  - When primary provider fails or rate-limits, system falls back to next configured provider
  - Failover is transparent to the user

### UAC-004: Plugin and skill extensibility

- status: implemented
- added: 2025-03-23 (initial PRODUCT.md)
- source_files: src/plugins/, src/plugin-sdk/
- criteria:
  - User can install skills via ClawHub or local directories
  - Plugins extend capabilities without modifying core
  - Skills provide structured instructions that agents follow

### UAC-005: Agent session routing

- status: implemented
- added: 2025-03-23 (initial PRODUCT.md)
- source_files: src/sessions/, src/agents/
- criteria:
  - Multiple agent workspaces can be configured (e.g., Dross, Oz)
  - Messages are routed to the correct agent based on channel, session key, or slash command
  - Each agent maintains its own context and workspace

### UAC-006: Secure defaults

- status: intent
- added: 2025-03-23 (initial PRODUCT.md)
- source_files: src/security/, SECURITY.md
- criteria:
  - Gateway starts with restrictive defaults (no open ports, auth required)
  - Dangerous operations require explicit opt-in (`--dangerously-*` flags or config)
  - Prompt injection mitigations are active by default

---

## Layer 4: Engineering Invariants

1. **Channel plugins are stateless message adapters** — they translate between channel-native formats and the internal message schema. No business logic in channel code.

2. **Provider adapters are interchangeable** — switching model providers must not require changes outside provider config. No provider-specific logic in routing or session code.

3. **Gateway is the control plane, not the product** — the assistant experience (personality, skills, memory) lives in agent workspaces, not in the gateway.

4. **Fork patches rebase cleanly on upstream** — local patches must not diverge structurally from upstream. If a patch can't rebase, it gets upstreamed or dropped.

5. **Single-user trust model** — the system assumes a trusted operator. Multi-tenant isolation is not a design goal and must not be retrofitted without explicit architectural review.

6. **Plugins over core** — new capabilities ship as plugins/skills unless they require gateway-level integration. The bar for adding to core is intentionally high.

---

## Appendix: Architecture Reference

### High-level architecture

```
┌─────────────────────────────────────────────────┐
│                   User Devices                   │
│  (Phone, Laptop, Desktop, IoT)                   │
└──────────┬──────────────────────┬────────────────┘
           │                      │
    ┌──────▼──────┐        ┌──────▼──────┐
    │  Channels   │        │    Nodes    │
    │ (WhatsApp,  │        │ (iOS/macOS/ │
    │  Telegram,  │        │  Android/   │
    │  Slack...)  │        │  Desktop)   │
    └──────┬──────┘        └──────┬──────┘
           │                      │
    ┌──────▼──────────────────────▼──────┐
    │           Gateway Daemon           │
    │         (Control Plane)            │
    │                                    │
    │  ┌──────────┐  ┌───────────────┐   │
    │  │ Sessions  │  │   Routing     │   │
    │  │ & Context │  │ & Failover    │   │
    │  └──────────┘  └───────────────┘   │
    │  ┌──────────┐  ┌───────────────┐   │
    │  │ Plugins  │  │   Security    │   │
    │  │ & Skills │  │   & Auth      │   │
    │  └──────────┘  └───────────────┘   │
    └──────────────────┬─────────────────┘
                       │
    ┌──────────────────▼─────────────────┐
    │         Model Providers            │
    │  (OpenAI, Anthropic, Google,       │
    │   Bedrock, Azure, local models)    │
    └────────────────────────────────────┘
```

### Key integration points

- **Channel webhooks/polling** — each channel plugin connects via its native API (WebSocket, webhook, polling)
- **ACP (Agent Client Protocol)** — standardized protocol for agent harness integration
- **Node pairing** — mDNS discovery + encrypted pairing for companion devices
- **Plugin SDK** — npm-distributed extension API for custom tools and integrations
- **Canvas** — WebSocket-based live UI rendering to paired browsers/devices
