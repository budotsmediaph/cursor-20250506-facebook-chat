 # Facebook Messenger Webhook

A robust implementation of a Facebook Messenger webhook that handles incoming messages and postbacks. This implementation includes proper error handling, message processing, and security features.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Deployment Options](#deployment-options)
- [Facebook Webhook Configuration](#facebook-webhook-configuration)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Features

- ✅ Webhook verification
- ✅ Message handling
- ✅ Postback event handling
- ✅ Error handling and logging
- ✅ Environment variable support
- ✅ Security best practices
- ✅ Easy deployment options

## Prerequisites

Before you begin, ensure you have:

1. Node.js (v14 or higher) installed
2. A Facebook Developer account
3. A Facebook Page
4. A Facebook App with Messenger product enabled
5. Git installed

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd <repository-name>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   # Create .env file
   touch .env
   ```

4. Add environment variables to `.env`:
   ```bash
   VERIFY_TOKEN=your_verify_token
   PAGE_ACCESS_TOKEN=your_page_access_token
   ```

5. Start the development server:
   ```bash
   npm start
   ```

## Deployment Options

### 1. Heroku (Recommended for Beginners)

#### Setup
```bash
# Install Heroku CLI
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu/Debian
sudo snap install heroku --classic

# Windows
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

#### Deployment
```bash
# Login to Heroku
heroku login

# Create new app
heroku create your-app-name

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Deploy
git push heroku main

# Set environment variables
heroku config:set VERIFY_TOKEN=your_verify_token
heroku config:set PAGE_ACCESS_TOKEN=your_page_access_token

# View logs
heroku logs --tail
```

### 2. Railway (Modern Alternative)

#### Setup
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login
```

#### Deployment
```bash
# Initialize project
railway init

# Link project
railway link

# Deploy
railway up

# Set environment variables
railway variables set VERIFY_TOKEN=your_verify_token
railway variables set PAGE_ACCESS_TOKEN=your_page_access_token
```

### 3. DigitalOcean App Platform (Production Ready)

#### Setup
```bash
# Install doctl CLI
# macOS
brew install doctl

# Ubuntu/Debian
sudo snap install doctl --classic

# Windows
# Download from https://github.com/digitalocean/doctl/releases
```

#### Deployment
```bash
# Login
doctl auth init

# Create app
doctl apps create --spec .do/app.yaml

# Set environment variables
doctl apps update <app-id> --spec .do/app.yaml
```

### 4. AWS Elastic Beanstalk (Enterprise Scale)

#### Setup
```bash
# Install AWS CLI
# macOS
brew install awscli

# Ubuntu/Debian
sudo apt install awscli

# Windows
# Download from https://aws.amazon.com/cli/
```

#### Deployment
```bash
# Configure AWS
aws configure

# Initialize EB
eb init -p node.js messenger-webhook

# Create environment
eb create messenger-webhook-env

# Set environment variables
eb setenv VERIFY_TOKEN=your_verify_token PAGE_ACCESS_TOKEN=your_page_access_token
```

## Facebook Webhook Configuration

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to Messenger → Settings
4. Under "Webhooks", click "Add Callback URL"
5. Enter your webhook URL: `https://your-deployed-url/webhook`
6. Set Verify Token to match your `VERIFY_TOKEN`
7. Subscribe to these events:
   - messages
   - messaging_postbacks
   - messaging_optins
   - messaging_referrals

## Security Considerations

1. **HTTPS**: Always use HTTPS for your webhook URL
2. **Environment Variables**: Never commit sensitive data to version control
3. **Rate Limiting**: Implement rate limiting in production
4. **Input Validation**: Validate all incoming webhook requests
5. **Token Security**: Rotate tokens regularly
6. **Error Handling**: Implement proper error handling and logging

## Testing

### Local Testing
```bash
# Test webhook verification
curl -X GET "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=1234567890"

# Test deployed webhook
curl -X GET "https://your-deployed-url/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=1234567890"
```

## Troubleshooting

### Common Issues

1. **Webhook Verification Fails**
   - Check VERIFY_TOKEN matches exactly
   - Ensure URL is accessible
   - Verify HTTPS is working

2. **Messages Not Received**
   - Check PAGE_ACCESS_TOKEN
   - Verify webhook is subscribed to correct events
   - Check server logs

3. **Deployment Issues**
   - Verify environment variables
   - Check build logs
   - Ensure proper Node.js version

### Logs

```bash
# Heroku
heroku logs --tail

# Railway
railway logs

# DigitalOcean
doctl apps logs <app-id>

# AWS
eb logs
```

### Environment Variables

```bash
# Heroku
heroku config

# Railway
railway variables

# DigitalOcean
doctl apps spec get <app-id>

# AWS
eb printenv
```

### Restart Application

```bash
# Heroku
heroku restart

# Railway
railway restart

# DigitalOcean
doctl apps update <app-id> --spec .do/app.yaml

# AWS
eb restart
```

## Support

For issues and feature requests, please [open an issue](<your-repository-url>/issues).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.