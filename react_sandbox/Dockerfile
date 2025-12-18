FROM node:20-alpine

# Security: create non-root user
RUN adduser -D sandboxuser

WORKDIR /app

# Copy package files and install dependencies
COPY package.json /app/
RUN npm install --production

# Copy the runner script
COPY render_test.js /app/render_test.js

# Switch to non-root user
USER sandboxuser

CMD ["node", "/app/render_test.js"]

