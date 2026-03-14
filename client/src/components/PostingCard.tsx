import { Building2, Calendar, Cake, Clock, ExternalLink, LockOpen, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router';

import SkillsList from './skills/SkillsList';

import type { OrganizationPosting, PostingSkill } from '../../../server/src/db/tables';

interface PostingCardProps {
  posting: OrganizationPosting & { skills: PostingSkill[] };
  organization?: {
    name: string;
    id: number;
  };
}

function PostingCard({ posting, organization }: PostingCardProps) {
  const postingDetailsPath = `/posting/${posting.id}`;

  return (
    <div className="card h-full min-h-[31rem] border border-base-200 bg-base-100 shadow-md transition-shadow hover:shadow-lg">
      <div className="card-body flex h-full flex-col">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <h2 className="card-title text-primary text-lg">
              <Link to={postingDetailsPath} className="link link-primary link-hover no-underline hover:underline inline-flex items-center gap-1.5">
                <span>{posting.title}</span>
                <ExternalLink size={14} />
              </Link>
            </h2>
          </div>
          {posting.is_closed
            ? (
                <span className="badge badge-error gap-1 shrink-0">
                  <Clock size={12} />
                  Closed
                </span>
              )
            : posting.automatic_acceptance
              ? (
                  <span className="badge badge-primary gap-1 shrink-0">
                    <LockOpen size={12} />
                    Open
                  </span>
                )
              : (
                  <span className="badge badge-secondary gap-1 shrink-0">
                    <Clock size={12} />
                    Review Based
                  </span>
                )}
        </div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-sm opacity-80 line-clamp-2">{posting.description}</p>
          {organization && (
            <Link
              to={`/organization/${organization.id}`}
              className="link link-primary link-hover font-medium text-sm inline-flex items-center gap-1.5 shrink-0"
            >
              <Building2 size={14} />
              <span>{organization.name}</span>
            </Link>
          )}
        </div>

        <div className="divider mt-0 mb-2" />

        <div className="space-y-3 text-sm mb-2">
          <p className="flex items-center gap-2">
            <MapPin size={16} className="text-primary shrink-0" />
            <div>
              <p className="text-xs opacity-70 font-semibold">LOCATION</p>
              <span>{posting.location_name}</span>
            </div>
          </p>

          {posting.end_timestamp
            ? (
                <div className="flex gap-3 items-start">
                  <div className="flex flex-col items-center shrink-0 mt-1">
                    <Calendar size={16} className="text-primary shrink-0" />
                    <div className="w-0.5 h-6 bg-primary my-0.5" />
                    <Calendar size={16} className="text-primary shrink-0" />
                  </div>
                  <div className="flex flex-col gap-1 grow">
                    <div>
                      <p className="text-xs opacity-70 font-semibold">START</p>
                      <span className="text-xs">
                        {new Date(posting.start_timestamp).toLocaleDateString()}
                        {' '}
                        {new Date(posting.start_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 font-semibold">END</p>
                      <span className="text-xs">
                        {new Date(posting.end_timestamp).toLocaleDateString()}
                        {' '}
                        {new Date(posting.end_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            : (
                <p className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary shrink-0" />
                  <div>
                    <p className="text-xs opacity-70 font-semibold">START</p>
                    <span className="text-xs">
                      {new Date(posting.start_timestamp).toLocaleDateString()}
                      {' '}
                      {new Date(posting.start_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </p>
              )}

          <div className="flex gap-4 pt-1">
            {posting.max_volunteers && (
              <p className="flex items-center gap-2 text-sm">
                <Users size={16} className="text-primary shrink-0" />
                <div>
                  <p className="text-xs opacity-70 font-semibold">VOLUNTEERS</p>
                  <span>
                    0/
                    {posting.max_volunteers}
                  </span>
                </div>
              </p>
            )}
            {posting.minimum_age && (
              <p className="flex items-center gap-2 text-sm">
                <Cake size={16} className="text-primary shrink-0" />
                <div>
                  <p className="text-xs opacity-70 font-semibold">MIN AGE</p>
                  <span>
                    {posting.minimum_age}
                    +
                  </span>
                </div>
              </p>
            )}
          </div>
        </div>

        {posting.skills && posting.skills.length > 0 && (
          <div className="mt-auto mb-2">
            <div className="divider mt-0 mb-2" />
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold opacity-70">REQUIRED SKILLS</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <SkillsList skills={posting.skills} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default PostingCard;
