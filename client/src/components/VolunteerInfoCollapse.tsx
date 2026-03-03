import { Cake, Mail, Mars, Venus } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';

import SkillsList from './SkillsList';

import type { PostingEnrollment } from '../../../server/src/types';

interface VolunteerInfoCollapseProps {
  volunteer: PostingEnrollment;
  actions?: ReactNode;
}

function VolunteerInfoCollapse({ volunteer, actions }: VolunteerInfoCollapseProps) {
  const volunteerName = `${volunteer.first_name} ${volunteer.last_name}`;
  const initials = `${volunteer.first_name.charAt(0)}${volunteer.last_name.charAt(0)}`.toUpperCase();
  const age = useMemo(() => {
    const now = new Date();
    const birthDate = new Date(volunteer.date_of_birth);
    let ageNum = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      ageNum--;
    }
    return ageNum;
  }, [volunteer.date_of_birth]);

  const genderBadgeStyles
    = volunteer.gender === 'male'
      ? 'badge-info'
      : volunteer.gender === 'female'
        ? 'badge-secondary'
        : 'badge-accent';

  return (
    <div className="collapse collapse-arrow border border-base-300 bg-base-100">
      <input type="checkbox" />
      <div className="collapse-title flex items-center justify-between gap-3 z-10 pointer-events-none">
        <div className="flex items-center gap-3 flex-1">
          <div className="avatar">
            <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-lg font-semibold">{initials}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <h5 className="font-bold text-base leading-tight">{volunteerName}</h5>
            <div className="flex gap-2 mt-1">
              <span className={`badge badge-sm gap-1 ${genderBadgeStyles}`}>
                {volunteer.gender === 'male' && <Mars size={10} />}
                {volunteer.gender === 'female' && <Venus size={10} />}
                {volunteer.gender === 'other' && <span className="font-bold">*</span>}
                {volunteer.gender.charAt(0).toUpperCase() + volunteer.gender.slice(1)}
              </span>
              <span className="badge badge-sm gap-1">
                <Cake size={10} />
                {age}
                {' '}
                years old
              </span>
            </div>
          </div>
        </div>
        {actions && (
          <div className="flex gap-2 items-center pointer-events-auto" onClick={e => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      <div className="collapse-content pt-0">
        <div className="flex items-center gap-2 text-xs opacity-70 mt-1">
          <Mail size={12} />
          {volunteer.email}
        </div>
        {volunteer.skills && volunteer.skills.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold opacity-70 mb-1">Skills</p>
            <div className="flex flex-wrap gap-1">
              <SkillsList skills={volunteer.skills} />
            </div>
          </div>
        )}
        {'message' in volunteer && volunteer.message && (
          <div className="mt-3">
            <p className="text-xs font-semibold opacity-70 mb-1">
              {'application_id' in volunteer ? 'Application Message' : 'Message'}
            </p>
            <p className="text-xs opacity-80 italic">
              "
              {volunteer.message}
              "
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VolunteerInfoCollapse;
