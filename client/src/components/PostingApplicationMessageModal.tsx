import { zodResolver } from '@hookform/resolvers/zod';
import { Send, X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import zod from 'zod';

const applyMessageSchema = zod.object({
  message: zod.string().max(350, 'Message must be 350 characters or fewer').optional(),
});

type PostingApplicationMessageFormData = zod.infer<typeof applyMessageSchema>;

type PostingApplicationMessageModalProps = {
  open: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (message?: string) => Promise<void> | void;
  errorMessage?: string | null;
};

function PostingApplicationMessageModal({ open, submitting = false, onClose, onSubmit, errorMessage }: PostingApplicationMessageModalProps) {
  const form = useForm<PostingApplicationMessageFormData>({
    resolver: zodResolver(applyMessageSchema),
    defaultValues: { message: '' },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ message: '' });
    }
  }, [open, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    const trimmedMessage = data.message?.trim();
    await onSubmit(trimmedMessage ? trimmedMessage : undefined);
  });

  const message = useWatch({ control: form.control, name: 'message', defaultValue: '' }) ?? '';
  const remainingCharacters = 350 - message.length;

  return (
    <div className={`modal ${open ? 'modal-open' : ''}`}>
      <div className="modal-box">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg">Add a message</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={submitting}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="You can add an optional message to tell the organization why you're interested in this opportunity"

            maxLength={350}
            rows={4}
            {...form.register('message')}
          />

          <div className="flex items-center justify-between text-xs">
            <span className="opacity-60">
              {remainingCharacters}
              {' '}
              characters left
            </span>
            {form.formState.errors.message && (
              <span className="text-error">{form.formState.errors.message.message}</span>
            )}
          </div>

          {errorMessage && (
            <div role="alert" className="alert alert-error">
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? 'Submitting...'
                : (
                    <span className="flex items-center gap-2">
                      <Send size={16} />
                      Submit application
                    </span>
                  )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={submitting ? undefined : onClose}>
        Close
      </div>
    </div>
  );
}

export default PostingApplicationMessageModal;
