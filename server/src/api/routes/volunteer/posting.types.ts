import { Enrollment, EnrollmentApplication, OrganizationPosting, PostingSkill } from '../../../db/tables.js';
import { PostingWithSkillsAndOrgName, SuccessResponse } from '../../../types.js';

export type VolunteerEnrollmentsResponse = {
  postings: PostingWithSkillsAndOrgName[];
};

export type VolunteerPostingSearchResponse = {
  postings: PostingWithSkillsAndOrgName[];
};

export type VolunteerPostingResponse = {
  hasPendingApplication: boolean;
  posting: OrganizationPosting;
  skills: PostingSkill[];
  isEnrolled: boolean;
};

export type VolunteerPostingEnrollResponse = {
  enrollment: Enrollment | EnrollmentApplication;
  isOpen: boolean;
};

export type VolunteerPostingWithdrawResponse = SuccessResponse;
