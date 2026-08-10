import { Box, Flex, Spinner } from '@radix-ui/themes';

export default function Loading() {
  return (
    <Box style={{ width: '100%', height: '100%' }}>
      <Flex justify='center'>
        <Spinner style={{ width: '30px', height: '30px' }} />
      </Flex>
    </Box>
  );
}
