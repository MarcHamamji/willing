import { OrganizationPostingWithoutVectors, PostingSkill } from '../../../db/tables.js';
import { PostingWithSkills, PostingEnrollment, SuccessResponse, PostingApplication } from '../../../types.js';

export type OrganizationPostingCreateResponse = {
  posting: OrganizationPostingWithoutVectors;
  skills: PostingSkill[];
};

export type OrganizationPostingListResponse = {
  postings: PostingWithSkills[];
};

export type OrganizationPostingResponse = {
  posting: OrganizationPostingWithoutVectors;
  skills: PostingSkill[];
};

export type OrganizationPostingEnrollmentsResponse = {
  enrollments: PostingEnrollment[];
};

export type OrganizationPostingUpdateResponse = {
  posting: OrganizationPostingWithoutVectors;
  skills: PostingSkill[];
};

export type OrganizationPostingDeleteResponse = SuccessResponse;

export type OrganizationPostingApplicationsReponse = {
  applications: PostingApplication[];
};

export type OrganizationPostingApplicationAcceptanceResponse = SuccessResponse;

export type OrganizationPostingApplicationRejectionResponse = SuccessResponse;

export type OrganizationPostingEnrollmentAttendanceUpdateResponse = SuccessResponse;
