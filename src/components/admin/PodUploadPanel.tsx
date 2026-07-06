import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type PodUploadPanelProps = {
  podUrl: string;
  error?: string | null;
  isUploading: boolean;
  disabled?: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
};

export function PodUploadPanel({
  podUrl,
  error,
  isUploading,
  disabled = false,
  onUpload,
  onRemove,
}: PodUploadPanelProps) {
  const fileInput = (
    <input
      type="file"
      accept="image/*,application/pdf"
      onChange={onUpload}
      disabled={isUploading || disabled}
      className="hidden"
    />
  );

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {podUrl ? (
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">
            Current POD:{" "}
            <a
              href={podUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4"
            >
              View document
            </a>
          </p>
          <div className="flex gap-2">
            <label className="flex-1">
              <div className="flex min-h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-50">
                Replace POD
              </div>
              {fileInput}
            </label>
            <Button type="button" variant="outline" onClick={onRemove} disabled={disabled}>
              Remove POD
            </Button>
          </div>
        </div>
      ) : (
        <label className="block">
          <div className="flex w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 px-4 py-8 transition-colors hover:border-primary/50 hover:bg-orange-50/30">
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-700">Upload Proof of Delivery</p>
              <p className="mt-1 text-xs text-neutral-500">Image or PDF file</p>
            </div>
          </div>
          {fileInput}
        </label>
      )}

      {isUploading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Spinner className="size-4" />
          Uploading...
        </div>
      ) : null}
    </div>
  );
}
