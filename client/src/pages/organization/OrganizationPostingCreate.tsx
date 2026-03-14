import { zodResolver } from '@hookform/resolvers/zod';
import { Send, MapPin, Edit3, Users, ShieldCheck, LockOpen, Lock } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import CalendarInfo from '../../components/CalendarInfo.tsx';
import PageHeader from '../../components/layout/PageHeader';
import Loading from '../../components/Loading';
import LocationPicker from '../../components/LocationPicker';
import SkillsInput from '../../components/skills/SkillsInput';
import { ToggleButton } from '../../components/ToggleButton';
import { organizationPostingFormSchema, type OrganizationPostingFormData } from '../../schemas/auth';
import { executeAndShowError, FormField, FormRootError } from '../../utils/formUtils';
import requestServer from '../../utils/requestServer';
import { useOrganization } from '../../utils/useUsers';

import type { OrganizationPostingCreateResponse } from '../../../../server/src/api/types';

export default function OrganizationPostingCreate() {
  const account = useOrganization();
  const navigate = useNavigate();

  const form = useForm<OrganizationPostingFormData>({
    resolver: zodResolver(organizationPostingFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      automatic_acceptance: true,
    },
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [position, setPosition] = useState<[number, number]>([33.90192863620578, 35.477959277880416]);
  const startTimestamp = useWatch({ control: form.control, name: 'start_timestamp' }) ?? '';
  const endTimestamp = useWatch({ control: form.control, name: 'end_timestamp' }) ?? '';

  const submit = form.handleSubmit(async (data) => {
    await executeAndShowError(form, async () => {
      if (!account?.id) {
        throw new Error('Organization account not found. Please log in again.');
      }

      const payload = {
        organization_id: account.id,
        title: data.title.trim(),
        description: data.description.trim(),
        location_name: data.location_name.trim(),
        latitude: position[0],
        longitude: position[1],
        start_timestamp: new Date(data.start_timestamp).toISOString(),
        end_timestamp: data.end_timestamp ? new Date(data.end_timestamp).toISOString() : undefined,
        max_volunteers: data.max_volunteers ? Number(data.max_volunteers) : undefined,
        minimum_age: data.minimum_age ? Number(data.minimum_age) : undefined,
        automatic_acceptance: data.automatic_acceptance,
        skills: skills.length > 0 ? skills : undefined,
      };

      console.log('Submitting posting payload:', payload);

      const response = await requestServer<OrganizationPostingCreateResponse>('/organization/posting', {
        method: 'POST',
        body: payload,
        includeJwt: true,
      });

      console.log('Posting created successfully:', response);
      navigate('/organization');
    });
  });

  const onMapPositionPick = useCallback((coords: [number, number], name?: string) => {
    setPosition(coords);
    if (name && !form.getFieldState('location_name').isDirty) {
      form.setValue('location_name', name);
    }
  }, [form]);

  return (
    <div className="grow bg-base-200">
      <div className="p-6 md:container mx-auto">
        <PageHeader
          title="Create Posting"
          showBack
          defaultBackTo="/organization"
        />

        <div className="card bg-base-100 w-full shadow-2xl">
          <form className="card-body space-y-6" onSubmit={submit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                form={form}
                label="Title"
                name="title"
                type="text"
                placeholder="Enter posting title"
                Icon={Edit3}
              />

              <FormField
                form={form}
                label="Location Name"
                name="location_name"
                type="text"
                placeholder="e.g. Downtown Community Center"
                Icon={MapPin}
              />
            </div>

            <FormField
              form={form}
              label="Description"
              name="description"
              type="textarea"
              placeholder="Describe the opportunity"
            />

            <div className="space-y-4">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      form={form}
                      label="Max Volunteers"
                      name="max_volunteers"
                      type="number"
                      placeholder="Optional"
                      Icon={Users}
                    />

                    <FormField
                      form={form}
                      label="Min Age"
                      name="minimum_age"
                      type="number"
                      placeholder="Optional"
                      Icon={ShieldCheck}
                    />
                  </div>

                  <CalendarInfo
                    startValue={startTimestamp}
                    endValue={endTimestamp}
                    onStartChange={(value: string) => {
                      form.setValue('start_timestamp', value, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                    onEndChange={(value: string) => {
                      form.setValue('end_timestamp', value, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                    inputType="datetime-local"
                    className="grid grid-cols-2 gap-3"
                    startPlaceholder="Start Date & Time"
                    endPlaceholder="End Date & Time"
                  />

                  <SkillsInput skills={skills} setSkills={setSkills} />

                  <ToggleButton
                    form={form}
                    name="automatic_acceptance"
                    label="Posting Type"
                    options={[
                      {
                        value: true,
                        label: 'Open Posting',
                        description: 'Volunteers are accepted automatically.',
                        Icon: LockOpen,
                        btnColor: 'btn-primary',
                      },
                      {
                        value: false,
                        label: 'Review-Based',
                        description: 'Volunteers must be approved by the organization.',
                        Icon: Lock,
                        btnColor: 'btn-secondary',
                      },
                    ]}
                  />
                </div>

                <div className="lg:col-span-1">
                  <fieldset className="fieldset">
                    <label className="label">
                      <span className="label-text font-medium">Pin Location on Map</span>
                    </label>
                    <LocationPicker position={position} setPosition={onMapPositionPick} />
                  </fieldset>
                </div>
              </div>
            </div>

            <FormRootError form={form} />

            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2 mt-6"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? <Loading />
                : (
                    <>
                      <Send size={18} />
                      Create Posting
                    </>
                  )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
