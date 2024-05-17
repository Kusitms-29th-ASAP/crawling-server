# Use the official Node.js 14 image as the base image
FROM --platform=linux/amd64 node:22

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && apt-get -y install graphicsmagick \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install puppeteer so it's available in the container.
RUN npm install

RUN mkdir .env

# Copy the rest of the application code to the working directory
COPY ./ ./

# Expose the port that the server will listen on
EXPOSE 3000

# Start the server
CMD ["node", "crawling_application.js"]