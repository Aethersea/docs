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
            Documentation
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            href="https://github.com/aethersea/aethersea/releases"
          >
            Download
          </Link>
        </div>
      </div>
    </header>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <Heading as="h3">{title}</Heading>
      <p>{description}</p>
    </div>
  );
}

const features = [
  {
    title: 'Hardware Decoding',
    description:
      'GPU-accelerated H.264 and H.265 decoding on Windows (D3D11VA/NVDEC) and macOS (VideoToolbox) keeps CPU usage minimal even at 4K.',
  },
  {
    title: 'Ultra-Low Latency',
    description:
      'End-to-end latency under 20 ms on a local network. Every stage of the pipeline is optimised to minimise delay.',
  },
  {
    title: 'Full Input Support',
    description:
      'Keyboard, mouse, scroll, and up to 4 simultaneous gamepads are forwarded to the host in real time.',
  },
];

export default function Home(): JSX.Element {
  return (
    <Layout description="The Aethersea desktop client">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {features.map((f) => (
                <FeatureItem key={f.title} {...f} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
