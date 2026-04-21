import { colors, space } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { WalletConnectState } from "@/components/ui/wallet-connect-state";
import { BountyCard } from "@/components/ui/bounty-card";

const navItems = [
  { id: "tokens", label: "Tokens" },
  { id: "button", label: "Button" },
  { id: "input", label: "Input" },
  { id: "card", label: "Card" },
  { id: "toast", label: "Toast" },
  { id: "modal", label: "Modal" },
  { id: "badge", label: "Badge" },
  { id: "wallet-connect-state", label: "WalletConnectState" },
  { id: "bounty-card", label: "BountyCard" },
  { id: "phase-2", label: "Phase 2" },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-4 overflow-x-auto border border-border bg-surface-sunken p-4 text-sm font-mono text-ink-muted">
      <code>{children}</code>
    </pre>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink font-display uppercase tracking-wider">
          {title}
        </h2>
        <p className="mt-1 text-ink-muted font-body">{description}</p>
      </div>
      {children}
    </section>
  );
}

function VariantLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block mb-2 text-xs font-display uppercase tracking-wider text-ink-faint">
      {children}
    </span>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-full flex">
      {/* Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-border bg-surface-sunken sticky top-0 h-screen overflow-y-auto p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-ink font-display uppercase tracking-wider">
            MathBounty
          </h1>
          <p className="text-xs text-ink-faint font-display uppercase tracking-wider mt-1">
            Design System
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="px-3 py-2 text-sm font-medium text-ink-muted font-display uppercase tracking-wider transition-colors hover:bg-surface-raised hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-6 md:p-12 max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-ink font-display uppercase tracking-wider">
            Design System
          </h1>
          <p className="mt-3 text-lg text-ink-muted font-body max-w-prose">
            The single source of truth for every reusable UI primitive in
            MathBounty. Built for human reviewers and AI coding agents.
          </p>
        </div>

        {/* AI Agent Callout */}
        <div className="mb-16 border-2 border-brand bg-brand-glow p-6">
          <h2 className="text-lg font-semibold text-brand font-display uppercase tracking-wider flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center border border-brand text-xs">
              🤖
            </span>
            How AI agents should use this page
          </h2>
          <ol className="mt-3 list-decimal list-inside space-y-2 text-ink-muted font-body">
            <li>
              <strong className="text-ink">Always import from</strong>{" "}
              <code className="border border-border bg-surface-sunken px-1.5 py-0.5 text-sm font-mono text-brand">
                components/ui/
              </code>{" "}
              — never write inline JSX that duplicates a component found here.
            </li>
            <li>
              <strong className="text-ink">Reuse tokens from</strong>{" "}
              <code className="border border-border bg-surface-sunken px-1.5 py-0.5 text-sm font-mono text-brand">
                lib/tokens.ts
              </code>{" "}
              — colors, spacing, and typography values are the canonical source.
            </li>
            <li>
              <strong className="text-ink">Match state coverage</strong> before
              considering a component done. If the design system shows 4 states,
              your implementation must handle all 4.
            </li>
          </ol>
        </div>

        {/* Tokens */}
        <Section
          id="tokens"
          title="Tokens"
          description="Visual primitives. Every color, space, and type value used across the product."
        >
          {/* Colors */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-ink font-display uppercase tracking-wider mb-4">
              Color Palette
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Object.entries(colors).map(([name, value]) => (
                <div key={name} className="border border-border overflow-hidden">
                  <div
                    className="h-16 w-full"
                    style={{ background: value }}
                  />
                  <div className="p-3">
                    <p className="text-sm font-medium text-ink font-display uppercase tracking-wider">
                      {name.replace(/-/g, " ").replace(/([A-Z])/g, " $1")}
                    </p>
                    <p className="text-xs text-ink-faint font-mono mt-1">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spacing */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-ink font-display uppercase tracking-wider mb-4">
              Spacing Scale
            </h3>
            <div className="flex flex-col gap-3">
              {Object.entries(space).map(([name, value]) => (
                <div key={name} className="flex items-center gap-4">
                  <span className="w-16 text-sm font-mono text-ink-muted shrink-0 uppercase">
                    {name}
                  </span>
                  <div
                    className="h-4 bg-brand"
                    style={{ width: value }}
                  />
                  <span className="text-xs font-mono text-ink-faint">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div>
            <h3 className="text-lg font-semibold text-ink font-display uppercase tracking-wider mb-4">
              Typography
            </h3>
            <div className="space-y-6">
              <div className="p-4 border border-border bg-surface-raised">
                <p className="text-xs text-ink-faint font-display uppercase tracking-wider mb-2">
                  Display — Bebas Neue
                </p>
                <p className="text-4xl font-bold text-ink font-display uppercase tracking-wider">
                  The quick brown fox jumps over the lazy dog
                </p>
                <p className="mt-2 text-sm text-ink-muted font-mono">
                  font-display / weight: 400 (all-caps by design)
                </p>
              </div>
              <div className="p-4 border border-border bg-surface-raised">
                <p className="text-xs text-ink-faint font-display uppercase tracking-wider mb-2">
                  Body — DM Sans
                </p>
                <p className="text-base text-ink font-body max-w-prose">
                  MathBounty is a decentralized marketplace where anyone can post
                  a mathematical challenge with an ETH reward. Solvers compete to
                  provide correct proofs, and smart contracts handle escrow and
                  payouts automatically.
                </p>
                <p className="mt-2 text-sm text-ink-muted font-mono">
                  font-body / weights: 400, 500, 600, 700
                </p>
              </div>
              <div className="p-4 border border-border bg-surface-raised">
                <p className="text-xs text-ink-faint font-display uppercase tracking-wider mb-2">
                  Mono — JetBrains Mono
                </p>
                <p className="text-sm text-ink font-mono">
                  0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
                </p>
                <p className="mt-2 text-sm text-ink-muted font-mono">
                  font-mono / weights: 400, 500, 600, 700
                </p>
              </div>
            </div>
          </div>
        </Section>

        <hr className="my-16 border-border" />

        {/* Button */}
        <Section
          id="button"
          title="Button"
          description="Triggers actions. Use primary for the main CTA, secondary for alternatives, destructive for irreversible operations."
        >
          <div className="space-y-8">
            {/* Primary */}
            <div>
              <VariantLabel>Primary</VariantLabel>
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="primary">Default</Button>
                <Button variant="primary" className="bg-brand-dim">
                  Hover
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
                <Button variant="primary" isLoading>
                  Loading
                </Button>
              </div>
            </div>
            {/* Secondary */}
            <div>
              <VariantLabel>Secondary</VariantLabel>
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="secondary">Default</Button>
                <Button variant="secondary" className="border-brand text-brand">
                  Hover
                </Button>
                <Button variant="secondary" disabled>
                  Disabled
                </Button>
                <Button variant="secondary" isLoading>
                  Loading
                </Button>
              </div>
            </div>
            {/* Destructive */}
            <div>
              <VariantLabel>Destructive</VariantLabel>
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="destructive">Default</Button>
                <Button variant="destructive" className="bg-error-dim">
                  Hover
                </Button>
                <Button variant="destructive" disabled>
                  Disabled
                </Button>
                <Button variant="destructive" isLoading>
                  Loading
                </Button>
              </div>
            </div>
          </div>
          <CodeBlock>{`import { Button } from "@/components/ui/button";

<Button variant="primary" size="md" onClick={handleClick}>
  Submit Bounty
</Button>`}</CodeBlock>
        </Section>

        <hr className="my-16 border-border" />

        {/* Input */}
        <Section
          id="input"
          title="Input"
          description="Receives text data. Always pair with a label. Show error text when validation fails."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div>
              <VariantLabel>Default</VariantLabel>
              <Input label="Bounty Title" placeholder="e.g. Prove Fermat's Last" />
            </div>
            <div>
              <VariantLabel>Focused</VariantLabel>
              <Input
                label="Bounty Title"
                placeholder="e.g. Prove Fermat's Last"
                className="ring-2 ring-brand ring-offset-2 ring-offset-surface"
              />
            </div>
            <div>
              <VariantLabel>Error</VariantLabel>
              <Input
                label="Reward (ETH)"
                placeholder="0.5"
                state="error"
                error="Must be greater than 0"
              />
            </div>
            <div>
              <VariantLabel>Disabled</VariantLabel>
              <Input
                label="Deadline"
                value="2025-06-01"
                state="disabled"
              />
            </div>
          </div>
          <CodeBlock>{`import { Input } from "@/components/ui/input";

<Input
  label="Bounty Title"
  placeholder="e.g. Prove Fermat's Last"
  error={errors.title}
/>`}</CodeBlock>
        </Section>

        <hr className="my-16 border-border" />

        {/* Card */}
        <Section
          id="card"
          title="Card"
          description="Groups related content. Use for bounty details, forms, or any content that needs a contained surface."
        >
          <div className="flex flex-wrap gap-4">
            <Card className="w-64">
              <h4 className="font-display font-semibold text-ink uppercase tracking-wider">Default Card</h4>
              <p className="mt-2 text-sm text-ink-muted font-body">
                Standard padding and border for contained content.
              </p>
            </Card>
            <Card padding="lg" className="w-64">
              <h4 className="font-display font-semibold text-ink uppercase tracking-wider">Large Padding</h4>
              <p className="mt-2 text-sm text-ink-muted font-body">
                More breathing room for complex content.
              </p>
            </Card>
            <Card padding="sm" className="w-64">
              <h4 className="font-display font-semibold text-ink uppercase tracking-wider">Small Padding</h4>
              <p className="mt-2 text-sm text-ink-muted font-body">
                Tight spacing for dense info.
              </p>
            </Card>
          </div>
          <CodeBlock>{`import { Card } from "@/components/ui/card";

<Card padding="md">
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</Card>`}</CodeBlock>
        </Section>

        <hr className="my-16 border-border" />

        {/* Toast */}
        <Section
          id="toast"
          title="Toast"
          description="Temporary feedback after an action. Auto-dismisses after 5 seconds unless configured otherwise."
        >
          <div className="space-y-4 max-w-md">
            <Toast
              variant="success"
              title="Bounty Created"
              description="Your bounty is now live on Sepolia."
            />
            <Toast
              variant="error"
              title="Transaction Failed"
              description="Insufficient gas for the transaction."
            />
            <Toast
              variant="info"
              title="New Claim"
              description="Someone claimed your bounty #42."
            />
            <Toast
              variant="warning"
              title="Deadline Approaching"
              description="Bounty #7 expires in 24 hours."
            />
          </div>
          <CodeBlock>{`import { Toast } from "@/components/ui/toast";

<Toast
  variant="success"
  title="Bounty Created"
  description="Your bounty is now live."
  onDismiss={() => setShow(false)}
/>`}</CodeBlock>
        </Section>

        <hr className="my-16 border-border" />

        {/* Modal */}
        <Section
          id="modal"
          title="Modal"
          description="Interrupts the user for critical decisions. Use sparingly — prefer inline confirmation for non-destructive actions."
        >
          <div className="relative h-80 border border-dashed border-border bg-surface-sunken overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-sm border-2 border-border bg-surface-raised shadow-lg">
                <div className="border-b border-border p-4">
                  <h2 className="text-lg font-semibold text-ink font-display uppercase tracking-wider">
                    Confirm Payout
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted font-body">
                    This will release 0.5 ETH to the solver. This action cannot
                    be undone.
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-ink-muted font-body">
                    Solver address: 0x742d...0bEb
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-border p-4">
                  <Button variant="secondary" size="sm">
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm">
                    Confirm Payout
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <CodeBlock>{`import { Modal } from "@/components/ui/modal";

<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  description="Are you sure?"
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={confirm}>
        Confirm
      </Button>
    </>
  }
>
  <p>Modal content here.</p>
</Modal>`}</CodeBlock>
        </Section>

        <hr className="my-16 border-border" />

        {/* Badge */}
        <Section
          id="badge"
          title="Badge"
          description="Small status label. Use for bounty states, transaction statuses, or category tags."
        >
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="brand">Brand</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="warning">Warning</Badge>
          </div>
          <CodeBlock>{`import { Badge } from "@/components/ui/badge";

<Badge variant="success">Paid</Badge>`}</CodeBlock>
        </Section>

        <hr className="my-16 border-border" />

        {/* WalletConnectState */}
        <Section
          id="wallet-connect-state"
          title="WalletConnectState"
          description="Shows the current wallet connection status. Always visible in the app header."
        >
          <div className="flex flex-wrap gap-4">
            <div>
              <VariantLabel>Disconnected</VariantLabel>
              <WalletConnectState state="disconnected" />
            </div>
            <div>
              <VariantLabel>Connected</VariantLabel>
              <WalletConnectState
                state="connected"
                address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
              />
            </div>
            <div>
              <VariantLabel>Wrong Network</VariantLabel>
              <WalletConnectState state="wrong-network" networkName="Sepolia" />
            </div>
          </div>
          <CodeBlock>{`import { WalletConnectState } from "@/components/ui/wallet-connect-state";

<WalletConnectState
  state="connected"
  address="0x742d...0bEb"
/>`}</CodeBlock>
        </Section>

        <hr className="my-16 border-border" />

        {/* BountyCard */}
        <Section
          id="bounty-card"
          title="BountyCard"
          description="The primary bounty representation. Shows title, reward, deadline, and status at a glance."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BountyCard
              status="Open"
              title="Prove the Riemann Hypothesis"
              reward="5.0 ETH"
              deadline="2025-12-31"
              description="A complete proof or counter-example acceptable. Must be peer-reviewable."
              proposer="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
            />
            <BountyCard
              status="Claimed"
              title="Collatz Conjecture — Cycle Analysis"
              reward="1.2 ETH"
              deadline="2025-08-15"
              description="Prove no non-trivial cycles exist below 2^60."
              proposer="0x8ba1EAEf5d4A9D71A00e1E80fFd9bd74"
            />
            <BountyCard
              status="Paid"
              title="Twin Prime Infinite Proof Sketch"
              reward="3.0 ETH"
              deadline="2025-03-01"
              description="Novel sieve approach demonstrating bounded gaps."
              proposer="0x1A2b3C4d5E6f7G8h9I0j"
            />
            <BountyCard
              status="Expired"
              title="P vs NP — Oracle Separation"
              reward="10.0 ETH"
              deadline="2024-01-01"
              description="Demonstrate a relativized separation with a new oracle construction."
              proposer="0xAbCdEf0123456789AbCdEf01"
            />
          </div>
          <CodeBlock>{`import { BountyCard } from "@/components/ui/bounty-card";

<BountyCard
  status="Open"
  title="Prove the Riemann Hypothesis"
  reward="5.0 ETH"
  deadline="2025-12-31"
  description="A complete proof or counter-example."
  proposer="0x742d...0bEb"
/>`}</CodeBlock>
        </Section>

        <hr className="my-16 border-border" />

        {/* Phase 2 */}
        <section id="phase-2" className="scroll-mt-24">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-ink font-display uppercase tracking-wider">
              Phase 2 — AI Skill Conversion
            </h2>
            <p className="mt-1 text-ink-muted font-body">
              Future plan for making this design system machine-discoverable.
              No execution this sprint — documentation only.
            </p>
          </div>
          <div className="border border-border bg-surface-raised p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-ink font-display uppercase tracking-wider">
                1. Extract Component Registry as Structured JSON
              </h3>
              <p className="mt-1 text-sm text-ink-muted font-body">
                Convert each component section into a machine-readable schema
                with props, variants, default values, and usage constraints.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink font-display uppercase tracking-wider">
                2. Wrap with Scribe-Style Capability Blocks
              </h3>
              <p className="mt-1 text-sm text-ink-muted font-body">
                Annotate each component with natural-language capability
                descriptions so AI agents can match intent to implementation.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink font-display uppercase tracking-wider">
                3. Register as a Notion Skill
              </h3>
              <p className="mt-1 text-sm text-ink-muted font-body">
                Publish the registry as a reusable skill that any AI coding
                agent in the workspace can query for component shapes, tokens,
                and state coverage matrices.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-border text-center">
          <p className="text-sm text-ink-faint font-body">
            MathBounty Design System — Built for humans and machines.
          </p>
        </footer>
      </main>
    </div>
  );
}
