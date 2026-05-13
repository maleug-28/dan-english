FROM node:22-alpine
WORKDIR /app
RUN npm install -g http-server
COPY . .
EXPOSE 8080
CMD ["http-server", ".", "-p", "8080", "-c-1", "--proxy", "http://localhost:8080/index.html?"]
