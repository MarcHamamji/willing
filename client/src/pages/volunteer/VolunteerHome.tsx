import { House } from 'lucide-react';
import { Link } from 'react-router-dom';

import PageHeader from '../../components/layout/PageHeader.tsx';
import Loading from '../../components/Loading.tsx';
import PostingCard from '../../components/PostingCard';
import HorizontalScrollSection from '../../components/postings/HorizontalScrollSection.tsx';
import requestServer from '../../utils/requestServer';
import useAsync from '../../utils/useAsync';

import type { VolunteerEnrollmentsResponse, VolunteerPostingSearchResponse } from '../../../../server/src/api/types';
import type { PostingWithSkillsAndOrgName } from '../../../../server/src/types';

const PostingRailCard = ({ posting }: { posting: PostingWithSkillsAndOrgName }) => (
  <div className="w-[320px] shrink-0 snap-start md:w-[380px]">
    <PostingCard
      posting={posting}
      organization={{ name: posting.organization_name, id: posting.organization_id }}
    />
  </div>
);

const RailLoadingState = () => (
  <div className="flex justify-center rounded-box border border-base-300 bg-base-100 px-6 py-12">
    <Loading size="lg" />
  </div>
);

function VolunteerHome() {
  const {
    data: enrolledPostings,
    loading: enrolledLoading,
    error: enrolledError,
  } = useAsync<PostingWithSkillsAndOrgName[], []>(
    async () => {
      const res = await requestServer<VolunteerEnrollmentsResponse>('/volunteer/posting/enrollments', { includeJwt: true });
      return res.postings;
    },
    true,
  );

  const {
    data: allPostings,
    loading: allLoading,
    error: allError,
  } = useAsync<PostingWithSkillsAndOrgName[], []>(
    async () => {
      const res = await requestServer<VolunteerPostingSearchResponse>('/volunteer/posting', { includeJwt: true });
      return res.postings;
    },
    true,
  );

  const forYouPostings = (allPostings ?? []).slice(0, 8);

  return (
    <div className="grow bg-base-200">
      <div className="p-6 md:container mx-auto">
        <PageHeader
          title="Home"
          subtitle="Your enrollments and personalised picks - all in one place."
          icon={House}
        />

        <div className="space-y-10">

          <HorizontalScrollSection
            title="My Enrollments"
            subtitle="Here you can view all postings you're currently enrolled in or have applied to"
            hasItems={!enrolledLoading && (enrolledPostings?.length ?? 0) > 0}
            action={(
              <Link to="/volunteer/enrollments" className="btn btn-sm btn-primary">
                View All
              </Link>
            )}
            emptyState={enrolledLoading
              ? <RailLoadingState />
              : enrolledError
                ? (
                    <div className="alert alert-error">
                      <span>{enrolledError.message}</span>
                    </div>
                  )
                : (
                    <div className="alert bg-base-100 shadow-sm">
                      <span>You have not enrolled in any postings yet.</span>
                    </div>
                  )}
          >
            {(enrolledPostings ?? []).map(posting => (
              <PostingRailCard key={posting.id} posting={posting} />
            ))}
          </HorizontalScrollSection>

          <HorizontalScrollSection
            title="For You"
            subtitle="Recommended for you"
            hasItems={!allLoading && forYouPostings.length > 0}
            action={(
              <Link to="/volunteer/search" className="btn btn-sm btn-primary">
                View All
              </Link>
            )}
            emptyState={allLoading
              ? <RailLoadingState />
              : allError
                ? (
                    <div className="alert alert-error">
                      <span>{allError.message}</span>
                    </div>
                  )
                : (
                    <div className="alert bg-base-100 shadow-sm">
                      <span>No recommended postings are available yet.</span>
                    </div>
                  )}
          >
            {forYouPostings.map(posting => (
              <PostingRailCard key={posting.id} posting={posting} />
            ))}
          </HorizontalScrollSection>

        </div>
      </div>
    </div>
  );
}

export default VolunteerHome;
