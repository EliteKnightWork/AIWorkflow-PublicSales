import { Container } from '@radix-ui/themes';
import type React from 'react';
import { BidCompanyListProvider } from './_context/bidConpanyListContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BidCompanyListProvider>
      <Container maxWidth={'100%'} minHeight={'100vh'}>
        {children}
      </Container>
    </BidCompanyListProvider>
  );
};

export default Layout;
