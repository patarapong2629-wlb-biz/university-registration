FROM node:20

WORKDIR /app

COPY . .

RUN npm install

RUN mkdir -p /app/output

CMD ["node", "seed-university-data.js"]