import { Container } from '@radix-ui/themes';
import type React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Container maxWidth={'100%'} minHeight={'100vh'}>
      {children}
    </Container>
  );
};

export default Layout;
