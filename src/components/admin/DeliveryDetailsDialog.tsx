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
  receiverName?: string;
  error?: string | null;
  isSaving?: boolean;
  title?: string;
  description?: string;
  idPrefix: string;
  showReceiverName?: boolean;
  showDeliveryDateTime?: boolean;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onReceiverNameChange?: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

function getDateTimeInputValue(date: string, time: string) {
  if (!date || !time) return "";
  return `${date}T${time.slice(0, 5)}`;
}

export function DeliveryDetailsDialog({
  open,
  date,
  time,
  receiverName = "",
  error,
  isSaving = false,
  title = "Delivery details",
  description = "Enter the required delivery information before marking this shipment as delivered.",
  idPrefix,
  showReceiverName = false,
  showDeliveryDateTime = true,
  onDateChange,
  onTimeChange,
  onReceiverNameChange,
  onConfirm,
  onCancel,
}: DeliveryDetailsDialogProps) {
  const receiverError =
    showReceiverName && error && !receiverName.trim()
      ? "Receiver's Name is required."
      : null;
  const deliveryDateTimeError =
    showDeliveryDateTime && error && (!date || !time)
      ? "Delivery Date & Time is required."
      : null;
  const dialogError = error && !receiverError && !deliveryDateTimeError ? error : null;

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
        {dialogError ? (
          <Alert variant="destructive">
            <AlertDescription>{dialogError}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-4">
          {showReceiverName ? (
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}_receiver_name`}>Receiver's Name</Label>
              <Input
                id={`${idPrefix}_receiver_name`}
                value={receiverName}
                onChange={(event) => onReceiverNameChange?.(event.target.value)}
                disabled={isSaving}
                placeholder="Enter receiver's name"
              />
              {receiverError ? (
                <p className="text-xs text-red-600">{receiverError}</p>
              ) : null}
            </div>
          ) : null}

          {showDeliveryDateTime ? (
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}_delivery_datetime`}>
                Delivery Date &amp; Time (Status date and time)
              </Label>
              <Input
                id={`${idPrefix}_delivery_datetime`}
                type="datetime-local"
                value={getDateTimeInputValue(date, time)}
                onChange={(event) => {
                  const [nextDate = "", nextTime = ""] = event.target.value.split("T");
                  onDateChange(nextDate);
                  onTimeChange(nextTime.slice(0, 5));
                }}
                disabled={isSaving}
              />
              {deliveryDateTimeError ? (
                <p className="text-xs text-red-600">{deliveryDateTimeError}</p>
              ) : null}
            </div>
          ) : null}
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
