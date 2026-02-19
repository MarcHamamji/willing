import { Inbox, ClipboardCheck } from 'lucide-react';
import { useCallback } from 'react';

import OrganizationRequestReviewCard from './components/OrganizationRequestReviewCard';
import requestServer from '../../utils/requestServer';
import useAsync from '../../utils/useAsync';

import type { OrganizationRequest } from '../../../../server/src/db/tables';

function AdminHome() {
  const getOrganizationRequests = useCallback(async () => {
    const res = await requestServer<{
      organizationRequests: OrganizationRequest[];
    }>('/admin/getOrganizationRequests', {}, true);
    return res.organizationRequests;
  }, []);

  const {
    data: organizationRequests,
    trigger: refreshOrganizationRequests,
  } = useAsync(getOrganizationRequests, true);

  return (
    <div className="grow bg-base-200">
      <div className="p-6 md:container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="text-primary" size={32} />
            <h3 className="text-3xl font-extrabold tracking-tight">Organization Requests</h3>
          </div>
          {
            (organizationRequests)
              ? (
                  <div className="badge badge-primary badge-outline">
                    {organizationRequests.length}
                    {' '}
                    Pending
                  </div>
                )
              : (
                  <div className="w-22 h-6 skeleton">
                  </div>
                )
          }
        </div>

        {
          organizationRequests
            ? (organizationRequests.length > 0
                ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                      {organizationRequests.map(request => (
                        <OrganizationRequestReviewCard
                          request={request}
                          refreshOrganizationRequests={refreshOrganizationRequests}
                          key={request.id}
                        />
                      ))}
                    </div>
                  )
                : (
                    <div className="hero bg-base-200 rounded-box p-10">
                      <div className="hero-content text-center">
                        <div className="max-w-md flex flex-col items-center">
                          <Inbox size={64} className="opacity-20 mb-4" />
                          <p className="py-2 font-bold opacity-80">All caught up!</p>
                          <p className="pb-6 opacity-60">No organization requests found at this time.</p>
                        </div>
                      </div>
                    </div>
                  )
              )
            : (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                  <div className="card shadow-sm border border-base-200 skeleton h-169">
                  </div>
                  <div className="card shadow-sm border border-base-200 skeleton h-169">
                  </div>
                  <div className="card shadow-sm border border-base-200 skeleton h-169">
                  </div>
                </div>
              )
        }
      </div>
    </div>
  );
}

export default AdminHome;
