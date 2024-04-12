# MatchZy Demo Upload Service

This service is designed to handle automated uploads of demo files from the MatchZy plugin for Counter-Strike 2 (CS2) servers.

## Setting Up Your Environment

To get started with the MatchZy Demo Upload Service:

1. **Copy `.env.example` to a New File:**
   Copy the `.env.example` file to a new file named `.env`. This can be done with the following command:
   ```bash
   cp .env.example .env
   ```

2. **Configure Your Environment Variables:**
   Open the `.env` file in a text editor. Here, you need to specify the `MATCHZY_AUTHORIZATION`, `LOG_DIRECTORY_PATH`, `UPLOAD_DIRECTORY_PATH`, and `PORT` keys. Replace the placeholder values with your actual configurations. Example entries:
   ```plaintext
   MATCHZY_AUTHORIZATION=your_secret_key
   LOG_DIRECTORY_PATH=./logs
   UPLOAD_DIRECTORY_PATH=/your/demos/path
   PORT=3000
   ```

## Installation

Ensure Node.js and npm are installed on your system. Install the application dependencies from your project directory:
```bash
npm install
```

## Running the Service

### Using PM2

To manage the application with PM2:

1. **Start the application with PM2:**
   ```bash
   pm2 start app.js --name "MatchZy-demoupload"
   ```

2. **Ensure automatic restart with PM2:**
   Generate and configure PM2 to automatically start your application at system reboot:
   ```bash
   pm2 startup
   pm2 save
   ```

3. **Monitoring logs with PM2:**
   To check the application logs:
   ```bash
   pm2 logs MatchZy-demoupload
   ```

## MatchZy Plugin

The MatchZy Demo Upload Service works in conjunction with the [MatchZy Plugin](https://github.com/shobhit-pathak/MatchZy) for CS2 servers. This plugin is responsible for sending demo recordings of matches to this web service. A comprehensive documentation of the MatchZy plugin can be found [here](https://shobhit-pathak.github.io/MatchZy/). For more details on demo recording and automated uploading, refer to the [GOTV section](https://shobhit-pathak.github.io/MatchZy/gotv/).

### Plugin Configuration

To integrate the CS2 server with this service, you need to configure the following parameters in the `csgo/cfg/MatchZy/config.cfg` file on your CS2 server:

- `matchzy_demo_upload_url`: Define the URL where recorded demos will be uploaded after each match. For example:
  ```cfg
  matchzy_demo_upload_url "http://demos.mydomain.com:3000/upload"
  ```
- `matchzy_demo_upload_header_key`: This key should be `MatchZy-Authorization`. It's a custom HTTP header key for the demo upload requests.
  ```cfg
  matchzy_demo_upload_header_key MatchZy-Authorization
  ```
- `matchzy_demo_upload_header_value`: Set the value for the custom header. This should match the `MATCHZY_AUTHORIZATION` key defined in your service's `.env` file. For example:
  ```cfg
  matchzy_demo_upload_header_value [Your_Authorization_Code]
  ```

## Acknowledgements

A big thank you to [Shobhit Pathak](https://github.com/shobhit-pathak) for creating the MatchZy plugin, facilitating seamless integration of match recordings and uploads for CS2 servers.
