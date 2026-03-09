import { MapPin, Globe, Mail, Phone } from 'lucide-react';
import { useParams } from 'react-router-dom';

import ColumnLayout from '../components/layout/ColumnLayout';
import PageHeader from '../components/layout/PageHeader';
import LocationPicker from '../components/LocationPicker';
import PostingCard from '../components/PostingCard';
import requestServer from '../utils/requestServer';
import useAsync from '../utils/useAsync';

import type { OrganizationProfileResponse } from '../../../server/src/api/types';

function OrganizationProfile() {
  const { id } = useParams<{ id: string }>();

  const { data, loading, error } = useAsync(
    async () => {
      if (!id) throw new Error('Organization ID is required');
      const response = await requestServer<OrganizationProfileResponse>(
        `/organization/${id}`,
        {
          method: 'GET',
          includeJwt: false,
        },
      );
      return response;
    },
    !!id,
  );

  if (!id) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <div className="grow">
          <div className="p-6 md:container mx-auto">
            <div className="alert alert-error">
              <span>Invalid organization ID</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <div className="grow">
        <div className="p-6 md:container mx-auto">
          <PageHeader
            title="Organization Profile"
            subtitle="View organization details and available opportunities"
            showBack
            defaultBackTo="/"
          />

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error.message}</span>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          )}

          {!loading && data && (
            <ColumnLayout
              sidebar={(
                <>
                  <div className="card bg-base-100 shadow-md border border-base-200">
                    <div className="card-body">
                      <div className="flex flex-col items-center text-center">
                        <div className="bg-linear-to-br from-primary to-primary/70 text-primary-content rounded-full w-24 h-24 flex items-center justify-center mb-4">
                          <span className="text-4xl font-bold">
                            {data.organization.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold">
                          {data.organization.name}
                        </h2>
                      </div>

                      <div className="divider my-4" />

                      <div className="space-y-4">
                        {data.organization.location_name && (
                          <div className="flex gap-3">
                            <MapPin
                              size={20}
                              className="text-primary shrink-0 mt-0.5"
                            />
                            <div className="flex-1">
                              <p className="text-xs opacity-70 font-semibold mb-0.5">
                                LOCATION
                              </p>
                              <p className="text-sm">
                                {data.organization.location_name}
                              </p>
                            </div>
                          </div>
                        )}

                        {data.organization.email && (
                          <div className="flex gap-3">
                            <Mail
                              size={20}
                              className="text-primary shrink-0 mt-0.5"
                            />
                            <div className="flex-1">
                              <p className="text-xs opacity-70 font-semibold mb-0.5">
                                EMAIL
                              </p>
                              <a
                                href={`mailto:${data.organization.email}`}
                                className="link link-primary text-sm break-all"
                              >
                                {data.organization.email}
                              </a>
                            </div>
                          </div>
                        )}

                        {data.organization.phone_number && (
                          <div className="flex gap-3">
                            <Phone
                              size={20}
                              className="text-primary shrink-0 mt-0.5"
                            />
                            <div className="flex-1">
                              <p className="text-xs opacity-70 font-semibold mb-0.5">
                                PHONE
                              </p>
                              <a
                                href={`tel:${data.organization.phone_number}`}
                                className="link link-primary text-sm"
                              >
                                {data.organization.phone_number}
                              </a>
                            </div>
                          </div>
                        )}

                        {data.organization.url && (
                          <div className="flex gap-3">
                            <Globe
                              size={20}
                              className="text-primary shrink-0 mt-0.5"
                            />
                            <div className="flex-1">
                              <p className="text-xs opacity-70 font-semibold mb-0.5">
                                WEBSITE
                              </p>
                              <a
                                href={data.organization.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-primary text-sm break-all"
                              >
                                {data.organization.url}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {(data.organization.latitude && data.organization.longitude) && (
                    <div className="card bg-base-100 shadow-md border border-base-200">
                      <div className="card-body">
                        <h5 className="font-bold text-lg">Location</h5>
                        <p className="text-sm opacity-70 mb-2">
                          Organization location on map.
                        </p>
                        <LocationPicker
                          position={[
                            data.organization.latitude,
                            data.organization.longitude,
                          ]}
                          setPosition={() => {}}
                          readOnly={true}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            >
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-2xl font-bold tracking-tight">
                    Postings
                  </h3>
                  <span className="badge badge-lg badge-primary">
                    {data.postings.length}
                  </span>
                </div>

                {data.postings.length === 0
                  ? (
                      <div className="card bg-base-100 shadow-md border border-base-200">
                        <div className="card-body flex flex-col items-center justify-center py-12">
                          <p className="text-center opacity-70">
                            This organization has no active postings at the moment.
                          </p>
                        </div>
                      </div>
                    )
                  : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.postings.map(posting => (
                          <PostingCard
                            key={posting.id}
                            posting={posting}
                          />
                        ))}
                      </div>
                    )}
              </div>
            </ColumnLayout>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrganizationProfile;
