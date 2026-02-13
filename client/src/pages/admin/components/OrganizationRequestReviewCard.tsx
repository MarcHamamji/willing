import { useCallback, useState } from 'react';
import type { OrganizationRequest } from '../../../../../server/src/db/types';
import requestServer from '../../../requestServer';
import LocationPicker from '../../../components/LocationPicker';

function OrganizationRequestReviewCard({ request, refreshOrganizationRequests }: {
  request: OrganizationRequest;
  refreshOrganizationRequests: () => Promise<void>;
}) {
  const [reason, setReason] = useState('');

  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setReason(e.target.value);
  }, []);

  const rejectRequest = useCallback(async () => {
    // TODO: Should show the error if it fails
    await requestServer('/admin/reviewOrganizationRequest', {
      method: 'POST',
      body: JSON.stringify({
        requestId: request.id,
        accepted: false,
        reason: reason,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }, true);

    refreshOrganizationRequests();
  }, [request, refreshOrganizationRequests, reason]);

  const approveRequest = useCallback(async () => {
    // TODO: Should show the error if it fails
    await requestServer('/admin/reviewOrganizationRequest', {
      method: 'POST',
      body: JSON.stringify({
        requestId: request.id,
        accepted: true,
        reason: '',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }, true);

    refreshOrganizationRequests();
  }, [request, refreshOrganizationRequests]);

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body">
        <h2 className="card-title text-primary">{request.name}</h2>
        <div className="text-sm opacity-70 flex items-center gap-1 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {request.location_name}
        </div>

        <LocationPicker position={[request.latitude, request.longitude]} setPosition={() => {}} readOnly={true} />

        <div className="space-y-1 my-4 text-sm">
          <p className="flex justify-between">
            <span className="font-semibold">Email</span>
            <span className="truncate ml-2">{request.email}</span>
          </p>
          <p className="flex justify-between">
            <span className="font-semibold">Phone</span>
            <a href={'tel:' + request.phone_number} target="_blank" className="link link-secondary truncate ml-2">{request.phone_number}</a>
          </p>
          {request.url && (
            <p className="flex justify-between">
              <span className="font-semibold">Website</span>
              <a href={request.url} target="_blank" className="link link-secondary truncate ml-2">{request.url}</a>
            </p>
          )}
        </div>

        <div className="card-actions justify-end mt-2">
          <span className="join flex-grow">
            <input
              className="input flex-grow join-item"
              placeholder="Reason"
              onChange={handleReasonChange}
            />
            <button
              className="btn join-item"
              onClick={rejectRequest}
            >
              Reject
            </button>
          </span>
          <button
            className="btn btn-primary"
            onClick={approveRequest}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrganizationRequestReviewCard;
