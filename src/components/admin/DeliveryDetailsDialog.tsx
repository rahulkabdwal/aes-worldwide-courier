import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

type DeliveryDetailsDialogProps = {
  open: boolean;
  date: string;
  time: string;
  error?: string | null;
  isSaving?: boolean;
  title?: string;
  description?: string;
  idPrefix: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeliveryDetailsDialog({
  open,
  date,
  time,
  error,
  isSaving = false,
  title = "Delivery details",
  description = "Enter the delivery date and time before marking this shipment as delivered.",
  idPrefix,
  onDateChange,
  onTimeChange,
  onConfirm,
  onCancel,
}: DeliveryDetailsDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSaving) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}_delivery_date`}>Delivery Date</Label>
            <Input
              id={`${idPrefix}_delivery_date`}
              type="date"
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}_delivery_time`}>Delivery Time</Label>
            <Input
              id={`${idPrefix}_delivery_time`}
              type="time"
              value={time}
              onChange={(event) => onTimeChange(event.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
