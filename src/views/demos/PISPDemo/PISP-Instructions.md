# PISP Demonstration Setup Guide

This guide will walk you through the steps to set up and run the PISP (Payment Initiation Service Provider) Demonstration.

## Prerequisites

- Git
- Node.js and npm
- Terminal or command prompt

## Step 1: Set up the ML Testing Toolkit UI

1. Clone the repository:
   ```
   git clone https://github.com/mojaloop/ml-testing-toolkit-ui.git
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
   PORT=6061 npm start
   ```

   The UI should now be running at `http://localhost:6061`.

## Step 2: Set up the PISP TTK Sandbox

1. Visit the PISP TTK Sandbox repository:
   [https://github.com/mojaloop/pisp-ttk-sandbox/](https://github.com/mojaloop/pisp-ttk-sandbox/)

2. Follow the setup instructions provided in the repository's README.

## Step 3: Access the PISP Demo

Once both the ML Testing Toolkit UI and the PISP TTK Sandbox are running:

1. Open your web browser and navigate to:
   ```
   http://localhost:6061/pispdemo
   ```

2. You should now be able to interact with the PISP Demonstration.

## Troubleshooting

- If you encounter any issues with the setup or running of the demonstration, refer to the respective repositories' documentation or issue trackers.
- Ensure all prerequisites are correctly installed and configured on your system.
