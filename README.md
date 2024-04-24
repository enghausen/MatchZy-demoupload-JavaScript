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
   Open the `.env` file in a text editor. Here, you need to specify the `MATCHZY_AUTHORIZATION`, `LOG_DIRECTORY_PATH`, `UPLOAD_DIRECTORY_PATH`, `ADD_RANDOM_STRING_TO_FILENAME`, `ENABLE_DISCORD_NOTIFICATIONS`, `PORT`, `DISCORD_WEBHOOK_URL_TEAM1`, and `DISCORD_BASE_URL` keys. Replace the placeholder values with your actual configurations. Example entries:
   ```plaintext
   MATCHZY_AUTHORIZATION=your_secret_key
   LOG_DIRECTORY_PATH=./logs
   UPLOAD_DIRECTORY_PATH=/your/demos/path
   ADD_RANDOM_STRING_TO_FILENAME=true
   ENABLE_DISCORD_NOTIFICATIONS=true
   PORT=3000
   DISCORD_WEBHOOK_URL_TEAM1=https://discord.com/api/webhooks/xxxx
   DISCORD_BASE_URL=https://demos.mydomain.com
   ```

   `ADD_RANDOM_STRING_TO_FILENAME` can be set to `true` or `false` depending on whether you want to append a random string to filenames to enhance security.

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
- `matchzy_demo_name_format`: Define the demo name format to include the timestamp, map name, and team name at the end of the demo name. For example:
  ```cfg
  matchzy_demo_name_format "{TIME}_{MAP}_Team1"
  ```

## Nginx Configuration (optional)

This service uses Nginx as both a web server and reverse proxy to manage traffic to the Node.js application and to handle authentication and direct file access.

### Nginx as a Web Server

The Nginx server is configured to serve files directly with optional authentication per team directory and to enable directory listing:

```nginx
server {
    server_name demos.mydomain.com;

    # Global settings
    root /your/demos/path;
    autoindex on;  # Enable directory listing globally

    # Authentication for each team directory for browsing
    location ~* ^/(Team1|Team2|Team3|Team4)/$ {
        auth_basic "Restricted";
        auth_basic_user_file /etc/nginx/.htpasswd_$1;  # Dynamically load password file based on directory
        autoindex on;
    }

    # Allow direct file access without authentication
    location ~* ^/(Team1|Team2|Team3|Team4)/.*\\.dem$ {
        auth_basic off;
        autoindex off;  # Disable directory listing here to prevent browsing without auth
    }

    # Upload location
    location /upload {
        client_max_body_size 500m;
        proxy_pass http://localhost:3000/upload;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/demos.mydomain.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/demos.mydomain.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

# HTTP to HTTPS redirect
server {
    if ($host = demos.mydomain.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    listen [::]:80;
    server_name demos.mydomain.com;
    return 404; # managed by Certbot
}
```

This configuration ensures that your demo files are served securely with optional directory listing and authentication per team, while also providing a seamless upload experience through a reverse proxy setup.

## Setting Up SSL with Let's Encrypt

Let's Encrypt provides a free, automated, and open certificate authority that can be utilized through tools like Certbot for effortless SSL/TLS certificate management. Here’s how you can set up SSL for your Nginx server using Let's Encrypt:

1. **Install Certbot:**
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain and Install Certificates:**
   ```bash
   sudo certbot --nginx -d demos.mydomain.com
   ```

   Follow the prompts to configure your certificates. Certbot will automatically modify your Nginx configuration to use these certificates and set up a renewal process.

3. **Automatic Renewal:**
   Certbot automatically sets up a cron job to renew your certificates before they expire. You can verify the cron job by checking Certbot's renewal configuration:
   ```bash
   sudo certbot renew --dry-run
   ```

## Customizing Your Nginx Configuration

This Nginx configuration is designed to be adaptable to different environments and needs. Follow these guidelines to customize it for your specific setup:

### Update Domain and Paths
- **Domain Name**: Replace `demos.mydomain.com` with your actual domain name to match your DNS settings.
- **Root Directory**: Change `/your/demos/path` to the path where your demo files are stored on the server. This should be the directory where the uploaded demo files are saved.

### Configuring Team Directories
- **Team Directories**: The example configuration uses generic placeholders (`Team1`, `Team2`, `Team3`, `Team4`). You should replace these with the actual names of the teams or directories you are using.
  - Modify the `location` block patterns to match the directory names you have set up.
  - Adjust the `.htpasswd_$1` references to match the naming conventions of your password files for HTTP authentication.

### Authentication Setup
- **Authentication Files**: Ensure that you have corresponding `.htpasswd` files for each team or directory specified. These files should be properly configured with credentials to control access.

### Direct File Access
- This configuration disables directory listing and basic authentication for `.dem` files within each team's directory, allowing direct access via links. Make sure that the regex in the `location` directive correctly identifies the file types you want to serve without authentication.

### SSL Configuration
- **SSL Certificates**: Ensure that your SSL paths correctly point to your Let's Encrypt certificates. This setup enhances security by encrypting all data exchanged between your server and clients.

### Reverse Proxy Setup
- The reverse proxy settings are configured to forward requests to a local Node.js application running on port 3000. If your application runs on a different port or host, update the `proxy_pass` directive accordingly.
```

## Acknowledgements

A big thank you to [Shobhit Pathak](https://github.com/shobhit-pathak) for creating the MatchZy plugin, facilitating seamless integration of match recordings and uploads for CS2 servers.
