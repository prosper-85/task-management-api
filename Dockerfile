# Use the official Node.js 20 image as the base image
FROM node:20.15.1

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install project dependencies
RUN npm install

# Remove any previous build output if it exists
RUN rm -rf dist

# Copy the rest of the application source code to the container
COPY . .

# Build the application
RUN npm run build

# Expose the port your NestJS application listens on
EXPOSE 3000

# Command to start your NestJS application in production mode
CMD ["npm", "run", "start:prod"]
