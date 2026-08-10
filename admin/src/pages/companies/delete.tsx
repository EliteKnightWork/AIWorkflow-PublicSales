import React, { useState } from "react";
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDelete, useInvalidate } from "@refinedev/core";
import { UUID } from "crypto";

interface CustomDeleteButtonProps {
  resource: string;
  recordItemId: UUID;
  name: string;
}

const CustomDeleteButton: React.FC<CustomDeleteButtonProps> = ({
  resource,
  recordItemId,
  name,
}) => {
  const [open, setOpen] = useState(false);
  const { mutate } = useDelete();
  const invalidate = useInvalidate();

  const handleDelete = () => {
    mutate(
      {
        resource,
        id: recordItemId,
      },
      {
        onSuccess: () => {
          invalidate({
            resource,
            invalidates: ["list"],
          });
        },
        onError: (error) => {
          console.error("Delete failed:", error);
        },
      },
    );
    setOpen(false);
  };

  return (
    <>
      <IconButton onClick={() => setOpen(true)} color="error">
        <DeleteIcon />
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>削除確認</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {"会社名: "}
            <strong>{name}</strong>
            {" を削除しますか？"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>キャンセル</Button>
          <Button onClick={handleDelete} color="error">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomDeleteButton;
