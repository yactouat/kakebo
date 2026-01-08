import { AppShell, Burger, Group, NavLink, Title } from '@mantine/core';
import { IconChartBar, IconGift, IconNotebook, IconPigMoney, IconTarget, IconWallet } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [opened, { toggle }] = useDisclosure(true);
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened, desktop: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} size="sm" />
            <Title order={3}>kakebo</Title>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={Link}
          to="/ledger"
          label="Ledger"
          leftSection={<IconNotebook size={20} />}
          active={location.pathname === '/ledger'}
        />
        <NavLink
          component={Link}
          to="/net-worth"
          label="Net Worth"
          leftSection={<IconWallet size={20} />}
          active={location.pathname === '/net-worth'}
        />
        <NavLink
          component={Link}
          to="/diagrams"
          label="Diagrams"
          leftSection={<IconChartBar size={20} />}
          active={location.pathname === '/diagrams'}
        />
        <NavLink
          component={Link}
          to="/projects"
          label="Projects"
          leftSection={<IconTarget size={20} />}
          active={location.pathname.startsWith('/projects')}
        />
        <NavLink
          component={Link}
          to="/savings-accounts"
          label="Savings"
          leftSection={<IconPigMoney size={20} />}
          active={location.pathname.startsWith('/savings-accounts')}
        />
        <NavLink
          component={Link}
          to="/wishlists"
          label="Wishlists"
          leftSection={<IconGift size={20} />}
          active={location.pathname.startsWith('/wishlists')}
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};

export default Layout;

