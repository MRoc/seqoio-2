FROM node:16.13.0

COPY client /app/client
WORKDIR /app/client
RUN npm install

EXPOSE 3001

CMD ["npm", "start"]

