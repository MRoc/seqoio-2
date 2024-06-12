FROM node:16.13.0

COPY client /app/client
WORKDIR /app/client
RUN npm install
RUN npm run build

COPY server /app/server
WORKDIR /app/server
RUN npm install

EXPOSE 3000

CMD ["npm", "start"]

