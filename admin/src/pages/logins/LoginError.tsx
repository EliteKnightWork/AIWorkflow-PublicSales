import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

type LoginErrorProps = {
  message: string;
  onRetry: () => void;
};

export const LoginError = ({ message, onRetry }: LoginErrorProps) => {
  return (
    <Box
      alignItems="center"
      display="flex"
      flexDirection="column"
      gap={2}
      justifyContent="center"
      minHeight="100vh"
      padding={2}
    >
      <Alert severity="error" sx={{ maxWidth: 480, width: "100%" }}>
        認証に失敗しました。再度ログインしてください。
        <br />
        {message}
      </Alert>
      <Button
        onClick={() => {
          onRetry();
        }}
        variant="contained"
      >
        ログインをやり直す
      </Button>
    </Box>
  );
};


