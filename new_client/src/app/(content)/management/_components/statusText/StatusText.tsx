import { Box, Text } from '@radix-ui/themes';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';

type StatusTextProps = {
  text: string;
  color: string;
  borderColor: string;
};

export default function StatusText({ text, color, borderColor }: StatusTextProps) {
  const statusContent = (
    <Box
      style={{
        border: `${borderColor} 1px solid`,
        padding: '2px 16px',
        width: 'fit-content',
      }}
    >
      <Text
        style={{
          color: color,
          fontWeight: 'bold',
          fontSize: '14px',
        }}
      >
        {text.length > 5 ? `${text.slice(0, 5)}...` : text}
      </Text>
    </Box>
  );

  // テキストが 5文字以上の場合はツールチップを表示
  if (text.length > 5) {
    return <AppTooltip triggerChildren={statusContent} content={text} />;
  }

  return statusContent;
}
