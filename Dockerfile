# node:sqlite needs Node >= 22.13
FROM node:22-alpine
WORKDIR /app
COPY . .
ENV PORT=3000 DATA_DIR=/data TRUST_PROXY=1
RUN mkdir -p /data && chown node:node /data
VOLUME /data
EXPOSE 3000
USER node
CMD ["node", "server.js"]
