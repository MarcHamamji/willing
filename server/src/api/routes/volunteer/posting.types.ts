import { Enrollment, EnrollmentApplication, OrganizationPostingWithoutVectors, PostingSkill } from '../../../db/tables.js';
import { PostingWithSkillsAndOrgName, SuccessResponse } from '../../../types.js';

export type VolunteerEnrollmentEntry = PostingWithSkillsAndOrgName & {
  status: 'enrolled' | 'pending';
};

export type VolunteerEnrollmentsResponse = {
  postings: VolunteerEnrollmentEntry[];
};

export type VolunteerPostingSearchResponse = {
  postings: PostingWithSkillsAndOrgName[];
};

export type VolunteerPostingResponse = {
  hasPendingApplication: boolean;
  posting: OrganizationPostingWithoutVectors;
  skills: PostingSkill[];
  isEnrolled: boolean;
};

export type VolunteerPostingEnrollResponse = {
  enrollment: Enrollment | EnrollmentApplication;
  isOpen: boolean;
};

export type VolunteerPostingWithdrawResponse = SuccessResponse;
