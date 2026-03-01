import { parseAsBoolean, useQueryState } from "nuqs";

const useCreateProjectDialog = () => {
  const [open, setOpen] = useQueryState(
    "new-project",
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

export default useCreateProjectDialog;
