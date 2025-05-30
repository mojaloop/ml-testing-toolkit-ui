# ML Testing Toolkit UI

## 1. Running the toolkit UI

### 1.1 With Docker

This is the easiest way to run the self testing toolkit ui.

The following software should be installed on your system to run the toolkit.

* Git
* Docker

Please execute the following lines to build and run the application. 

```bash
git clone https://github.com/mojaloop/ml-testing-toolkit-ui
cd ml-testing-toolkit-ui
docker-compose up
```

To update the testing-toolkit-ui to the latest version and rebuild, please run the following
```bash
cd ml-testing-toolkit-ui
git pull
docker-compose build
docker-compose up
```

### 1.2 Running locally

The following software should be installed on your system to run the toolkit ui locally.

* Git
* NodeJS
  
Please execute the following lines to run the toolkit ui.

```
git clone https://github.com/mojaloop/ml-testing-toolkit-ui.git
cd ml-testing-toolkit-ui
npm install
npm start
```

## 3. Ports

If you run the testing toolkit UI through **Docker** the web server will be started and listen on port 6060. You can get the web interface on http://localhost:6060/

If you run the testing toolkit UI locally, you can find out the port number in the output in the console.

You should run testing toolkit backend service to use this UI.
Please follow this link to learn about backend service.

https://github.com/mojaloop/ml-testing-toolkit/blob/main/README.md

-------

## Auditing Dependencies

We use `npm-audit-resolver` along with `npm audit` to check dependencies for node vulnerabilities, and keep track of resolved dependencies with an `audit-resolve.json` file.

To start a new resolution process, run:

```bash
npm run audit:resolve
```

You can then check to see if the CI will pass based on the current dependencies with:

```bash
npm run audit:check
```

And commit the changed `audit-resolve.json` to ensure that CircleCI will build correctly.

## Container Scans

As part of our CI/CD process, we use anchore-cli to scan our built docker container for vulnerabilities upon release.

If you find your release builds are failing, refer to the [container scanning](https://github.com/mojaloop/ci-config#container-scanning) in our shared Mojaloop CI config repo. There is a good chance you simply need to update the `mojaloop-policy-generator.js` file and re-run the circleci workflow.

For more information on anchore and anchore-cli, refer to:
- [Anchore CLI](https://github.com/anchore/anchore-cli)
- [Circle Orb Registry](https://circleci.com/orbs/registry/orb/anchore/anchore-engine)

## Automated Releases

As part of our CI/CD process, we use a combination of CircleCI, standard-version
npm package and github-release CircleCI orb to automatically trigger our releases
and image builds. This process essentially mimics a manual tag and release.

On a merge to main, CircleCI is configured to use the mojaloopci github account
to push the latest generated CHANGELOG and package version number.

Once those changes are pushed, CircleCI will pull the updated main, tag and
push a release triggering another subsequent build that also publishes a docker image.

## [PISP Demonstration Setup Guide (click here)](./src/views/demos/PISPDemo/PISP-Instructions.md)

## CI/CD Configuration

This project uses the CircleCI orb for its CI/CD pipeline configuration. The orb standardizes the build, test, and deployment processes across Mojaloop projects.

Key features of the CI/CD configuration:
- PR title validation
- Automated testing (unit, integration)
- Vulnerability scanning using Grype
- Automated Docker image building and publishing
- Automated versioning and releases

For more details on the orb, see the [mojaloop/build GitHub repository](https://github.com/mojaloop/ci-config-orb-build).
