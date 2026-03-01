import { parseAsBoolean, useQueryState } from "nuqs";

const useCreateWorkspaceDialog = () => {
  const [open, setOpen] = useQueryState(
    "new-workspace",
    parseAsBoolean.withDefault(false)
  );

  const onOpen = () => setOpen(true);
  const onClose = () => setOpen(false);
  const onOpenChange = (nextOpen: boolean) => setOpen(nextOpen);

  return {
    open,
    onOpen,
    onClose,
    onOpenChange,
  };
};

export default useCreateWorkspaceDialog;
