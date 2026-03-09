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
    title: 'Hardware Encoding',
    description:
      'NVENC, AMF, QuickSync, and VideoToolbox backends offload encoding to the GPU, enabling ultra-high bitrates with minimal CPU impact.',
  },
  {
    title: 'Low-Latency Capture',
    description:
      'DXGI Desktop Duplication on Windows and ScreenCaptureKit on macOS provide zero-copy frame capture directly from the GPU framebuffer.',
  },
  {
    title: 'Full Input Injection',
    description:
      'Keyboard, mouse, and gamepad events from Shen are injected into the OS input stack so remote applications respond just like on a local machine.',
  },
];

export default function Home(): JSX.Element {
  return (
    <Layout description="The Aethersea server">
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
