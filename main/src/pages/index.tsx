import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            Get Started
          </Link>
          <Link className="button button--outline button--secondary button--lg" to="/blog">
            Updates
          </Link>
        </div>
      </div>
    </header>
  );
}

function ProjectCard({
  title,
  description,
  href,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  badge: string;
}) {
  return (
    <div className={clsx('col col--6', styles.projectCard)}>
      <div className="card shadow--md">
        <div className="card__header">
          <span className={clsx('badge', styles.badge)}>{badge}</span>
          <Heading as="h3">{title}</Heading>
        </div>
        <div className="card__body">
          <p>{description}</p>
        </div>
        <div className="card__footer">
          <Link className="button button--primary button--block" href={href}>
            View Docs →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout description="Open-source, high-performance remote desktop solution">
      <HomepageHeader />
      <main>
        <section className={styles.projects}>
          <div className="container">
            <div className="row">
              <ProjectCard
                title="Shen"
                description="The cross-platform desktop client. Connects to a Leviathan server and renders the stream with ultra-low latency using hardware-accelerated decoding."
                href="https://shen.theaethersea.com"
                badge="Client"
              />
              <ProjectCard
                title="Leviathan"
                description="The server component. Captures your desktop, encodes it with hardware acceleration, and streams it securely to Shen clients."
                href="https://leviathan.theaethersea.com"
                badge="Server"
              />
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
