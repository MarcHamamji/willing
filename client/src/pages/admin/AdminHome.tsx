import { useCallback, useEffect, useState } from 'react';
import requestServer from '../../requestServer';
import type { OrganizationRequest } from '../../../../server/src/db/tables';
import OrganizationRequestReviewCard from './components/OrganizationRequestReviewCard';

function AdminHome() {
  const [organizationRequests, setOrganizationRequests] = useState<OrganizationRequest[]>([]);

  const refreshOrganizationRequests = useCallback(async () => {
    const res = await requestServer<{
      organizationRequests: OrganizationRequest[];
    }>('/admin/getOrganizationRequests', {}, true);

    setOrganizationRequests(res.organizationRequests);
  }, []);

  useEffect(() => {
    (async () => {
      await refreshOrganizationRequests();
    })();
  }, []);

  return (
    <div className="flex-grow bg-base-200">
      <div className="p-6 md:container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-extrabold tracking-tight">Organization Requests</h3>
          <div className="badge badge-primary badge-outline">
            {organizationRequests.length}
            {' '}
            Pending
          </div>
        </div>

        {organizationRequests.length > 0
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
                  <div className="max-w-md">
                    <p className="py-6 opacity-60">No organization requests found at this time.</p>
                  </div>
                </div>
              </div>
            )}
      </div>
    </div>
  );
}

export default AdminHome;
