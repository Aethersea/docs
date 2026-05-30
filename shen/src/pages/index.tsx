import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DownloadIcon from '@mui/icons-material/Download';
import MemoryIcon from '@mui/icons-material/Memory';
import BoltIcon from '@mui/icons-material/Bolt';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

type Feature = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const features: Feature[] = [
  {
    title: 'Hardware Decoding',
    description:
      'GPU-accelerated H.264 and H.265 decoding on Windows (D3D11VA/NVDEC) and macOS (VideoToolbox) keeps CPU usage minimal even at 4K.',
    icon: <MemoryIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Ultra-Low Latency',
    description:
      'End-to-end latency under 20 ms on a local network. Every stage of the pipeline is optimised to minimise delay.',
    icon: <BoltIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Full Input Support',
    description:
      'Keyboard, mouse, scroll, and up to 4 simultaneous gamepads are forwarded to the host in real time.',
    icon: <SportsEsportsIcon fontSize="large" color="primary" />,
  },
];

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Box
      component="header"
      className="heroGradient relative overflow-hidden px-4 py-16 text-center text-white md:py-24"
    >
      <Container maxWidth="md">
        <Typography variant="h2" component="h1" color="inherit" gutterBottom sx={{ fontWeight: 800 }}>
          {siteConfig.title}
        </Typography>
        <Typography variant="h5" component="p" color="inherit" sx={{ opacity: 0.9 }}>
          {siteConfig.tagline}
        </Typography>
        <Stack
          className="mt-8"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'center' }}
        >
          <Button
            component={Link}
            to="/docs/intro"
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{ bgcolor: 'common.white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
          >
            Documentation
          </Button>
          <Button
            component={Link}
            href="https://github.com/aethersea/aethersea/releases"
            variant="outlined"
            size="large"
            startIcon={<DownloadIcon />}
            sx={{ color: 'common.white', borderColor: 'common.white' }}
          >
            Download
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

function FeatureCard({ title, description, icon }: Feature) {
  return (
    <Card variant="outlined" className="h-full" sx={{ borderRadius: 3 }}>
      <CardContent>
        <div className="mb-3">{icon}</div>
        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </CardContent>
    </Card>
  );
}

export default function Home(): React.JSX.Element {
  return (
    <Layout description="The Aethersea desktop client">
      <HomepageHeader />
      <main>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </Container>
      </main>
    </Layout>
  );
}
