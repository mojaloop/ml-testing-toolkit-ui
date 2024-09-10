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

# PISP Demonstration Setup Guide

This guide will walk you through the steps to set up and run the PISP (Payment Initiation Service Provider) Demonstration.

## Prerequisites

- Git
- Node.js and npm
- Terminal or command prompt

## Step 1: Set up the ML Testing Toolkit UI

1. Clone the repository:
   ```
   git clone https://github.com/pawarspeaks/ml-testing-toolkit-ui.git
   ```

2. Navigate to the project directory:
   ```
   cd ml-testing-toolkit-ui
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Set the Node.js environment variable for OpenSSL:
   ```
   export NODE_OPTIONS=--openssl-legacy-provider
   ```

5. Start the development server:
   ```
   PORT=6060 HOST=localhost ./node_modules/.bin/react-scripts start
   ```

   The UI should now be running at `http://localhost:6060`.

## Step 2: Set up the PISP TTK Sandbox

1. Visit the PISP TTK Sandbox repository:
   [https://github.com/mojaloop/pisp-ttk-sandbox/](https://github.com/mojaloop/pisp-ttk-sandbox/)

2. Follow the setup instructions provided in the repository's README.

## Step 3: Access the PISP Demo

Once both the ML Testing Toolkit UI and the PISP TTK Sandbox are running:

1. Open your web browser and navigate to:
   ```
   http://localhost:6060/pispdemo
   ```

2. You should now be able to interact with the PISP Demonstration.

## Troubleshooting

- If you encounter any issues with the setup or running of the demonstration, refer to the respective repositories' documentation or issue trackers.
- Ensure all prerequisites are correctly installed and configured on your system.
