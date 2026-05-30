import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DevicesIcon from '@mui/icons-material/Devices';
import DnsIcon from '@mui/icons-material/Dns';

type Project = {
  title: string;
  badge: string;
  description: string;
  href: string;
  icon: React.ReactNode;
};

const projects: Project[] = [
  {
    title: 'Shen',
    badge: 'Client',
    description:
      'The cross-platform desktop client. Connects to a Leviathan server and renders the stream with ultra-low latency using hardware-accelerated decoding.',
    href: 'https://shen.theaethersea.com',
    icon: <DevicesIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Leviathan',
    badge: 'Server',
    description:
      'The server component. Captures your desktop, encodes it with hardware acceleration, and streams it securely to Shen clients.',
    href: 'https://leviathan.theaethersea.com',
    icon: <DnsIcon fontSize="large" color="primary" />,
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
        <Typography variant="h2" component="h1" fontWeight={800} color="inherit" gutterBottom>
          {siteConfig.title}
        </Typography>
        <Typography variant="h5" component="p" color="inherit" sx={{ opacity: 0.9 }}>
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
            Get Started
          </Button>
          <Button
            component={Link}
            to="/blog"
            variant="outlined"
            size="large"
            sx={{ color: 'common.white', borderColor: 'common.white' }}
          >
            Updates
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

function ProjectCard({ title, badge, description, href, icon }: Project) {
  return (
    <Card
      variant="outlined"
      className="flex h-full flex-col transition-transform duration-200 hover:-translate-y-1"
      sx={{ borderRadius: 3 }}
    >
      <CardContent className="grow">
        <Stack direction="row" spacing={1.5} alignItems="center" className="mb-3">
          {icon}
          <Typography variant="h5" component="h3" fontWeight={700}>
            {title}
          </Typography>
          <Chip label={badge} color="primary" size="small" className="ml-auto" />
        </Stack>
        <Typography color="text.secondary">{description}</Typography>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button component={Link} href={href} variant="contained" fullWidth endIcon={<ArrowForwardIcon />}>
          View Docs
        </Button>
      </CardActions>
    </Card>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout description="Open-source, high-performance remote desktop solution">
      <HomepageHeader />
      <main>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.title} {...p} />
            ))}
          </div>
        </Container>
      </main>
    </Layout>
  );
}
