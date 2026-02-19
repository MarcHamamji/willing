import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, CheckCircle2, LockKeyhole } from 'lucide-react';
import { useContext } from 'react';
import { useForm } from 'react-hook-form';
import zod from 'zod';

import Loading from './Loading';
import { passwordSchema } from '../../../server/src/db/tables';
import AuthContext from '../auth/AuthContext';
import { executeAndShowError, FormField, FormRootError } from '../utils/formUtils';

const passwordResetSchema = zod.object({
  currentPassword: zod.string().nonempty('Current password is required'),
  newPassword: passwordSchema,
  confirmedNewPassword: zod.string(),
}).refine(data => data.newPassword === data.confirmedNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmedNewPassword'],
});

type PasswordResetForm = zod.infer<typeof passwordResetSchema>;

function PasswordResetCard() {
  const auth = useContext(AuthContext);
  const form = useForm({
    resolver: zodResolver(passwordResetSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const onSubmit = form.handleSubmit(async (data: PasswordResetForm) => {
    await executeAndShowError(form, async () => {
      await auth.changePassword(data.currentPassword, data.newPassword);
      form.reset();
    });
  });

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <form onSubmit={onSubmit}>
          <FormField
            form={form}
            label="Current Password"
            name="currentPassword"
            type="password"
            Icon={LockKeyhole}
          />

          <FormField
            form={form}
            label="New Password"
            name="newPassword"
            type="password"
            Icon={LockKeyhole}
          />

          <FormField
            form={form}
            label="Confirm New Password"
            name="confirmedNewPassword"
            type="password"
            Icon={CheckCircle}
          />

          {form.formState.isSubmitSuccessful
            && (
              <div role="alert" className="alert alert-success alert-soft mt-2">
                <CheckCircle2 size={20} />
                <span>Your password was successfully updated</span>
              </div>
            )}

          <FormRootError form={form} />

          <div className="card-actions justify-end mt-6 gap-2">
            <button type="submit" className="btn btn-primary">
              {
                form.formState.isSubmitting
                  ? <Loading />
                  : 'Update Password'
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default PasswordResetCard;
