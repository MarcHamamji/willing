import {
  MapPin,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import { useCallback, useState } from 'react';

import LocationPicker from '../../../components/LocationPicker';
import requestServer from '../../../utils/requestServer';

import type { OrganizationRequest } from '../../../../../server/src/db/tables';

function OrganizationRequestReviewCard({ request, refreshOrganizationRequests }: {
  request: OrganizationRequest;
  refreshOrganizationRequests: (...args: unknown[]) => unknown;
}) {
  const [reason, setReason] = useState('');
  const location: [number, number] = [request.latitude ?? 0, request.longitude ?? 0];

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
          <MapPin size={16} />
          {request.location_name}
        </div>

        <LocationPicker position={location} setPosition={() => {}} readOnly={true} />

        <div className="space-y-1 my-4 text-sm">
          <p className="flex justify-between">
            <span className="flex items-center gap-2 font-semibold">
              <Mail size={14} className="opacity-70" />
              Email
            </span>
            <span className="truncate ml-2">{request.email}</span>
          </p>
          <p className="flex justify-between">
            <span className="flex items-center gap-2 font-semibold">
              <Phone size={14} className="opacity-70" />
              Phone
            </span>
            <span className="truncate ml-2">{request.phone_number}</span>
          </p>
          {request.url && (
            <p className="flex justify-between">
              <span className="flex items-center gap-2 font-semibold">
                <Globe size={14} className="opacity-70" />
                Website
              </span>
              <a href={request.url} target="_blank" className="link link-primary truncate ml-2">{request.url}</a>
            </p>
          )}
        </div>

        <div className="card-actions flex-col gap-3">
          <div className="join w-full relative">
            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 z-50 pointer-events-none" size={16} />
            <input
              className="input input-bordered join-item flex-grow pl-10 border-l-rounded rounded-l-lg rounded-r-none"
              placeholder="Reason"
              onChange={handleReasonChange}
            />
            <button
              className="btn btn-error join-item gap-2"
              onClick={rejectRequest}
            >
              <XCircle size={18} />
              Reject
            </button>
          </div>

          <button
            className="btn btn-primary w-full gap-2"
            onClick={approveRequest}
          >
            <CheckCircle size={18} />
            {' '}
            Approve Organization
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrganizationRequestReviewCard;
