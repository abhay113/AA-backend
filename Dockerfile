# Use an official Node.js runtime as the base image
FROM node:17.9.1
# RUN apt-get update && apt-get install -y supervisor 
#redis-server
# Set the working directory in the container
WORKDIR ./middleware

# Copy package.json and package-lock.json (if present)
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the application code into the container
COPY . .
COPY supervisord.conf /etc/supervisor/

# Expose a port (optional)
EXPOSE 3003

# Start the application
CMD [ "npm", "start" ]
# CMD ["supervisord", "-n", "-c", "/etc/supervisor/supervisord.conf"]
