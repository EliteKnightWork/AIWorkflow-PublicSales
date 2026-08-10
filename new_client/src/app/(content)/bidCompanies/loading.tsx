import { Box, Flex } from '@radix-ui/themes';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';

export default function Loading() {
  return (
    <Box style={{ width: '100%', height: '100vh' }}>
      <Flex justify='center' align='center' style={{ height: '30%' }}>
        <LoadingSpinner />
      </Flex>
    </Box>
  );
}
