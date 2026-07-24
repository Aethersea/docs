import Link from 'next/link';
import {
  ArrowRight,
  Braces,
  GitFork,
  MonitorSmartphone,
  ServerCog,
  ShieldCheck,
  Zap,
} from 'lucide-react';

const projects = [
  {
    name: 'Shen',
    label: 'Client',
    description:
      'A cross-platform client with hardware-accelerated decoding, precise input, and multi-session support.',
    href: 'https://shen.theaethersea.com',
    icon: MonitorSmartphone,
  },
  {
    name: 'Leviathan',
    label: 'Server',
    description:
      'The host service that captures, encodes, and securely streams your desktop with low latency.',
    href: 'https://leviathan.theaethersea.com',
    icon: ServerCog,
  },
  {
    name: 'Develop',
    label: 'Engineering',
    description:
      'Build guides, protocol details, and internal architecture for contributors to the Aethersea stack.',
    href: 'https://develop.theaethersea.com',
    icon: Braces,
  },
] as const;

export default function HomePage() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="hero-grid pointer-events-none absolute inset-x-0 top-0 h-[42rem]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-[color:var(--brand)]/15 blur-3xl" />

      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-24 text-center sm:pt-32 lg:pt-40">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-fd-card/80 px-3 py-1.5 text-sm text-fd-muted-foreground shadow-sm backdrop-blur">
          <Zap className="size-4 text-[color:var(--brand)]" />
          Open-source remote desktop infrastructure
        </div>
        <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-[-0.04em] sm:text-7xl">
          Your desktop, carried across the{' '}
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
            Aethersea
          </span>
        </h1>
        <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-fd-muted-foreground sm:text-xl">
          A fast, secure streaming stack built for responsive remote work and play—without locking you into a closed platform.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="https://shen.theaethersea.com/docs/getting-started"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-fd-primary px-5 font-medium text-fd-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Get started
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="https://github.com/aethersea/aethersea"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-fd-background/80 px-5 font-medium shadow-sm backdrop-blur transition-colors hover:bg-fd-accent"
          >
            <GitFork className="size-4" />
            View on GitHub
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
          <div className="rounded-xl border bg-fd-card/70 p-4 backdrop-blur">
            <Zap className="mb-3 size-5 text-[color:var(--brand)]" />
            <p className="font-medium">Low latency</p>
            <p className="mt-1 text-sm text-fd-muted-foreground">Hardware codecs and adaptive FEC.</p>
          </div>
          <div className="rounded-xl border bg-fd-card/70 p-4 backdrop-blur">
            <ShieldCheck className="mb-3 size-5 text-[color:var(--brand)]" />
            <p className="font-medium">Secure transport</p>
            <p className="mt-1 text-sm text-fd-muted-foreground">TLS, DTLS-SRTP, and pairing.</p>
          </div>
          <div className="rounded-xl border bg-fd-card/70 p-4 backdrop-blur">
            <MonitorSmartphone className="mb-3 size-5 text-[color:var(--brand)]" />
            <p className="font-medium">Cross-platform</p>
            <p className="mt-1 text-sm text-fd-muted-foreground">Desktop and mobile clients.</p>
          </div>
        </div>
      </section>

      <section className="border-y bg-fd-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--brand)]">The stack</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Choose where you want to begin</h2>
            <p className="mt-4 text-fd-muted-foreground">
              Install a client, configure a host, or explore the implementation behind both.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {projects.map((project) => {
              const Icon = project.icon;
              return (
                <Link
                  key={project.name}
                  href={project.href}
                  className="group rounded-2xl border bg-fd-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[color:var(--brand)]/50 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-11 place-items-center rounded-xl bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
                      <Icon className="size-5" />
                    </span>
                    <span className="rounded-full border px-2.5 py-1 text-xs font-medium text-fd-muted-foreground">
                      {project.label}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{project.name}</h3>
                  <p className="mt-2 min-h-18 text-sm leading-6 text-fd-muted-foreground">{project.description}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
                    Open project
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-fd-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Aethersea. Open source, end to end.</p>
        <Link href="https://develop.theaethersea.com" className="hover:text-fd-foreground">
          Developer documentation →
        </Link>
      </footer>
    </main>
  );
}
