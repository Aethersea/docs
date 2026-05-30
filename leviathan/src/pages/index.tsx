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
import VideocamIcon from '@mui/icons-material/Videocam';
import ScreenshotMonitorIcon from '@mui/icons-material/ScreenshotMonitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';

type Feature = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const features: Feature[] = [
  {
    title: 'Hardware Encoding',
    description:
      'NVENC, AMF, QuickSync, and VideoToolbox backends offload encoding to the GPU, enabling ultra-high bitrates with minimal CPU impact.',
    icon: <VideocamIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Low-Latency Capture',
    description:
      'DXGI Desktop Duplication on Windows and ScreenCaptureKit on macOS provide zero-copy frame capture directly from the GPU framebuffer.',
    icon: <ScreenshotMonitorIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Full Input Injection',
    description:
      'Keyboard, mouse, and gamepad events from Shen are injected into the OS input stack so remote applications respond just like on a local machine.',
    icon: <KeyboardIcon fontSize="large" color="primary" />,
  },
];

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Box
      component="header"
      className="relative overflow-hidden text-center"
      sx={{
        py: { xs: 8, md: 12 },
        background:
          'linear-gradient(135deg, var(--mui-palette-primary-main), var(--mui-palette-primary-dark))',
        color: 'common.white',
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h2" component="h1" fontWeight={800} gutterBottom>
          {siteConfig.title}
        </Typography>
        <Typography variant="h5" component="p" sx={{ opacity: 0.9 }}>
          {siteConfig.tagline}
        </Typography>
        <Stack
          className="mt-8"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
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
        <Typography variant="h6" component="h3" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </CardContent>
    </Card>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout description="The Aethersea server">
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
