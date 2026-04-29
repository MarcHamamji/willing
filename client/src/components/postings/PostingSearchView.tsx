import { TextSearch, ClipboardList, Building2, AlertTriangle, type LucideIcon } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import {
  buildSharedPostingQuery,
  hasSharedAdvancedPostingFilters,
  postingSortOptions,
  resolvePostingSortOption,
  resolveVolunteerPostingSortOption,
  toPostingSortOptionValue,
  toVolunteerPostingSortOptionValue,
  volunteerPostingSortOptions,
  type PostingSortDir,
  type SharedPostingFilterFields,
  type PostingSortBy,
  type PostingSortOptionValue,
  type VolunteerPostingSortBy,
  type VolunteerPostingSortOptionValue,
} from './postingFilterConfig.ts';
import { FormField } from '../../utils/formUtils.tsx';
import requestServer from '../../utils/requestServer.ts';
import useAsync from '../../utils/useAsync';
import Button from '../Button.tsx';
import CalendarInfo from '../CalendarInfo.tsx';
import EmptyState from '../EmptyState.tsx';
import CrisisCard from './CrisisCard.tsx';
import OrganizationCard from './OrganizationCard.tsx';
import PostingCollection from './PostingCollection.tsx';
import Loading from '../Loading.tsx';
import PostingFiltersCard from './PostingFiltersCard.tsx';
import PageContainer from '../layout/PageContainer.tsx';
import PageHeader from '../layout/PageHeader.tsx';

import type {
  VolunteerCrisesResponse,
  VolunteerEnrollmentsResponse,
  VolunteerOrganizationSearchResponse,
  VolunteerOrganizationSearchResult,
  VolunteerPostingSearchResponse,
} from '../../../../server/src/api/types.ts';
import type { Crisis } from '../../../../server/src/db/tables/index.ts';
import type { PostingWithContext } from '../../../../server/src/types.ts';

export type PostingSearchFilters = SharedPostingFilterFields & {
  sortBy: VolunteerPostingSortBy | PostingSortBy | CrisisPostingSortBy;
  sortDir: PostingSortDir;
  startDateFrom: string;
  endDateTo: string;
  startTimeFrom: string;
  endTimeTo: string;
  hideFull: boolean;
  crisisId: 'all' | `${number}`;
  entity: 'postings' | 'organizations' | 'crises';
  crisisFilter: 'all' | 'pinned_only' | 'unpinned_only';
  organizationCertificateFilter: 'all' | 'enabled' | 'disabled';
};

type PostingCrisisOption = {
  id: number;
  name: string;
};

type CrisisPostingSortBy = 'pinned' | 'title';
type CrisisPostingSortOptionValue = 'pinned_first' | 'title_asc' | 'title_desc';

type PostingSearchFormValues = Omit<PostingSearchFilters, 'sortBy' | 'sortDir'> & {
  sortOption: VolunteerPostingSortOptionValue | PostingSortOptionValue | CrisisPostingSortOptionValue;
  crisisFilter: PostingSearchFilters['crisisFilter'];
  entity: PostingSearchFilters['entity'];
};

type PostingSearchViewProps = {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  actions?: ReactNode;
  showBack?: boolean;
  defaultBackTo?: string;
  initialFilters?: Partial<PostingSearchFilters>;
  emptyMessage?: string;
  filterPostings?: (postings: PostingWithContext[]) => PostingWithContext[];
  fetchUrl?: string;
  organizationsFetchUrl?: string;
  crisisBasePath?: string;
  crisesFetchBasePath?: string;
  enableCrisisFilter?: boolean;
  crisisOptions?: PostingCrisisOption[];
  enableOrganizationSearch?: boolean;
  showEntityTabs?: boolean;
  postingsTopContent?: ReactNode;
};

