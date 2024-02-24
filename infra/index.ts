import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as docker from "@pulumi/docker";

// Import the program's configuration settings.
const config = new pulumi.Config();
const apiImageName = "api";
const containerPort = config.getNumber("containerPort") || 8080;
const cpu = config.getNumber("cpu") || 1;
const memory = config.get("memory") || "1Gi";
const concurrency = config.getNumber("concurrency") || 80;
const stack = pulumi.getStack();

// Import the provider's configuration settings.
const gcpConfig = new pulumi.Config("gcp");
const location = gcpConfig.require("region");
const project = gcpConfig.require("project");

const githubConfig = new pulumi.Config("github");
const githubRepository = githubConfig.require("repository");

// Enable Artifact Registry API
const artifactRegistryApi = new gcp.projects.Service("artifact-registry-api", {
  service: "artifactregistry.googleapis.com",
  project: project,
});

// Create an Artifact Registry repository
const apiRepository = new gcp.artifactregistry.Repository(
  "api-repository",
  {
    description: "Repository for api container image",
    format: "DOCKER",
    location: location,
    repositoryId: `${stack}-api`,
  },
  { dependsOn: artifactRegistryApi }
);

// Form the repository URL
let repoUrl = pulumi.concat(
  location,
  "-docker.pkg.dev/",
  project,
  "/",
  apiRepository.repositoryId
);

// Create a container image for the service.
// Before running `pulumi up`, configure Docker for authentication to Artifact Registry
// as described here: https://cloud.google.com/artifact-registry/docs/docker/authentication
const apiImage = new docker.Image("api-image", {
  imageName: pulumi.concat(repoUrl, "/", apiImageName),
  build: {
    context: "..",
    dockerfile: "../apps/api/Dockerfile",
    target: "prod",
    platform: "linux/amd64",
    args: {
      // Cloud Run currently requires x86_64 images
      // https://cloud.google.com/run/docs/container-contract#languages
      DOCKER_DEFAULT_PLATFORM: "linux/amd64",
    },
  },
  skipPush: false,
});

// Enable Run API
const runApi = new gcp.projects.Service("run-api", {
  service: "run.googleapis.com",
  project: project,
});

// Create a Cloud Run service definition.
const service = new gcp.cloudrun.Service(
  "api",
  {
    name: "api",
    location,
    template: {
      spec: {
        containers: [
          {
            image: pulumi.concat(repoUrl, "/", apiImageName, ":latest"),
            resources: {
              limits: {
                memory,
                cpu: cpu.toString(),
              },
            },
            ports: [
              {
                containerPort,
              },
            ],
          },
        ],
        containerConcurrency: concurrency,
      },
    },
  },
  { dependsOn: runApi }
);

// Create an IAM member to allow the service to be publicly accessible.
const invoker = new gcp.cloudrun.IamMember("invoker", {
  location,
  service: service.name,
  role: "roles/run.invoker",
  member: "allUsers",
});

// Enable IAM Credentials API
const iamCredentialsApi = new gcp.projects.Service("iam-credentials-api", {
  service: "iamcredentials.googleapis.com",
  project: project,
});

// Create a new GCP service account for the Cloud Run workload
const serviceAccount = new gcp.serviceaccount.Account(
  "github-service-account",
  {
    accountId: "github-service-account",
    displayName: "Service Account for GitHub Actions",
  },
  { dependsOn: iamCredentialsApi }
);

// Create a new GCP Workload Identity Pool
const identityPool = new gcp.iam.WorkloadIdentityPool("identity-pool", {
  project,
  workloadIdentityPoolId: "identity-pool",
  displayName: "GitHub Workload Identity Pool",
  description: "Used to authenticate GitHub Actions with GCP",
});

// Create a new GCP Workload Identity Pool Provider for OIDC
const identityPoolProvider = new gcp.iam.WorkloadIdentityPoolProvider(
  "identity-pool-provider",
  {
    project,
    workloadIdentityPoolId: identityPool.workloadIdentityPoolId,
    workloadIdentityPoolProviderId: "identity-pool-provider",
    displayName: "GitHub OIDC Provider",
    description: "GitHub Actions provider",
    oidc: {
      issuerUri: "https://token.actions.githubusercontent.com",
    },
    attributeMapping: {
      "google.subject": "assertion.sub",
      "attribute.repository": "assertion.repository",
      "attribute.actor": "assertion.actor",
      "attribute.aud": "assertion.aud",
    },
  }
);

// Create IAM policy binding.
const serviceAccountIamBinding = new gcp.serviceaccount.IAMBinding(
  "sa-iam-binding",
  {
    serviceAccountId: serviceAccount.name,
    role: "roles/iam.workloadIdentityUser",
    members: [
      pulumi.interpolate`principalSet://iam.googleapis.com/${identityPool.name}/attribute.repository/${githubRepository}`,
    ],
  }
);

// Define the role bindings for the service account.
const runAdminBinding = new gcp.projects.IAMBinding("run-admin-binding", {
  project,
  role: "roles/run.admin",
  members: [pulumi.interpolate`serviceAccount:${serviceAccount.email}`],
});

const storageAdminBinding = new gcp.projects.IAMBinding(
  "storage-admin-binding",
  {
    project,
    role: "roles/storage.admin",
    members: [pulumi.interpolate`serviceAccount:${serviceAccount.email}`],
  }
);

const artifactRegistryWriterBinding = new gcp.projects.IAMBinding(
  "artifact-registry-writer-binding",
  {
    project,
    role: "roles/artifactregistry.writer",
    members: [pulumi.interpolate`serviceAccount:${serviceAccount.email}`],
  }
);

const serviceAccountUserBinding = new gcp.projects.IAMBinding(
  "service-account-user-binding",
  {
    project,
    role: "roles/iam.serviceAccountUser",
    members: [pulumi.interpolate`serviceAccount:${serviceAccount.email}`],
  }
);

// Export
export const serviceAccountEmail = serviceAccount.email;
export const identityPoolProviderName = identityPoolProvider.name;
