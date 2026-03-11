import PostingSearchView from '../../components/postings/PostingSearchView.tsx';

function VolunteerSearch() {
  return (
    <div className="grow bg-base-200">
      <PostingSearchView
        title="Search Opportunities"
        subtitle="Browse all postings and filter them down by dates, location, or skills."
      />
    </div>
  );
}

export default VolunteerSearch;
