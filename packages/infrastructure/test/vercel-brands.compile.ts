import type {
  VercelCanonicalDomain,
  VercelDeploymentId,
  VercelEnvironmentVariableId,
  VercelIntegrationId,
  VercelMarketplaceDatabaseId,
  VercelProjectId,
  VercelTeamId,
} from "../src/vercel/index.js";

declare const teamId: VercelTeamId;
declare const projectId: VercelProjectId;
declare const environmentVariableId: VercelEnvironmentVariableId;
declare const deploymentId: VercelDeploymentId;
declare const integrationId: VercelIntegrationId;
declare const databaseId: VercelMarketplaceDatabaseId;
declare const domain: VercelCanonicalDomain;

// @ts-expect-error team and project identities are not interchangeable
const projectFromTeam: VercelProjectId = teamId;

// @ts-expect-error project and environment identities are not interchangeable
const environmentFromProject: VercelEnvironmentVariableId = projectId;

// @ts-expect-error deployment and integration identities are not interchangeable
const integrationFromDeployment: VercelIntegrationId = deploymentId;

// @ts-expect-error Marketplace database IDs cannot become deployment IDs
const deploymentFromDatabase: VercelDeploymentId = databaseId;

// @ts-expect-error canonical domains cannot become project IDs
const projectFromDomain: VercelProjectId = domain;

void environmentVariableId;
void integrationId;
void projectFromTeam;
void environmentFromProject;
void integrationFromDeployment;
void deploymentFromDatabase;
void projectFromDomain;
