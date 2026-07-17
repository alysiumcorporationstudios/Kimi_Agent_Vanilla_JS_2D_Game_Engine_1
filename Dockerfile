# Optional container deploy (Render's render.yaml uses the native Node runtime
# instead — this file is only for platforms that prefer Docker).
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
