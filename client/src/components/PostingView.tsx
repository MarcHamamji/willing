import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Calendar,
  Cake,
  Edit3,
  Lock,
  LockOpen,
  Mail,
  MapPin,
  Mars,
  ShieldCheck,
  Trash2,
  Users,
  Venus,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import ColumnLayout from './ColumnLayout';
import Loading from './Loading';
import LocationPicker from './LocationPicker';
import PostingApplicationMessageModal from './PostingApplicationMessageModal';
import SkillsInput from './SkillsInput';
import SkillsList from './SkillsList';
import { ToggleButton } from './ToggleButton';
import { organizationPostingFormSchema, type OrganizationPostingFormData } from '../schemas/auth';
import { executeAndShowError, FormField } from '../utils/formUtils';
import requestServer from '../utils/requestServer';
import { useOrganization } from '../utils/useUsers';

import type { OrganizationPosting, PostingSkill } from '../../../server/src/db/tables';
import type {
  EnrolledVolunteer,
  EnrollmentsResponse,
  PostingResponse,
  VolunteerPostingResponse,
  ApplicationsResponse,
  PendingApplication,
} from '../../../server/src/types';

type PostingWithSkills = OrganizationPosting & { skills: PostingSkill[] };

const getDateTimeInputValue = (value: Date | string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const offset = parsed.getTimezoneOffset();
  const localDate = new Date(parsed.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

type PostingViewerMode = 'organization' | 'volunteer';

function PostingView({ mode = 'organization' }: { mode?: PostingViewerMode }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isVolunteerView = mode === 'volunteer';
  const organizationAccount = useOrganization();
  const account = isVolunteerView ? null : organizationAccount;

  const [posting, setPosting] = useState<PostingWithSkills | null>(null);
  const [enrollments, setEnrollments] = useState<EnrolledVolunteer[]>([]);
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [position, setPosition] = useState<[number, number]>([33.90192863620578, 35.477959277880416]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [processingApplicationId, setProcessingApplicationId] = useState<number | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaveMessageVisible, setIsSaveMessageVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const form = useForm<OrganizationPostingFormData>({
    resolver: zodResolver(organizationPostingFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      is_open: true,
    },
  });

  const isOpen = useWatch({
    control: form.control,
    name: 'is_open',
    defaultValue: true,
  });

  const loadPosting = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setFetchError(null);

      if (isVolunteerView) {
        const postingResponse = await requestServer<VolunteerPostingResponse>(
          `/volunteer/posting/${id}`,
          {},
          true,
        );

        const postingWithSkills = {
          ...postingResponse.posting,
          skills: postingResponse.skills,
        };

        setPosting(postingWithSkills);
        setEnrollments([]);
        setIsEnrolled(postingResponse.isEnrolled);
        setSkills(postingResponse.skills.map(s => s.name));
        setPosition([
          postingResponse.posting.latitude ?? 33.90192863620578,
          postingResponse.posting.longitude ?? 35.477959277880416,
        ]);

        form.reset({
          title: postingResponse.posting.title,
          description: postingResponse.posting.description,
          location_name: postingResponse.posting.location_name,
          start_timestamp: getDateTimeInputValue(postingResponse.posting.start_timestamp),
          end_timestamp: postingResponse.posting.end_timestamp
            ? getDateTimeInputValue(postingResponse.posting.end_timestamp)
            : undefined,
          max_volunteers: postingResponse.posting.max_volunteers?.toString() ?? undefined,
          minimum_age: postingResponse.posting.minimum_age?.toString() ?? undefined,
          is_open: postingResponse.posting.is_open,
        });

        return;
      }

      const [postingResponse, enrollmentsResponse] = await Promise.all([
        requestServer<PostingResponse>(`/organization/posting/${id}`, {}, true),
        requestServer<EnrollmentsResponse>(`/organization/posting/${id}/enrollments`, {}, true),
      ]);

      const postingWithSkills = {
        ...postingResponse.posting,
        skills: postingResponse.skills,
      };

      setPosting(postingWithSkills);
      setEnrollments(enrollmentsResponse.enrollments);

      if (!postingResponse.posting.is_open) {
        const applicationsResponse = await requestServer<ApplicationsResponse>(
          `/organization/posting/${id}/applications`,
          {},
          true,
        );
        setApplications(applicationsResponse.applications);
      }

      setIsEnrolled(false);
      setSkills(postingResponse.skills.map(s => s.name));
      setPosition([
        postingResponse.posting.latitude ?? 33.90192863620578,
        postingResponse.posting.longitude ?? 35.477959277880416,
      ]);

      form.reset({
        title: postingResponse.posting.title,
        description: postingResponse.posting.description,
        location_name: postingResponse.posting.location_name,
        start_timestamp: getDateTimeInputValue(postingResponse.posting.start_timestamp),
        end_timestamp: postingResponse.posting.end_timestamp
          ? getDateTimeInputValue(postingResponse.posting.end_timestamp)
          : undefined,
        max_volunteers: postingResponse.posting.max_volunteers?.toString() ?? undefined,
        minimum_age: postingResponse.posting.minimum_age?.toString() ?? undefined,
        is_open: postingResponse.posting.is_open,
      });
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Failed to load posting');
    } finally {
      setLoading(false);
    }
  }, [id, form, isVolunteerView]);

  useEffect(() => {
    loadPosting();
  }, [loadPosting]);

  useEffect(() => {
    if (!saveMessage) return;
    setIsSaveMessageVisible(true);

    const fadeTimeout = setTimeout(() => {
      setIsSaveMessageVisible(false);
    }, 2400);

    const removeTimeout = setTimeout(() => {
      setSaveMessage(null);
    }, 3000);

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, [saveMessage]);

  const onSave = form.handleSubmit(async (data) => {
    if (!isEditMode || !posting || !id || !account?.id) return;

    await executeAndShowError(form, async () => {
      setSaving(true);
      setSaveError(null);
      setSaveMessage(null);

      try {
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
          is_open: data.is_open,
          skills: skills.length > 0 ? skills : undefined,
        };

        const response = await requestServer<PostingResponse>(
          `/organization/posting/${id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
          true,
        );

        const updatedPosting = {
          ...response.posting,
          skills: response.skills,
        };

        setPosting(updatedPosting);
        setSkills(response.skills.map(s => s.name));
        setSaveMessage('Posting updated successfully.');
        setIsEditMode(false);
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Failed to update posting');
      } finally {
        setSaving(false);
      }
    });
  });

  const onCancelEdit = useCallback(() => {
    if (!posting) return;
    form.reset({
      title: posting.title,
      description: posting.description,
      location_name: posting.location_name,
      start_timestamp: getDateTimeInputValue(posting.start_timestamp),
      end_timestamp: posting.end_timestamp ? getDateTimeInputValue(posting.end_timestamp) : undefined,
      max_volunteers: posting.max_volunteers?.toString() ?? undefined,
      minimum_age: posting.minimum_age?.toString() ?? undefined,
      is_open: posting.is_open,
    });
    setSkills(posting.skills.map(s => s.name));
    setPosition([
      posting.latitude ?? 33.90192863620578,
      posting.longitude ?? 35.477959277880416,
    ]);
    setIsEditMode(false);
    setSaveError(null);
    setSaveMessage(null);
  }, [form, posting]);

  const onDelete = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this posting? This action cannot be undone.')) return;

    try {
      setDeleting(true);
      await requestServer(`/organization/posting/${id}`, { method: 'DELETE' }, true);
      navigate('/organization');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete posting');
    } finally {
      setDeleting(false);
    }
  };

  const closeApplyModal = useCallback(() => {
    setIsApplyModalOpen(false);
    setApplyError(null);
  }, []);

  const openApplyModal = useCallback(() => {
    if (!id || isEnrolled) return;
    setSaveMessage(null);
    setSaveError(null);
    setApplyError(null);
    setIsApplyModalOpen(true);
  }, [id, isEnrolled]);

  const submitApplication = useCallback(async (message?: string) => {
    if (!id || isEnrolled) return;

    try {
      setApplying(true);
      setApplyError(null);
      setSaveMessage(null);
      setSaveError(null);

      await requestServer(
        `/volunteer/posting/${id}/enroll`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message ? { message } : {}),
        },
        true,
      );

      setIsEnrolled(true);
      setIsApplyModalOpen(false);
      setSaveMessage('Application submitted successfully.');
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to apply to posting';
      setApplyError(messageText);
      setSaveError(messageText);
    } finally {
      setApplying(false);
    }
  }, [id, isEnrolled]);

  const withdrawApplication = useCallback(async () => {
    if (!id || !isEnrolled) return;
    if (!confirm('Are you sure you want to withdraw your application?')) return;

    try {
      setWithdrawing(true);
      setSaveError(null);
      setSaveMessage(null);

      await requestServer(`/volunteer/posting/${id}/enroll`, { method: 'DELETE' }, true);

      setIsEnrolled(false);
      setSaveMessage('Application withdrawn successfully.');
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to withdraw application';
      setSaveError(messageText);
    } finally {
      setWithdrawing(false);
    }
  }, [id, isEnrolled]);

  const acceptApplication = useCallback(async (applicationId: number) => {
    if (!id) return;

    try {
      setProcessingApplicationId(applicationId);
      setSaveError(null);
      setSaveMessage(null);

      await requestServer(
        `/organization/posting/${id}/applications/${applicationId}/accept`,
        { method: 'POST' },
        true,
      );

      const enrollmentsResponse = await requestServer<EnrollmentsResponse>(
        `/organization/posting/${id}/enrollments`,
        {},
        true,
      );
      setEnrollments(enrollmentsResponse.enrollments);

      setApplications(prev => prev.filter(app => app.application_id !== applicationId));
      setSaveMessage('Application accepted successfully.');
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to accept application';
      setSaveError(messageText);
    } finally {
      setProcessingApplicationId(null);
    }
  }, [id]);

  const rejectApplication = useCallback(async (applicationId: number) => {
    if (!id) return;
    if (!confirm('Are you sure you want to reject this application?')) return;

    try {
      setProcessingApplicationId(applicationId);
      await requestServer(`/organization/posting/${id}/applications/${applicationId}`, { method: 'DELETE' }, true);

      setApplications(prev => prev.filter(app => app.application_id !== applicationId));
      setSaveMessage('Application rejected.');
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to reject application';
      setSaveError(messageText);
    } finally {
      setProcessingApplicationId(null);
    }
  }, [id]);

  const onMapPositionPick = useCallback((coords: [number, number]) => {
    setPosition(coords);
  }, []);

  const formValues = form.watch();

  const formattedStartDate = useMemo(() => {
    if (!formValues.start_timestamp) return '-';
    const parsed = new Date(formValues.start_timestamp);
    if (Number.isNaN(parsed.getTime())) return formValues.start_timestamp;
    return parsed.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [formValues.start_timestamp]);

  const formattedEndDate = useMemo(() => {
    if (!formValues.end_timestamp) return '-';
    const parsed = new Date(formValues.end_timestamp);
    if (Number.isNaN(parsed.getTime())) return formValues.end_timestamp;
    return parsed.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [formValues.end_timestamp]);

  if (loading) {
    return (
      <div className="grow bg-base-200">
        <div className="p-6 md:container mx-auto">
          <div className="flex justify-center mt-8">
            <Loading size="xl" />
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="grow bg-base-200">
        <div className="p-6 md:container mx-auto">
          <div role="alert" className="alert alert-error">
            <span>{fetchError}</span>
          </div>
          <button className="btn btn-outline mt-4" onClick={loadPosting}>Retry</button>
        </div>
      </div>
    );
  }

  if (!posting) {
    return (
      <div className="grow bg-base-200">
        <div className="p-6 md:container mx-auto">
          <div role="alert" className="alert alert-warning">
            <span>Posting not found.</span>
          </div>
          <button className="btn btn-outline mt-4" onClick={() => navigate('/organization')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grow bg-base-200">
      <PostingApplicationMessageModal
        open={isApplyModalOpen}
        submitting={applying}
        onClose={closeApplyModal}
        onSubmit={submitApplication}
        errorMessage={applyError}
      />
      <div className="p-6 md:container mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6 bg-base-200 -mx-6 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(isVolunteerView ? '/volunteer' : '/organization')}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h3 className="text-3xl font-extrabold tracking-tight">Posting Details</h3>
              <p className="opacity-70 mt-1">
                {isVolunteerView ? 'Review details before applying' : 'View and manage your posting'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isVolunteerView
              ? (
                  <>
                    {isEnrolled
                      ? (
                          <button
                            className="btn btn-error btn-outline"
                            onClick={withdrawApplication}
                            disabled={withdrawing}
                          >
                            {withdrawing ? 'Withdrawing...' : 'Withdraw Application'}
                          </button>
                        )
                      : (
                          <button
                            className="btn btn-primary"
                            onClick={openApplyModal}
                            disabled={applying}
                          >
                            {applying ? 'Applying...' : 'Apply'}
                          </button>
                        )}
                  </>
                )
              : isEditMode
                ? (
                    <>
                      <button className="btn btn-outline" onClick={onCancelEdit} disabled={saving}>
                        Cancel
                      </button>
                      <button className="btn btn-primary" onClick={onSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  )
                : (
                    <>
                      <button className="btn btn-outline" onClick={() => setIsEditMode(true)}>
                        <Edit3 size={16} />
                        Edit
                      </button>
                      <button
                        className="btn btn-outline btn-error"
                        onClick={onDelete}
                        disabled={deleting}
                      >
                        <Trash2 size={16} />
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
          </div>
        </div>

        <div className="mt-6">
          {saveMessage && (
            <div
              role="alert"
              className={`alert alert-success mb-4 transition-all duration-500 ${
                isSaveMessageVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-1'
              }`}
            >
              <span>{saveMessage}</span>
            </div>
          )}

          {saveError && (
            <div role="alert" className="alert alert-error mb-4">
              <span>{saveError}</span>
            </div>
          )}

          <ColumnLayout
            sidebar={(
              <>
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <h4 className="text-xl font-bold mb-4">Posting Information</h4>

                    {isEditMode
                      ? (
                          <div className="space-y-4">
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
                              label="Description"
                              name="description"
                              type="textarea"
                              placeholder="Describe the opportunity"
                            />
                            <FormField
                              form={form}
                              label="Location Name"
                              name="location_name"
                              type="text"
                              placeholder="e.g. Downtown Community Center"
                              Icon={MapPin}
                            />
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
                            <FormField
                              form={form}
                              label="Start Date"
                              name="start_timestamp"
                              type="datetime-local"
                            />
                            <FormField
                              form={form}
                              label="End Date"
                              name="end_timestamp"
                              type="datetime-local"
                            />
                          </div>
                        )
                      : (
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-semibold opacity-70 uppercase">Title</label>
                              <p className="text-lg font-semibold text-primary">{formValues.title}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold opacity-70 uppercase">Description</label>
                              <p className="text-sm opacity-80 whitespace-pre-wrap">{formValues.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-primary" />
                              <span className="text-sm">{formValues.location_name}</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-primary" />
                                <div>
                                  <p className="text-xs opacity-70 font-semibold">START</p>
                                  <span className="text-xs">{formattedStartDate}</span>
                                </div>
                              </div>
                              {formValues.end_timestamp && (
                                <div className="flex items-center gap-2">
                                  <Calendar size={16} className="text-primary" />
                                  <div>
                                    <p className="text-xs opacity-70 font-semibold">END</p>
                                    <span className="text-xs">{formattedEndDate}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              {formValues.max_volunteers
                                ? (
                                    <div className="flex items-center gap-2">
                                      <Users size={16} className="text-primary" />
                                      <div>
                                        <p className="text-xs opacity-70 font-semibold">MAX VOLUNTEERS</p>
                                        <span className="text-sm">{formValues.max_volunteers}</span>
                                      </div>
                                    </div>
                                  )
                                : null}
                              {formValues.minimum_age && (
                                <div className="flex items-center gap-2">
                                  <Cake size={16} className="text-primary" />
                                  <div>
                                    <p className="text-xs opacity-70 font-semibold">MIN AGE</p>
                                    <span className="text-sm">
                                      {formValues.minimum_age}
                                      +
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                  </div>
                </div>

                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <h5 className="font-bold text-lg">Status</h5>
                    <p className="text-sm opacity-70 mb-3">Posting visibility.</p>
                    {isEditMode
                      ? (
                          <ToggleButton
                            form={form}
                            name="is_open"
                            label="Posting Type"
                            disabled={saving}
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
                        )
                      : (
                          <span className={`badge gap-2 ${isOpen ? 'badge-primary' : 'badge-secondary'}`}>
                            {isOpen ? <LockOpen size={12} /> : <Lock size={12} />}
                            {isOpen ? 'Open' : 'Review Based'}
                          </span>
                        )}
                    <p className="text-xs opacity-70 mt-2">
                      {isOpen
                        ? 'Volunteers are accepted automatically.'
                        : 'Volunteers must be accepted by the organization.'}
                    </p>
                  </div>
                </div>

                {!isVolunteerView && (
                  <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                      <h5 className="font-bold text-lg">Location</h5>
                      <p className="text-sm opacity-70 mb-2">
                        {isEditMode ? 'Pick the location on the map.' : 'Posting location on map.'}
                      </p>
                      <LocationPicker
                        position={position}
                        setPosition={onMapPositionPick}
                        readOnly={!isEditMode}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          >
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h5 className="font-bold text-lg">Required Skills</h5>
                <p className="text-sm opacity-70 mt-1">Skills needed for this opportunity.</p>

                {isEditMode
                  ? (
                      <SkillsInput skills={skills} setSkills={setSkills} />
                    )
                  : (
                      <SkillsList skills={posting.skills} enableLimit={false} />
                    )}
              </div>
            </div>

            {isVolunteerView && (
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <h5 className="font-bold text-lg">Location</h5>
                  <p className="text-sm opacity-70 mb-2">
                    {isEditMode ? 'Pick the location on the map.' : 'Posting location on map.'}
                  </p>
                  <LocationPicker
                    position={position}
                    setPosition={onMapPositionPick}
                    readOnly={!isEditMode}
                  />
                </div>
              </div>
            )}

            {!isVolunteerView && !isOpen && (
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <h4 className="text-xl font-bold mb-4">
                    Enrollment Applications
                    {' '}
                    <span className="badge badge-primary">{applications.length}</span>
                  </h4>

                  {applications.length === 0
                    ? (
                        <div className="alert">
                          <span className="text-sm">No pending applications.</span>
                        </div>
                      )
                    : (
                        <div className="space-y-2">
                          {applications.map((app) => {
                            const volunteerName = `${app.first_name} ${app.last_name}`;
                            const initials = `${app.first_name.charAt(0)}${app.last_name.charAt(0)}`.toUpperCase();
                            const age = Math.floor(
                              (Date.now() - new Date(app.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
                            );

                            const genderBadgeStyles = app.gender === 'male'
                              ? 'badge-info'
                              : app.gender === 'female'
                                ? 'badge-secondary'
                                : 'badge-accent';

                            return (
                              <div key={app.application_id} className="collapse collapse-arrow border border-base-300 bg-base-100">
                                <input type="checkbox" />
                                <div className="collapse-title flex items-center gap-3">
                                  <div className="avatar">
                                    <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center">
                                      <span className="text-lg font-semibold">{initials}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col">
                                    <h5 className="font-bold text-base leading-tight">{volunteerName}</h5>
                                    <div className="flex gap-2 mt-1">
                                      <span className={`badge badge-sm gap-1 ${genderBadgeStyles}`}>
                                        {app.gender === 'male' && <Mars size={10} />}
                                        {app.gender === 'female' && <Venus size={10} />}
                                        {app.gender === 'other' && <span className="font-bold">*</span>}
                                        {app.gender.charAt(0).toUpperCase() + app.gender.slice(1)}
                                      </span>
                                      <span className="badge badge-sm">
                                        {age}
                                        {' '}
                                        years old
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="collapse-content pt-0">
                                  <div className="flex items-center gap-2 text-xs opacity-70 mt-1">
                                    <Mail size={12} />
                                    {app.email}
                                  </div>
                                  {app.skills && app.skills.length > 0 && (
                                    <div className="mt-3">
                                      <p className="text-xs font-semibold opacity-70 mb-1">Skills</p>
                                      <div className="flex flex-wrap gap-1">
                                        <SkillsList skills={app.skills} />
                                      </div>
                                    </div>
                                  )}
                                  {app.message && (
                                    <div className="mt-3">
                                      <p className="text-xs font-semibold opacity-70 mb-1">Application Message</p>
                                      <p className="text-xs opacity-80 italic">
                                        "
                                        {app.message}
                                        "
                                      </p>
                                    </div>
                                  )}
                                  <div className="mt-4 flex gap-2">
                                    <button
                                      className="btn btn-sm btn-success"
                                      onClick={() => acceptApplication(app.application_id)}
                                      disabled={processingApplicationId === app.application_id}
                                    >
                                      {processingApplicationId === app.application_id ? 'Processing...' : 'Accept'}
                                    </button>
                                    <button
                                      className="btn btn-sm btn-error btn-outline"
                                      onClick={() => rejectApplication(app.application_id)}
                                      disabled={processingApplicationId === app.application_id}
                                    >
                                      {processingApplicationId === app.application_id ? 'Processing...' : 'Reject'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                </div>
              </div>
            )}

            {!isVolunteerView && (
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <h4 className="text-xl font-bold mb-4">
                    Enrolled Volunteers
                    {' '}
                    <span className="badge badge-primary">{enrollments.length}</span>
                  </h4>

                  {enrollments.length === 0
                    ? (
                        <div className="alert">
                          <span className="text-sm">No volunteers have enrolled yet.</span>
                        </div>
                      )
                    : (
                        <div className="space-y-2">
                          {enrollments.map((volunteer) => {
                            const volunteerName = `${volunteer.first_name} ${volunteer.last_name}`;
                            const initials = `${volunteer.first_name.charAt(0)}${volunteer.last_name.charAt(0)}`.toUpperCase();
                            const age = Math.floor(
                              (Date.now() - new Date(volunteer.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
                            );

                            const genderBadgeStyles = volunteer.gender === 'male'
                              ? 'badge-info'
                              : volunteer.gender === 'female'
                                ? 'badge-secondary'
                                : 'badge-accent';

                            return (
                              <div key={volunteer.enrollment_id} className="collapse collapse-arrow border border-base-300 bg-base-100">
                                <input type="checkbox" />
                                <div className="collapse-title flex items-center gap-3">
                                  <div className="avatar">
                                    <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center">
                                      <span className="text-lg font-semibold">{initials}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col">
                                    <h5 className="font-bold text-base leading-tight">{volunteerName}</h5>
                                    <div className="flex gap-2 mt-1">
                                      <span className={`badge badge-sm gap-1 ${genderBadgeStyles}`}>
                                        {volunteer.gender === 'male' && <Mars size={10} />}
                                        {volunteer.gender === 'female' && <Venus size={10} />}
                                        {volunteer.gender === 'other' && <span className="font-bold">*</span>}
                                        {volunteer.gender.charAt(0).toUpperCase() + volunteer.gender.slice(1)}
                                      </span>
                                      <span className="badge badge-sm">
                                        {age}
                                        {' '}
                                        years old
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="collapse-content pt-0">
                                  <div className="flex items-center gap-2 text-xs opacity-70 mt-1">
                                    <Mail size={12} />
                                    {volunteer.email}
                                  </div>
                                  {volunteer.skills && volunteer.skills.length > 0 && (
                                    <div className="mt-3">
                                      <p className="text-xs font-semibold opacity-70 mb-1">Skills</p>
                                      <div className="flex flex-wrap gap-1">
                                        <SkillsList skills={volunteer.skills} />
                                      </div>
                                    </div>
                                  )}
                                  {volunteer.message && (
                                    <div className="mt-3">
                                      <p className="text-xs font-semibold opacity-70 mb-1">Message</p>
                                      <p className="text-xs opacity-80 italic">
                                        "
                                        {volunteer.message}
                                        "
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                </div>
              </div>
            )}
          </ColumnLayout>
        </div>
      </div>
    </div>
  );
}

export default PostingView;
