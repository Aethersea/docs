import Link from 'next/link';
import { ArrowRight, Code2, MonitorSmartphone, ServerCog } from 'lucide-react';

const sections = [
  {
    title: 'Shen development',
    description: 'Build the Electron client and understand its FEC implementation.',
    href: '/docs/shen',
    icon: MonitorSmartphone,
  },
  {
    title: 'Leviathan development',
    description: 'Build the Go server and explore its streaming and platform internals.',
    href: '/docs/leviathan',
    icon: ServerCog,
  },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-20 sm:py-28">
      <div className="max-w-3xl">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-fd-primary/10 text-fd-primary">
          <Code2 className="size-6" />
        </span>
        <h1 className="mt-7 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">Build Aethersea with us.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fd-muted-foreground">
          Contributor setup, protocol notes, and the implementation details behind Shen and Leviathan.
        </p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.title}
              href={section.href}
              className="group rounded-2xl border bg-fd-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-fd-primary/50"
            >
              <Icon className="size-6 text-fd-primary" />
              <h2 className="mt-5 text-xl font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-fd-muted-foreground">{section.description}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
                Read the docs <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
