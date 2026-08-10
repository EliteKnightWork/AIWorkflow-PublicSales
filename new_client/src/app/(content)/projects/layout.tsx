import { Container, Flex } from '@radix-ui/themes';
import type React from 'react';
import { Suspense } from 'react';
import { ContentFooter } from '@/app/_components/contentFooter/ContentFooter';
import ManagementProvider from '../management/_context/ManagementContext';
import { ProjectListProvider } from './_context/projectListContext';
import { ProjectSearchProvider } from './_context/projectSearchContext';
import { SelectedSearchFilterPresetProvider } from './_context/selectedSearchFilterPreset';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Suspense fallback={null}>
      <ProjectSearchProvider>
        <SelectedSearchFilterPresetProvider>
          <ProjectListProvider>
            <ManagementProvider>
              <Flex direction={'column'} minHeight={'100vh'}>
                <Container maxWidth={'100%'}>{children}</Container>
                <ContentFooter />
              </Flex>
            </ManagementProvider>
          </ProjectListProvider>
        </SelectedSearchFilterPresetProvider>
      </ProjectSearchProvider>
    </Suspense>
  );
};

export default Layout;