const toPostingSearchFormValues = (filters: PostingSearchFilters): PostingSearchFormValues => ({
  search: filters.search,
  sortOption: filters.entity === 'organizations'
    ? toPostingSortOptionValue(filters.sortBy as PostingSortBy, filters.sortDir)
    : filters.entity === 'crises'
      ? (filters.sortBy === 'pinned'
          ? 'pinned_first'
          : (filters.sortDir === 'desc' ? 'title_desc' : 'title_asc'))
      : toVolunteerPostingSortOptionValue(filters.sortBy as VolunteerPostingSortBy, filters.sortDir),
  crisisFilter: filters.crisisFilter,
  startDateFrom: filters.startDateFrom,
  endDateTo: filters.endDateTo,
  startTimeFrom: filters.startTimeFrom,
  endTimeTo: filters.endTimeTo,
  hideFull: filters.hideFull,
  crisisId: filters.crisisId,
  entity: filters.entity,
  postingFilter: filters.postingFilter,
  organizationCertificateFilter: filters.organizationCertificateFilter,
});

const fromPostingSearchFormValues = (values: PostingSearchFormValues): PostingSearchFilters => {
  let querySortBy: VolunteerPostingSortBy | PostingSortBy | CrisisPostingSortBy = 'title';
  let querySortDir: PostingSortDir = 'asc';
  let crisisFilter: 'all' | 'pinned_only' | 'unpinned_only' = 'all';

  if (values.entity === 'organizations') {
    const selectedSortOption = resolvePostingSortOption(values.sortOption as PostingSortOptionValue);
    querySortBy = 'title';
    querySortDir = selectedSortOption.sortDir;
  } else if (values.entity === 'crises') {
    const selected = values.sortOption as CrisisPostingSortOptionValue;
    if (selected === 'pinned_first') {
      querySortBy = 'pinned';
      querySortDir = 'desc';
    } else {
      querySortBy = 'title';
      querySortDir = selected === 'title_desc' ? 'desc' : 'asc';
    }
    crisisFilter = values.crisisFilter;
  } else {
    const selectedSortOption = resolveVolunteerPostingSortOption(values.sortOption as VolunteerPostingSortOptionValue);
    querySortBy = selectedSortOption.sortBy as VolunteerPostingSortBy;
    querySortDir = selectedSortOption.sortDir;
  }

  return {
    search: values.search,
    sortBy: querySortBy,
    sortDir: querySortDir,
    startDateFrom: values.startDateFrom,
    endDateTo: values.endDateTo,
    startTimeFrom: values.startTimeFrom,
    endTimeTo: values.endTimeTo,
    hideFull: values.hideFull,
    crisisId: values.crisisId,
    entity: values.entity,
    postingFilter: values.postingFilter ?? 'all',
    crisisFilter, organizationCertificateFilter: values.organizationCertificateFilter ?? 'all' } as PostingSearchFilters;
};

const getCleanDefaultsForEntity = (entity: PostingSearchFilters['entity']): PostingSearchFilters => ({
  search: '',
  sortBy: entity === 'postings' ? 'recommended' : entity === 'crises' ? 'pinned' : 'title',
  sortDir: entity === 'postings' ? 'desc' : entity === 'crises' ? 'desc' : 'asc',
  startDateFrom: '',
  endDateTo: '',
  startTimeFrom: '',
  endTimeTo: '',
  hideFull: false,
  crisisId: 'all',
  entity,
  crisisFilter: 'all',
  postingFilter: 'all',
  organizationCertificateFilter: 'all',
});

