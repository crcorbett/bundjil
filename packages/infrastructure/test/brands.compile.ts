import type {
  AlchemyLogicalResourceId,
  PreviewInfrastructureStateRevision,
  ProductionInfrastructureStateRevision,
  SecretReferenceId,
  SyntheticPhysicalResourceId,
  VercelDeploymentId,
  VercelProjectId,
} from "../src/index.js";

declare const logicalId: AlchemyLogicalResourceId;
declare const physicalId: SyntheticPhysicalResourceId;
declare const previewRevision: PreviewInfrastructureStateRevision;
declare const productionRevision: ProductionInfrastructureStateRevision;
declare const secretReference: SecretReferenceId;
declare const vercelProjectId: VercelProjectId;
declare const vercelDeploymentId: VercelDeploymentId;

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

void physicalId;
void productionRevision;
void physicalFromLogical;
void productionFromPreview;
void physicalFromSecret;
void projectFromDeployment;
void syntheticFromVercel;
