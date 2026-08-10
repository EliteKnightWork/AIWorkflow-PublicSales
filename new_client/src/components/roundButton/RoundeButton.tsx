import { Box, Button, Text } from '@radix-ui/themes';
import LoadingSpinner from '../loadingSpinner/LoadingSpinner';

type Props = {
  text: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  buttonClassName?: string;
  buttonBoxClassName?: string;
  icon?: string;
  hideIcon?: boolean;
  disabled?: boolean;
  loading?: boolean;
};

export const RoundButton = ({
  text,
  onClick,
  buttonClassName,
  buttonBoxClassName,
  icon,
  hideIcon,
  disabled,
  loading,
}: Props) => {
  return (
    <Button
      variant='outline'
      disabled={disabled}
      className={`roundButton ${buttonClassName}`}
      onClick={onClick}
    >
      <Box className={`roundButtonBox ${buttonBoxClassName}`}>
        {loading ? (
          <LoadingSpinner size={20} />
        ) : (
          <>
            <Text>{text}</Text>
            {!hideIcon && (
              <span className={'material-icons roundButtonIcon'} translate='no' aria-hidden='true'>
                {icon ?? 'filter_alt'}
              </span>
            )}
          </>
        )}
      </Box>
    </Button>
  );
};
