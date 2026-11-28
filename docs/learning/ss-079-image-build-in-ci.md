# SS-079: Backend Image Build Fix And Image Builds In CI

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-079 (#154)](https://github.com/Samska/samska-sandbox/issues/154)
- Pull request: See the Issue
- ADRs: None
- Canonical documentation: [Deployment](../DEPLOYMENT.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why a build that was never run in CI can be broken for every host.
- How the Maven wrapper depends on tools in the base image.

### Core — Know this for interviews

A deployment artifact must be built by the pipeline, not first by the host. The first Railway build exposed a defect that existed since the container work in SS-074 because CI only ran the application's tests, never `docker build`.

## Concepts explained

### The wrapper and the base image

`mvnw` downloads a Maven distribution and checks it against `distributionSha256Sum`, which is the checksum of the `.zip`. Without `unzip` in the image the wrapper takes another path and the checksum no longer matches, so the build stops with "Failed to validate Maven distribution SHA-256". Installing `unzip` restores the intended path. The image also sets the wrapper executable, because an upload from Windows loses the executable bit that Git keeps.

### Build images in CI

A job builds both images on every pull request. It does not push them; it only proves that the Dockerfiles still build from a clean checkout.

## Design record

No visible UI changed. The deployment guide records the first-deployment findings: connect the repository instead of uploading from Windows, set the config file path for `railway.json`, automatic deploys on push, and a byte-order mark added by PowerShell standard input.

## Verification

The fix was reproduced and confirmed by a local `docker build` of the backend image on the owner's machine, and the new CI job builds both images from a clean checkout.