function PostingSearchView({
  title,
  subtitle,
  icon = TextSearch,
  badge,
  actions,
  showBack = false,
  defaultBackTo,
  initialFilters,
  emptyMessage = 'No postings found yet',
  filterPostings,
  fetchUrl,
  organizationsFetchUrl = '/volunteer/organizations',
  crisisBasePath = '/volunteer/crises',
  crisesFetchBasePath = '/volunteer/crises',
  enableCrisisFilter = false,
  crisisOptions = [],
  enableOrganizationSearch = false,
  showEntityTabs = true,
  postingsTopContent,
}: PostingSearchViewProps) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const storageKey = useMemo(() => `posting-search-filters:${location.pathname}`, [location.pathname]);

  const [persistedFilters, setPersistedFilters] = useState<Partial<PostingSearchFilters> | undefined>(() => {
    if (typeof window === 'undefined') return undefined;

    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return undefined;

    try {
      const parsed = JSON.parse(raw) as Partial<PostingSearchFilters>;
      return parsed && typeof parsed === 'object' ? parsed : undefined;
    } catch {
      return undefined;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      setPersistedFilters(undefined);
      return;
    }

    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) {
      setPersistedFilters(undefined);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<PostingSearchFilters>;
      setPersistedFilters(parsed && typeof parsed === 'object' ? parsed : undefined);
    } catch {
      setPersistedFilters(undefined);
    }
  }, [storageKey]);

  const defaultFilters = useMemo<PostingSearchFilters>(() => ({
    search: '',
    sortBy: 'recommended',
    sortDir: 'desc',
    startDateFrom: '',
    endDateTo: '',
    startTimeFrom: '',
    endTimeTo: '',
    hideFull: false,
    crisisId: 'all',
    entity: 'postings',
    crisisFilter: 'all',
    postingFilter: 'all',
    organizationCertificateFilter: 'all',
    ...persistedFilters,
    ...initialFilters,
  }), [initialFilters, persistedFilters]);

  const [activeEntity, setActiveEntity] = useState<PostingSearchFilters['entity']>(defaultFilters.entity);
  const cleanEntityDefaults = useMemo(() => getCleanDefaultsForEntity(activeEntity), [activeEntity]);

  useEffect(() => {
    setActiveEntity(defaultFilters.entity);
  }, [defaultFilters.entity]);

  const activeFilters = useMemo(() => {
    if (activeEntity === 'organizations' || activeEntity === 'crises') {
      const keepUserTitleSort = defaultFilters.sortBy === 'title';
      return {
        ...defaultFilters,
        entity: activeEntity,
        sortBy: activeEntity === 'crises'
          ? (defaultFilters.sortBy as CrisisPostingSortBy)
          : 'title' as const,
        sortDir: activeEntity === 'crises'
          ? defaultFilters.sortDir
          : (keepUserTitleSort ? defaultFilters.sortDir : 'asc' as const),
        crisisFilter: activeEntity === 'crises' ? defaultFilters.crisisFilter ?? 'all' : 'all',
      };
    }

    return {
      ...defaultFilters,
      entity: activeEntity,
      sortBy: defaultFilters.sortBy,
      sortDir: defaultFilters.sortDir,
      crisisFilter: 'all' as const,
    };
  }, [defaultFilters, activeEntity]);

  const defaultFormValues = useMemo(() => toPostingSearchFormValues(activeFilters), [activeFilters]);

  const [postings, setPostings] = useState<PostingWithContext[]>([]);
  const [organizations, setOrganizations] = useState<VolunteerOrganizationSearchResult[]>([]);
  const [crises, setCrises] = useState<Crisis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { trigger: fetchPostingsRequest } = useAsync(
    async (url: string) => requestServer<VolunteerPostingSearchResponse | VolunteerEnrollmentsResponse>(url, { includeJwt: true }),
    { notifyOnError: true },
  );

  const fetchPostings = useCallback(async (activeFilters: PostingSearchFilters) => {
    const baseUrl = fetchUrl ?? '/volunteer/posting';
    const query = new URLSearchParams(buildSharedPostingQuery(activeFilters));
    if (activeFilters.hideFull) query.append('hide_full', 'true');
    if (activeFilters.crisisId !== 'all') query.append('crisis_id', activeFilters.crisisId);

    const separator = baseUrl.includes('?') ? '&' : '?';
    const url = query.size > 0 ? `${baseUrl}${separator}${query.toString()}` : baseUrl;

    setLoading(true);
    setError(null);

    try {
      const shouldFetchPostings = activeFilters.entity === 'postings';
      const shouldFetchOrgs = enableOrganizationSearch && activeFilters.entity === 'organizations';
      const shouldFetchCrises = activeFilters.entity === 'crises';

      const postingPromise = shouldFetchPostings
        ? fetchPostingsRequest(url)
        : Promise.resolve({ postings: [] } as VolunteerPostingSearchResponse);

      const organizationsPromise = shouldFetchOrgs
        ? (() => {
            const orgQuery = new URLSearchParams();
            if (activeFilters.search) orgQuery.append('search', activeFilters.search);
            if (activeFilters.sortBy === 'title') {
              orgQuery.append('sort_by', 'title');
              orgQuery.append('sort_dir', activeFilters.sortDir);
            }
            if (activeFilters.organizationCertificateFilter && activeFilters.organizationCertificateFilter !== 'all') {
              orgQuery.append('certificate_enabled', activeFilters.organizationCertificateFilter);
            }
            const orgUrl = orgQuery.toString() ? `${organizationsFetchUrl}?${orgQuery.toString()}` : organizationsFetchUrl;
            return requestServer<VolunteerOrganizationSearchResponse>(orgUrl, { includeJwt: true });
          })()
        : Promise.resolve({ organizations: [] } as VolunteerOrganizationSearchResponse);

      const crisesPromise = shouldFetchCrises
        ? (() => {
            const crisisQuery = new URLSearchParams();
            if (activeFilters.search) crisisQuery.append('search', activeFilters.search);

            if (activeFilters.crisisFilter === 'pinned_only') {
              crisisQuery.append('pinned', 'true');
            } else if (activeFilters.crisisFilter === 'unpinned_only') {
              crisisQuery.append('pinned', 'false');
            }

            if (activeFilters.sortBy === 'pinned') {
              crisisQuery.append('sort_by', 'pinned_first');
            } else if (activeFilters.sortBy === 'title' && activeFilters.sortDir === 'desc') {
              crisisQuery.append('sort_by', 'title_desc');
            } else if (activeFilters.sortBy === 'title' && activeFilters.sortDir === 'asc') {
              crisisQuery.append('sort_by', 'title_asc');
            }

            const crisisUrl = crisisQuery.toString() ? `${crisesFetchBasePath}?${crisisQuery.toString()}` : crisesFetchBasePath;
            return requestServer<VolunteerCrisesResponse>(crisisUrl, { includeJwt: true });
          })()
        : Promise.resolve({ crises: [] } as VolunteerCrisesResponse);

      const [postingResponse, organizationResponse, crisisResponse] = await Promise.all([
        postingPromise,
        organizationsPromise,
        crisesPromise,
      ]);
      const postProcessFilteredPostings = filterPostings ? filterPostings(postingResponse.postings) : postingResponse.postings;
      setPostings(postProcessFilteredPostings);
      setOrganizations(organizationResponse.organizations);

      let orderedCrises = crisisResponse.crises;
      const shouldApplyClientCrisisSort = activeFilters.entity === 'crises'
        && crisesFetchBasePath.startsWith('/organization/');
      if (shouldApplyClientCrisisSort) {
        orderedCrises = [...orderedCrises].sort((a, b) => {
          if (activeFilters.sortBy === 'pinned') {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          }

          const nameA = a.name || '';
          const nameB = b.name || '';
          return activeFilters.sortDir === 'desc'
            ? nameB.localeCompare(nameA)
            : nameA.localeCompare(nameB);
        });
      }

      setCrises(orderedCrises);
    } catch (fetchError) {
      setPostings([]);
      setOrganizations([]);
      const message = fetchError instanceof Error ? fetchError.message : 'Failed to load postings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetchPostingsRequest, fetchUrl, filterPostings, enableOrganizationSearch, organizationsFetchUrl, crisesFetchBasePath]);

  const applyFilters = useCallback(async (formValues: PostingSearchFormValues) => {
    const withEntity = { ...formValues, entity: activeEntity };
    const filters = fromPostingSearchFormValues(withEntity);

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(storageKey, JSON.stringify(filters));
    }
    setPersistedFilters(filters);

    setActiveEntity(filters.entity);
    await fetchPostings(filters);
  }, [fetchPostings, activeEntity, storageKey]);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    hasFetchedRef.current = false;
  }, [activeEntity, storageKey]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    void fetchPostings(activeFilters);
  }, [activeEntity, storageKey, fetchPostings, activeFilters]);

  const setEntityInUrl = useCallback((entity: PostingSearchFilters['entity']) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('entity', entity);
    setSearchParams(nextParams);

    // Immediately show loading skeleton when user switches entity.
    setLoading(true);
    setPostings([]);
    setOrganizations([]);
    setCrises([]);

    if (showEntityTabs && typeof window !== 'undefined') {
      const entityDefaults = getCleanDefaultsForEntity(entity);
      const nextStoredFilters: Partial<PostingSearchFilters> = {
        ...(persistedFilters ?? {}),
        entity,
      };

      if (entity !== 'postings') {
        nextStoredFilters.sortBy = 'title';
        nextStoredFilters.sortDir = 'asc';
      } else if (!nextStoredFilters.sortBy || nextStoredFilters.sortBy === 'title') {
        nextStoredFilters.sortBy = entityDefaults.sortBy;
        nextStoredFilters.sortDir = entityDefaults.sortDir;
      }

      window.sessionStorage.setItem(storageKey, JSON.stringify(nextStoredFilters));
      setPersistedFilters(nextStoredFilters);
    }
  }, [searchParams, setSearchParams, showEntityTabs, storageKey, persistedFilters]);

  const postingsInlineControls = activeEntity === 'postings'
    ? (postingsTopContent ?? actions)
    : undefined;

  const headerActions = showEntityTabs
    ? undefined
    : actions;

  return (
    <PageContainer>
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        badge={badge}
        actions={headerActions}
        showBack={showBack}
        defaultBackTo={defaultBackTo}
      />

      {showEntityTabs && (
        <div className="w-full">
          <div className="join w-full">
            <Button
              type="button"
              className="join-item flex-1"
              color={activeEntity === 'postings' ? 'primary' : undefined}
              style={activeEntity === 'postings' ? undefined : 'outline'}
              onClick={() => {
                setActiveEntity('postings');
                if (showEntityTabs) {
                  setEntityInUrl('postings');
                }
              }}
              Icon={ClipboardList}
            >
              <span className="max-sm:hidden">
                Postings
              </span>
            </Button>
            {enableOrganizationSearch && (
              <Button
                type="button"
                className="join-item flex-1"
                color={activeEntity === 'organizations' ? 'primary' : undefined}
                style={activeEntity === 'organizations' ? undefined : 'outline'}
                onClick={() => {
                  setActiveEntity('organizations');
                  if (showEntityTabs) {
                    setEntityInUrl('organizations');
                  }
                }}
                Icon={Building2}
              >
                <span className="max-sm:hidden">
                  Organizations
                </span>
              </Button>
            )}
            {enableCrisisFilter && (
              <Button
                type="button"
                className="join-item flex-1"
                color={activeEntity === 'crises' ? 'primary' : undefined}
                style={activeEntity === 'crises' ? undefined : 'outline'}
                onClick={() => {
                  setActiveEntity('crises');
                  if (showEntityTabs) {
                    setEntityInUrl('crises');
                  }
                }}
                Icon={AlertTriangle}
              >
                <span className="max-sm:hidden">
                  Crises
                </span>
              </Button>
            )}
          </div>
        </div>
      )}
      <PostingFiltersCard
        title={'Filter ' + (activeEntity === 'postings' ? 'Postings' : activeEntity === 'organizations' ? 'Organizations' : 'Crises')}
        defaultValues={defaultFormValues}
        resetValues={toPostingSearchFormValues(cleanEntityDefaults)}
        onApply={applyFilters}
        searchFieldName="search"
        searchPlaceholder={activeEntity === 'organizations'
          ? 'Search by name, description, or location'
          : 'Search by title, description, or location'}
        sortFieldName="sortOption"
        sortOptions={activeEntity === 'organizations'
          ? postingSortOptions
              .filter(option => option.value === 'title_asc' || option.value === 'title_desc')
              .map(option => ({
                label: option.value === 'title_asc' ? 'Name (A-Z)' : 'Name (Z-A)',
                value: option.value,
              }))
          : activeEntity === 'crises'
            ? [
                { label: 'Title (A-Z)', value: 'title_asc' },
                { label: 'Title (Z-A)', value: 'title_desc' },
              ]
            : volunteerPostingSortOptions.map(option => ({ label: option.label, value: option.value }))}
        extraFields={(form) => {
          if (activeEntity === 'postings') {
            return (
              <FormField
                form={form}
                name="postingFilter"
                label="Posting Filter"
                selectOptions={[
                  { label: 'All postings', value: 'all' },
                  { label: 'Open postings', value: 'open' },
                  { label: 'Review-based postings', value: 'review' },
                  { label: 'Full commitment', value: 'full' },
                  { label: 'Partial commitment', value: 'partial' },
                  { label: 'Tagged postings', value: 'tagged' },
                  { label: 'Untagged postings', value: 'untagged' },
                ]}
              />
            );
          }

          if (activeEntity === 'organizations') {
            return (
              <FormField
                form={form}
                name="organizationCertificateFilter"
                label="Certificate status"
                selectOptions={[
                  { label: 'All organizations', value: 'all' },
                  { label: 'Cert enabled', value: 'enabled' },
                  { label: 'Cert disabled', value: 'disabled' },
                ]}
              />
            );
          }

          if (activeEntity === 'crises') {
            return (
              <div className="lg:col-span-2">
                <FormField
                  form={form}
                  name="crisisFilter"
                  label="Crisis visibility"
                  selectOptions={[
                    { label: 'All crises', value: 'all' },
                    { label: 'Pinned only', value: 'pinned_only' },
                    { label: 'Unpinned only', value: 'unpinned_only' },
                  ]}
                />
              </div>
            );
          }

          return null;
        }}
        showAdvanced={activeEntity === 'postings'}
        getHasAdvancedFiltersApplied={values => activeEntity === 'postings'
          ? (hasSharedAdvancedPostingFilters(values) || values.hideFull || values.crisisId !== 'all')
          : false}
        renderAdvancedFields={form => (
          <>
            <div className="lg:col-span-2">
              <CalendarInfo
                selectionMode="range"
                rangeLabel="Date Range"
                rangeValue={{
                  from: form.watch('startDateFrom') ?? '',
                  to: form.watch('endDateTo') ?? '',
                }}
                onRangeChange={({ from, to }) => {
                  form.setValue('startDateFrom', from, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                  form.setValue('endDateTo', to, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }}
                className="w-full"
              />
            </div>

            <FormField
              form={form}
              name="startTimeFrom"
              label="Start Time After"
              type="time"
            />

            <FormField
              form={form}
              name="endTimeTo"
              label="End Time By"
              type="time"
            />
            {enableCrisisFilter && (
              <div className="lg:col-span-2">
                <FormField
                  form={form}
                  name="crisisId"
                  label="Crisis"
                  selectOptions={[
                    { label: 'All Postings', value: 'all' },
                    ...crisisOptions.map(crisis => ({
                      label: crisis.name,
                      value: String(crisis.id),
                    })),
                  ]}
                />
              </div>
            )}

            <div className="lg:col-span-2 flex items-end">
              <label className="label cursor-pointer justify-start gap-3 py-0">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  {...form.register('hideFull')}
                />
                <span className="label-text">Hide full postings</span>
              </label>
            </div>
          </>
        )}
      />

      {postingsInlineControls && (
        <div className="-mt-1 mb-2 flex justify-end">
          {postingsInlineControls}
        </div>
      )}

      {error && <div className="mb-4 text-sm text-base-content/70">Unable to load postings.</div>}

      {loading
        ? (
            <div className="p-6">
              <div className="flex justify-center mt-8">
                <Loading size="xl" />
              </div>
            </div>
          )
        : activeEntity === 'crises'
          ? (
              crises.length === 0
                ? (
                    <EmptyState
                      Icon={icon}
                      title="No crises found"
                      description="Try a different search term or check again later."
                    />
                  )
                : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {crises.map(crisis => (
                        <CrisisCard key={crisis.id} crisis={crisis} link={`${crisisBasePath}/${crisis.id}/postings`} />
                      ))}
                    </div>
                  )
            )
          : (postings.length === 0 && !organizations.length)
              ? (
                  <EmptyState
                    Icon={icon}
                    title={activeEntity === 'organizations' ? 'No organizations found' : 'No postings found'}
                    description={activeEntity === 'organizations' ? 'No organizations found yet.' : emptyMessage}
                  />
                )
              : (
                  <>
                    {postings.length > 0 && (
                      <div>
                        <PostingCollection
                          postings={postings}
                          showCrisis
                          crisisBasePath={crisisBasePath}
                          cardsContainerClassName="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3"
                          listContainerClassName="space-y-4"
                        />
                      </div>
                    )}

                    {enableOrganizationSearch && organizations.length > 0 && (
                      <div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {organizations.map(organization => (
                            <OrganizationCard
                              key={organization.id}
                              organization={organization}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
    </PageContainer>
  );
}

export default PostingSearchView;
