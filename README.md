# ML Testing Toolkit UI

## 1. Running the toolkit UI

### 1.1 With Docker

This is the easiest way to run the self testing toolkit ui.

The following softwares should be installed on your system to run the toolkit.

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

The following softwares should be installed on your system to run the toolkit ui locally.

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

https://github.com/mojaloop/ml-testing-toolkit/blob/master/README.md
