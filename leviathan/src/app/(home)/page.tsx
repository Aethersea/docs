import Link from 'next/link';
import { ArrowRight, Gauge, MonitorUp, ServerCog, ShieldCheck } from 'lucide-react';

const features = [
  { title: 'Hardware encoding', text: 'NVENC, QSV, AMF, and VideoToolbox backends.', icon: Gauge },
  { title: 'Efficient capture', text: 'Shared capture pipelines support concurrent sessions.', icon: MonitorUp },
  { title: 'Secure by design', text: 'TLS signaling, DTLS-SRTP media, and pairing.', icon: ShieldCheck },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-20 sm:py-28">
      <div className="max-w-3xl">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-fd-primary/10 text-fd-primary">
          <ServerCog className="size-6" />
        </span>
        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-fd-primary">Aethersea server</p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">Meet Leviathan.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fd-muted-foreground">
          Capture, encode, and securely stream your host desktop to Shen clients with low-latency media transport.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/docs/getting-started"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-fd-primary px-5 font-medium text-fd-primary-foreground"
          >
            Get started <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs"
            className="inline-flex h-11 items-center justify-center rounded-lg border px-5 font-medium hover:bg-fd-accent"
          >
            Browse documentation
          </Link>
        </div>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="rounded-2xl border bg-fd-card p-5 shadow-sm">
              <Icon className="size-5 text-fd-primary" />
              <h2 className="mt-4 font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-fd-muted-foreground">{feature.text}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
