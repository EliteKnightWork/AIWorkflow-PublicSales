import { Container } from '@radix-ui/themes';
import type React from 'react';
import { OrganizationListProvider } from './_context/organizationListContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <OrganizationListProvider>
      <Container maxWidth={'100%'} minHeight={'100vh'}>
        {children}
      </Container>
    </OrganizationListProvider>
  );
};

export default Layout;
