import { ClipboardList } from 'lucide-react';

import PostingSearchView from '../../components/postings/PostingSearchView.tsx';

function VolunteerEnrollments() {
  return (
    <div className="grow bg-base-200">
      <PostingSearchView
        title="My Enrollments"
        subtitle="Here you can view all postings you're currently enrolled in or have applied to."
        icon={ClipboardList}
        showBack
        defaultBackTo="/volunteer"
        fetchUrl="/volunteer/posting/enrollments"
        emptyMessage="You haven't applied to any postings yet."
      />
    </div>
  );
}

export default VolunteerEnrollments;
