FROM node:20-slim
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --production
COPY . .
ENV PORT 8080
EXPOSE 8080
CMD ["npm", "start", "--prefix", "server"]
