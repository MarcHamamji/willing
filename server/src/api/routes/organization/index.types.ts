import { ResetPasswordResponse } from '../../../auth/resetPassword.js';
import { OrganizationAccountWithoutPassword, OrganizationAccountWithoutPasswordWithTimestamps, OrganizationPostingWithoutVectors, PostingSkill } from '../../../db/tables.js';
import { SuccessResponse } from '../../../types.js';

export type OrganizationRequestResponse = SuccessResponse;

export type OrganizationProfileResponse = {
  organization: OrganizationAccountWithoutPasswordWithTimestamps;
  postings: (OrganizationPostingWithoutVectors & { skills: PostingSkill[] })[];
};

export type OrganizationMeResponse = {
  organization: OrganizationAccountWithoutPassword;
};

export type OrganizationResetPasswordResponse = ResetPasswordResponse;
