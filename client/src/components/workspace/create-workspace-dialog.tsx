import WorkspaceForm from "./create-workspace-form";
import useCreateWorkspaceDialog from "@/hooks/use-create-workspace-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
const CreateWorkspaceDialog = () => {
  const { open, onClose, onOpenChange } = useCreateWorkspaceDialog();

  return (
    <Dialog modal={true} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl !p-0 overflow-hidden border-0">
        <WorkspaceForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkspaceDialog;
