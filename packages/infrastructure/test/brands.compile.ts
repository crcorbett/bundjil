import type {
  PhotonProjectId,
  PhotonWebhookId,
} from "@bundjil/photon/management";

import type {
  AlchemyR2AccountId,
  AlchemyR2BucketName,
  AlchemyLogicalResourceId,
  PreviewInfrastructureStateRevision,
  ProductionInfrastructureStateRevision,
  SecretReferenceId,
  SyntheticPhysicalResourceId,
  // @ts-expect-error Vercel deployment identities are exported only from /vercel
  VercelDeploymentId as RetiredRootVercelDeploymentId,
  // @ts-expect-error Vercel project identities are exported only from /vercel
  VercelProjectId as RetiredRootVercelProjectId,
} from "../src/index.js";
import type {
  VercelDeploymentId,
  VercelProjectId,
} from "../src/vercel/index.js";

declare const retiredRootProjectId: RetiredRootVercelProjectId;
declare const retiredRootDeploymentId: RetiredRootVercelDeploymentId;

declare const logicalId: AlchemyLogicalResourceId;
declare const physicalId: SyntheticPhysicalResourceId;
declare const previewRevision: PreviewInfrastructureStateRevision;
declare const productionRevision: ProductionInfrastructureStateRevision;
declare const secretReference: SecretReferenceId;
declare const vercelProjectId: VercelProjectId;
declare const vercelDeploymentId: VercelDeploymentId;
declare const photonProjectId: PhotonProjectId;
declare const photonWebhookId: PhotonWebhookId;
declare const r2AccountId: AlchemyR2AccountId;
declare const r2BucketName: AlchemyR2BucketName;

// @ts-expect-error logical and physical identities are not interchangeable
const physicalFromLogical: SyntheticPhysicalResourceId = logicalId;

// @ts-expect-error Preview and Production state revisions are isolated
const productionFromPreview: ProductionInfrastructureStateRevision =
  previewRevision;

// @ts-expect-error secret references cannot become physical resource IDs
const physicalFromSecret: SyntheticPhysicalResourceId = secretReference;

// @ts-expect-error Vercel project and deployment identities cannot mix
const projectFromDeployment: VercelProjectId = vercelDeploymentId;

// @ts-expect-error Vercel and synthetic resource identities cannot mix
const syntheticFromVercel: SyntheticPhysicalResourceId = vercelProjectId;

// @ts-expect-error Photon project and webhook identities cannot mix
const photonProjectFromWebhook: PhotonProjectId = photonWebhookId;

// @ts-expect-error Vercel and Photon project identities cannot mix
const photonProjectFromVercel: PhotonProjectId = vercelProjectId;

// @ts-expect-error R2 account and bucket identities cannot mix
const r2BucketFromAccount: AlchemyR2BucketName = r2AccountId;

void physicalId;
void retiredRootProjectId;
void retiredRootDeploymentId;
void productionRevision;
void physicalFromLogical;
void productionFromPreview;
void physicalFromSecret;
void projectFromDeployment;
void syntheticFromVercel;
void photonProjectId;
void photonProjectFromWebhook;
void photonProjectFromVercel;
void r2BucketName;
void r2BucketFromAccount;
